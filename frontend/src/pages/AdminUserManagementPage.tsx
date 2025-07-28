import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editData, setEditData] = useState({ name: '', username: '', email: '' });

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      const endpoint = role === 'admin'
        ? `/admin/users/${userId}`
        : `/admin/users/tenant/${userId}`;
      await axios.delete(endpoint);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert('Silme sırasında hata oluştu.');
      console.error(err);
    }
  };

  const handleEdit = (userId: number) => {
    const selectedUser = users.find(u => u.id === userId);
    if (!selectedUser) return;
    setEditingUser(selectedUser);
    setEditData({
      name: selectedUser.name,
      username: selectedUser.username,
      email: selectedUser.email
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const endpoint = role === 'admin'
        ? `/admin/users/${editingUser.id}`
        : `/admin/users/tenant/${editingUser.id}`;
      await axios.put(endpoint, editData);
      setUsers(prev =>
        prev.map(u => (u.id === editingUser.id ? { ...u, ...editData } : u))
      );
      setEditingUser(null);
    } catch (err) {
      alert('Güncelleme sırasında hata oluştu.');
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const resMe = await axios.get('/users/me');
        const role = resMe.data.user?.role || '';
        setRole(role);

        const endpoint = role === 'admin' ? '/admin/users' : '/admin/users/tenant';
        const resUsers = await axios.get(endpoint);
        setUsers(resUsers.data.users || []);
      } catch (err) {
        setError('Kullanıcılar alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading || !role) return <p>Yükleniyor...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kullanıcı Yönetimi</h1>
      {error && <p className="text-red-600">{error}</p>}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Ad</th>
            <th className="border p-2">Kullanıcı Adı</th>
            <th className="border p-2">Email</th>
            {role === 'admin' && <th className="border p-2">Rol</th>}
            <th className="border p-2">Kayıt Tarihi</th>
            <th className="border p-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.username}</td>
              <td className="border p-2">{user.email}</td>
              {role === 'admin' && <td className="border p-2">{user.role}</td>}
              <td className="border p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="border p-2">
                <button
                  className="text-blue-600 hover:underline mr-2"
                  onClick={() => handleEdit(user.id)}
                >
                  Düzenle
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDelete(user.id)}
                >
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Kullanıcıyı Düzenle</h2>
            <label className="block mb-2">
              Ad:
              <input
                className="border w-full p-1"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </label>
            <label className="block mb-2">
              Kullanıcı Adı:
              <input
                className="border w-full p-1"
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              />
            </label>
            <label className="block mb-4">
              Email:
              <input
                className="border w-full p-1"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </label>
            <div className="flex justify-end">
              <button
                className="bg-gray-300 px-4 py-1 rounded mr-2"
                onClick={() => setEditingUser(null)}
              >
                İptal
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-1 rounded"
                onClick={handleSave}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;