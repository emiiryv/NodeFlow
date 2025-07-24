const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { isTenantAdmin, isAdmin } = require('../middlewares/roleMiddleware');

// Get video metadata by file ID

// Get all videos with associated file info
router.get('/', verifyToken, isTenantAdmin, videoController.getAllVideos);

// Create video metadata
router.post('/', verifyToken, isTenantAdmin, videoController.createVideoMetadata);

// Delete video by ID
router.delete('/:id', verifyToken, isAdmin, videoController.deleteVideoById);

module.exports = router;