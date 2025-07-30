import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

interface FileItem {
  id: number;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  tenant: {
    id: number;
    name: string;
  };
}

const AdminFileManagementPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'videos'>('files');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRoleAndTenants = async () => {
      try {
        const userRes = await axios.get('/users/me');
        const role = userRes.data.user?.role || userRes.data.role;
        setUserRole(role);
        if (!role) {
          setError('Kullanıcı rolü alınamadı.');
          setLoading(false);
          return;
        }

        if (role === 'admin') {
          const tenantRes = await axios.get('/admin/tenants');
          setTenants(tenantRes.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Kullanıcı bilgileri alınırken hata oluştu.');
      }
    };
    fetchUserRoleAndTenants();
  }, []);

  useEffect(() => {
    if (!userRole) return;
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const baseEndpoint = userRole === 'admin' ? '/admin/files' : '/admin/files/tenant';
        const endpoint = userRole === 'admin' && selectedTenantId
          ? `${baseEndpoint}?tenantId=${selectedTenantId}`
          : baseEndpoint;
        const res = await axios.get(endpoint);
        setFiles(res.data || []);
      } catch (err) {
        setError('Dosyalar alınırken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [userRole, selectedTenantId]);

  useEffect(() => {
    if (!userRole) return;
    const fetchVideos = async () => {
      try {
        const baseEndpoint = userRole === 'admin' ? '/admin/videos' : '/admin/videos/tenant';
        const endpoint = userRole === 'admin' && selectedTenantId
          ? `${baseEndpoint}?tenantId=${selectedTenantId}`
          : baseEndpoint;
        const res = await axios.get(endpoint);
        setVideos(res.data || []);
      } catch (err) {
        console.error('Videolar alınırken hata oluştu.');
      }
    };
    fetchVideos();
  }, [userRole, selectedTenantId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Dosya Yönetimi ({userRole === 'tenantadmin' ? 'Tenant Admin' : 'Admin'})
      </h1>
      {userRole === 'admin' && (
        <div className="mb-4">
          <label className="mr-2 font-medium">Tenant:</label>
          <select
            className="border border-gray-300 px-2 py-1"
            value={selectedTenantId || ''}
            onChange={(e) => setSelectedTenantId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Tüm Tenantlar</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 rounded ${activeTab === 'files' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Dosyalar
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 rounded ${activeTab === 'videos' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Videolar
        </button>
      </div>
      {activeTab === 'files' && (
        <>
          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && files.length === 0 && <p>Hiç dosya bulunamadı.</p>}
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Dosya Adı</th>
                <th className="py-2 px-4 border-b">Boyut</th>
                <th className="py-2 px-4 border-b">Yükleme Tarihi</th>
                <th className="py-2 px-4 border-b">Kullanıcı</th>
                {userRole === 'admin' && (
                  <th className="py-2 px-4 border-b">Tenant</th>
                )}
                <th className="py-2 px-4 border-b">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => navigate(`/files/${file.id}`)} className="text-blue-600 underline text-left">
                      {file.filename}
                    </button>
                  </td>
                  <td className="py-2 px-4 border-b">{(file.size / 1024).toFixed(2)} KB</td>
                  <td className="py-2 px-4 border-b">{new Date(file.uploadedAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">
                    {file.user?.name ? `${file.user.name} (${file.user.email})` : '—'}
                  </td>
                  {userRole === 'admin' && (
                    <td className="py-2 px-4 border-b">{file.tenant?.name || '—'}</td>
                  )}
                  <td className="py-2 px-4 border-b">
                    <button
                      className="text-red-600 hover:underline"
                      onClick={async () => {
                        if (!window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
                        try {
                          const deleteEndpoint = userRole === 'admin'
                            ? `/admin/files/${file.id}`
                            : `/admin/files/tenant/${file.id}`;
                          await axios.delete(deleteEndpoint);
                          setFiles(prev => prev.filter(f => f.id !== file.id));
                        } catch (err) {
                          console.error('Silme hatası:', err);
                          alert('Dosya silinirken bir hata oluştu.');
                        }
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {activeTab === 'videos' && (
        <>
          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && videos.length === 0 && <p>Hiç video bulunamadı.</p>}
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Başlık</th>
                <th className="py-2 px-4 border-b">Dosya</th>
                <th className="py-2 px-4 border-b">Süre</th>
                <th className="py-2 px-4 border-b">Çözünürlük</th>
                <th className="py-2 px-4 border-b">Kullanıcı</th>
                {userRole === 'admin' && (
                  <th className="py-2 px-4 border-b">Tenant</th>
                )}
                <th className="py-2 px-4 border-b">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => navigate(`/files/${video.fileId}`)} className="text-blue-600 underline text-left">
                      {video.filename}
                    </button>
                  </td>
                  <td className="py-2 px-4 border-b">{video.filename}</td>
                  <td className="py-2 px-4 border-b">{video.duration?.toFixed(2)} sn</td>
                  <td className="py-2 px-4 border-b">{video.resolution}</td>
                  <td className="py-2 px-4 border-b">
                    {video.user?.name ? `${video.user.name} (${video.user.email})` : '—'}
                  </td>
                  {userRole === 'admin' && (
                    <td className="py-2 px-4 border-b">{video.tenant?.name || '—'}</td>
                  )}
                  <td className="py-2 px-4 border-b">
                    <button
                      className="text-red-600 hover:underline"
                      onClick={async () => {
                        if (!window.confirm('Bu videoyu silmek istediğinize emin misiniz?')) return;
                        try {
                          const deleteEndpoint = userRole === 'admin'
                            ? `/admin/videos/${video.id}`
                            : `/admin/videos/tenant/${video.id}`;
                          await axios.delete(deleteEndpoint);
                          setVideos(prev => prev.filter(v => v.id !== video.id));
                        } catch (err) {
                          console.error('Video silme hatası:', err);
                          alert('Video silinirken bir hata oluştu.');
                        }
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default AdminFileManagementPage;