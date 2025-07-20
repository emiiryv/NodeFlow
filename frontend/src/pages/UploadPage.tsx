import React, { useState } from 'react';
import axios from '../api/axiosInstance';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setError(null);

    try {
      const res = await axios.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('Upload response:', res.data);

      const blobUrl = res.data?.blobUri || res.data?.file?.url;
      if (blobUrl) {
        setUploadedUrl(blobUrl);
      } else {
        setError('Yükleme başarılı ancak Azure URL’si alınamadı.');
      }
    } catch (err) {
      console.error('Yükleme hatası:', err);
      setError('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <a href="/files" className="text-blue-500 underline">Dosya Listesi</a>
      </div>
      <h1 className="text-xl font-bold mb-2">NodeFlow Dosya Yükleme</h1>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!file || isUploading}
      >
        {isUploading ? 'Yükleniyor...' : 'Yükle'}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}

      {uploadedUrl && (
        <div className="mt-4">
          <p>Yüklenen dosya:</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadPage;