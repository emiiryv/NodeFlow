import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { Worker, Job } from 'bullmq';
import { generateThumbnail } from '../services/thumbnailService';

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
    console.log(`Processing thumbnail job for: ${tmpPath}`);

    try {
      fs.writeFileSync(tmpPath, Buffer.from(videoBuffer));
      const thumbUrl = await generateThumbnail(tmpPath, videoId, tenantId);
      console.log(`Thumbnail created at: ${thumbUrl}`);
      fs.unlinkSync(tmpPath);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      try { fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath); } catch {}
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Thumbnail job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`Thumbnail job ${job?.id} failed:`, err);
});
