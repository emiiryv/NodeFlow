// backend/controllers/videoController.ts

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Request, Response } from 'express';
import fs from 'fs';
import prisma from '../models/db';
import { uploadToAzure, parseAzureBlobUrl } from '../services/azureService';
import { extractMetadata, optimizeVideo } from '../services/metaService';
import { compressVideoBuffer } from '../utils/videoProcessor';
import { generateThumbnail } from '../services/thumbnailService';
import { thumbnailQueue, metadataQueue } from '../jobs/queue';
import { BlobServiceClient } from '@azure/storage-blob';
import type { Prisma } from '@prisma/client';

/* =========================
   LIST / GET
========================= */

const getVideos = async (req: Request, res: Response) => {
  const role = req.user?.role;
  const tenantId = req.user?.tenantId;

  try {
    if (role !== 'admin' && !tenantId) {
      return res.status(403).json({ message: 'Forbidden: Tenant context is required.' });
    }

    let whereCondition: Prisma.VideoWhereInput = {};
    if (role !== 'admin') whereCondition = { tenantId: tenantId! };

    const videos = await prisma.video.findMany({
      where: whereCondition,
      include: { user: true, tenant: true },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(videos);
  } catch (error) {
    console.error('Videos fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getVideoById = async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    const video = await prisma.video.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: true, tenant: true, file: true },
    });

    if (!video) return res.status(404).json({ message: 'Video not found' });

    if (role !== 'admin') {
      if (!tenantId) return res.status(403).json({ message: 'Forbidden' });
      const sameTenant = video.tenantId === tenantId;
      const isOwner = video.uploadedBy === userId;
      if (!sameTenant && !isOwner) {
        return res.status(403).json({ message: 'You do not have permission to view this video.' });
      }
    }

    res.json(video);
  } catch (error) {
    console.error('Video fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyVideos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const whereCondition = tenantId
      ? { uploadedBy: userId, tenantId }
      : { uploadedBy: userId };

    const videos = await prisma.video.findMany({
      where: whereCondition,
      orderBy: { uploadedAt: 'desc' },
    });

    res.status(200).json(videos);
  } catch (error) {
    console.error('User videos fetch error:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

/* =========================
   UPLOAD VIDEO
========================= */

const uploadVideo = async (req: Request, res: Response) => {
  // Allow uploading without title: if missing/empty, fallback to original filename (without extension)
  const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const safeTitle = rawTitle.length > 0 ? rawTitle : path.parse((req.file?.originalname ?? 'video')).name;
  const description: string | undefined = typeof req.body?.description === 'string' ? req.body.description : undefined;
  const file = req.file;
  const userId = req.user?.userId;
  const tenantId = req.user?.tenantId;

  if (!file) return res.status(400).json({ message: 'No video file uploaded' });
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Optimize
    const optimizedBuffer = await optimizeVideo(file.buffer, file.originalname);
    if (optimizedBuffer) {
      file.buffer = optimizedBuffer;
      file.size = optimizedBuffer.length;
    }

    // Compress big files
    const MAX_SIZE_MB = 200;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const { buffer: compressedBuffer, size: compressedSize } = await compressVideoBuffer(file.buffer);
      if (compressedBuffer) {
        file.buffer = compressedBuffer;
        file.size = compressedSize;
      }
    }

    // Upload to Azure
    const azureUploadResult = await uploadToAzure(
      {
        originalname: file.originalname,
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
      },
      req.ip ?? '',
      tenantId?.toString() ?? ''
    );

    const { container, blobName } = parseAzureBlobUrl(azureUploadResult.url);

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context is required' });
    }

    // Save file
    const newFile = await prisma.file.create({
      data: {
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: azureUploadResult.size,
        uploaderIp: req.ip ?? '',
        uploadedAt: azureUploadResult.uploadedAt,
        userId,
        tenantId,
        mimetype: file.mimetype || 'application/octet-stream',
        container: container ?? null,
        blobName: blobName ?? null,
      },
    });

    // video tablosuna kayıt
    const newVideo = await prisma.video.create({
      data: {
        title: safeTitle,
        description: description ?? null,
        uploadedBy: userId,
        tenantId,
        fileId: newFile.id,
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: azureUploadResult.size,
      },
    });

    // Enqueue metadata extraction job
    await metadataQueue.add('extract-metadata', {
      videoId: newVideo.id,
      fileBuffer: file.buffer,
      filename: file.originalname,
    });

    // Enqueue thumbnail generation job
    await thumbnailQueue.add('generate-thumbnail', {
      videoBuffer: file.buffer,
      videoId: newVideo.id,
      tenantId,
    });

    res.status(201).json({
      message: 'Video uploaded. Metadata extraction and thumbnail generation have been queued.',
      file: newFile,
      // video and metadata will be available after background jobs complete
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =========================
   DELETE VIDEO
========================= */

const deleteVideo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const tenantId = req.user?.tenantId;

    const video = await prisma.video.findUnique({
      where: { id: Number(req.params.id) },
      include: { file: true },
    });

    if (!video) return res.status(404).json({ message: 'Video not found' });

    let allowed = false;
    if (role === 'admin') allowed = true;
    else if (role === 'tenantadmin') allowed = video.tenantId === tenantId;
    else allowed = video.uploadedBy === userId;

    if (!allowed) return res.status(403).json({ message: 'You do not have permission to delete this video.' });

    await prisma.video.delete({ where: { id: Number(req.params.id) } });
    await prisma.file.delete({ where: { id: video.fileId } });

    res.status(204).send();
  } catch (error) {
    console.error('Video delete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* =========================
   REGENERATE THUMBNAIL (?at=…)
========================= */

const generateThumbnailForVideo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const role = req.user?.role;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { file: true },
    });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    let allowed = false;
    if (role === 'admin') allowed = true;
    else if (role === 'tenantadmin') allowed = video.tenantId === tenantId;
    else allowed = video.uploadedBy === userId;
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    let container = video.file.container ?? null;
    let blobName = video.file.blobName ?? null;
    if (!container || !blobName) {
      const parsed = parseAzureBlobUrl(video.file.url);
      container = parsed.container;
      blobName = parsed.blobName;
    }
    if (!container || !blobName) {
      return res.status(500).json({ message: 'Blob location is missing' });
    }

    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const blobService = BlobServiceClient.fromConnectionString(connStr);
    const containerClient = blobService.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    const tmpDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpVideoPath = path.join(tmpDir, `video_${video.id}.bin`);
    await blobClient.downloadToFile(tmpVideoPath, 0, undefined, {});

    const rawAt = Array.isArray(req.query.at)
      ? Number.parseFloat(String(req.query.at[0]))
      : (typeof req.query.at === 'string' ? Number.parseFloat(req.query.at) : NaN);

    const defaultAt = (() => {
      const d = Number(video.duration ?? 0);
      if (!d || !Number.isFinite(d) || d < 2) return 5;
      return Math.max(1, Math.floor(d * 0.25));
    })();

    let atSecond = defaultAt;
    if (Number.isFinite(rawAt) && rawAt >= 0) {
      if (video.duration && Number.isFinite(video.duration)) {
        const maxAt = Math.max(0, Number(video.duration) - 1);
        atSecond = Math.min(rawAt, maxAt);
      } else {
        atSecond = rawAt;
      }
    }

    const thumbUrl = await generateThumbnail(
      tmpVideoPath,
      video.id,
      video.tenantId ?? undefined,
      atSecond
    );

    await prisma.video.update({
      where: { id: video.id },
      data: { thumbnailUrl: thumbUrl },
    });

    try { fs.existsSync(tmpVideoPath) && fs.unlinkSync(tmpVideoPath); } catch {}

    return res.json({ message: 'Thumbnail regenerated', thumbnailUrl: thumbUrl });
  } catch (err) {
    console.error('generateThumbnailForVideo error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/* =========================
   UPLOAD CUSTOM THUMBNAIL (image file)
========================= */

const uploadThumbnailForVideo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

    const role = req.user?.role;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { file: true },
    });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    let allowed = false;
    if (role === 'admin') allowed = true;
    else if (role === 'tenantadmin') allowed = video.tenantId === tenantId;
    else allowed = video.uploadedBy === userId;
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });

    const img = req.file;
    if (!img) return res.status(400).json({ message: 'No thumbnail file uploaded' });
    if (!img.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Invalid file type, expected image/*' });
    }

    const uploaded = await uploadToAzure(
      {
        originalname: img.originalname || `video_${video.id}_thumbnail`,
        buffer: img.buffer,
        mimetype: img.mimetype,
        size: img.size,
      },
      req.ip ?? '',
      (video.tenantId ?? tenantId ?? '').toString()
    );

    await prisma.video.update({
      where: { id: video.id },
      data: { thumbnailUrl: uploaded.url },
    });

    return res.json({ message: 'Thumbnail updated', thumbnailUrl: uploaded.url });
  } catch (err) {
    console.error('uploadThumbnailForVideo error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const streamVideoThumbnail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).send('Invalid id');

    const role = req.user?.role;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { file: true },
    });
    if (!video) return res.status(404).send('Video not found');

    // yetki
    let allowed = false;
    if (role === 'admin') allowed = true;
    else if (role === 'tenantadmin') allowed = video.tenantId === tenantId;
    else allowed = video.uploadedBy === userId;
    if (!allowed) return res.status(403).send('Forbidden');

    // container / blobName tespiti
    let container: string | null = null;
    let blobName: string | null = null;

    if (video.thumbnailUrl) {
      const parsed = parseAzureBlobUrl(video.thumbnailUrl);
      container = parsed.container ?? null;
      blobName = parsed.blobName ?? null;
    }

    // fallback: standart konum
    if (!container || !blobName) {
      // video.file.container varsa onu kullan, yoksa file.url'den çöz
      container = video.file.container ?? parseAzureBlobUrl(video.file.url).container ?? null;
      // tenant klasörü kullanıyorsanız:
      const tenantFolder = video.tenantId ? `${video.tenantId}/` : '';
      blobName = `${tenantFolder}thumbnails/${video.id}.jpg`;
    }

    if (!container || !blobName) {
      return res.status(500).send('Thumbnail blob location missing');
    }

    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const blobService = BlobServiceClient.fromConnectionString(connStr);
    const containerClient = blobService.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    // var mı kontrol et
    const exists = await blobClient.exists();
    if (!exists) return res.status(404).send('Thumbnail not found');

    // props & headers
    const props = await blobClient.getProperties();
    res.setHeader('Content-Type', props.contentType || 'image/jpeg');
    if (props.contentLength) {
      res.setHeader('Content-Length', String(props.contentLength));
    }
    res.setHeader('Cache-Control', 'public, max-age=300');

    const dl = await blobClient.download();
    dl.readableStreamBody!.pipe(res);
  } catch (e) {
    console.error('streamVideoThumbnail error:', e);
    res.status(500).send('Internal server error');
  }
};


/* =========================
   EXPORTS
========================= */

export default {
  getVideos,
  getVideoById,
  uploadVideo,
  deleteVideo,
  getMyVideos,
  generateThumbnailForVideo,
  uploadThumbnailForVideo,
  streamVideoThumbnail
};