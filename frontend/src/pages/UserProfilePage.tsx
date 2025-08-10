import React, { useEffect, useState, useMemo } from 'react';
import axios from '../api/axiosInstance';
import {
  Box,
  Card,
  Title,
  Text,
  Group,
  Avatar,
  Button,
  TextInput,
  PasswordInput,
  Modal,
  Divider,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconKey } from '@tabler/icons-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'tenantadmin' | 'admin';
  createdAt: string;
  tenant?: { id: number; name: string };
}

const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const initials = useMemo(() => {
    const source = (name || user?.name || user?.email || '').trim();
    if (!source) return 'U';
    const parts = source.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }, [name, user]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/users/me');
        const u: User = res.data.user;
        setUser(u);
        setName(u?.name || '');
        setEmail(u?.email || '');
      } catch (error) {
        console.error('Kullanıcı verisi alınamadı:', error);
      }
    };
    fetchUser();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await axios.put('/users/me', { name, email });
      setUser((prev) => (prev ? { ...prev, name, email } : prev));
      notifications.show({ color: 'green', title: 'Güncellendi', message: 'Profil başarıyla güncellendi.' });
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      notifications.show({ color: 'red', title: 'Hata', message: 'Profil güncellenemedi.' });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      notifications.show({ color: 'yellow', title: 'Eksik bilgi', message: 'Lütfen tüm alanları doldurun.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      notifications.show({ color: 'red', title: 'Hata', message: 'Yeni parolalar uyuşmuyor.' });
      return;
    }
    try {
      await axios.put('/users/change-password', { currentPassword, newPassword });
      notifications.show({ color: 'green', title: 'Başarılı', message: 'Parola güncellendi.' });
      setPwdOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Parola değiştirilemedi:', error);
      notifications.show({ color: 'red', title: 'Hata', message: 'Parola güncellenemedi.' });
    }
  };

  if (!user) return <Text>Yükleniyor…</Text>;

  return (
    <Box>
      <Title order={2} mb="sm">Kullanıcı Profili</Title>

      <Card withBorder radius="lg" p="lg">
        <Group justify="space-between" align="center" mb="md" wrap="wrap">
          <Group align="center" gap="md">
            <Avatar radius="xl" size={64}>{initials}</Avatar>
            <div>
              <Text fw={700} fz="lg">{user.name || 'İsimsiz Kullanıcı'}</Text>
              <Text c="dimmed" fz="sm">{user.email}</Text>
              <Group gap="xs" mt={6}>
                <Badge variant="light">{user.role}</Badge>
                {user.tenant?.name && <Badge variant="light" color="grape">Tenant: {user.tenant.name}</Badge>}
                <Badge variant="light" color="gray">
                  Üyelik: {new Date(user.createdAt).toLocaleDateString()}
                </Badge>
              </Group>
            </div>
          </Group>

          <Group gap="sm">
            <Button leftSection={<IconKey size={16} />} variant="outline" onClick={() => setPwdOpen(true)}>
              Şifre Değiştir
            </Button>
            <Button onClick={handleSaveProfile}>Kaydet</Button>
          </Group>
        </Group>

        <Divider my="md" />

        <Group grow align="start">
          <TextInput
            label="Ad"
            placeholder="Ad Soyad"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <TextInput
            label="E‑posta"
            placeholder="ornek@mail.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
        </Group>
      </Card>

      {/* Şifre Değiştir Modalı */}
      <Modal opened={pwdOpen} onClose={() => setPwdOpen(false)} title="Parola Değiştir" centered>
        <PasswordInput
          label="Mevcut Parola"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          mb="sm"
        />
        <PasswordInput
          label="Yeni Parola"
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
          mb="sm"
        />
        <PasswordInput
          label="Yeni Parolayı Onayla"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          mb="md"
        />
        <Group justify="end">
          <Button variant="default" onClick={() => setPwdOpen(false)}>Vazgeç</Button>
          <Button onClick={handleChangePassword}>Kaydet</Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default UserProfilePage;