import zlib from 'zlib';
import util from 'util';

const gzip = util.promisify(zlib.gzip);

/**
 * Compresses a given Buffer using Gzip and returns both buffer and its size.
 * @param {Buffer} buffer - The buffer to compress.
 * @returns {Promise<{buffer: Buffer, size: number}>} - The compressed buffer and its size.
 */
export async function compressBuffer(buffer) {
  try {
    const compressed = await gzip(buffer);
    return {
      buffer: compressed,
      size: compressed.length
    };
  } catch (err) {
    console.error('Compression failed:', err);
    throw new Error('Buffer compression error');
  }
}