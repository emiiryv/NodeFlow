import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import {
  Box,
  Title,
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Button,
  TextInput,
  Loader,
  Tooltip,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconDownload,
  IconTrash,
  IconCopy,
  IconEdit,
  IconPhoto,
  IconVideo,
  IconFile,
} from '@tabler/icons-react';

interface FileItem {
  id: number;
  filename: string;
  url: string;
  uploadedAt: string;
  size: number;
  mimetype: string;
}

interface VideoItem {
  id: number;
  fileId: number;
  title: string;
  description?: string;
  url: string;
  uploadedAt: string;
  duration?: number;
  resolution?: string;
  format?: string;
  size: number;
  filename: string;
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const FileListPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [newFilename, setNewFilename] = useState('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'file' | 'video'; id: number; name: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/files');
      const allFiles = res.data;
      const videoRes = await axios.get('/videos/my');
      const videoFileIds = videoRes.data.map((v: any) => v.fileId);
      const filteredFiles = allFiles.filter((f: any) => !videoFileIds.includes(f.id));
      setFiles(filteredFiles);
      setVideos(videoRes.data);
      setError(null);
    } catch (err) {
      setError('Dosyalar alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const openEdit = (file: FileItem) => {
    setEditingFile(file);
    setNewFilename(file.filename);
    setIsEditOpen(true);
  };

  const handleUpdateFilename = async () => {
    if (!editingFile) return;
    try {
      await axios.put(`/files/${editingFile.id}`, { filename: newFilename });
      setFiles((prev) => prev.map((f) => (f.id === editingFile.id ? { ...f, filename: newFilename } : f)));
      notifications.show({ color: 'green', title: 'Güncellendi', message: 'Dosya adı güncellendi.' });
      setIsEditOpen(false);
    } catch (err) {
      notifications.show({ color: 'red', title: 'Hata', message: 'Dosya adı güncellenemedi.' });
    }
  };

  const askDelete = (kind: 'file' | 'video', id: number, name: string) => {
    setDeleteTarget({ kind, id, name });
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === 'file') {
        await axios.delete(`/files/${deleteTarget.id}`);
        setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      } else {
        await axios.delete(`/videos/${deleteTarget.id}`);
        setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      }
      notifications.show({ color: 'green', title: 'Silindi', message: `${deleteTarget.name} kaldırıldı.` });
    } catch (err) {
      notifications.show({ color: 'red', title: 'Hata', message: 'Silme işlemi başarısız.' });
    } finally {
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      notifications.show({ color: 'blue', title: 'Kopyalandı', message: 'Bağlantı panoya kopyalandı.' });
    } catch {
      notifications.show({ color: 'red', title: 'Hata', message: 'Kopyalanamadı.' });
    }
  };

  const renderFileType = (mime: string) => {
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

  return (
    <Box>
      <Title order={2} mb="sm">Yüklenen Dosyalar</Title>
      {loading && (
        <Group my="md"><Loader size="sm" /> <Text>Yükleniyor…</Text></Group>
      )}
      {error && <Text c="red" mb="sm">{error}</Text>}

      {/* Dosyalar */}
      <Title order={4} mt="lg" mb="xs">Dosyalar</Title>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dosya Adı</Table.Th>
            <Table.Th>Boyut</Table.Th>
            <Table.Th>Tür</Table.Th>
            <Table.Th>Yüklenme Tarihi</Table.Th>
            <Table.Th style={{ width: 200 }}>İşlemler</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {files.map((file) => (
            <Table.Tr key={file.id}>
              <Table.Td>
                <Anchor onClick={() => navigate(`/files/${file.id}`)}>{file.filename}</Anchor>
              </Table.Td>
              <Table.Td>{fmtSize(file.size)}</Table.Td>
              <Table.Td>{renderFileType(file.mimetype)}</Table.Td>
              <Table.Td>{new Date(file.uploadedAt).toLocaleString()}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-start">
                  <Tooltip label="İndir / Aç">
                    <ActionIcon onClick={() => window.open(file.url, '_blank')}>
                      <IconDownload size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Bağlantıyı kopyala">
                    <ActionIcon onClick={() => copyLink(file.url)}>
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Adı düzenle">
                    <ActionIcon onClick={() => openEdit(file)}>
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Sil">
                    <ActionIcon color="red" onClick={() => askDelete('file', file.id, file.filename)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Videolar */}
      <Title order={4} mt="lg" mb="xs">Videolar</Title>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dosya Adı</Table.Th>
            <Table.Th>Süre</Table.Th>
            <Table.Th>Çözünürlük</Table.Th>
            <Table.Th>Format</Table.Th>
            <Table.Th>Boyut</Table.Th>
            <Table.Th>Yüklenme Tarihi</Table.Th>
            <Table.Th style={{ width: 160 }}>İşlemler</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {videos.map((video) => (
            <Table.Tr key={video.id}>
              <Table.Td>
                <Anchor onClick={() => navigate(`/files/${video.fileId}`)}>{video.filename}</Anchor>
              </Table.Td>
              <Table.Td>{video.duration ? `${video.duration.toFixed(2)} sn` : '-'}</Table.Td>
              <Table.Td>{video.resolution || '-'}</Table.Td>
              <Table.Td>
                <Badge variant="light">{video.format || '-'}</Badge>
              </Table.Td>
              <Table.Td>{fmtSize(video.size)}</Table.Td>
              <Table.Td>{new Date(video.uploadedAt).toLocaleString()}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-start">
                  <Tooltip label="İndir / Aç">
                    <ActionIcon onClick={() => window.open(video.url, '_blank')}>
                      <IconDownload size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Bağlantıyı kopyala">
                    <ActionIcon onClick={() => copyLink(video.url)}>
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Sil">
                    <ActionIcon color="red" onClick={() => askDelete('video', video.id, video.filename)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Edit Modal */}
      <Modal opened={isEditOpen} onClose={() => setIsEditOpen(false)} title="Dosya adını güncelle" centered>
        <TextInput value={newFilename} onChange={(e) => setNewFilename(e.currentTarget.value)} label="Yeni ad" mb="md"/>
        <Group justify="end">
          <Button variant="default" onClick={() => setIsEditOpen(false)}>İptal</Button>
          <Button onClick={handleUpdateFilename}>Kaydet</Button>
        </Group>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Silme onayı" centered>
        <Text>"{deleteTarget?.name}" öğesini silmek istediğinize emin misiniz?</Text>
        <Group justify="end" mt="md">
          <Button variant="default" onClick={() => setIsDeleteOpen(false)}>Vazgeç</Button>
          <Button color="red" onClick={confirmDelete}>Sil</Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default FileListPage;