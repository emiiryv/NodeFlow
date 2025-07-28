import express from 'express';
import { isAdmin, isTenantAdmin } from '../middlewares/roleMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getAllUsers,
  getTenantUsers,
  getAdminFiles,
  getTenantAdminFiles,
  deleteFileById,
  updateUserById,
  deleteUserById,
  getAllTenants
} from '../controllers/adminController.js';

const router = express.Router();

// Tenants
router.get('/tenants', authenticate, isAdmin, getAllTenants);

// Users
router.get('/users', authenticate, isAdmin, getAllUsers);
router.get('/users/tenant', authenticate, isTenantAdmin, getTenantUsers);

router.delete('/users/:id', authenticate, isAdmin, deleteUserById);
router.delete('/users/tenant/:id', authenticate, isTenantAdmin, deleteUserById);

router.put('/users/:id', authenticate, isAdmin, updateUserById);
router.put('/users/tenant/:id', authenticate, isTenantAdmin, updateUserById);

// Files
router.get('/files', authenticate, isAdmin, getAdminFiles);
router.get('/files/tenant', authenticate, isTenantAdmin, getTenantAdminFiles);

// File Deletion
router.delete('/files/:id', authenticate, isAdmin, deleteFileById);
router.delete('/files/tenant/:id', authenticate, isTenantAdmin, deleteFileById);

export default router;
