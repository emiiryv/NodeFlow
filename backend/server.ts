import https from 'https';
import fs from 'fs';
import cors from 'cors';
import { scheduleBlobCleanup } from './scripts/blobCleanup';
import app from './app';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { setupWebSocket } from './socketServer';
import { wss } from './socketServer';
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

const server = https.createServer({ key, cert }, app);
server.listen(PORT, () => {
  console.log(`NodeFlow backend running at https://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
setupWebSocket(server);

import './jobs/thumbnailWorker';
import './jobs/metadataWorker';