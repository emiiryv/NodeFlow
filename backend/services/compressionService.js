

import zlib from 'zlib';
import util from 'util';

const gzip = util.promisify(zlib.gzip);

/**
 * Compresses a given Buffer using Gzip, only if the file is an image.
 * @param {Buffer} buffer - The buffer to compress.
 * @param {string} mimetype - The MIME type of the file.
 * @returns {Promise<{buffer: Buffer, size: number}>} - The compressed buffer and its new size.
 */
export async function compressBuffer(buffer, mimetype) {
  // Only compress if the file is an image
  if (!mimetype || !mimetype.startsWith('image/')) {
    return { buffer, size: buffer.length };
  }

  try {
    const compressed = await gzip(buffer);
    return { buffer: compressed, size: compressed.length };
  } catch (err) {
    console.error('Compression failed:', err);
    throw new Error('Buffer compression error');
  }
}