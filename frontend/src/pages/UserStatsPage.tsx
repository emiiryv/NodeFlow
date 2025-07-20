

import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';

interface Stats {
  totalFiles: number;
  totalSize: number;
  lastUpload: string | null;
}

const UserStatsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/users/stats/me');
        const { totalFiles, totalSize, lastUpload } = res.data;
        setStats({ totalFiles, totalSize, lastUpload });
      } catch (err) {
        setError('İstatistikler alınamadı.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kullanıcı İstatistikleri</h1>
      {loading && <p>Yükleniyor...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {stats && (
        <ul className="space-y-2">
          <li><strong>Toplam Dosya:</strong> {stats.totalFiles}</li>
          <li><strong>Toplam Boyut:</strong> {(stats.totalSize / 1024).toFixed(2)} KB</li>
          <li><strong>Son Yükleme Tarihi:</strong> {stats.lastUpload ? new Date(stats.lastUpload).toLocaleString() : 'Yok'}</li>
        </ul>
      )}
    </div>
  );
};

export default UserStatsPage;