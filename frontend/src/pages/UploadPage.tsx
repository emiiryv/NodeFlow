import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

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
      {!isAuthenticated ? (
        <div className="mb-4 flex gap-4">
          <button onClick={() => window.location.href = '/login'} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Giriş Yap</button>
          <button onClick={() => window.location.href = '/register'} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Kayıt Ol</button>
        </div>
      ) : null}

      <h1 className="text-xl font-bold mb-2">NodeFlow Dosya Yükleme</h1>
      {isAuthenticated ? (
        <>
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
        </>
      ) : (
        <p className="text-red-500 mt-2">Yükleme işlemi için lütfen giriş yapın.</p>
      )}
    </div>
  );
};

export default UploadPage;