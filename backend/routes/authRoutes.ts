import express from 'express';
import { register, login } from '../controllers/authController';
import { isAdmin, isTenantAdmin } from '../middlewares/roleMiddleware';
import csrfProtection from '../middlewares/csrfProtection';
import { authLimiter } from '../middlewares/rateLimitMiddleware';

const router = express.Router();

// Public Routes (no auth required)
router.post('/register', authLimiter, csrfProtection, register);
router.post('/login', authLimiter, login);

export default router;