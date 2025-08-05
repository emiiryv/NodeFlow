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
  fileId: number;
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
      const allFiles = res.data;

      // Video dosyalarının ID'lerini filtrele
      const videoRes = await axios.get('/videos/my');
      const videoFileIds = videoRes.data.map((v: any) => v.fileId);

      const filteredFiles = allFiles.filter((f: any) => !videoFileIds.includes(f.id));

      setFiles(filteredFiles);
      setVideos(videoRes.data);
    } catch (err) {
      setError('Dosyalar alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  // fetchVideos fonksiyonu artık kullanılmıyor

  const deleteFile = async (id: number) => {
    if (!window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/files/${id}`);
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      setError('Dosya silinemedi.');
    }
  };

  const deleteVideo = async (id: number) => {
    if (!window.confirm('Bu videoyu silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/videos/${id}`);
      setVideos((prev) => prev.filter((video) => video.id !== id));
    } catch (err) {
      setError('Video silinemedi.');
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
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Yüklenen Dosyalar</h1>
      {loading && <p>Yükleniyor...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <h2 className="text-xl font-semibold mt-6 mb-2">Dosyalar</h2>
      <table className="w-full table-auto border border-gray-300 mb-8 text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 text-left">Dosya Adı</th>
            <th className="px-4 py-2">Boyut</th>
            <th className="px-4 py-2">Tür</th>
            <th className="px-4 py-2">Yüklenme Tarihi</th>
            <th className="px-4 py-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-t">
              <td className="px-4 py-2">
                <button onClick={() => navigate(`/files/${file.id}`)} className="text-blue-600 underline">
                  {file.filename}
                </button>
              </td>
              <td className="px-4 py-2 text-center">{(file.size / 1024).toFixed(2)} KB</td>
              <td className="px-4 py-2 text-center">{file.mimetype}</td>
              <td className="px-4 py-2 text-center">{new Date(file.uploadedAt).toLocaleString()}</td>
              <td className="px-4 py-2 flex flex-col gap-1 items-center">
                <button onClick={() => window.open(file.url, '_blank')} className="text-green-600 underline text-xs">
                  İndir
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(file.url);
                    alert('Bağlantı panoya kopyalandı!');
                  }}
                  className="text-blue-600 underline text-xs"
                >
                  Kopyala
                </button>
                <button onClick={() => handleEdit(file)} className="text-yellow-600 underline text-xs">
                  Düzenle
                </button>
                <button onClick={() => deleteFile(file.id)} className="text-red-600 underline text-xs">
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6 mb-2">Videolar</h2>
      <table className="w-full table-auto border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 text-left">Dosya Adı</th>
            <th className="px-4 py-2">Süre</th>
            <th className="px-4 py-2">Çözünürlük</th>
            <th className="px-4 py-2">Format</th>
            <th className="px-4 py-2">Boyut</th>
            <th className="px-4 py-2">Yüklenme Tarihi</th>
            <th className="px-4 py-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id} className="border-t">
              <td className="px-4 py-2">
                <button onClick={() => navigate(`/files/${video.fileId}`)} className="text-blue-600 underline">
                  {video.filename}
                </button>
              </td>
              <td className="px-4 py-2 text-center">{video.duration?.toFixed(2)} sn</td>
              <td className="px-4 py-2 text-center">{video.resolution}</td>
              <td className="px-4 py-2 text-center">{video.format}</td>
              <td className="px-4 py-2 text-center">{(video.size / 1024).toFixed(2)} KB</td>
              <td className="px-4 py-2 text-center">{new Date(video.uploadedAt).toLocaleString()}</td>
              <td className="px-4 py-2 flex flex-col gap-1 items-center">
                <button onClick={() => window.open(video.url, '_blank')} className="text-green-600 underline text-xs">
                  İndir
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(video.url);
                    alert('Bağlantı panoya kopyalandı!');
                  }}
                  className="text-blue-600 underline text-xs"
                >
                  Kopyala
                </button>
                <button onClick={() => deleteVideo(video.id)} className="text-red-600 underline text-xs">
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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