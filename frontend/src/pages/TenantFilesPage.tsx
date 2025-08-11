import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
  Table,
  Loader,
  Card,
  Text,
  Group,
  ActionIcon,
  Tooltip,
  Anchor,
  useMantineTheme,
  useComputedColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconCopy } from '@tabler/icons-react';

interface FileItem {
  id: number;
  filename: string;
  size: number;
  uploadedAt: string;
  url: string; // legacy (blob) — artık kullanmıyoruz
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const TenantFilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenantName, setTenantName] = useState('');
  const navigate = useNavigate();

  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme();

  const borderColor = colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3];
  const headerBg = colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0];
  const headerColor = colorScheme === 'dark' ? theme.colors.gray[2] : theme.black;

  const tableStyles = {
    table: {
      border: `1px solid ${borderColor}`,
      borderCollapse: 'separate' as const,
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

  // Kendi indir/önizleme endpointimiz
  const API_BASE = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '');
  const downloadUrl = (id: number) => `${API_BASE}/files/${id}/download`;

  useEffect(() => {
    const fetchTenantFiles = async () => {
      try {
        const response = await axiosInstance.get('/files/tenant');
        setFiles(response.data);
        setError('');
      } catch (err) {
        setError('Dosyalar alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    const fetchTenantData = async () => {
      try {
        const tenantRes = await axiosInstance.get('/users/me');
        setTenantName(tenantRes.data?.user?.tenant?.name || '');
      } catch {
        setTenantName('');
      }
    };

    fetchTenantFiles();
    fetchTenantData();
  }, []);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      notifications.show({ color: 'blue', title: 'Kopyalandı', message: 'Bağlantı panoya kopyalandı.' });
    } catch {
      notifications.show({ color: 'red', title: 'Hata', message: 'Kopyalanamadı.' });
    }
  };

  return (
    <Box>
      <Title order={2} mb="sm">Tenant Dosyaları</Title>
      {tenantName && <Text fw={500} mb="md">{tenantName}</Text>}

      {loading && (
        <Group my="md"><Loader size="sm" /> <Text>Yükleniyor…</Text></Group>
      )}
      {error && <Text c="red" mb="sm">{error}</Text>}

      {!loading && files.length === 0 ? (
        <Card withBorder radius="lg" p="lg">
          <Text c="dimmed">Tenant'a ait dosya bulunamadı.</Text>
        </Card>
      ) : (
        <Table.ScrollContainer minWidth={900}>
          <Table striped highlightOnHover withTableBorder stickyHeader styles={tableStyles}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Dosya Adı</Table.Th>
                <Table.Th>Boyut</Table.Th>
                <Table.Th>Yüklenme Tarihi</Table.Th>
                <Table.Th style={{ width: 160 }}>İşlemler</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {files.map((file) => {
                const dUrl = downloadUrl(file.id);
                return (
                  <Table.Tr key={file.id}>
                    <Table.Td>
                      <Anchor onClick={() => navigate(`/files/${file.id}`)}>{file.filename}</Anchor>
                    </Table.Td>
                    <Table.Td>{fmtSize(file.size)}</Table.Td>
                    <Table.Td>{new Date(file.uploadedAt).toLocaleString()}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Aç / İndir" withArrow>
                          <ActionIcon onClick={() => window.open(dUrl, '_blank')} aria-label="Aç veya indir">
                            <IconDownload size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Bağlantıyı kopyala" withArrow>
                          <ActionIcon onClick={() => copyLink(dUrl)} aria-label="Bağlantıyı kopyala">
                            <IconCopy size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Box>
  );
};

export default TenantFilesPage;