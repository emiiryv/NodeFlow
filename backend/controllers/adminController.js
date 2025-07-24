

import prisma from '../models/db.js';

// Admin veya Tenant Admin: Tüm kullanıcıları getir
export const getAllUsers = async (req, res) => {
  try {
    const role = req.user?.role;
    const tenantId = req.user?.tenantId;

    const users = await prisma.user.findMany({
      where: role === 'tenantadmin' ? { tenantId } : {},
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

    const files = await prisma.file.findMany({
      where: role === 'tenantadmin' ? { tenantId } : {},
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

// Admin: Dosya sil
export const deleteFileById = async (req, res) => {
  const { id } = req.params;

  try {
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