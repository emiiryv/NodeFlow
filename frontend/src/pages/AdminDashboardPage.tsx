import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

const AdminDashboardPage: React.FC = () => {
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/users/me')
      .then(res => setUserRole(res.data.user.role))
      .catch(err => console.error('Rol alınamadı:', err));
  }, []);

  if (userRole !== 'admin' && userRole !== 'tenantadmin') {
    return <div className="p-6">Bu sayfayı görüntüleme yetkiniz yok.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Paneli</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/admin/user-management')}
          className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white p-4 rounded shadow transition transform hover:scale-105 hover:shadow-lg focus:outline-none"
        >
          <h2 className="text-xl font-semibold">Kullanıcı Yönetimi</h2>
          <p className="text-sm text-white">Kullanıcıları görüntüle, sil veya tenantlara göre filtrele.</p>
        </button>
        <button
          onClick={() => navigate('/admin/file-management')}
          className="cursor-pointer bg-green-500 hover:bg-green-600 text-white p-4 rounded shadow transition transform hover:scale-105 hover:shadow-lg focus:outline-none"
        >
          <h2 className="text-xl font-semibold">Dosya Yönetimi</h2>
          <p className="text-sm text-white">Tüm dosyaları veya tenant'a ait dosyaları görüntüle.</p>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboardPage;