const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const getVideoByFileId = async (req, res) => {
  try {
    const { fileId } = req.params;
    const video = await prisma.video.findUnique({
      where: { fileId: Number(fileId) }
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Video fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createVideoMetadata = async (req, res) => {
  try {
    const { fileId, duration, format, resolution } = req.body;
    const video = await prisma.video.create({
      data: {
        fileId: Number(fileId),
        duration: duration !== null ? parseFloat(duration) : null,
        format,
        resolution
      }
    });
    res.status(201).json(video);
  } catch (error) {
    console.error('Video metadata creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      where: {
        file: {
          tenantId: req.user.tenantId
        }
      },
      include: { file: true }
    });
    res.json(videos);
  } catch (error) {
    console.error('Fetching all videos failed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.video.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Deleting video failed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { 
  getVideoByFileId, 
  createVideoMetadata,
  getAllVideos,
  deleteVideoById
};