import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

interface FileItem {
  id: number;
  filename: string;
  url: string;
  uploadedAt: string;
  size: number;
  mimetype: string;
}

const FileListPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchFiles = async () => {
    try {
      const res = await axios.get('/files');
      setFiles(res.data);
    } catch (err) {
      setError('Dosyalar alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (id: number) => {
    try {
      await axios.delete(`/files/${id}`);
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      setError('Dosya silinemedi.');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Yüklenen Dosyalar</h1>
      {loading && <p>Yükleniyor...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <ul>
        {files.map((file) => (
          <li key={file.id} className="mb-4 border-b pb-3">
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <a href={file.url} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">
                  {file.filename}
                </a>
                <div className="text-sm text-gray-600">
                  Tür: {file.mimetype} | Boyut: {(file.size / 1024).toFixed(2)} KB
                </div>
                <div className="text-sm text-gray-600">
                  Yükleme Tarihi: {new Date(file.uploadedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => deleteFile(file.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 h-fit"
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileListPage;