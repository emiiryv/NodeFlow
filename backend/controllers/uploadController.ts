import { Request, Response } from 'express';
import prisma from '../models/db';
import { uploadToAzure, parseAzureBlobUrl } from '../services/azureService';
import { compressBuffer } from '../utils/compression';
import logger from '../utils/logger';

export const handleUpload = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Dosya bulunamadı.' });
    }

    // Video dosyaları bu endpointte işlenmez; /videos kullanın
    if (file.mimetype.startsWith('video/')) {
      return res
        .status(400)
        .json({ message: 'Video dosyaları için /videos endpointini kullanın.' });
    }

    // Büyük dosyalar için (video dışı) sıkıştırma
    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      const { buffer: compressedBuffer, size: compressedSize } = await compressBuffer(file.buffer);
      if (compressedBuffer) {
        file.buffer = compressedBuffer;
        file.size = compressedSize;
      }
    }

    // Azure'a upload
    const azureUploadResult = await uploadToAzure(
      {
        originalname: file.originalname,
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.buffer.length,
      },
      req.ip || '',
      req.user?.tenantId?.toString() || ''
    ); // tenantId Azure’a string olarak gider

    // URL'den container ve blobName'i çıkar
    const { container, blobName } = parseAzureBlobUrl(azureUploadResult.url);

    if (!req.user?.userId || !req.user?.tenantId || !file.mimetype) {
      return res
        .status(400)
        .json({ message: 'Eksik kullanıcı veya tenant bilgisi ya da mimetype.' });
    }

    // Dosyayı veritabanına kaydet (Azure sonuçlarını kaynak al)
    const newFile = await prisma.file.create({
      data: {
        filename: azureUploadResult.filename,
        url: azureUploadResult.url,
        size: azureUploadResult.size, // buffer.length yerine Azure’dan dönen
        uploaderIp: req.ip || '',
        uploadedAt: azureUploadResult.uploadedAt,
        userId: req.user.userId,
        tenantId: req.user.tenantId,
        mimetype: file.mimetype,
        container: container ?? null,
        blobName: blobName ?? null,
      },
    });

    logger.info(`File uploaded successfully: ${azureUploadResult.filename}`);

    return res.status(201).json({
      message: 'Dosya başarıyla yüklendi.',
      file: newFile,
      blobUri: newFile.url,
    });
  } catch (error) {
    logger.error('Dosya yükleme hatası');
    logger.error(error instanceof Error ? error.message : String(error));
    return res
      .status(500)
      .json({ message: 'Dosya yüklenirken bir hata oluştu.' });
  }
};