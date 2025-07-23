import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

interface FileItem {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

const TenantFilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenantFiles = async () => {
      try {
        const response = await axiosInstance.get('/files/tenant');
        setFiles(response.data);
      } catch (err) {
        setError('Dosyalar alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantFiles();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Tenant Dosyaları</h2>
      {loading && <p>Yükleniyor...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {Array.isArray(files) && files.length === 0 && !loading ? (
        <p>Tenant'a ait dosya bulunamadı.</p>
      ) : (
        <ul>
          {Array.isArray(files) && files.map((file) => (
            <li key={file.id}>
              <strong>{file.filename}</strong> – {(file.size / 1024).toFixed(2)} KB –{' '}
              {new Date(file.uploadedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TenantFilesPage;