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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconCopy } from '@tabler/icons-react';

interface FileItem {
  id: number;
  filename: string;
  size: number;
  uploadedAt: string;
  url: string;
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
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Dosya Adı</Table.Th>
              <Table.Th>Boyut</Table.Th>
              <Table.Th>Yüklenme Tarihi</Table.Th>
              <Table.Th style={{ width: 160 }}>İşlemler</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {files.map((file) => (
              <Table.Tr key={file.id}>
                <Table.Td>
                  <Anchor onClick={() => navigate(`/files/${file.id}`)}>{file.filename}</Anchor>
                </Table.Td>
                <Table.Td>{fmtSize(file.size)}</Table.Td>
                <Table.Td>{new Date(file.uploadedAt).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Aç / İndir" withArrow>
                      <ActionIcon onClick={() => window.open(file.url, '_blank')} aria-label="Aç veya indir">
                        <IconDownload size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Bağlantıyı kopyala" withArrow>
                      <ActionIcon onClick={() => copyLink(file.url)} aria-label="Bağlantıyı kopyala">
                        <IconCopy size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Box>
  );
};

export default TenantFilesPage;