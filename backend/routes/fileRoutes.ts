import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { handleUpload } from '../controllers/uploadController';
import {
  getUserFiles,
  getTenantFiles,
  getFileById,
  updateFileName,
  deleteFileById,
  streamFileById
} from '../controllers/fileController';

import { upload } from '../middlewares/uploadMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';
import { isAdmin, isTenantAdmin } from '../middlewares/roleMiddleware';

const router = express.Router();

// Helpers to preset disposition/query before hitting controller
const setInlineDisposition = (req: Request, _res: Response, next: NextFunction) => {
  // Ensure inline preview (should not count as download in controller)
  (req.query as any).disposition = 'inline';
  // Optional hint for controller logic
  (req as any).isDownload = false;
  next();
};

const setAttachmentDisposition = (req: Request, _res: Response, next: NextFunction) => {
  // Force attachment (download)
  (req.query as any).disposition = 'attachment';
  // Optional hint for controller logic
  (req as any).isDownload = true;
  next();
};

router.post('/upload', verifyToken, upload.single('file'), handleUpload);

router.get('/', verifyToken, getUserFiles);
router.get('/tenant', verifyToken, getTenantFiles);
router.get('/stream/:id', verifyToken, setInlineDisposition, streamFileById);
router.get('/:id/download', verifyToken, setAttachmentDisposition, streamFileById);
router.get('/:id', verifyToken, getFileById);
router.put('/:id', verifyToken, updateFileName);
router.delete('/:id', verifyToken, deleteFileById);

export default router;