import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET /videos
const getVideos = async (req, res) => {
  const role = req.user?.role;
  const tenantId = req.user?.tenantId;

  try {
    const videos = await prisma.video.findMany({
      where: role === 'admin' ? {} : { tenantId },
      include: {
        user: true,
        tenant: true,
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(videos);
  } catch (error) {
    console.error('Video fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /videos/:id
const getVideoById = async (req, res) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (error) {
    console.error('Video fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /videos/my
const getMyVideos = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const videos = await prisma.video.findMany({
      where: {
        uploadedBy: userId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    res.status(200).json(videos);
  } catch (error) {
    console.error('Kullanıcı videoları alınamadı:', error);
    res.status(500).json({ message: 'Videolar alınırken hata oluştu.' });
  }
};

import { uploadToAzure } from '../services/azureService.js';
import { extractMetadata } from '../services/metaService.js';
import { compressVideoBuffer } from '../utils/videoProcessor.js';
import { optimizeVideo } from '../services/metaService.js';

const uploadVideo = async (req, res) => {
  const { title, description } = req.body;
  const file = req.file;
  const userId = req.user?.userId || req.user?.id;

  if (!file) return res.status(400).json({ message: 'No video file uploaded' });

  try {
    // Optional: Optimize video before compression and upload
    const optimizedBuffer = await optimizeVideo(file.buffer, file.originalname);
    if (optimizedBuffer) {
      file.buffer = optimizedBuffer;
      file.size = optimizedBuffer.length;
    }
    // Compress if too large
    const MAX_SIZE_MB = 200;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const { buffer: compressedBuffer, size: compressedSize } = await compressVideoBuffer(file.buffer);
      if (compressedBuffer) {
        file.buffer = compressedBuffer;
        file.size = compressedSize;
      }
    }

    // Upload to Azure
    const azureUploadResult = await uploadToAzure({
      originalname: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
    }, req.ip);

    // Save file record
    const newFile = await prisma.file.create({
      data: {
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: azureUploadResult.size,
        uploaderIp: req.ip,
        uploadedAt: azureUploadResult.uploadedAt,
        userId: req.user?.id || null,
        tenantId: req.user?.tenantId || null,
        mimetype: file?.mimetype || 'application/octet-stream',
      },
    });

    // Extract metadata
    const metadata = await extractMetadata(file.buffer);

    const newVideo = await prisma.video.create({
      data: {
        fileId: newFile.id,
        title,
        description,
        duration: metadata?.duration || null,
        format: metadata?.format || null,
        resolution: metadata?.resolution || null,
        filename: newFile.filename,
        url: newFile.url,
        size: azureUploadResult.size,
        uploadedBy: userId,
        tenantId: req.user?.tenantId || null,
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

// DELETE /videos/:id
const deleteVideo = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const role = req.user?.role;

    // Find the video including the associated file
    const video = await prisma.video.findUnique({
      where: { id: Number(req.params.id) },
      include: { file: true },
    });

    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Authorization check
    if (role !== 'admin' && video.uploadedBy !== userId) {
      return res.status(403).json({ message: 'Bu videoyu silme yetkiniz yok.' });
    }

    // First delete the video entry (to remove foreign key reference)
    await prisma.video.delete({
      where: { id: Number(req.params.id) },
    });

    // Then delete the associated file
    await prisma.file.delete({
      where: { id: video.fileId },
    });

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
  getMyVideos
};