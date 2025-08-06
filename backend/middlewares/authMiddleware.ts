import jwt from 'jsonwebtoken';
import prisma from '../models/db';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    tenantId: number;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token eksik veya geçersiz.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token eksik.' });
  }

  if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    return res.status(500).json({ message: 'Sunucu yapılandırma hatası' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: (decoded as any).userId } });
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }
    req.user = {
      userId: user.id,
      tenantId: user.tenantId ?? 0,
      role: user.role,
    };
    next();
  } catch (err) {
    console.error('Token doğrulama hatası:', err);
    return res.status(403).json({ message: 'Geçersiz token.' });
  }
};

export const authenticate = verifyToken;