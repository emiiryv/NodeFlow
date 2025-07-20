import prisma from '../models/db.js';
import { extractMetadata } from '../config/videoMetaParser.js';
import { uploadToAzure } from '../services/azureService.js';
import { compressBuffer } from '../utils/compression.js';
import { compressVideoBuffer } from '../utils/videoProcessor.js';

export const handleUpload = async (req, res) => {
  try {
    const file = req.file;

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      console.log('Büyük dosya algılandı, sıkıştırma uygulanacak...');
      if (file.mimetype.startsWith('video/')) {
        const { buffer: compressedBuffer, size: compressedSize } = await compressVideoBuffer(file.buffer);
        if (compressedBuffer) {
          file.buffer = compressedBuffer;
          file.size = compressedSize;
        }
      } else {
        const { buffer: compressedBuffer, size: compressedSize } = await compressBuffer(file.buffer, file.mimetype);
        if (compressedBuffer) {
          file.buffer = compressedBuffer;
          file.size = compressedSize;
        }
      }
    }

    // Azure'a upload
    const azureUploadResult = await uploadToAzure({
      originalname: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
    }, req.ip);

    // Dosyayı veritabanına kaydet
    const newFile = await prisma.file.create({
      data: {
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: azureUploadResult.size || null,
        uploaderIp: req.ip,
        uploadedAt: azureUploadResult.uploadedAt,
        userId: req.user?.userId || null,
      },
    });

    let newVideo = null;
    let metadata = null;

    if (file.mimetype.startsWith('video/')) {
      metadata = await extractMetadata(file.buffer);

      newVideo = await prisma.video.create({
        data: {
          fileId: newFile.id,
          duration: metadata?.duration || null,
          format: metadata?.format || null,
          resolution: metadata?.resolution || null,
        },
      });
    }

    res.status(200).json({
      message: 'Dosya başarıyla yüklendi ve video meta verisi çıkarıldı.',
      file: newFile,
      video: newVideo,
      metadata: metadata || 'Video dışı dosya, metadata çıkarılmadı.',
    });
  } catch (error) {
    console.error('Dosya yükleme veya metadata çıkarma hatası:', error);
    res.status(500).json({ message: 'Dosya yüklenirken veya metadata çıkarılırken hata oluştu.' });
  }
};