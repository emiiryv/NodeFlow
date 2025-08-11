import express from 'express';
import videoController from '../controllers/videoController';
import { verifyToken } from '../middlewares/authMiddleware';
import { uploadVideo, upload } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.get('/', verifyToken, videoController.getVideos);
router.get('/my', verifyToken, videoController.getMyVideos);
router.get('/:id', verifyToken, videoController.getVideoById);
router.post('/', verifyToken, uploadVideo.single('video'), videoController.uploadVideo);
router.post('/:id/thumbnail', verifyToken, videoController.generateThumbnailForVideo);
router.post('/:id/thumbnail/upload', verifyToken, upload.single('thumbnail'), videoController.uploadThumbnailForVideo);
router.get('/:id/thumbnail', verifyToken, videoController.streamVideoThumbnail);
router.delete('/:id', verifyToken, videoController.deleteVideo);

export default router;