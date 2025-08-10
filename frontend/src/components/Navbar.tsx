import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { Group, Button, Menu, ActionIcon } from '@mantine/core';
import { IconMenu2 } from '@tabler/icons-react';

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
    <Group justify="space-between" w="100%" h={56} align="center" wrap="nowrap" gap="md">
      {isLoggedIn ? (
        <>
          <Group gap="sm" wrap="nowrap" align="center">
            <Button variant="subtle" size="md" component={Link} to="/">Ana Sayfa</Button>
            <Button variant="subtle" size="md" component={Link} to="/files">Dosyalar</Button>
            {userRole !== 'admin' && (
              <Button variant="subtle" size="md" component={Link} to="/tenant-files">
                Tenant Dosyaları
              </Button>
            )}
            <Button variant="subtle" size="md" component={Link} to="/stats">İstatistikler</Button>
            {(userRole === 'admin' || userRole === 'tenantadmin') && (
              <Menu>
                <Menu.Target>
                  <Button variant="subtle" size="md" style={{ cursor: 'pointer' }}>Admin</Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/admin/user-management">Kullanıcı Yönetimi</Menu.Item>
                  <Menu.Item component={Link} to="/admin/file-management">Dosya Yönetimi</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label="Menü">
                <IconMenu2 />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link} to="/profile">Profil</Menu.Item>
              <Menu.Item onClick={handleLogout} color="red">Çıkış Yap</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </>
      ) : (
        // Navbar.tsx - logged-out (isLoggedIn === false) kısmı
<Group gap="sm">
  <Button
    variant="subtle"
    size="md"
    component={Link}
    to="/login"
    type="button"
  >
    Giriş Yap
  </Button>
  <Button
    variant="filled"
    color="grape"
    size="md"
    radius="md"
    component={Link}
    to="/register"
    type="button"
  >
    Kayıt Ol
  </Button>
</Group>
      )}
    </Group>
  );
};

export default Navbar;