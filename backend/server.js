import cors from 'cors';
import './scripts/blobCleanup.js';
import app from './app.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
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

app.listen(PORT, () => {
  console.log(`NodeFlow backend running on port ${PORT}`);
});