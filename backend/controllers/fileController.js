import { uploadToAzure } from '../services/azureService.js';
import prisma from '../models/db.js';

export const handleFileUpload = async (req, res) => {
  try {
    const file = req.file;
    const uploaderIp = req.ip || req.connection.remoteAddress;

    const uploadResult = await uploadToAzure(file, uploaderIp);

    const savedFile = await prisma.file.create({
      data: {
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: uploadResult.size,
        uploaderIp: uploadResult.uploaderIp,
        uploadedAt: new Date()
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

export const getAllFiles = async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      include: { videos: true, accessLogs: true },
    });
    res.json(files);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    res.status(500).json({ message: 'Error retrieving files.' });
  }
};

export const getFileById = async (req, res) => {
  const { id } = req.params;
  try {
    const file = await prisma.file.findUnique({
      where: { id: Number(id) },
      include: { videos: true, accessLogs: true },
    });
    if (!file) return res.status(404).json({ message: 'File not found.' });
    res.json(file);
  } catch (error) {
    console.error('Failed to fetch file:', error);
    res.status(500).json({ message: 'Error retrieving file.' });
  }
};

export const deleteFileById = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.video.deleteMany({ where: { fileId: Number(id) } });
    await prisma.accessLog.deleteMany({ where: { fileId: Number(id) } });
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
  try {
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