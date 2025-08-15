import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { Worker, Job } from 'bullmq';
import { generateThumbnail } from '../services/thumbnailService';
import logger from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const worker = new Worker(
  'thumbnailQueue',
  async (job: Job) => {
    const { videoBuffer, videoId, tenantId } = job.data;

    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const tmpPath = path.join(uploadsDir, `video_${videoId}_${Date.now()}.mp4`);
    logger.info(`Processing thumbnail job for: ${tmpPath}`);

    try {
      fs.writeFileSync(tmpPath, Buffer.from(videoBuffer));
      const thumbUrl = await generateThumbnail(tmpPath, videoId, tenantId);
      logger.info(`Thumbnail created at: ${thumbUrl}`);
      fs.unlinkSync(tmpPath);
    } catch (error) {
      logger.error({ err: error }, 'Error generating thumbnail');
      try { fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath); } catch {}
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  logger.info(`Thumbnail job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  logger.error({ err }, `Thumbnail job ${job?.id} failed`);
});
