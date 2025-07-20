import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

/**
 * Compress a video buffer using ffmpeg via temporary files.
 * @param {Buffer} buffer - Original video buffer
 * @param {string} mimetype - MIME type of the video
 * @returns {Promise<{ buffer: Buffer, size: number }>} - Compressed video buffer and new size
 */
export const compressVideoBuffer = async (buffer, mimetype = '') => {
  const tempInput = path.join(os.tmpdir(), `input-${Date.now()}.mov`);
  const tempOutput = path.join(os.tmpdir(), `output-${Date.now()}.mp4`);

  try {
    await writeFile(tempInput, buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(tempInput)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('?x720')
        .outputOptions('-preset fast')
        .output(tempOutput)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const compressedBuffer = await readFile(tempOutput);
    return {
      buffer: compressedBuffer,
      size: compressedBuffer.length
    };
  } finally {
    if (fs.existsSync(tempInput)) await unlink(tempInput);
    if (fs.existsSync(tempOutput)) await unlink(tempOutput);
  }
};