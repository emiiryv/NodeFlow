import express from 'express';
import { register, login } from '../controllers/authController';
import { isAdmin, isTenantAdmin } from '../middlewares/roleMiddleware';

const router = express.Router();

// Public Routes (no auth required)
router.post('/register', register);
router.post('/login', login);

export default router;