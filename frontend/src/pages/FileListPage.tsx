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

interface VideoItem {
  id: number;
  title: string;
  description?: string;
  url: string;
  uploadedAt: string;
  duration?: number;
  resolution?: string;
  format?: string;
  size: number;
  filename: string;
}

const FileListPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);

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

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/videos/my');
      setVideos(response.data);
    } catch (err) {
      console.error('Videolar alınamadı.');
    }
  };

  const deleteFile = async (id: number) => {
    if (!window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/files/${id}`);
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      setError('Dosya silinemedi.');
    }
  };
  const handleEdit = (file: FileItem) => {
    setEditingFile(file);
    setNewFilename(file.filename);
    setIsModalOpen(true);
  };

  const handleUpdateFilename = async () => {
    if (!editingFile) return;
    try {
      await axios.put(`/files/${editingFile.id}`, { filename: newFilename });
      setFiles((prev) =>
        prev.map((file) => (file.id === editingFile.id ? { ...file, filename: newFilename } : file))
      );
      setIsModalOpen(false);
    } catch (err) {
      setError('Dosya adı güncellenemedi.');
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchVideos();
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
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="text-sm text-green-600 underline hover:text-green-800"
                  >
                    İndir
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(file.url);
                      alert('Bağlantı panoya kopyalandı!');
                    }}
                    className="text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    Bağlantıyı Kopyala
                  </button>
                </div>
                <button onClick={() => handleEdit(file)} className="text-sm text-gray-500 underline">Düzenle</button>
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
      <h1 className="text-2xl font-bold mt-8 mb-4">Yüklenen Videolar</h1>
      <ul>
        {videos.map((video) => (
          <li key={video.id} className="mb-4 border-b pb-3">
            <div className="flex flex-col">
              <a href={video.url} target="_blank" rel="noreferrer" className="text-blue-600 font-medium underline">
                {video.title}
              </a>
              <p className="text-sm text-gray-600 mt-1">
                Süre: {video.duration?.toFixed(2)} sn | Çözünürlük: {video.resolution} | Format: {video.format}
              </p>
              <p className="text-sm text-gray-600">
                Dosya: {video.filename} | {(video.size / 1024).toFixed(2)} KB
              </p>
              <p className="text-sm text-gray-600">
                Yükleme Tarihi: {new Date(video.uploadedAt).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-80">
            <h2 className="text-lg font-semibold mb-4">Dosya Adını Güncelle</h2>
            <input
              type="text"
              className="border px-2 py-1 w-full mb-3"
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-3 py-1 bg-gray-300 rounded">İptal</button>
              <button onClick={handleUpdateFilename} className="px-3 py-1 bg-blue-500 text-white rounded">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileListPage;