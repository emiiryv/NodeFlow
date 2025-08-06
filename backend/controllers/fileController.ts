import { Request, Response } from 'express';
import { uploadToAzure, deleteFromAzure } from '../services/azureService';
import prisma from '../models/db';

export const handleFileUpload = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided.' });

    const tenantId: number | null = req.user?.tenantId ?? null;
    const userId: number | null = req.user?.userId ?? null;

    // Check for userId and tenantId before uploading file
    if (userId === null || tenantId === null) {
      return res.status(401).json({ error: 'Unauthorized: Missing user or tenant.' });
    }

    const uploaderIp = req.ip ?? '';

    const uploadResult: {
      filename: string;
      url: string;
      size: number;
      mimetype: string;
      uploaderIp: string;
    } = await uploadToAzure(file, uploaderIp, tenantId.toString());

    if (
      uploadResult.size === undefined ||
      !uploadResult.uploaderIp
    ) {
      return res.status(400).json({ error: 'Missing required upload metadata.' });
    }

    const userConnect = { connect: { id: userId } };
    const tenantConnect = { connect: { id: tenantId } };

    const savedFile = await prisma.file.create({
      data: {
        filename: uploadResult.filename,
        url: uploadResult.url,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype,
        uploaderIp: uploadResult.uploaderIp,
        uploadedAt: new Date(),
        user: userConnect,
        tenant: tenantConnect,
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

export const getUserFiles = async (req: Request, res: Response) => {
  try {
    const tenantId: number | null = req.user?.tenantId ?? null;
    const userId: number | null = req.user?.userId ?? null;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!tenantId) return res.status(401).json({ message: 'Unauthorized' });

    const files = await prisma.file.findMany({
      where: {
        tenantId: tenantId ?? undefined,
        userId: userId ?? undefined
      },
      include: { accessLogs: true },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(files);
  } catch (error) {
    console.error('Failed to fetch user files:', error);
    res.status(500).json({ message: 'Error retrieving files.' });
  }
};

export const getFileById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const idNum = Number(id);
  if (isNaN(idNum)) return res.status(400).json({ message: 'Invalid file ID' });
  const tenantId: number | null = req.user?.tenantId ?? null;
  if (!tenantId) return res.status(403).json({ message: 'Access denied.' });

  try {
    const file = await prisma.file.findUnique({
      where: { id: idNum },
      include: {
        accessLogs: true,
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
        videos: true
      },
    });

    if (!file) return res.status(404).json({ message: 'File not found.' });

    if (file.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(file);
  } catch (error) {
    console.error('Failed to fetch file:', error);
    res.status(500).json({ message: 'Error retrieving file.' });
  }
};

export const deleteFileById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const idNum = Number(id);
  if (isNaN(idNum)) return res.status(400).json({ message: 'Invalid file ID' });
  const tenantId: number | null = req.user?.tenantId ?? null;
  if (!tenantId) return res.status(403).json({ message: 'Access denied.' });

  try {
    const file = await prisma.file.findUnique({ where: { id: idNum } });
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }

    if (file.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await prisma.video.deleteMany({ where: { fileId: idNum } });
    await prisma.accessLog.deleteMany({ where: { fileId: idNum } });

    await deleteFromAzure(file.url);
    await prisma.file.delete({ where: { id: idNum } });

    res.json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete file:', error);
    res.status(500).json({ message: 'Error deleting file.' });
  }
};

export const updateFileName = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { filename } = req.body;
  const idNum = Number(id);
  if (isNaN(idNum)) return res.status(400).json({ message: 'Invalid file ID' });
  const tenantId: number | null = req.user?.tenantId ?? null;
  if (!tenantId) return res.status(403).json({ message: 'Access denied.' });

  try {
    const file = await prisma.file.findUnique({ where: { id: idNum } });

    if (!file) return res.status(404).json({ message: 'File not found.' });

    if (file.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const updated = await prisma.file.update({
      where: { id: idNum },
      data: { filename },
    });
    res.json(updated);
  } catch (error) {
    console.error('Failed to update file name:', error);
    res.status(500).json({ message: 'Error updating file name.' });
  }
};
export const getTenantFiles = async (req: Request, res: Response) => {
  try {
    const tenantId: number | null = req.user?.tenantId ?? null;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID bulunamadı.' });
    }

    const files = await prisma.file.findMany({
      where: { tenantId: tenantId ?? undefined },
      include: { accessLogs: true },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(files);
  } catch (error) {
    console.error('Tenant dosyaları getirme hatası:', error);
    res.status(500).json({ message: 'Tenant dosyaları alınamadı.' });
  }
};