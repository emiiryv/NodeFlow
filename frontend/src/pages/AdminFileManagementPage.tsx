import React, { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

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
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {file.filename}
                </a>
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
    </div>
  );
};

export default AdminFileManagementPage;