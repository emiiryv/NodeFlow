import { Request, Response } from 'express';
import prisma from '../models/db';
import { uploadToAzure } from '../services/azureService';
import { extractMetadata, optimizeVideo } from '../services/metaService';
import { compressVideoBuffer } from '../utils/videoProcessor';

import type { Prisma } from '@prisma/client';

const getVideos = async (req: Request, res: Response) => {
  const role = req.user?.role;
  const tenantId = req.user?.tenantId;

  try {
    if (role !== 'admin') {
      if (!tenantId) {
        return res.status(403).json({ message: 'Forbidden: Tenant context is required.' });
      }
    }

    let whereCondition: Prisma.VideoWhereInput = {};
    if (role !== 'admin') {
      // tenantId burada kesin number, undefined değil
      whereCondition = { tenantId: tenantId! };
      // Alternatif olarak:
      // whereCondition = { tenantId: { equals: tenantId! } };
    }

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
      include: {
        user: true,
        tenant: true,
        file: true,
      },
    });

    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Access control: non-admins must be same tenant OR uploader
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

    const whereCondition = tenantId ? { uploadedBy: userId, tenantId } : { uploadedBy: userId };

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

const uploadVideo = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const file = req.file;
  const userId = req.user?.userId;
  const tenantId = req.user?.tenantId;

  if (!file) return res.status(400).json({ message: 'No video file uploaded' });
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Optimize video
    const optimizedBuffer = await optimizeVideo(file.buffer, file.originalname);
    if (optimizedBuffer) {
      file.buffer = optimizedBuffer;
      file.size = optimizedBuffer.length;
    }

    // Compress large video
    const MAX_SIZE_MB = 200;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const { buffer: compressedBuffer, size: compressedSize } = await compressVideoBuffer(file.buffer);
      if (compressedBuffer) {
        file.buffer = compressedBuffer;
        file.size = compressedSize;
      }
    }

    // Upload to Azure - tenantId converted to string safely
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

    // Save file record
    const newFile = await prisma.file.create({
      data: {
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: azureUploadResult.size,
        uploaderIp: req.ip ?? '',
        uploadedAt: azureUploadResult.uploadedAt,
        userId,
        tenantId: tenantId ?? null,
        mimetype: file.mimetype || 'application/octet-stream',
      },
    });

    // Extract metadata
    const metadata = await extractMetadata(file.buffer);

    const newVideo = await prisma.video.create({
      data: {
        fileId: newFile.id,
        title,
        description,
        duration: metadata?.duration ?? null,
        format: metadata?.format ?? null,
        resolution: metadata?.resolution ?? null,
        filename: newFile.filename,
        url: newFile.url,
        size: azureUploadResult.size,
        uploadedBy: userId,
        tenantId: tenantId ?? null,
      },
    });

    res.status(201).json({
      message: 'Video uploaded and metadata extracted successfully.',
      file: newFile,
      video: newVideo,
      metadata: metadata || 'Metadata could not be extracted',
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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

    // Authorization rules:
    // - admin: can delete anything
    // - tenantadmin: can delete if same tenant
    // - user: can delete if owner (uploadedBy)
    let allowed = false;
    if (role === 'admin') {
      allowed = true;
    } else if (role === 'tenantadmin') {
      allowed = video.tenantId === tenantId;
    } else {
      allowed = video.uploadedBy === userId;
    }

    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to delete this video.' });
    }

    await prisma.video.delete({ where: { id: Number(req.params.id) } });
    await prisma.file.delete({ where: { id: video.fileId } });

    res.status(204).send();
  } catch (error) {
    console.error('Video delete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  getVideos,
  getVideoById,
  uploadVideo,
  deleteVideo,
  getMyVideos,
};