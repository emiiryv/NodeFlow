// services/azureService.js
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

async function uploadToAzure(file, uploaderIp) {
  const { originalname, buffer, mimetype, size } = file;
  if (!originalname || !buffer || !mimetype || !Buffer.isBuffer(buffer) || typeof size !== 'number') {
    throw new Error('Invalid file object provided to uploadToAzure.');
  }

  const blobName = `${Date.now()}-${originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimetype }
  });

  const url = blockBlobClient.url;

  if (!url) {
    throw new Error('Blob URL could not be retrieved after upload.');
  }

  return {
    filename: originalname,
    url,
    size,
    uploaderIp,
    uploadedAt: new Date()
  };
}

async function deleteFromAzure(blobUrl) {
  try {
    const url = new URL(blobUrl);
    const blobName = decodeURIComponent(url.pathname.split('/').pop());
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error('Azure blob silinirken hata:', error);
    throw new Error('Blob silme işlemi başarısız.');
  }
}

export { uploadToAzure, deleteFromAzure };