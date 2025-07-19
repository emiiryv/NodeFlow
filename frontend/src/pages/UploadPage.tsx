import React, { useState } from 'react';
import axios from '../api/axiosInstance';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedUrl(res.data.data.blobUri);
    } catch (err) {
      console.error('Yükleme hatası:', err);
      alert('Upload failed.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">NodeFlow Dosya Yükleme</h1>
      <input type="file" onChange={handleFileChange} className="mb-2" />
      <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">
        Yükle
      </button>

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