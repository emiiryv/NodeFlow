

const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// Get video metadata by file ID

// Get all videos with associated file info
router.get('/', videoController.getAllVideos);

// Create video metadata
router.post('/', videoController.createVideoMetadata);

// Delete video by ID
router.delete('/:id', videoController.deleteVideoById);

module.exports = router;