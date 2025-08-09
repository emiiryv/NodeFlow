import cors from 'cors';
import { scheduleBlobCleanup } from './scripts/blobCleanup';
import app from './app';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';
dotenv.config();

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

app.listen(PORT, () => {
  console.log(`NodeFlow backend running on port ${PORT}`);
});