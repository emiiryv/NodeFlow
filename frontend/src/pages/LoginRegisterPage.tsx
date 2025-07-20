import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register';

const LoginRegisterPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>(() => window.location.pathname.includes('login') ? 'login' : 'register');
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';

    const payload =
      mode === 'login'
        ? { email: formData.email, password: formData.password }
        : formData;

    try {
      const response = await axios.post(endpoint, payload);
      if (mode === 'login' && response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/');
      } else if (mode === 'register') {
        alert('Kayıt başarılı! Giriş yapabilirsiniz.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    }
  };

  return (
    <div className="auth-page">
      <h2>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <input
              type="text"
              name="name"
              placeholder="Adınız"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Kullanıcı Adı"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </>
        )}
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={formData.password}
          onChange={handleChange}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</button>
      </form>
      <p>
        {mode === 'login' ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}{' '}
        <button onClick={toggleMode}>
          {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </p>
    </div>
  );
};

export default LoginRegisterPage;