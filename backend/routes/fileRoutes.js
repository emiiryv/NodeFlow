import express from 'express';
import multer from 'multer';
import { handleUpload } from '../controllers/uploadController.js';
import {
  getAllFiles,
  getFileById,
  updateFileName,
  deleteFileById
} from '../controllers/fileController.js';

import { upload } from '../middlewares/uploadMiddleware.js';
const router = express.Router();

router.post('/upload', upload.single('file'), handleUpload);

router.get('/', getAllFiles);
router.get('/:id', getFileById);
router.put('/:id', updateFileName);
router.delete('/:id', deleteFileById);

export default router;