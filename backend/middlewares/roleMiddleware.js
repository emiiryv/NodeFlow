

/**
 * Role-based access control middleware
 * Usage: Pass allowed roles as parameters (e.g., allowRoles('admin'))
 */

export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Yetkisiz erişim: rol veya tenant tabanlı erişim reddedildi.' });
    }
    if (!user.tenantId) {
      return res.status(403).json({ message: 'Yetkisiz erişim: tenant tanımlı değil.' });
    }
    next();
  };
};