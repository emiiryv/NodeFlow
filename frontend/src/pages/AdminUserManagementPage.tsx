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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUserManagementPage;