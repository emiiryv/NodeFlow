import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import {
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  FileInput,
  TextInput,
  Textarea,
  Progress,
  Image,
  Badge,
  // Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      if (file.type.startsWith('video/')) {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title);
        formData.append('description', description);

        const res = await axios.post('/videos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (!e.total) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          },
        });

        const videoUrl = res.data?.blobUri || res.data?.video?.url;
        const newFileId = res.data?.video?.id || null;
        if (videoUrl) {
          setUploadedUrl(videoUrl);
          setUploadedId(newFileId);
          notifications.show({ color: 'green', title: 'Başarılı', message: 'Video yüklendi.' });
        } else {
          setError('Yükleme başarılı ancak Azure URL’si alınamadı.');
          notifications.show({ color: 'yellow', title: 'Uyarı', message: 'URL alınamadı.' });
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
        const tenantId = payload?.tenantId;
        formData.append('tenantId', tenantId || '');

        const res = await axios.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (!e.total) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          },
        });

        const blobUrl = res.data?.blobUri || res.data?.file?.url;
        const newFileId = res.data?.file?.id || null;
        if (blobUrl) {
          setUploadedUrl(blobUrl);
          setUploadedId(newFileId);
          notifications.show({ color: 'green', title: 'Başarılı', message: 'Dosya yüklendi.' });
        } else {
          setError('Yükleme başarılı ancak Azure URL’si alınamadı.');
          notifications.show({ color: 'yellow', title: 'Uyarı', message: 'URL alınamadı.' });
        }
      }
    } catch (err) {
      console.error('Yükleme hatası:', err);
      setError('Upload failed.');
      notifications.show({ color: 'red', title: 'Hata', message: 'Yükleme başarısız.' });
    } finally {
      setIsUploading(false);
      setProgress((p) => (p === 0 ? 0 : 100));
    }
  };

  const fileKind: 'image' | 'video' | 'other' = file
    ? file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : 'other'
    : 'other';

  return (
    <Box>
      {!isAuthenticated && (
        <Group mb="md">
          <Button variant="subtle" onClick={() => navigate('/login')}>Giriş Yap</Button>
          <Button onClick={() => navigate('/register')}>Kayıt Ol</Button>
        </Group>
      )}

      <Title order={2} mb="sm">Dosya Yükleme Servisi</Title>

      {isAuthenticated ? (
        <Card withBorder radius="lg" p="lg">
          <Stack gap="md">
            <FileInput
              label="Dosya Seç"
              placeholder="Bir dosya seçin"
              value={file}
              onChange={(f) => {
                setFile(f);
                setTitle('');
                setDescription('');
              }}
            />

            {fileKind === 'video' && (
              <Group grow>
                <TextInput label="Başlık" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
                <Textarea label="Açıklama" value={description} onChange={(e) => setDescription(e.currentTarget.value)} minRows={2} />
              </Group>
            )}

            {previewUrl && (
              <Card withBorder padding="sm" radius="md">
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Badge variant="light" color={fileKind === 'image' ? 'green' : fileKind === 'video' ? 'blue' : 'gray'}>
                      {fileKind}
                    </Badge>
                    <Text size="sm" c="dimmed">{file?.name} {(file && (file.size / 1024 / 1024).toFixed(2))} MB</Text>
                  </Group>
                </Group>
                {fileKind === 'image' && <Image src={previewUrl} alt={file?.name} radius="md" h={220} fit="contain" />}
                {fileKind === 'video' && (
                  <Box style={{ aspectRatio: '16/9' }}>
                    <video src={previewUrl} controls style={{ width: '100%', height: '100%' }} />
                  </Box>
                )}
              </Card>
            )}

            {isUploading && (
              <Box>
                <Text size="sm" mb={4}>Yükleniyor… {progress}%</Text>
                <Progress value={progress} animated aria-label="Yükleme ilerlemesi" />
              </Box>
            )}

            <Group>
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? 'Yükleniyor…' : 'Yükle'}
              </Button>
              {uploadedUrl && uploadedId && (
                <Button variant="subtle" onClick={() => navigate(`/files/${uploadedId}`)}>
                  Yüklenen dosyaya git
                </Button>
              )}
              {/* {uploadedUrl && (
                <Anchor href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                  Yüklenen dosyayı aç
                </Anchor>
              )} */}
            </Group>

            {error && <Text c="red" size="sm">{error}</Text>}
          </Stack>
        </Card>
      ) : (
        <Text c="red" mt="sm">Yükleme işlemi için lütfen giriş yapın.</Text>
      )}
    </Box>
  );
};

export default UploadPage;