import prisma from '../models/db.js';
import { extractMetadata } from '../config/videoMetaParser.js';
import { uploadToAzure } from '../services/azureService.js';

export const handleUpload = async (req, res) => {
  try {
    const file = req.file;

    // Azure'a upload
    const azureUploadResult = await uploadToAzure(file, req.ip);

    // Dosyayı veritabanına kaydet
    const newFile = await prisma.file.create({
      data: {
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: azureUploadResult.size || null,
        uploaderIp: req.ip,
        uploadedAt: azureUploadResult.uploadedAt,
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