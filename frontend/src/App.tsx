import Navbar from './components/Navbar';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import FileListPage from './pages/FileListPage';
import LoginRegisterPage from './pages/LoginRegisterPage';
import UserStatsPage from './pages/UserStatsPage';
import UserProfilePage from './pages/UserProfilePage';

function App() {
  return (
    <BrowserRouter>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/files" element={<FileListPage />} />
          <Route path="/login" element={<LoginRegisterPage />} />
          <Route path="/register" element={<LoginRegisterPage />} />
          <Route path="/stats" element={<UserStatsPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;