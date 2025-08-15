import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import  logger  from '../utils/logger';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit for videos
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    logger.info(`Received file with mimetype: ${file.mimetype}`);
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      logger.warn(`Rejected non-video file: ${file.originalname} (${file.mimetype})`);
      cb(new Error('Only video files are allowed') as any, false);
    }
  }
});

export { upload, uploadVideo };