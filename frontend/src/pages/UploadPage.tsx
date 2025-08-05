import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setTitle('');
      setDescription('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      if (file.type.startsWith('video/')) {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('description', description);

        const res = await axios.post('/videos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        console.log('Video upload response:', res.data);

        const videoUrl = res.data?.blobUri || res.data?.video?.url;
        if (videoUrl) {
          setUploadedUrl(videoUrl);
        } else {
          setError('Yükleme başarılı ancak Azure URL’si alınamadı.');
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
        const tenantId = payload?.tenantId;
        formData.append('tenantId', tenantId || '');

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
      }
    } catch (err) {
      console.error('Yükleme hatası:', err);
      setError('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {!isAuthenticated ? (
        <div className="mb-4 flex gap-4">
          <button onClick={() => window.location.href = '/login'} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Giriş Yap</button>
          <button onClick={() => window.location.href = '/register'} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Kayıt Ol</button>
        </div>
      ) : null}

      <h1 className="text-xl font-bold mb-2">NodeFlow Dosya Yükleme</h1>
      {isAuthenticated ? (
        <div className="bg-white shadow rounded p-4 space-y-4">
          <input type="file" onChange={handleFileChange} className="mb-2 w-full border border-gray-300 px-3 py-2 rounded" />
          {file && file.type.startsWith('video/') && (
            <div className="mb-2">
              <input
                type="text"
                placeholder="Başlık"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mb-2 w-full px-2 py-1 border rounded"
              />
              <textarea
                placeholder="Açıklama"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
          )}
          <button
            onClick={handleUpload}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!file || isUploading}
          >
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
          {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
          {uploadedUrl && (
            <div className="mt-4">
              <p>Yüklenen dosya:</p>
              <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mt-2 text-sm">
                {uploadedUrl}
              </a>
            </div>
          )}
        </div>
      ) : (
        <p className="text-red-500 mt-2">Yükleme işlemi için lütfen giriş yapın.</p>
      )}
    </div>
  );
};

export default UploadPage;