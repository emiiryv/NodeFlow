import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import {
  Box,
  Card,
  Title,
  Text,
  Group,
  Badge,
  Anchor,
  Grid,
  Loader,
  Image,
  Divider,
  Button,
  CopyButton,
  ActionIcon,
  Tooltip,
  Modal,
} from '@mantine/core';
import { IconPhoto, IconVideo, IconFile, IconExternalLink, IconCopy, IconDownload, IconTrash } from '@tabler/icons-react';

interface FileDetail {
  id: number;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  mimetype: string;
  user?: { id: number; name: string; email: string };
  tenant?: { id: number; name: string };
  video?: {
    id: number;
    title: string;
    description?: string;
    duration: number;
    format: string;
    resolution: string;
    fileId: number;
  };
  thumbnailUrl?: string;
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const FileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await axiosInstance.get(`/files/${id}`);
        setFile(response.data);
        setError(null);
      } catch (err) {
        setError('Dosya detayları alınamadı.');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [id]);

  if (loading) {
    return (
      <Group p="md">
        <Loader size="sm" />
        <Text>Yükleniyor…</Text>
      </Group>
    );
  }

  if (error) return <Text c="red" p="md">{error}</Text>;
  if (!file) return <Text p="md">Dosya bulunamadı.</Text>;

  const isImage = file.mimetype?.startsWith('image/');
  const isVideo = file.mimetype?.startsWith('video/') || !!file.video;

  // 🔗 Kendi endpoint'lerimiz (cookie tabanlı auth)
  const API = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '');
  const base = `${API}/files/${file.id}/download`;
  const streamUrl = `${base}?disposition=inline`;
  const downloadUrl = `${base}`;

  return (
    <Box>
      <Title order={2} mb="sm">Dosya Detayı</Title>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder radius="lg" p="md">
            <Group mb="sm" gap="xs">
              {isImage ? <IconPhoto size={18} /> : isVideo ? <IconVideo size={18} /> : <IconFile size={18} />}
              <Text fw={600}>{file.filename}</Text>
              <Badge variant="light">{file.mimetype}</Badge>
            </Group>

            {isImage && (
              // 👇 Artık blob değil kendi stream endpoint'imizden
              <Image src={streamUrl} alt={file.filename} radius="md" h={360} fit="contain" />
            )}

            {isVideo && (
              <Box style={{ aspectRatio: '16/9' }}>
                {/* 👇 Video da backend stream endpoint'iyle */}
                <video src={streamUrl} controls style={{ width: '100%', height: '100%' }} />
              </Box>
            )}

            {!isImage && !isVideo && (
              <Group mt="sm">
                <Button leftSection={<IconExternalLink size={16} />} onClick={() => window.open(downloadUrl, '_blank')}>
                  Dosyayı Aç
                </Button>
              </Group>
            )}

            {isVideo && file.video && (
              <Box mt="sm">
                {file.video.title && <Text fw={600}>{file.video.title}</Text>}
                {file.video.description && <Text size="sm" c="dimmed">{file.video.description}</Text>}
              </Box>
            )}

            <Group mt="sm" justify="flex-end">
              <CopyButton value={downloadUrl} timeout={1500}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Kopyalandı' : 'Kopyala'} withArrow>
                    <ActionIcon variant="subtle" onClick={copy} aria-label="Bağlantıyı kopyala">
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              <Tooltip label="İndir / Aç" withArrow>
                <ActionIcon variant="subtle" onClick={() => window.open(downloadUrl, '_blank')} aria-label="İndir veya aç">
                  <IconDownload size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Sil" withArrow>
                <ActionIcon color="red" variant="subtle" onClick={() => setDeleteOpen(true)} aria-label="Sil">
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder radius="lg" p="md">
            <Title order={4} mb="xs">Meta Bilgiler</Title>
            <Divider mb="sm" />
            <Group gap="xs" mb={6}>
              <Text c="dimmed">Boyut:</Text>
              <Text>{fmtSize(file.size)}</Text>
            </Group>
            <Group gap="xs" mb={6}>
              <Text c="dimmed">Yüklenme:</Text>
              <Text>{new Date(file.uploadedAt).toLocaleString()}</Text>
            </Group>
            <Group gap="xs" mb={6} wrap="nowrap">
              <Text c="dimmed">URL:</Text>
              {/* 👇 Anchor artık kendi endpoint'imize işaret ediyor */}
              <Anchor
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
              >
                {downloadUrl}
              </Anchor>
              <CopyButton value={downloadUrl} timeout={1500}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Kopyalandı' : 'Kopyala'} withArrow>
                    <ActionIcon variant="subtle" onClick={copy} aria-label="URL'i kopyala">
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            {file.user && (
              <Group gap="xs" mb={6}>
                <Text c="dimmed">Yükleyen:</Text>
                <Text>{file.user.name} ({file.user.email})</Text>
              </Group>
            )}
            {file.tenant && (
              <Group gap="xs" mb={6}>
                <Text c="dimmed">Tenant:</Text>
                <Text>{file.tenant.name}</Text>
              </Group>
            )}
          </Card>

          {file.video && (
            <Card withBorder radius="lg" p="md" mt="md">
              <Title order={4} mb="xs">Video Detayları</Title>
              <Divider mb="sm" />
              <Group gap="xs" mb={6}>
                <Text c="dimmed">Başlık:</Text>
                <Anchor component={Link} to={`/files/${file.video.fileId}`}>{file.video.title}</Anchor>
              </Group>
              {file.video.description && (
                <Group gap="xs" mb={6}>
                  <Text c="dimmed">Açıklama:</Text>
                  <Text>{file.video.description}</Text>
                </Group>
              )}
              <Group gap="xs" mb={6}>
                <Text c="dimmed">Süre:</Text>
                <Text>{file.video.duration.toFixed(2)} saniye</Text>
              </Group>
              <Group gap="xs" mb={6}>
                <Text c="dimmed">Format:</Text>
                <Text>{file.video.format}</Text>
              </Group>
              <Group gap="xs" mb={6}>
                <Text c="dimmed">Çözünürlük:</Text>
                <Text>{file.video.resolution}</Text>
              </Group>
            </Card>
          )}

          {file.thumbnailUrl && (
            <Card withBorder radius="lg" p="md" mt="md">
              <Title order={4} mb="xs">Thumbnail</Title>
              <Divider mb="sm" />
              {/* Thumbnail da istersen streamUrl ile gelebilir; şimdilik doğrudan gösteriyoruz */}
              <Image src={streamUrl} alt="Video Thumbnail" radius="md" w={260} fit="contain" />
            </Card>
          )}
        </Grid.Col>
      </Grid>
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Silme onayı" centered>
        <Text>"{file.filename}" dosyasını silmek istediğinize emin misiniz?</Text>
        <Group justify="end" mt="md">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>Vazgeç</Button>
          <Button color="red" onClick={async () => {
            try {
              await axiosInstance.delete(`/files/${file.id}`);
              setDeleteOpen(false);
              navigate('/files');
            } catch (e) {
              setDeleteOpen(false);
            }
          }}>Sil</Button>
        </Group>
      </Modal>
    </Box>
  );
};

export default FileDetailPage;