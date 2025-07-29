import prisma from '../models/db.js';

// Admin veya Tenant Admin: Tüm kullanıcıları getir
export const getAllUsers = async (req, res) => {
  try {
    const role = req.user?.role;
    const tenantId = req.user?.tenantId;
    const tenantIdParam = req.query.tenantId;

    const users = await prisma.user.findMany({
      where: role === 'tenantadmin'
        ? { tenantId }
        : tenantIdParam
        ? { tenantId: Number(tenantIdParam) }
        : {},
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
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
  }
};

// Admin veya Tenant Admin: Dosyaları getir
export const getAdminFiles = async (req, res) => {
  try {
    const role = req.user?.role;
    const tenantId = req.user?.tenantId;
    const tenantIdParam = req.query.tenantId;

    const files = await prisma.file.findMany({
      where: {
        mimetype: {
          not: {
            startsWith: 'video/',
          },
        },
        ...(role === 'tenantadmin'
          ? { tenantId }
          : tenantIdParam
          ? { tenantId: Number(tenantIdParam) }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(files);
  } catch (error) {
    console.error('getAdminFiles error:', error);
    res.status(500).json({ message: 'Dosyalar alınamadı.' });
  }
};

// Admin: Kullanıcı sil
export const deleteUserById = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'Kullanıcı silindi.' });
  } catch (error) {
    console.error('deleteUserById error:', error);
    res.status(500).json({ message: 'Kullanıcı silinemedi.' });
  }
};

// Admin veya TenantAdmin: Kullanıcı bilgilerini güncelle
export const updateUserById = async (req, res) => {
  const { id } = req.params;
  const { name, email, username } = req.body;

  const userRole = req.user?.role;
  const tenantId = req.user?.tenantId;

  if (userRole !== 'admin' && userRole !== 'tenantadmin') {
    return res.status(403).json({ message: 'Yetkisiz erişim.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Tenant admin sadece kendi tenant kullanıcılarını güncelleyebilir
    if (userRole === 'tenantadmin' && user.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Bu kullanıcıya erişiminiz yok.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { name, email, username },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('updateUserById error:', error);
    res.status(500).json({ message: 'Kullanıcı güncellenemedi.' });
  }
};

// Admin: Dosya sil
export const deleteFileById = async (req, res) => {
  const { id } = req.params;

  const userRole = req.user?.role;
  const tenantId = req.user?.tenantId;

  if (userRole !== 'admin' && userRole !== 'tenantadmin') {
    return res.status(403).json({ message: 'Yetkisiz erişim.' });
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id: Number(id) },
    });

    if (!file) {
      return res.status(404).json({ message: 'Dosya bulunamadı.' });
    }

    // Tenant admin sadece kendi tenant dosyalarını silebilir
    if (userRole === 'tenantadmin' && file.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Bu dosyaya erişiminiz yok.' });
    }

    await prisma.file.delete({ where: { id: Number(id) } });

    res.json({ message: 'Dosya silindi.' });
  } catch (error) {
    console.error('deleteFileById error:', error);
    res.status(500).json({ message: 'Dosya silinemedi.' });
  }
};

export { getAdminFiles as getTenantAdminFiles };
// Belirli bir tenant'ın kullanıcılarını getir
export const getTenantUsers = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID bulunamadı.' });
    }

    const users = await prisma.user.findMany({
      where: { tenantId },
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
    console.error('getTenantUsers error:', error);
    res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
  }
};

// Admin: Tüm tenantları getir
export const getAllTenants = async (req, res) => {
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
    console.error('getAllTenants error:', error);
    res.status(500).json({ message: 'Tenantlar alınamadı.' });
  }
};

// Admin veya TenantAdmin: Video sil
export const deleteVideoById = async (req, res) => {
  const { id } = req.params;

  const userRole = req.user?.role;
  const tenantId = req.user?.tenantId;

  if (userRole !== 'admin' && userRole !== 'tenantadmin') {
    return res.status(403).json({ message: 'Yetkisiz erişim.' });
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id: Number(id) },
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

    await prisma.video.delete({ where: { id: Number(id) } });

    // İlişkili dosyayı da sil
    if (video.file) {
      await prisma.file.delete({ where: { id: video.file.id } });
    }

    res.json({ message: 'Video silindi.' });
  } catch (error) {
    console.error('deleteVideoById error:', error);
    res.status(500).json({ message: 'Video silinemedi.' });
  }
};
// Admin veya TenantAdmin: Videoları getir
export const getAdminVideos = async (req, res) => {
  const role = req.user?.role;
  const tenantId = req.user?.tenantId;
  const tenantIdParam = req.query.tenantId;

  try {
    const videos = await prisma.video.findMany({
      where: {
        ...(role === 'tenantadmin'
          ? { tenantId }
          : tenantIdParam
          ? { tenantId: Number(tenantIdParam) }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true } },
        file: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(videos);
  } catch (error) {
    console.error('getAdminVideos error:', error);
    res.status(500).json({ message: 'Videolar alınamadı.' });
  }
};