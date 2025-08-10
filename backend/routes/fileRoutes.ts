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

router.post('/upload', verifyToken, upload.single('file'), handleUpload);

router.get('/', verifyToken, getUserFiles);
router.get('/tenant', verifyToken, getTenantFiles);
router.get('/stream/:id', verifyToken, streamFileById);//
router.get('/:id/download', verifyToken, streamFileById); 
router.get('/:id', verifyToken, getFileById);
router.put('/:id', verifyToken, updateFileName);
router.delete('/:id', verifyToken, deleteFileById);

export default router;