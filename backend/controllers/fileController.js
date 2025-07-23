import { uploadToAzure, deleteFromAzure } from '../services/azureService.js';
import prisma from '../models/db.js';

export const handleFileUpload = async (req, res) => {
  try {
    const file = req.file;
    const uploaderIp = req.ip || req.connection.remoteAddress;
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    const uploadResult = await uploadToAzure(file, uploaderIp);

    const savedFile = await prisma.file.create({
      data: {
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: uploadResult.size,
        uploaderIp: uploadResult.uploaderIp,
        uploadedAt: new Date(),
        userId: userId,
        tenantId: tenantId
      }
    });

    res.status(200).json({
      message: 'File upload successful',
      data: {
        file: savedFile,
        blobUri: savedFile.url
      }
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
};

export const getUserFiles = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const files = await prisma.file.findMany({
      where: {
        tenantId: req.user?.tenantId,
        userId: req.user?.userId
      },
      include: { videos: true, accessLogs: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(files);
  } catch (error) {
    console.error('Failed to fetch user files:', error);
    res.status(500).json({ message: 'Error retrieving files.' });
  }
};

export const getFileById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  try {
    const file = await prisma.file.findUnique({
      where: { id: Number(id) },
      include: { videos: true, accessLogs: true },
    });

    if (!file) return res.status(404).json({ message: 'File not found.' });

    if (file.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(file);
  } catch (error) {
    console.error('Failed to fetch file:', error);
    res.status(500).json({ message: 'Error retrieving file.' });
  }
};

export const deleteFileById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    const file = await prisma.file.findUnique({ where: { id: Number(id) } });
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    if (file.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await prisma.video.deleteMany({ where: { fileId: Number(id) } });
    await prisma.accessLog.deleteMany({ where: { fileId: Number(id) } });

    await deleteFromAzure(file.url);
    await prisma.file.delete({ where: { id: Number(id) } });

    res.json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete file:', error);
    res.status(500).json({ message: 'Error deleting file.' });
  }
};

export const updateFileName = async (req, res) => {
  const { id } = req.params;
  const { filename } = req.body;
  const userId = req.user?.userId;

  try {
    const file = await prisma.file.findUnique({ where: { id: Number(id) } });

    if (!file) return res.status(404).json({ message: 'File not found.' });

    if (file.tenantId !== req.user?.tenantId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const updated = await prisma.file.update({
      where: { id: Number(id) },
      data: { filename },
    });
    res.json(updated);
  } catch (error) {
    console.error('Failed to update file name:', error);
    res.status(500).json({ message: 'Error updating file name.' });
  }
};
export const getTenantFiles = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID bulunamadı.' });
    }

    const files = await prisma.file.findMany({
      where: { tenantId },
      include: { videos: true, accessLogs: true },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(files);
  } catch (error) {
    console.error('Tenant dosyaları getirme hatası:', error);
    res.status(500).json({ message: 'Tenant dosyaları alınamadı.' });
  }
};