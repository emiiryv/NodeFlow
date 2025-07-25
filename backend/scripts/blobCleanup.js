

import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import cron from 'node-cron';
import prisma from '../models/db.js';

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

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

// Run every day at 3 AM
cron.schedule('0 3 * * *', cleanupOrphanedBlobs);