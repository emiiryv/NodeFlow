import Navbar from './components/Navbar';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import FileListPage from './pages/FileListPage';
import FileDetailPage from './pages/FileDetailPage';
import LoginRegisterPage from './pages/LoginRegisterPage';
import UserStatsPage from './pages/UserStatsPage';
import UserProfilePage from './pages/UserProfilePage';
import TenantFilesPage from './pages/TenantFilesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminFileManagementPage from './pages/AdminFileManagementPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';

function App() {
  return (
    <BrowserRouter>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/files" element={<FileListPage />} />
          <Route path="/files/:id" element={<FileDetailPage />} />
          <Route path="/login" element={<LoginRegisterPage />} />
          <Route path="/register" element={<LoginRegisterPage />} />
          <Route path="/stats" element={<UserStatsPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/tenant-files" element={<TenantFilesPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/file-management" element={<AdminFileManagementPage />} />
          <Route path="/admin/user-management" element={<AdminUserManagementPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;