import { Request, Response } from 'express';
import { uploadToAzure, deleteFromAzure } from '../services/azureService';
import prisma from '../models/db';

import { BlobServiceClient } from '@azure/storage-blob';
import { parseAzureBlobUrl } from '../services/azureService';

export const streamFileById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).send('Invalid id');

    const me = { role: req.user?.role, tenantId: req.user?.tenantId };

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        mimetype: true,
        tenantId: true,
        container: true,
        blobName: true,
        url: true,
      },
    });
    if (!file) return res.status(404).send('Not found');

    // Access rule: admin serbest, değilse aynı tenant olmalı
    if (me.role !== 'admin' && file.tenantId !== me.tenantId) {
      return res.status(403).send('Forbidden');
    }

    // container & blobName belirle (legacy kayıtlar için URL parse fallback)
    let container = file.container ?? null;
    let blobName = file.blobName ?? null;
    if (!container || !blobName) {
      const parsed = parseAzureBlobUrl(file.url);
      container = parsed.container;
      blobName = parsed.blobName;
    }
    if (!container || !blobName) {
      return res.status(500).send('Blob location is missing');
    }

    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const blobService = BlobServiceClient.fromConnectionString(connStr);
    const containerClient = blobService.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    // Blob metadata (Content-Length için)
    const props = await blobClient.getProperties();
    const total = props.contentLength ?? undefined;

    // Range desteği (typesafe)
    const rangeHeader = req.headers.range; // örn: "bytes=0-"
    let offset = 0;
    let count: number | undefined = undefined;

    if (typeof rangeHeader === 'string' && total !== undefined) {
      const m = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (m && m[1]) {
        offset = Number.parseInt(m[1], 10);
        if (m[2]) {
          const end = Number.parseInt(m[2], 10);
          if (!Number.isNaN(end) && end >= offset) {
            count = end - offset + 1;
          }
        }
        res.status(206);
        res.setHeader('Accept-Ranges', 'bytes');
        const endByte = count ? offset + count - 1 : (total - 1);
        res.setHeader('Content-Range', `bytes ${offset}-${endByte}/${total}`);
      }
    }

    res.setHeader('Content-Type', file.mimetype);
    const disposition = (req.query.disposition === 'inline') ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(file.filename)}"`);

    const dl = await blobClient.download(offset, count);
    if (!rangeHeader && total !== undefined) {
      res.setHeader('Content-Length', String(total));
    }

    // (opsiyonel) erişim logu
    // await prisma.accessLog.create({ data: { fileId: file.id, ipAddress: req.ip || '', userAgent: req.headers['user-agent'] || '' }});

    dl.readableStreamBody!.pipe(res);
  } catch (e) {
    console.error('streamFileById error:', e);
    res.status(500).send('Internal server error');
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
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid file ID' });

    const role = req.user?.role;
    const tenantId = req.user?.tenantId ?? null;

    const rec = await prisma.file.findUnique({
      where: { id },
      include: {
        accessLogs: true,
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
        videos: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!rec) return res.status(404).json({ message: 'File not found.' });

    // Admin serbest; değilse aynı tenant olmalı
    if (role !== 'admin') {
      if (!tenantId || rec.tenantId !== tenantId) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const v = rec.videos && rec.videos.length > 0 ? rec.videos[0] : null;

    const payload: any = {
      id: rec.id,
      filename: rec.filename,
      url: rec.url,
      size: rec.size,
      uploadedAt: rec.uploadedAt,
      mimetype: rec.mimetype,
      user: rec.user ? { id: rec.user.id, name: rec.user.name, email: rec.user.email } : undefined,
      tenant: rec.tenant ? { id: rec.tenant.id, name: rec.tenant.name } : undefined,
    };

    if (v) {
      payload.video = {
        id: v.id,
        title: v.title ?? '',
        description: v.description ?? null,
        duration: v.duration ?? 0,
        format: v.format ?? '',
        resolution: v.resolution ?? '',
        fileId: v.fileId,
        thumbnailUrl: (v as any).thumbnailUrl ?? undefined,
      };
    }

    return res.json(payload);
  } catch (error) {
    console.error('Failed to fetch file:', error);
    return res.status(500).json({ message: 'Error retrieving file.' });
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
      include: {
        accessLogs: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(files);
  } catch (error) {
    console.error('Tenant dosyaları getirme hatası:', error);
    res.status(500).json({ message: 'Tenant dosyaları alınamadı.' });
  }
};