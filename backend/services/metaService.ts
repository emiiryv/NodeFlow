import { tmpdir } from 'os';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import streamifier from 'streamifier';
import ffmpeg from 'fluent-ffmpeg';

export const extractMetadata = async (buffer: Buffer): Promise<{
  format: string;
  duration: number;
  resolution: string | null;
}> => {
  const tempFilePath = path.join(tmpdir(), `${Date.now()}-temp-video`);

  // Buffer'ı geçici dosyaya yaz
  await writeFile(tempFilePath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
      // İşlem tamamlandıktan sonra temp dosyayı sil
      unlink(tempFilePath).catch(() => {});

      if (err) {
        reject(err);
      } else {
        const format = metadata.format?.format_name || '';
        const duration = metadata.format?.duration || 0;
        const resolution =
          metadata.streams?.[0]?.width && metadata.streams?.[0]?.height
            ? `${metadata.streams[0].width}x${metadata.streams[0].height}`
            : null;

        resolve({ format, duration, resolution });
      }
    });
  });
};

export const optimizeVideo = async (
  buffer: Buffer,
  originalName: string
): Promise<Buffer> => {
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