import { Request, Response } from 'express';
import prisma from '../models/db';
import logger from '../utils/logger';

// Admin veya Tenant Admin: Tüm kullanıcıları getir
export const getAllUsers = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role } = req.user as { userId: number; tenantId: number; role: string };
  const tenantIdParam = req.query.tenantId;

  if (!role || (role === 'tenantadmin' && tenantId === undefined)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı oturumu.' });
  }

  try {
    const tenantFilter =
      role === 'tenantadmin'
        ? { tenantId: tenantId }
        : tenantIdParam
        ? { tenantId: Number(tenantIdParam) }
        : {};

    const users = await prisma.user.findMany({
      where: {
        ...tenantFilter,
        role: 'user',
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        tenantId: true,
      }
    });

    logger.info(`Admin ${userId} fetched ${users.length} users`);
    res.json({ users });
  } catch (error) {
    logger.error({ err: error }, 'getAllUsers error');
    res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
  }
};

// Admin veya Tenant Admin: Dosyaları getir
export const getAdminFiles = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role } = req.user as { userId: number; tenantId: number; role: string };
  const tenantIdParam = req.query.tenantId;

  if (!role || (role === 'tenantadmin' && tenantId === undefined)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı oturumu.' });
  }

  try {
    const tenantFilter =
      role === 'tenantadmin'
        ? { tenantId: tenantId }
        : tenantIdParam
        ? { tenantId: Number(tenantIdParam) }
        : {};

    const files = await prisma.file.findMany({
      where: {
        mimetype: {
          not: {
            startsWith: 'video/',
          },
        },
        ...tenantFilter,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    logger.info(`Admin ${userId} fetched ${files.length} files`);
    res.json(files);
  } catch (error) {
    logger.error({ err: error }, 'getAdminFiles error');
    res.status(500).json({ message: 'Dosyalar alınamadı.' });
  }
};

// Admin: Kullanıcı sil
export const deleteUserById = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role } = req.user as { userId: number; tenantId: number; role: string };

  const { id } = req.params;
  const numericId = Number(id);
  if (isNaN(numericId)) return res.status(400).json({ message: 'Geçersiz ID.' });

  try {
    await prisma.user.delete({ where: { id: numericId } });
    logger.warn(`Admin ${userId} deleted user ${numericId}`);
    res.json({ message: 'Kullanıcı silindi.' });
  } catch (error) {
    logger.error({ err: error }, 'deleteUserById error');
    res.status(500).json({ message: 'Kullanıcı silinemedi.' });
  }
};

// Admin veya TenantAdmin: Kullanıcı bilgilerini güncelle
export const updateUserById = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role: userRole } = req.user as { userId: number; tenantId: number; role: string };

  const { id } = req.params;
  const numericId = Number(id);
  if (isNaN(numericId)) return res.status(400).json({ message: 'Geçersiz ID.' });

  const { name, email, username } = req.body;

  if (!userRole || (userRole === 'tenantadmin' && tenantId === undefined)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı oturumu.' });
  }

  if (userRole !== 'admin' && userRole !== 'tenantadmin') {
    return res.status(403).json({ message: 'Yetkisiz erişim.' });
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: numericId },
    });

    if (!userRecord) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Tenant admin sadece kendi tenant kullanıcılarını güncelleyebilir
    if (userRole === 'tenantadmin' && userRecord.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Bu kullanıcıya erişiminiz yok.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: numericId },
      data: { name, email, username },
    });

    logger.info(`User ${userId} updated user ${numericId}`);
    res.json(updatedUser);
  } catch (error) {
    logger.error({ err: error }, 'updateUserById error');
    res.status(500).json({ message: 'Kullanıcı güncellenemedi.' });
  }
};

