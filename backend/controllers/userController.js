import prisma from '../models/db.js';

// Get profile of current user
export const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Profil alınırken hata:', error);
    res.status(500).json({ message: 'Profil alınırken hata oluştu.' });
  }
};

// Admin: list all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Kullanıcı listesi alınırken hata:', error);
    res.status(500).json({ message: 'Kullanıcı listesi alınırken hata oluştu.' });
  }
};

// Delete current user
export const deleteUser = async (req, res) => {
  try {
    const deleted = await prisma.user.delete({
      where: { id: req.user.userId },
    });

    res.status(200).json({ message: 'Kullanıcı hesabı silindi.' });
  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error);
    res.status(500).json({ message: 'Kullanıcı silinirken bir hata oluştu.' });
  }
};

// Update current user
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, email },
    });

    res.status(200).json({ message: 'Kullanıcı profili güncellendi.', user: updated });
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error);
    res.status(500).json({ message: 'Kullanıcı güncellenirken bir hata oluştu.' });
  }
};

// Change user password
import bcrypt from 'bcrypt';

export const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mevcut ve yeni şifre zorunludur.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mevcut şifre yanlış.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Şifre değiştirilirken hata oluştu.' });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [totalFiles, totalSizeResult, latestFile] = await Promise.all([
      prisma.file.count({ where: { userId } }),
      prisma.file.aggregate({
        where: { userId },
        _sum: { size: true },
      }),
      prisma.file.findFirst({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        select: { uploadedAt: true },
      }),
    ]);

    const totalSize = totalSizeResult._sum.size || 0;
    const lastUpload = latestFile?.uploadedAt || null;

    res.status(200).json({
      totalFiles,
      totalSize,
      lastUpload,
    });
  } catch (error) {
    console.error('İstatistik alınırken hata:', error);
    res.status(500).json({ message: 'İstatistik alınırken bir hata oluştu.' });
  }
};