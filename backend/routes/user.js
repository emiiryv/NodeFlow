import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUser
} from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get current user's profile
router.get('/me', authenticate, getUserProfile);

// Update user profile
router.put('/me', authenticate, updateUserProfile);

// Delete user account
router.delete('/me', authenticate, deleteUser);

export default router;