import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/users/me');
        setUser(response.data.user);
        setName(response.data.user.name || '');
        setEmail(response.data.user.email);
      } catch (error) {
        console.error('Kullanıcı verisi alınamadı:', error);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('/users/me', { name, email });
      setMessage('Profil başarıyla güncellendi.');
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      setMessage('Profil güncellenemedi.');
    }
    if (currentPassword && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        setMessage('Yeni parolalar uyuşmuyor.');
        return;
      }
      try {
        await axios.put('/users/change-password', {
          currentPassword,
          newPassword,
        });
        setMessage('Parola başarıyla güncellendi.');
      } catch (error) {
        console.error('Parola değiştirilemedi:', error);
        setMessage('Parola güncellenemedi.');
      }
    }
  };

  if (!user) return <div>Yükleniyor...</div>;

  return (
    <div className="profile-container">
      <h2>Kullanıcı Profili</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Ad:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">E-posta:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <fieldset>
          <legend>Parola Değiştir</legend>
          <div className="form-group">
            <label htmlFor="currentPassword">Mevcut Parola:</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Yeni Parola:</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Yeni Parolayı Onayla:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </fieldset>
        <button className="update-button" type="submit">Güncelle</button>
      </form>
      {message && <p>{message}</p>}
      <div className="user-meta">
        <p>Rol: {user.role}</p>
        <p>Üyelik Tarihi: {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default UserProfilePage;