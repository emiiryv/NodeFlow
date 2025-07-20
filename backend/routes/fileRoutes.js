import express from 'express';
import multer from 'multer';
import { handleUpload } from '../controllers/uploadController.js';
import {
  getUserFiles,
  getFileById,
  updateFileName,
  deleteFileById
} from '../controllers/fileController.js';

import { upload } from '../middlewares/uploadMiddleware.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/upload', verifyToken, upload.single('file'), handleUpload);

router.get('/', verifyToken, getUserFiles);
router.get('/:id', verifyToken, getFileById);
router.put('/:id', verifyToken, updateFileName);
router.delete('/:id', verifyToken, deleteFileById);

export default router;