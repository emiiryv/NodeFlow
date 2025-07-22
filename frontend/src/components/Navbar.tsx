import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
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
            <Link to="/stats" className="hover:text-gray-300">İstatistikler</Link>
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