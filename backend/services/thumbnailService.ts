import { spawn } from 'child_process';
import fs from 'fs';
import { uploadToAzure } from './azureService';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateThumbnail(
  videoPath: string,
  videoId: number,
  tenantId?: number,
  atSecond = 5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmpDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tempThumbnailPath = path.join(
      __dirname,
      `../uploads/thumb_${videoId}.jpg`
    );

    // ffmpeg komutu: belirtilen saniyeden tek kare al
    const ffmpeg = spawn('ffmpeg', [
      '-ss',
      atSecond.toString(),
      '-i',
      videoPath,
      '-vframes',
      '1',
      '-vf',
      'scale=854:-1:force_original_aspect_ratio=decrease',
      '-q:v',
      '4',
      '-y',
      tempThumbnailPath,
    ]);

    ffmpeg.on('close', async (code) => {
      if (code !== 0) {
        return reject(new Error(`FFmpeg exited with code ${code}`));
      }

      try {
        const buffer = fs.readFileSync(tempThumbnailPath);

        // Azure’a yükle
        const azurePath = `thumbnails/${videoId}.jpg`;
        const uploadResult = await uploadToAzure(
          { originalname: `${videoId}.jpg`, buffer, mimetype: 'image/jpeg', size: buffer.length },
          '', // uploaderIp (gerekirse boş geç)
          tenantId ?? '',
          azurePath
        );

        resolve(uploadResult.url);
      } catch (err) {
        reject(err);
      } finally {
        if (fs.existsSync(tempThumbnailPath)) {
          fs.unlinkSync(tempThumbnailPath);
        }
      }
    });
  });
}