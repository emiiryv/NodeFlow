import { Queue } from 'bullmq';


const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const thumbnailQueue = new Queue('thumbnailQueue', {
  connection,
});

export const metadataQueue = new Queue('metadataQueue', {
  connection,
});
