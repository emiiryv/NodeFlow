import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from '../api/axiosInstance';
import {
  Box,
  Title,
  Table,
  Group,
  Text,
  Badge,
  TextInput,
  Select,
  Modal,
  Button,
  Loader,
  Pagination,
  ActionIcon,
  Tooltip,
  useMantineTheme,
  useComputedColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconEdit, IconTrash } from '@tabler/icons-react';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'tenantadmin' | 'admin';
  createdAt: string;
}

const roleColor = (role: User['role']) => {
  switch (role) {
    case 'admin':
      return 'red';
    case 'tenantadmin':
      return 'yellow';
    default:
      return 'green';
  }
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const AdminUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<{ name: string; username: string; email: string; role?: User['role'] }>({ name: '', username: '', email: '' });
  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  // inline arama & sayfalama
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      const endpoint = role === 'admin' ? `/admin/users/${userId}` : `/admin/users/tenant/${userId}`;
      await axios.delete(endpoint);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      notifications.show({ color: 'green', title: 'Silindi', message: 'Kullanıcı kaldırıldı.' });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Hata', message: 'Silme sırasında hata oluştu.' });
      console.error(err);
    }
  };

  const handleEdit = (userId: number) => {
    const selectedUser = users.find((u) => u.id === userId);
    if (!selectedUser) return;
    setEditingUser(selectedUser);
    setEditData({ name: selectedUser.name || '', username: selectedUser.username || '', email: selectedUser.email || '', role: selectedUser.role });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const payload = { name: editData.name, username: editData.username, email: editData.email } as any;
      if (role === 'admin' && editData.role) payload.role = editData.role;

      const endpoint = role === 'admin' ? `/admin/users/${editingUser.id}` : `/admin/users/tenant/${editingUser.id}`;
      await axios.put(endpoint, payload);
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...payload } : u)));
      setEditingUser(null);
      notifications.show({ color: 'green', title: 'Güncellendi', message: 'Kullanıcı bilgileri güncellendi.' });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Hata', message: 'Güncelleme sırasında hata oluştu.' });
      console.error(err);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const resMe = await axios.get('/users/me');
      const currentRole = resMe.data.user?.role || '';
      setRole(currentRole);

      if (currentRole === 'admin') {
        const resTenants = await axios.get('/admin/tenants');
        setTenants(resTenants.data || []);
      }

      const endpoint =
        currentRole === 'admin'
          ? selectedTenantId
            ? `/admin/users?tenantId=${selectedTenantId}`
            : '/admin/users'
          : '/admin/users/tenant';
      const resUsers = await axios.get(endpoint);
      setUsers(resUsers.data.users || []);
      setError('');
    } catch (err) {
      setError('Kullanıcılar alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (role === 'admin') fetchUsers();
  }, [fetchUsers, role]);

  // arama & filtre & sayfalama türevleri
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [users, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme();

  const borderColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  const headerBg = colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0];
  const headerColor = colorScheme === 'dark' ? theme.colors.gray[2] : theme.black;

  const tableStyles = {
    table: {
      border: `1px solid ${borderColor}`,
      borderCollapse: 'separate',
      borderSpacing: 0,
    },
    th: {
      backgroundColor: headerBg,
      color: headerColor,
      borderBottom: `1px solid ${borderColor}`,
      borderRight: `1px solid ${borderColor}`,
      '&:last-child': { borderRight: 'none' },
    },
    td: {
      borderBottom: `1px solid ${borderColor}`,
      borderRight: `1px solid ${borderColor}`,
      '&:last-child': { borderRight: 'none' },
    },
  } as const;

  if (loading || !role) {
    return (
      <Group my="md">
        <Loader size="sm" />
        <Text>Yükleniyor…</Text>
      </Group>
    );
  }

  return (
    <Box>
      <Title order={2} mb="sm">Kullanıcı Yönetimi</Title>
      {error && <Text c="red" mb="sm">{error}</Text>}

      <Group justify="space-between" align="center" mb="md" wrap="wrap">
        <Group gap="sm">
          <TextInput
            placeholder="Ara: ad, kullanıcı adı, e‑posta"
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setPage(1);
            }}
            w={260}
          />

          {role === 'admin' && (
            <Select
              placeholder="Tüm Tenantlar"
              data={[{ value: '', label: 'Tüm Tenantlar' }, ...tenants.map((t) => ({ value: String(t.id), label: t.name }))]}
              value={selectedTenantId ? String(selectedTenantId) : ''}
              onChange={(val) => setSelectedTenantId(val ? Number(val) : null)}
              w={240}
            />
          )}
        </Group>

        <Group gap="sm">
          <Select
            data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n}/sayfa` }))}
            value={String(pageSize)}
            onChange={(v) => setPageSize(Number(v))}
            w={120}
          />
        </Group>
      </Group>

      <Table.ScrollContainer minWidth={900}>
        <Table striped highlightOnHover stickyHeader styles={tableStyles}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Ad</Table.Th>
              <Table.Th>Kullanıcı Adı</Table.Th>
              <Table.Th>Email</Table.Th>
              {role === 'admin' && <Table.Th>Rol</Table.Th>}
              <Table.Th>Kayıt Tarihi</Table.Th>
              <Table.Th style={{ width: 140 }}>İşlemler</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paged.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.name}</Table.Td>
                <Table.Td>{user.username}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                {role === 'admin' && (
                  <Table.Td>
                    <Badge color={roleColor(user.role)} variant="light">{user.role}</Badge>
                  </Table.Td>
                )}
                <Table.Td>{new Date(user.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Düzenle">
                      <ActionIcon onClick={() => handleEdit(user.id)}>
                        <IconEdit size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Sil">
                      <ActionIcon color="red" onClick={() => handleDelete(user.id)}>
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Group justify="space-between" align="center" mt="md" wrap="wrap">
        <Text size="sm" c="dimmed">Toplam {filtered.length} kullanıcı</Text>
        <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
      </Group>

      {/* Edit Modal */}
      <Modal opened={!!editingUser} onClose={() => setEditingUser(null)} title="Kullanıcıyı Düzenle" centered>
        <TextInput label="Ad" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.currentTarget.value })} mb="sm" />
        <TextInput label="Kullanıcı Adı" value={editData.username} onChange={(e) => setEditData({ ...editData, username: e.currentTarget.value })} mb="sm" />
        <TextInput label="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.currentTarget.value })} mb="sm" />
        {role === 'admin' && (
          <Select
            label="Rol"
            data={[
              { value: 'user', label: 'user' },
              { value: 'tenantadmin', label: 'tenantadmin' },
              { value: 'admin', label: 'admin' },
            ]}
            value={editData.role || 'user'}
            onChange={(v) => setEditData({ ...editData, role: (v as User['role']) || 'user' })}
            mb="md"
          />
        )}
        <Group justify="end">
          <Button variant="default" onClick={() => setEditingUser(null)}>İptal</Button>
          <Button onClick={handleSave}>Kaydet</Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default AdminUserManagementPage;