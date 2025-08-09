import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import cron from 'node-cron';
import prisma from '../models/db';

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!AZURE_STORAGE_CONNECTION_STRING) {
  throw new Error('AZURE_STORAGE_CONNECTION_STRING is not defined in environment variables');
}

const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;
if (!CONTAINER_NAME) {
  throw new Error('AZURE_CONTAINER_NAME is not defined in environment variables');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

async function cleanupOrphanedBlobs() {
  try {
    console.log('[Cronjob] Blob cleanup started...');

    // Fetch all file URLs from DB
    const files = await prisma.file.findMany();
    const fileUrls = new Set(files.map(file => file.url));

    // List all blobs in Azure container
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobUrl = `${containerClient.url}/${blob.name}`;

      if (!fileUrls.has(blobUrl)) {
        console.log(`Deleting orphaned blob: ${blobUrl}`);
        await containerClient.deleteBlob(blob.name);
      }
    }

    console.log('[Cronjob] Blob cleanup finished.');
  } catch (error) {
    console.error('[Cronjob] Error during blob cleanup:', error);
  }
}


export function scheduleBlobCleanup() {
  console.log('[Cron] Scheduling blob cleanup every 10 minute...');
  cron.schedule('*/10 * * * *', () => {
    console.log('[Cron] Triggered blob cleanup at', new Date().toISOString());
    cleanupOrphanedBlobs();
  });
}