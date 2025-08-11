import { AppShell, Container, Title, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import logo from '../assets/logo.png';

type LayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function Layout({ title, children }: LayoutProps) {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme();

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header style={{ backgroundColor: 'var(--mantine-color-body)', borderBottom: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}` }}>
        <Container size="xl" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 20 }}>
            <img src={logo} alt="Logo" style={{ height: 32 }} />
            <Title order={4} style={{ marginLeft: 8 }}>NodeFlow</Title>
          </div>
          <Navbar />
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">
          {title && (
            <Title order={2} mb="md">
              {title}
            </Title>
          )}
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}