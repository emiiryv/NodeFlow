import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

interface FileDetail {
  id: number;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  mimetype: string;
  user?: { id: number; name: string; email: string };
  tenant?: { id: number; name: string };
  video?: {
    id: number;
    title: string;
    duration: number;
    format: string;
    resolution: string;
    fileId: number;
  };
  thumbnailUrl?: string;
}

const FileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await axiosInstance.get(`/files/${id}`);
        setFile(response.data);
      } catch (err) {
        setError('Dosya detayları alınamadı.');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [id]);

  if (loading) return <p className="p-4">Yükleniyor...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;
  if (!file) return <p className="p-4">Dosya bulunamadı.</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Dosya Detayı</h1>
      <ul className="space-y-1 mb-4">
        <li><strong>Dosya Adı:</strong> {file.filename}</li>
        <li><strong>Boyut:</strong> {(file.size / 1024).toFixed(2)} KB</li>
        <li><strong>Mimetype:</strong> {file.mimetype}</li>
        <li><strong>Yüklenme Tarihi:</strong> {new Date(file.uploadedAt).toLocaleString()}</li>
        <li><strong>URL:</strong> <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{file.url}</a></li>
        {file.user && (
          <li><strong>Yükleyen:</strong> {file.user.name} ({file.user.email})</li>
        )}
        {file.tenant && (
          <li><strong>Tenant:</strong> {file.tenant.name}</li>
        )}
      </ul>

      {file.video && (
        <>
          <h2 className="text-lg font-semibold mb-1">🎥 Video Detayları</h2>
          <ul className="space-y-1">
            <li>
              <strong>Başlık:</strong>{' '}
              <a
                href={`/files/${file.video?.fileId}`}
                className="text-blue-600 underline"
              >
                {file.video.title}
              </a>
            </li>
            <li><strong>Süre:</strong> {file.video.duration.toFixed(2)} saniye</li>
            <li><strong>Format:</strong> {file.video.format}</li>
            <li><strong>Çözünürlük:</strong> {file.video.resolution}</li>
          </ul>
        </>
      )}

      {file.mimetype.startsWith("video/") && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">🎬 Video Önizleme</h2>
          <div className="relative max-w-full w-full sm:w-[480px] md:w-[640px] aspect-video rounded shadow overflow-hidden">
            <video controls className="w-full h-full object-contain">
              <source src={file.url} type={file.mimetype} />
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          </div>
        </div>
      )}

      {'thumbnailUrl' in file && file.thumbnailUrl && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">🖼️ Thumbnail</h2>
          <img src={file.thumbnailUrl} alt="Video Thumbnail" className="rounded w-64 border" />
        </div>
      )}
    </div>
  );
};

export default FileDetailPage;