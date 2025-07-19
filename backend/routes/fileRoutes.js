const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadToAzure } = require('../services/azureService');
const { v4: uuidv4 } = require('uuid');

// Multer config (hafızada tut, direkt blob’a atılacak)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const blobUri = await uploadToAzure(file);

    // DB’ye metadata ekleme (örnek - veritabanı işlemi yok burada)
    const metadata = {
      id: uuidv4(),
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      blobUri,
    };

    console.log('Yükleme tamamlandı:', metadata);
    res.status(200).json({ message: 'Upload successful', data: metadata });
  } catch (err) {
    console.error('Yükleme hatası:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;