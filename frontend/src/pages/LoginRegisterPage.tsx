import React, { useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Anchor,
  Alert,
  Group,
  Stack,
} from '@mantine/core';

type AuthMode = 'login' | 'register';

const LoginRegisterPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>(() =>
    window.location.pathname.includes('login') ? 'login' : 'register'
  );
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    tenantId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';

    const payload =
      mode === 'login'
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            tenantId: formData.tenantId,
          };

    try {
      const response = await axios.post(endpoint, payload);
      if (mode === 'login' && response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/');
      } else if (mode === 'register') {
        // Kayıt sonrası giriş ekranına dön
        setMode('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" pt="xl">
      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Title order={2} ta="center" mb="xs">
          {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </Title>
        <Text ta="center" c="dimmed" mb="md">
          {mode === 'login'
            ? 'Hesabınıza giriş yapın.'
            : 'Yeni bir hesap oluşturun.'}
        </Text>

        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            {mode === 'register' && (
              <>
                <TextInput
                  label="Ad"
                  name="name"
                  placeholder="Adınız"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <TextInput
                  label="Kullanıcı Adı"
                  name="username"
                  placeholder="Kullanıcı adı"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <TextInput
                  label="Tenant ID"
                  name="tenantId"
                  placeholder="Tenant ID"
                  value={formData.tenantId}
                  onChange={handleChange}
                  required
                />
              </>
            )}

            <TextInput
              type="email"
              label="E‑posta"
              name="email"
              placeholder="ornek@mail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <PasswordInput
              label="Şifre"
              name="password"
              placeholder="Şifre"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
              required
            />

            <Button type="submit" loading={loading} mt="sm">
              {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </Button>
          </Stack>
        </form>

        <Group justify="center" gap="xs" mt="md">
          <Text c="dimmed">
            {mode === 'login' ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
          </Text>
          <Anchor component="button" type="button" onClick={toggleMode} fw={500}>
            {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
};

export default LoginRegisterPage;