import https from 'https';
import fs from 'fs';
import cors from 'cors';
import { scheduleBlobCleanup } from './scripts/blobCleanup';
import app from './app';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
dotenv.config();
app.use(cookieParser());

const key = fs.readFileSync('./localhost+2-key.pem');
const cert = fs.readFileSync('./localhost+2.pem');

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3001';
console.log('CORS allowed origin:', allowedOrigin);
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3001;

scheduleBlobCleanup();

https.createServer({ key, cert }, app).listen(PORT, () => {
  console.log(`NodeFlow backend running at https://localhost:${PORT}`);
});

import './jobs/thumbnailWorker';
import './jobs/metadataWorker';