import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';


const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        try {
          const res = await axios.get('/users/me');
          setUserRole(res.data.user?.role || null);
        } catch (err) {
          console.error('Kullanıcı bilgisi alınamadı:', err);
          setUserRole(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex gap-4">
        <Link to="/" className="hover:text-gray-300">Ana Sayfa</Link>
      </div>
      <div>
        {isLoggedIn ? (
          <div className="flex gap-4 items-center">
            <Link to="/files" className="hover:text-gray-300">Dosyalar</Link>
            {userRole !== 'admin' && (
              <Link to="/tenant-files" className="hover:text-gray-300">Tenant Dosyaları</Link>
            )}
            <Link to="/stats" className="hover:text-gray-300">İstatistikler</Link>
            {userRole === 'admin' || userRole === 'tenantadmin' ? (
              <>
                <Link to="/admin" className="hover:text-gray-300">Admin Paneli</Link>
                <Link to="/admin/user-management" className="hover:text-gray-300">Kullanıcı Yönetimi</Link>
                <Link to="/admin/file-management" className="hover:text-gray-300">Dosya Yönetimi</Link>
              </>
            ) : null}
            <Link to="/profile" className="hover:text-gray-300">Profil</Link>
            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600">
              Çıkış Yap
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="bg-blue-500 px-3 py-1 rounded hover:bg-blue-600">Giriş Yap</Link>
            <Link to="/register" className="bg-green-500 px-3 py-1 rounded hover:bg-green-600">Kayıt Ol</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;