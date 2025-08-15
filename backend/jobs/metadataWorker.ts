import { Worker, Job } from 'bullmq';
import { extractMetadata } from '../services/metaService';
import logger from '../utils/logger';

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
      logger.info({ metadata }, 'Extracted metadata');

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
      logger.error({ error }, 'Error extracting metadata');
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  logger.info(`Metadata job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  logger.error({ err, jobId: job?.id }, 'Metadata job failed');
});