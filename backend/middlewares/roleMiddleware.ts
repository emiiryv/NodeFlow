/**
 * Role-based access control middleware
 * Usage:
 *   - allowRoles('admin')
 *   - isAdmin
 *   - isTenantAdmin
 */
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    tenantId: number;
    role: string;
  };
}

export const allowRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      logger.warn({
        msg: 'Role access denied',
        user,
        requiredRoles: allowedRoles
      });
      return res.status(403).json({ message: 'Yetkisiz erişim: rol reddedildi.' });
    }

    // Sadece admin dışındaki roller için tenantId zorunlu
    if (user.role !== 'admin' && !user.tenantId) {
      logger.warn({
        msg: 'Tenant ID missing for non-admin role',
        user
      });
      return res.status(403).json({ message: 'Yetkisiz erişim: tenant tanımlı değil.' });
    }

    next();
  };
};

export const isAdmin = allowRoles('admin');

export const isTenantAdmin = allowRoles('admin', 'tenantadmin');