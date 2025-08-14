import { Worker, Job } from 'bullmq';
import { extractMetadata } from '../services/metaService';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const worker = new Worker(
  'metadataQueue',
  async (job: Job) => {
    const { fileBuffer, videoId } = job.data;

    if (!fileBuffer || !videoId) {
      throw new Error('Missing fileBuffer or videoId in job data.');
    }

    try {
      const metadata = await extractMetadata(Buffer.from(fileBuffer));
      console.log(`Extracted metadata:`, metadata);

      const prisma = (await import('../models/db.js')).default;

      await prisma.video.update({
        where: { id: videoId },
        data: {
          format: metadata.format,
          duration: metadata.duration,
          resolution: metadata.resolution,
        },
      });
    } catch (error) {
      console.error('Error extracting metadata:', error);
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Metadata job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`Metadata job ${job?.id} failed:`, err);
});