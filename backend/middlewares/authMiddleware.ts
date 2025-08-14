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
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.cookie) {
    const rawCookies = req.headers.cookie;
    const parsedCookies = rawCookies.split(';').map(cookie => cookie.trim());
    for (const cookie of parsedCookies) {
      if (cookie.startsWith('token=')) {
        token = cookie.substring('token='.length);
        break;
      }
    }
  }

  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Token eksik veya geçersiz.' });
  }

  if (!JWT_SECRET) {
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
    return res.status(403).json({ message: 'Geçersiz token.' });
  }
};

export const authenticate = verifyToken;

export const secureQueueDashboard = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).send('Access denied. Admins only.');
  }
  next();
};