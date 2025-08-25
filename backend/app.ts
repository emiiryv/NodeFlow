import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fileRoutes from './routes/fileRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import videoRoutes from './routes/videoRoutes';
import securityRoutes from './routes/securityRoutes';
import { corsOptions } from './middlewares/corsConfig';

import queueDashboard from './utils/queueDashboard';
import { authenticate, secureQueueDashboard } from './middlewares/authMiddleware';
import { errorHandler } from './middlewares/errorHandler';
import logger from './utils/logger';

dotenv.config();

const app = express();
app.disable('etag');
app.use(cors(corsOptions));

// Logging middleware: log each request
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });

//CDN olmadığı için CSP’de yalnızca self ve data: kaynakları açık bırakıldı 
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }
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
app.use('/api', securityRoutes);

// adminRoutes sadece admin paneline ait API işlemlerini kapsar (örneğin: kullanıcı silme, dosya yönetimi gibi JSON API'ler).
// bull-board ise bir UI servisidir, kendi ExpressAdapter’ına sahip middleware’dir.
// Bu yüzden adminRoutes'a değil doğrudan app.ts içine, diğer route’larla eşdeğer bir middleware olarak eklenmesi gerekir.
app.use('/admin/queues', authenticate, secureQueueDashboard, queueDashboard.getRouter());

// Error handling middleware should be the last
app.use(errorHandler);

export default app;