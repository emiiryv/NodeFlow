/**
 * Role-based access control middleware
 * Usage:
 *   - allowRoles('admin')
 *   - isAdmin
 *   - isTenantAdmin
 */

export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Yetkisiz erişim: rol reddedildi.' });
    }

    // Sadece admin dışındaki roller için tenantId zorunlu
    if (user.role !== 'admin' && !user.tenantId) {
      return res.status(403).json({ message: 'Yetkisiz erişim: tenant tanımlı değil.' });
    }

    next();
  };
};

export const isAdmin = allowRoles('admin');

export const isTenantAdmin = allowRoles('admin', 'tenantadmin');