import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fileRoutes from './routes/fileRoutes.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

export default app;