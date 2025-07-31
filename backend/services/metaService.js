

import ffmpeg from 'fluent-ffmpeg';
import streamifier from 'streamifier';
import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export const extractMetadata = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = streamifier.createReadStream(buffer);
    ffmpeg.ffprobe(stream, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const format = metadata.format.format_name;
        const duration = metadata.format.duration;
        const resolution =
          metadata.streams[0]?.width && metadata.streams[0]?.height
            ? `${metadata.streams[0].width}x${metadata.streams[0].height}`
            : null;

        resolve({ format, duration, resolution });
      }
    });
  });
};

export const optimizeVideo = async (buffer, originalName) => {
  const inputPath = path.join(tmpdir(), `${Date.now()}-${originalName}`);
  const outputPath = path.join(tmpdir(), `optimized-${Date.now()}-${originalName}`);

  await writeFile(inputPath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-movflags +faststart')
      .save(outputPath)
      .on('end', async () => {
        const optimizedBuffer = await import('fs').then(fs => fs.promises.readFile(outputPath));
        await unlink(inputPath);
        await unlink(outputPath);
        resolve(optimizedBuffer);
      })
      .on('error', async (err) => {
        await unlink(inputPath);
        reject(err);
      });
  });
};