import express from 'express';
import videoController from '../controllers/videoController';
import { verifyToken } from '../middlewares/authMiddleware';
import { isTenantAdmin, isAdmin } from '../middlewares/roleMiddleware';
import { uploadVideo } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.get('/', verifyToken, videoController.getVideos);
router.get('/my', verifyToken, videoController.getMyVideos);
router.get('/:id', verifyToken, videoController.getVideoById);
router.post('/', verifyToken, uploadVideo.single('video'), videoController.uploadVideo);
router.delete('/:id', verifyToken, videoController.deleteVideo);

export default router;