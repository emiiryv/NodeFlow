import express from 'express';
import videoController from '../controllers/videoController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { isTenantAdmin, isAdmin } from '../middlewares/roleMiddleware.js';
import { uploadVideo } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, videoController.getVideos);
router.get('/my', verifyToken, videoController.getMyVideos);
router.get('/:id', verifyToken, videoController.getVideoById);
router.post('/', verifyToken, uploadVideo.single('video'), videoController.uploadVideo);
router.delete('/:id', verifyToken, videoController.deleteVideo);

export default router;