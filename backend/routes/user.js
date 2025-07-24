import { isAdmin, isTenantAdmin } from '../middlewares/roleMiddleware.js';
import express from 'express';
import {
  getUserStats,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  changeUserPassword
} from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get current user's profile
router.get('/me', authenticate, getUserProfile);

// Update user profile
router.put('/me', authenticate, updateUserProfile);

// Delete user account
router.delete('/me', authenticate, deleteUser);

// Get user statistics

// Get stats for current user only
router.get('/stats/me', authenticate, getUserStats);
router.get('/stats', authenticate, (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return isTenantAdmin(req, res, next);
}, getUserStats);

// Change user password
router.put('/change-password', authenticate, changeUserPassword);

export default router;