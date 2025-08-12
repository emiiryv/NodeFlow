import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import {
  Box, Card, Title, Text, Group, Badge, Anchor, Grid, Loader, Image,
  Divider, Button, CopyButton, ActionIcon, Tooltip, Modal, NumberInput,
  FileButton, Slider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
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
    thumbnailUrl?: string | null;
  };
  thumbnailUrl?: string | null;
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

  // Thumbnail modal state
  const [thumbModalOpen, setThumbModalOpen] = useState(false);
  const [thumbBusy, setThumbBusy] = useState(false);

  // Modal içi canlı seçim
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [vidDuration, setVidDuration] = useState<number>(0);
  const [currentSec, setCurrentSec] = useState<number>(0);

  // Poster var mı? (HEAD ile doğruluyoruz)
  const [posterReady, setPosterReady] = useState(false);

  const failedThumbIdsRef = useRef<Set<number>>(new Set());

  const API = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '');

  const refetch = async () => {
    try {
      const response = await axiosInstance.get(`/files/${id}`);
      setFile(response.data);
      setError(null);
    } catch {
      setError('Dosya detayları alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Değerleri file mevcut değilken de güvenli hesapla (hook'lar üstte kalsın) ---
  const fid = file?.id;
  const mimetype = file?.mimetype || '';
  const isImage = mimetype.startsWith('image/');
  const isVideo = mimetype.startsWith('video/') || !!file?.video;

  const base = fid ? `${API}/files/${fid}/download` : '';
  const streamUrl = fid ? `${base}?disposition=inline` : '';
  const downloadUrl = base;
  const detailUrl = fid ? `${window.location.origin}/files/${fid}` : '';

  const safeStr = (v?: string | null) => !!v && v !== 'null' && v !== 'undefined' && v.trim().length > 0;
  const numericVideoId = file?.video && Number.isFinite(Number(file.video.id)) ? Number(file.video.id) : null;
  const hasVideoThumb = !!file?.video && safeStr(file?.video?.thumbnailUrl);
  const hasFileThumb = safeStr(file?.thumbnailUrl);
  const videoThumbCandidate = numericVideoId && hasVideoThumb ? `${API}/videos/${numericVideoId}/thumbnail` : undefined;
  const fileThumbCandidate = hasFileThumb && fid ? `${API}/files/${fid}/thumbnail` : undefined;

  // Poster varlığını HEAD ile doğrula (hook sırası bozulmasın diye her zaman tanımlı)
  useEffect(() => {
    setPosterReady(false);
    if (!file) return;
  
    // yalnızca gerçekten bir thumbnail bilgisi varsa dene
    const canTryVideo = !!file.video && !!file.video.thumbnailUrl && file.video.thumbnailUrl !== 'null' && file.video.thumbnailUrl !== 'undefined';
    const canTryFile  = !!file.thumbnailUrl && file.thumbnailUrl !== 'null' && file.thumbnailUrl !== 'undefined';
  
    const url = canTryVideo
      ? `${API}/videos/${file.video!.id}/thumbnail`
      : (canTryFile && file.id ? `${API}/files/${file.id}/thumbnail` : '');
  
    if (!url) return;
  
    // aynı id için daha önce 404 aldıysak tekrar denemeyelim
    const victimId = canTryVideo ? Number(file.video!.id) : Number(file.id);
    if (failedThumbIdsRef.current.has(victimId)) return;
  
    const ctrl = new AbortController();
    (async () => {
      try {
        const resp = await fetch(url, {
          method: 'HEAD',
          credentials: 'include',
          signal: ctrl.signal,
        });
        if (resp.ok) {
          setPosterReady(true);
        } else {
          // 404 aldıysak tekrar denememek için işaretle
          failedThumbIdsRef.current.add(victimId);
          setPosterReady(false);
        }
      } catch {
        setPosterReady(false);
      }
    })();
  
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, API]);

  const posterUrl = posterReady ? (videoThumbCandidate || fileThumbCandidate) : undefined;
  // ----------------------------------------------------------------------

  // Modal: metadata yüklendiğinde süreyi al
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = Number.isFinite(v.duration)
  ? v.duration
  : (file?.video?.duration ?? 0);
    setVidDuration(dur && dur > 0 ? dur : 0);
    if (v.currentTime !== currentSec) v.currentTime = currentSec;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v) setCurrentSec(v.currentTime);
  };

  const handleSliderChange = (sec: number) => {
    setCurrentSec(sec);
    const v = videoRef.current;
    if (v) v.currentTime = sec;
  };

  const stepTo = (delta: number) => {
    const v = videoRef.current;
    const next = Math.max(0, Math.min((v?.duration ?? vidDuration) || 0, currentSec + delta));
    setCurrentSec(next);
    if (v) v.currentTime = next;
  };

  const handleGenerateThumbnail = async () => {
    if (!file?.video) {
      notifications.show({ color: 'red', title: 'Video yok', message: 'Bu dosya için video kaydı bulunamadı.' });
      return;
    }
    setThumbBusy(true);
    try {
      const at = Math.max(0, Math.floor(currentSec));
      await axiosInstance.post(`/videos/${file.video.id}/thumbnail`, null, { params: { at } });
      await refetch();
      setThumbModalOpen(false);
      notifications.show({ title: 'Başarılı', message: 'Thumbnail oluşturuldu.', color: 'green' });
    } catch {
      notifications.show({ title: 'Hata', message: 'Thumbnail oluşturulamadı.', color: 'red' });
    } finally {
      setThumbBusy(false);
    }
  };

  const handleUploadThumbnail = async (img: File | null) => {
    if (!img) return;
    if (!file?.video) {
      notifications.show({ color: 'red', title: 'Video yok', message: 'Bu dosya için video kaydı bulunamadı.' });
      return;
    }
    setThumbBusy(true);
    try {
      const fd = new FormData();
      fd.append('thumbnail', img);
      await axiosInstance.post(`/videos/${file.video.id}/thumbnail/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refetch();
      setThumbModalOpen(false);
      notifications.show({ title: 'Başarılı', message: 'Thumbnail yüklendi.', color: 'green' });
    } catch {
      notifications.show({ title: 'Hata', message: 'Thumbnail yüklenemedi.', color: 'red' });
    } finally {
      setThumbBusy(false);
    }
  };

  // --- Erken return'leri bütün hook'lardan SONRA yap ---
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
              <Image
                src={streamUrl}
                alt={file.filename}
                radius="md"
                h={360}
                fit="contain"
                crossOrigin="use-credentials"
              />
            )}

{isVideo && (
  <Box style={{ aspectRatio: '16/9' }}>
    <video
      src={streamUrl}
      controls
      preload="metadata"
      {...(posterReady && file?.video?.id
          ? { poster: `${API}/videos/${file.video.id}/thumbnail` }
          : {})}
      style={{ width: '100%', height: '100%' }}
      crossOrigin="use-credentials"
    />
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
              <Tooltip label={file?.video ? 'Thumbnail' : 'Video kaydı yok'} withArrow>
                <ActionIcon
                  variant="subtle"
                  disabled={!file?.video}
                  onClick={() => {
                    if (file?.video) setThumbModalOpen(true);
                    else notifications.show({ color: 'red', title: 'İşlem yapılamadı', message: 'Bu dosya için video kaydı bulunamadı.' });
                  }}
                  aria-label="Thumbnail işlemleri"
                >
                  <IconPhoto size={18} />
                </ActionIcon>
              </Tooltip>
              <CopyButton value={detailUrl} timeout={1500}>
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
              <Anchor
                href={detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
              >
                {detailUrl}
              </Anchor>
              <CopyButton value={detailUrl} timeout={1500}>
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
        </Grid.Col>
      </Grid>

      {/* Silme Modal */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Silme onayı" centered>
        <Text>"{file.filename}" dosyasını silmek istediğinize emin misiniz?</Text>
        <Group justify="end" mt="md">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>Vazgeç</Button>
          <Button
            color="red"
            onClick={async () => {
              try {
                await axiosInstance.delete(`/files/${file.id}`);
                setDeleteOpen(false);
                navigate('/files');
              } catch {
                setDeleteOpen(false);
              }
            }}
          >
            Sil
          </Button>
        </Group>
      </Modal>

      {/* Thumbnail oluşturma modalı (canlı önizleme) */}
      <Modal opened={thumbModalOpen} onClose={() => setThumbModalOpen(false)} title="Thumbnail oluştur" centered>
        <Box>
          <Box style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              preload="metadata"
              {...(posterUrl ? { poster: posterUrl } : {})}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              style={{ width: '100%', height: '100%' }}
              crossOrigin="use-credentials"
            />
          </Box>

          <Group mt="md" align="center" gap="sm">
            <Button size="xs" variant="light" onClick={() => stepTo(-1)}>-1s</Button>
            <Box style={{ flex: 1 }}>
              <Text size="sm" c="dimmed" mb={6}>
                Seçili an: {currentSec.toFixed(1)} sn {vidDuration > 0 && `(/${Math.floor(vidDuration)} sn)`}
              </Text>
              <Slider
                min={0}
                max={vidDuration > 1 ? vidDuration - 0.01 : 0}
                step={0.1}
                value={currentSec}
                onChange={handleSliderChange}
              />
            </Box>
            <Button size="xs" variant="light" onClick={() => stepTo(+1)}>+1s</Button>
          </Group>

          <Group mt="sm" align="end" gap="sm">
            <NumberInput
              label="Saniye"
              min={0}
              max={vidDuration > 1 ? Math.floor(vidDuration - 1) : 0}
              step={0.1}
              value={currentSec}
              onChange={(v) => handleSliderChange(Number(v) || 0)}
              style={{ width: 140 }}
            />
            <FileButton onChange={handleUploadThumbnail} accept="image/*">
              {(props) => <Button variant="outline" {...props}>Görsel yükle</Button>}
            </FileButton>
            <Group justify="end" style={{ marginLeft: 'auto' }}>
              <Button variant="default" onClick={() => setThumbModalOpen(false)}>Vazgeç</Button>
              <Button loading={thumbBusy} onClick={handleGenerateThumbnail}>Bu kareden oluştur</Button>
            </Group>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};

export default FileDetailPage;