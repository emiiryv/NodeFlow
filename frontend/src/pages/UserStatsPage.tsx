import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosInstance';
import {
  Box,
  Card,
  Title,
  Text,
  Group,
  Grid,
  Loader,
  Badge,
} from '@mantine/core';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Line,
} from 'recharts';

interface Stats {
  totalFiles: number;
  totalSize: number; // bytes
  lastUpload: string | null;
}

interface FileItem {
  id: number;
  uploadedAt: string; // ISO
}

type DayPoint = { date: string; label: string; count: number };

const fmtBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

const buildLastNDays = (n = 30): string[] => {
  const days: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // oldest -> today (today is last)
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    const iso = day.toISOString().slice(0, 10); // yyyy-mm-dd
    days.push(iso);
  }
  return days;
};

const labelOf = (iso: string) => {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}.${month}`;
};

const UserStatsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<DayPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Özet istatistikleri al
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/users/stats/me');
        const { totalFiles, totalSize, lastUpload } = res.data;
        setStats({ totalFiles, totalSize, lastUpload });
        setError(null);
      } catch (err) {
        setError('İstatistikler alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // 2) Günlük seri oluştur (son 30 gün) – /files listesinden
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true);
        const filesRes = await axios.get('/files'); // kullanıcının kendi dosyaları
        const files: FileItem[] = filesRes.data || [];

        // Gün sayacı
        const last30 = buildLastNDays(30);
        const counter = new Map<string, number>(last30.map((d) => [d, 0]));
        for (const f of files) {
          if (!f.uploadedAt) continue;
          const iso = new Date(f.uploadedAt).toISOString().slice(0, 10);
          if (counter.has(iso)) counter.set(iso, (counter.get(iso) || 0) + 1);
        }
        const data: DayPoint[] = last30.map((d) => ({
          date: d,
          label: labelOf(d),
          count: counter.get(d) || 0,
        }));
        setDaily(data);
      } catch (err) {
        // seri olmadan da sayfa çalışsın
      } finally {
        setLoadingSeries(false);
      }
    };
    fetchSeries();
  }, []);

  const lastUploadPretty = useMemo(
    () => (stats?.lastUpload ? new Date(stats.lastUpload).toLocaleString() : 'Yok'),
    [stats?.lastUpload]
  );

  if (loading && !stats) {
    return (
      <Group my="md">
        <Loader size="sm" /> <Text>Yükleniyor…</Text>
      </Group>
    );
  }

  return (
    <Box>
      <Title order={2} mb="sm">Kullanıcı İstatistikleri</Title>
      {error && <Text c="red" mb="md">{error}</Text>}

      {/* Özet Kartlar */}
      <Grid gutter="md" mb="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="lg" p="lg">
            <Text c="dimmed" size="sm">Toplam Dosya</Text>
            <Text fw={700} fz="xl">{stats?.totalFiles ?? 0}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="lg" p="lg">
            <Text c="dimmed" size="sm">Toplam Boyut</Text>
            <Text fw={700} fz="xl">{fmtBytes(stats?.totalSize ?? 0)}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="lg" p="lg">
            <Group justify="space-between" align="center" mb={6}>
              <Text c="dimmed" size="sm">Son Yükleme</Text>
              <Badge variant="light" color="grape">Son 30 gün</Badge>
            </Group>
            <Text fw={700} fz="md">{lastUploadPretty}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Günlük Upload Sayısı Grafiği */}
      <Card withBorder radius="lg" p="lg">
        <Group justify="space-between" align="center" mb="sm">
          <Title order={4}>Günlük Yükleme Sayısı</Title>
          {loadingSeries && (
            <Group gap="xs"><Loader size="xs" /> <Text size="sm">Veri hazırlanıyor…</Text></Group>
          )}
        </Group>

        <Box style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <ReTooltip
                formatter={(value: any) => [value, 'Yükleme']}
                labelFormatter={(label) => `Tarih: ${label}`}
              />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  );
};

export default UserStatsPage;