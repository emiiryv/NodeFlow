import express from 'express';
import { isAdmin, isTenantAdmin } from '../middlewares/roleMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getAllUsers,
  getTenantUsers,
  getAdminFiles,
  getTenantAdminFiles
} from '../controllers/adminController.js';

const router = express.Router();

// Users
router.get('/users', authenticate, isAdmin, getAllUsers);
router.get('/users/tenant', authenticate, isTenantAdmin, getTenantUsers);

// Files
router.get('/files', authenticate, isAdmin, getAdminFiles);
router.get('/files/tenant', authenticate, isTenantAdmin, getTenantAdminFiles);

export default router;
