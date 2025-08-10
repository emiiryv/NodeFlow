import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import {
  Box,
  Title,
  Group,
  Table,
  Text,
  Select,
  SegmentedControl,
  TextInput,
  Button,
  Checkbox,
  Modal,
  Loader,
  Tooltip,
  ActionIcon,
  CopyButton,
  Anchor,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconDownload,
  IconTrash,
  IconCopy,
  IconFileExport,
  IconPhoto,
  IconVideo,
  IconFile,
} from '@tabler/icons-react';

interface FileItem {
  id: number;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  mimetype?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  tenant?: {
    id: number;
    name: string;
  };
}

interface VideoItem {
  id: number;
  fileId: number;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  duration?: number;
  resolution?: string;
  format?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  tenant?: {
    id: number;
    name: string;
  };
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const AdminFileManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'videos'>('files');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'other'>('all');
  const [query, setQuery] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /** Fetch role & tenants */
  useEffect(() => {
    const fetchUserRoleAndTenants = async () => {
      try {
        const userRes = await axios.get('/users/me');
        const role = userRes.data.user?.role || userRes.data.role;
        setUserRole(role);
        if (!role) {
          setError('Kullanıcı rolü alınamadı.');
          setLoading(false);
          return;
        }
        if (role === 'admin') {
          const tenantRes = await axios.get('/admin/tenants');
          setTenants(tenantRes.data || []);
        }
      } catch (err) {
        setError('Kullanıcı bilgileri alınırken hata oluştu.');
      }
    };
    fetchUserRoleAndTenants();
  }, []);

