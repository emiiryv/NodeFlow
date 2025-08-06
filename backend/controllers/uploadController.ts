import { Request, Response } from 'express';
import prisma from '../models/db';
import { extractMetadata } from '../services/metaService';
import { uploadToAzure } from '../services/azureService';
import { compressBuffer } from '../utils/compression';
import { compressVideoBuffer } from '../utils/videoProcessor';

export const handleUpload = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Dosya bulunamadı.' });
    }

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
        const { buffer: compressedBuffer, size: compressedSize } = await compressBuffer(file.buffer);
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
      size: file.buffer.length,
    }, req.ip || '', req.user?.tenantId?.toString() || '');//tenantId azure'a string olarak yollanıyor(azure bu şekilde bekliyor)

    if (!req.user?.userId || !req.user?.tenantId || !file.mimetype) {
      return res.status(400).json({ message: 'Eksik kullanıcı veya tenant bilgisi ya da mimetype.' });
    }

    // Dosyayı veritabanına kaydet
    const newFile = await prisma.file.create({
      data: {
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: file.buffer.length,
        uploaderIp: req.ip || '',
        uploadedAt: azureUploadResult.uploadedAt,
        userId: req.user.userId,
        tenantId: req.user.tenantId,
        mimetype: file.mimetype,
      },
    });

    let newVideo = null;
    let metadata = null;

    if (file.mimetype.startsWith('video/')) {
      metadata = await extractMetadata(file.buffer);

      const videoData: any = {
        fileId: newFile.id,
        duration: metadata?.duration || null,
        format: metadata?.format || null,
        resolution: metadata?.resolution || null,
        filename: file.originalname,
        url: azureUploadResult.url,
        size: file.buffer.length,
        uploadedAt: azureUploadResult.uploadedAt,
        mimetype: file.mimetype,
      };

      if (req.user?.userId) {
        videoData.user = { connect: { id: req.user.userId } };
      }

      if (req.user?.tenantId) {
        videoData.tenant = { connect: { id: req.user.tenantId } };
      }

      newVideo = await prisma.video.create({ data: videoData });
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