import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  MantineProvider,
  localStorageColorSchemeManager,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme'; // kendi theme.ts'inizi kullanın

import UploadPage from './pages/UploadPage';
import FileListPage from './pages/FileListPage';
import FileDetailPage from './pages/FileDetailPage';
import LoginRegisterPage from './pages/LoginRegisterPage';
import UserStatsPage from './pages/UserStatsPage';
import UserProfilePage from './pages/UserProfilePage';
import TenantFilesPage from './pages/TenantFilesPage';
import AdminFileManagementPage from './pages/AdminFileManagementPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import Layout from './components/Layout';

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'nodeflow-color-scheme', // index.html'deki preload script ile AYNI
});

function App() {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="light"
      colorSchemeManager={colorSchemeManager}
    >
      <Notifications position="top-right" />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/files" element={<FileListPage />} />
            <Route path="/files/:id" element={<FileDetailPage />} />
            <Route path="/login" element={<LoginRegisterPage />} />
            <Route path="/register" element={<LoginRegisterPage />} />
            <Route path="/stats" element={<UserStatsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/tenant-files" element={<TenantFilesPage />} />
            <Route path="/admin/file-management" element={<AdminFileManagementPage />} />
            <Route path="/admin/user-management" element={<AdminUserManagementPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;