  /** Fetch files */
  useEffect(() => {
    if (!userRole) return;
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const baseEndpoint = userRole === 'admin' ? '/admin/files' : '/admin/files/tenant';
        const endpoint = userRole === 'admin' && selectedTenantId
          ? `${baseEndpoint}?tenantId=${selectedTenantId}`
          : baseEndpoint;
        const res = await axios.get(endpoint);
        setFiles(res.data || []);
        setError('');
      } catch (err) {
        setError('Dosyalar alınırken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [userRole, selectedTenantId]);

  /** Fetch videos */
  useEffect(() => {
    if (!userRole) return;
    const fetchVideos = async () => {
      try {
        const baseEndpoint = userRole === 'admin' ? '/admin/videos' : '/admin/videos/tenant';
        const endpoint = userRole === 'admin' && selectedTenantId
          ? `${baseEndpoint}?tenantId=${selectedTenantId}`
          : baseEndpoint;
        const res = await axios.get(endpoint);
        setVideos(res.data || []);
      } catch (err) {
        // silent
      }
    };
    fetchVideos();
  }, [userRole, selectedTenantId]);

  /** Derived lists (search + type filter) */
  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((f) => {
      const byQuery = !q || f.filename.toLowerCase().includes(q) || (f.user?.name || '').toLowerCase().includes(q);
      const kind = f.mimetype?.startsWith('image/') ? 'image' : f.mimetype?.startsWith('video/') ? 'video' : 'other';
      const byType = typeFilter === 'all' || typeFilter === kind;
      return byQuery && byType;
    });
  }, [files, query, typeFilter]);

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter((v) => !q || v.filename.toLowerCase().includes(q) || (v.user?.name || '').toLowerCase().includes(q));
  }, [videos, query]);

  const currentList: (FileItem | VideoItem)[] = activeTab === 'files' ? filteredFiles : filteredVideos;

  /** Selection helpers */
  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? currentList.map((x) => x.id) : []);
  };
  const toggleOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  /** CSV Export */
  const exportCsv = () => {
    const rows = (activeTab === 'files' ? filteredFiles : filteredVideos).map((item) => {
      if (activeTab === 'files') {
        const f = item as FileItem;
        return {
          id: f.id,
          filename: f.filename,
          url: f.url,
          size: f.size,
          uploadedAt: f.uploadedAt,
          user: f.user?.name || '',
          userEmail: f.user?.email || '',
          tenant: f.tenant?.name || '',
          mimetype: f.mimetype || '',
        };
      } else {
        const v = item as VideoItem;
        return {
          id: v.id,
          fileId: v.fileId,
          filename: v.filename,
          url: v.url,
          size: v.size,
          uploadedAt: v.uploadedAt,
          duration: v.duration || '',
          resolution: v.resolution || '',
          format: v.format || '',
          user: v.user?.name || '',
          userEmail: v.user?.email || '',
          tenant: v.tenant?.name || '',
        };
      }
    });

    const header = Object.keys(rows[0] || {});
    const csv = [header.join(','), ...rows.map((r) => header.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'files' ? 'files.csv' : 'videos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Bulk delete */
  const doBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      if (activeTab === 'files') {
        for (const id of selectedIds) {
          const deleteEndpoint = userRole === 'admin' ? `/admin/files/${id}` : `/admin/files/tenant/${id}`;
          // eslint-disable-next-line no-await-in-loop
          await axios.delete(deleteEndpoint);
        }
        setFiles((prev) => prev.filter((f) => !selectedIds.includes(f.id)));
      } else {
        for (const id of selectedIds) {
          const deleteEndpoint = userRole === 'admin' ? `/admin/videos/${id}` : `/admin/videos/tenant/${id}`;
          // eslint-disable-next-line no-await-in-loop
          await axios.delete(deleteEndpoint);
        }
        setVideos((prev) => prev.filter((v) => !selectedIds.includes(v.id)));
      }
      notifications.show({ color: 'green', title: 'Silindi', message: 'Seçili öğeler kaldırıldı.' });
      setSelectedIds([]);
      setConfirmOpen(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Hata', message: 'Toplu silme sırasında hata oluştu.' });
    }
  };

  const renderKind = (mime?: string) => {
    if (!mime) return (
      <Group gap={6} align="center"><IconFile size={16} /> <Text size="sm">Dosya</Text></Group>
    );
    if (mime.startsWith('image/')) return (
      <Group gap={6} align="center"><IconPhoto size={16} /> <Text size="sm">Görsel</Text></Group>
    );
    if (mime.startsWith('video/')) return (
      <Group gap={6} align="center"><IconVideo size={16} /> <Text size="sm">Video</Text></Group>
    );
    return (
      <Group gap={6} align="center"><IconFile size={16} /> <Text size="sm">Dosya</Text></Group>
    );
  };

  const rowsFiles = filteredFiles.map((file) => (
    <Table.Tr key={file.id}>
      <Table.Td w={36}>
        <Checkbox checked={selectedIds.includes(file.id)} onChange={() => toggleOne(file.id)} />
      </Table.Td>
      <Table.Td>
        <Anchor onClick={() => navigate(`/files/${file.id}`)}>{file.filename}</Anchor>
      </Table.Td>
      <Table.Td>{fmtSize(file.size)}</Table.Td>
      <Table.Td>{renderKind(file.mimetype)}</Table.Td>
      <Table.Td>{new Date(file.uploadedAt).toLocaleString()}</Table.Td>
      <Table.Td>{file.user?.name ? `${file.user.name} (${file.user.email})` : '—'}</Table.Td>
      {userRole === 'admin' && <Table.Td>{file.tenant?.name || '—'}</Table.Td>}
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Aç / İndir" withArrow>
            <ActionIcon onClick={() => window.open(file.url, '_blank')} aria-label="Aç veya indir">
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>
          <CopyButton value={file.url} timeout={1500}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'} withArrow>
                <ActionIcon onClick={copy} aria-label="Bağlantıyı kopyala">
                  <IconCopy size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
          <Tooltip label="Sil" withArrow>
            <ActionIcon color="red" onClick={() => { setSelectedIds([file.id]); setConfirmOpen(true); }} aria-label="Sil">
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const rowsVideos = filteredVideos.map((video) => (
    <Table.Tr key={video.id}>
      <Table.Td w={36}>
        <Checkbox checked={selectedIds.includes(video.id)} onChange={() => toggleOne(video.id)} />
      </Table.Td>
      <Table.Td>
        <Anchor onClick={() => navigate(`/files/${video.fileId}`)}>{video.filename}</Anchor>
      </Table.Td>
      <Table.Td>{video.duration ? `${video.duration.toFixed(2)} sn` : '-'}</Table.Td>
      <Table.Td>{video.resolution || '-'}</Table.Td>
      <Table.Td><Badge variant="light">{video.format || '-'}</Badge></Table.Td>
      <Table.Td>{fmtSize(video.size)}</Table.Td>
      <Table.Td>{new Date(video.uploadedAt).toLocaleString()}</Table.Td>
      <Table.Td>{video.user?.name ? `${video.user.name} (${video.user.email})` : '—'}</Table.Td>
      {userRole === 'admin' && <Table.Td>{video.tenant?.name || '—'}</Table.Td>}
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Aç / İndir" withArrow>
            <ActionIcon onClick={() => window.open(video.url, '_blank')} aria-label="Aç veya indir">
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>
          <CopyButton value={video.url} timeout={1500}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'} withArrow>
                <ActionIcon onClick={copy} aria-label="Bağlantıyı kopyala">
                  <IconCopy size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
          <Tooltip label="Sil" withArrow>
            <ActionIcon color="red" onClick={() => { setSelectedIds([video.id]); setConfirmOpen(true); }} aria-label="Sil">
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  const headerBar = (
    <Group justify="space-between" align="center" mb="md" wrap="wrap">
      <Group gap="sm" align="center">
        <SegmentedControl
          value={activeTab}
          onChange={(v) => {
            setActiveTab(v as 'files' | 'videos');
            setSelectedIds([]);
          }}
          data={[
            { value: 'files', label: 'Dosyalar' },
            { value: 'videos', label: 'Videolar' },
          ]}
        />

        <TextInput
          placeholder="Ara: ad, kullanıcı"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          w={240}
        />

        {activeTab === 'files' && (
          <Select
            placeholder="Tür: Tümü"
            data={[
              { value: 'all', label: 'Tümü' },
              { value: 'image', label: 'Görsel' },
              { value: 'other', label: 'Diğer' },
            ]}
            value={typeFilter}
            onChange={(v) => setTypeFilter((v as any) || 'all')}
            w={160}
          />
        )}

        {userRole === 'admin' && (
          <Select
            placeholder="Tüm Tenantlar"
            data={[{ value: '', label: 'Tüm Tenantlar' }, ...tenants.map((t) => ({ value: String(t.id), label: t.name }))]}
            value={selectedTenantId ? String(selectedTenantId) : ''}
            onChange={(val) => setSelectedTenantId(val ? Number(val) : null)}
            w={220}
          />
        )}
      </Group>

      <Group gap="sm" align="center">
        <Button variant="outline" leftSection={<IconFileExport size={16} />} onClick={exportCsv}>
          CSV Dışa Aktar
        </Button>
        <Button color="red" leftSection={<IconTrash size={16} />} disabled={selectedIds.length === 0} onClick={() => setConfirmOpen(true)}>
          Seçilileri Sil
        </Button>
      </Group>
    </Group>
  );

  return (
    <Box>
      <Title order={2} mb="sm">Dosya Yönetimi ({userRole === 'tenantadmin' ? 'Tenant Admin' : 'Admin'})</Title>
      {error && <Text c="red" mb="sm">{error}</Text>}

      {headerBar}

      {loading && (
        <Group my="md"><Loader size="sm" /> <Text>Yükleniyor…</Text></Group>
      )}

      {!loading && activeTab === 'files' && (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={36}>
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === filteredFiles.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredFiles.length}
                  onChange={(e) => toggleAll(e.currentTarget.checked)}
                />
              </Table.Th>
              <Table.Th>Dosya Adı</Table.Th>
              <Table.Th>Boyut</Table.Th>
              <Table.Th>Tür</Table.Th>
              <Table.Th>Yükleme Tarihi</Table.Th>
              <Table.Th>Kullanıcı</Table.Th>
              {userRole === 'admin' && <Table.Th>Tenant</Table.Th>}
              <Table.Th style={{ width: 160 }}>İşlemler</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rowsFiles}</Table.Tbody>
        </Table>
      )}

      {!loading && activeTab === 'videos' && (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={36}>
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === filteredVideos.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredVideos.length}
                  onChange={(e) => toggleAll(e.currentTarget.checked)}
                />
              </Table.Th>
              <Table.Th>Başlık / Dosya</Table.Th>
              <Table.Th>Süre</Table.Th>
              <Table.Th>Çözünürlük</Table.Th>
              <Table.Th>Format</Table.Th>
              <Table.Th>Boyut</Table.Th>
              <Table.Th>Yükleme Tarihi</Table.Th>
              <Table.Th>Kullanıcı</Table.Th>
              {userRole === 'admin' && <Table.Th>Tenant</Table.Th>}
              <Table.Th style={{ width: 160 }}>İşlemler</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rowsVideos}</Table.Tbody>
        </Table>
      )}

      {/* Confirm bulk delete */}
      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Toplu silme onayı" centered>
        <Text>Seçili {selectedIds.length} öğeyi silmek istediğinizden emin misiniz?</Text>
        <Group justify="end" mt="md">
          <Button variant="default" onClick={() => setConfirmOpen(false)}>Vazgeç</Button>
          <Button color="red" onClick={doBulkDelete}>Sil</Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default AdminFileManagementPage;