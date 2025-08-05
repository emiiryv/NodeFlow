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
    <nav className="bg-white shadow-md border-b">
      <div className="w-full max-w-7xl mx-auto px-4 py-2 flex flex-wrap justify-between items-center">
        {isLoggedIn ? (
          <>
            <div className="flex flex-wrap gap-4 items-center">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Ana Sayfa</Link>
              <Link to="/files" className="text-gray-700 hover:text-blue-600 font-medium">Dosyalar</Link>
              {userRole !== 'admin' && (
                <Link to="/tenant-files" className="text-gray-700 hover:text-blue-600 font-medium">Tenant Dosyaları</Link>
              )}
              <Link to="/stats" className="text-gray-700 hover:text-blue-600 font-medium">İstatistikler</Link>
              {(userRole === 'admin' || userRole === 'tenantadmin') && (
                <>
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 font-medium">Admin Paneli</Link>
                  <Link to="/admin/user-management" className="text-gray-700 hover:text-blue-600 font-medium">Kullanıcı Yönetimi</Link>
                  <Link to="/admin/file-management" className="text-gray-700 hover:text-blue-600 font-medium">Dosya Yönetimi</Link>
                </>
              )}
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 font-medium">Profil</Link>
            </div>
            <div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-1 rounded"
              >
                Çıkış Yap
              </button>
            </div>
          </>
        ) : (
          <div className="flex space-x-4">
            <Link to="/login" className="px-4 py-2 text-sm font-medium rounded shadow transition-all duration-200 bg-white text-purple-700 hover:bg-gray-100">Giriş Yap</Link>
            <Link to="/register" className="px-4 py-2 text-sm font-medium rounded shadow transition-all duration-200 bg-yellow-400 text-white hover:bg-yellow-500">Kayıt Ol</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;