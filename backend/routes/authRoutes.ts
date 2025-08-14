import express from 'express';
import { register, login } from '../controllers/authController';
import { isAdmin, isTenantAdmin } from '../middlewares/roleMiddleware';
import csrfProtection from '../middlewares/csrfProtection';

const router = express.Router();

// Public Routes (no auth required)
router.post('/register', csrfProtection, register);
router.post('/login', login);

export default router;