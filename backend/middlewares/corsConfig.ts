import cors from 'cors';

const allowedOrigins = [
  'https://localhost:3001', // dev frontend
  'https://yourdomain.com' // production
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};