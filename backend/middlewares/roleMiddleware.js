

/**
 * Role-based access control middleware
 * Usage: Pass allowed roles as parameters (e.g., allowRoles('admin'))
 */

export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Yetkisiz erişim: rol reddedildi.' });
    }
    next();
  };
};