import jwt from 'jsonwebtoken';
import prisma from '../models/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token eksik veya geçersiz.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }
    req.user = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    };
    next();
  } catch (err) {
    console.error('Token doğrulama hatası:', err);
    return res.status(403).json({ message: 'Geçersiz token.' });
  }
};

export const authenticate = verifyToken;