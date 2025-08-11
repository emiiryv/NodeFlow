import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fileRoutes from './routes/fileRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import videoRoutes from './routes/videoRoutes';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));

// Apply JSON parser only where needed; skip binary/no-body endpoints
const jsonOnly = express.json();
app.use((req, res, next) => {
  // Skip JSON parsing for download/stream and thumbnail-regenerate endpoints
  const p = req.path;
  const isFileDownload = req.method === 'GET' && (/^\/api\/files\/\d+\/download(\b|\/)\/?/.test(req.originalUrl) || /^\/api\/files\/stream\//.test(req.originalUrl));
  const isVideoThumbNoBody = req.method === 'POST' && /^\/api\/videos\/\d+\/thumbnail(\?.*)?$/.test(req.originalUrl);

  if (isFileDownload || isVideoThumbNoBody) {
    return next();
  }
  return jsonOnly(req, res, next);
});

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/videos', videoRoutes);

export default app;