import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME!;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

export async function uploadToAzure(
  file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
  uploaderIp: string,
  tenantId: string
): Promise<{ filename: string; url: string; size: number; mimetype: string; uploaderIp: string; uploadedAt: Date }> {
  const blobName = `${tenantId}/${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
    },
  });

  const url = blockBlobClient.url;

  return {
    filename: file.originalname,
    url,
    size: file.size,
    mimetype: file.mimetype,
    uploaderIp,
    uploadedAt: new Date(),
  };
}

export async function deleteFromAzure(blobName: string): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

export function parseAzureBlobUrl(url: string): { container: string | null; blobName: string | null } {
  try {
    const u = new URL(url);
    // /container/blob... -> ilk seg container, geri kalanı blob path
    const [_, container, ...rest] = u.pathname.split('/');
    if (!container || rest.length === 0) return { container: null, blobName: null };
    return { container, blobName: rest.join('/') };
  } catch {
    return { container: null, blobName: null };
  }
}