// Admin: Dosya sil
export const deleteFileById = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role: userRole } = req.user as { userId: number; tenantId: number; role: string };

  const { id } = req.params;
  const numericId = Number(id);
  if (isNaN(numericId)) return res.status(400).json({ message: 'Geçersiz ID.' });

  if (!userRole || (userRole === 'tenantadmin' && tenantId === undefined)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı oturumu.' });
  }

  if (userRole !== 'admin' && userRole !== 'tenantadmin') {
    return res.status(403).json({ message: 'Yetkisiz erişim.' });
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id: numericId },
    });

    if (!file) {
      return res.status(404).json({ message: 'Dosya bulunamadı.' });
    }

    // Tenant admin sadece kendi tenant dosyalarını silebilir
    if (userRole === 'tenantadmin' && file.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Bu dosyaya erişiminiz yok.' });
    }

    await prisma.file.delete({ where: { id: numericId } });
    logger.warn(`User ${userId} deleted file ${numericId}`);

    res.json({ message: 'Dosya silindi.' });
  } catch (error) {
    logger.error({ err: error }, 'deleteFileById error');
    res.status(500).json({ message: 'Dosya silinemedi.' });
  }
};

export { getAdminFiles as getTenantAdminFiles };
// Belirli bir tenant'ın kullanıcılarını getir
export const getTenantUsers = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role } = req.user as { userId: number; tenantId: number; role: string };

  if (!role || (role === 'tenantadmin' && tenantId === undefined)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı oturumu.' });
  }

  try {
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID bulunamadı.' });
    }

    const users = await prisma.user.findMany({
      where: { tenantId, role: 'user' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        tenantId: true,
      }
    });

    res.json({ users });
  } catch (error) {
    logger.error({ err: error }, 'getTenantUsers error');
    res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
  }
};

// Admin: Tüm tenantları getir
export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      }
    });
    res.json(tenants);
  } catch (error) {
    logger.error({ err: error }, 'getAllTenants error');
    res.status(500).json({ message: 'Tenantlar alınamadı.' });
  }
};

// Admin veya TenantAdmin: Video sil
export const deleteVideoById = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role: userRole } = req.user as { userId: number; tenantId: number; role: string };

  const { id } = req.params;
  const numericId = Number(id);
  if (isNaN(numericId)) return res.status(400).json({ message: 'Geçersiz ID.' });

  if (!userRole || (userRole === 'tenantadmin' && tenantId === undefined)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı oturumu.' });
  }

  if (userRole !== 'admin' && userRole !== 'tenantadmin') {
    return res.status(403).json({ message: 'Yetkisiz erişim.' });
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id: numericId },
      include: {
        file: true,
      },
    });

    if (!video) {
      return res.status(404).json({ message: 'Video bulunamadı.' });
    }

    if (userRole === 'tenantadmin' && video.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Bu videoya erişiminiz yok.' });
    }

    await prisma.video.delete({ where: { id: numericId } });
    logger.warn(`User ${userId} deleted video ${numericId}`);

    // İlişkili dosyayı da sil
    if (video.file) {
      await prisma.file.delete({ where: { id: video.file.id } });
    }

    res.json({ message: 'Video silindi.' });
  } catch (error) {
    logger.error({ err: error }, 'deleteVideoById error');
    res.status(500).json({ message: 'Video silinemedi.' });
  }
};
// Admin veya TenantAdmin: Videoları getir
export const getAdminVideos = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { userId, tenantId, role } = req.user as { userId: number; tenantId: number; role: string };
  const tenantIdParam = req.query.tenantId;

  if (!role || (role === 'tenantadmin' && tenantId === undefined)) {
    return res.status(400).json({ message: 'Geçersiz kullanıcı oturumu.' });
  }

  try {
    const tenantFilter =
      role === 'tenantadmin'
        ? { tenantId: tenantId }
        : tenantIdParam
        ? { tenantId: Number(tenantIdParam) }
        : {};

    const videos = await prisma.video.findMany({
      where: {
        ...tenantFilter,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
        file: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    logger.info(`Admin ${userId} fetched ${videos.length} videos`);
    res.json(videos);
  } catch (error) {
    logger.error({ err: error }, 'getAdminVideos error');
    res.status(500).json({ message: 'Videolar alınamadı.' });
  }
};