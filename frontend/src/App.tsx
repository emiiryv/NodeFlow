import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import FileListPage from './pages/FileListPage';
import LoginRegisterPage from './pages/LoginRegisterPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/files" element={<FileListPage />} />
        <Route path="/login" element={<LoginRegisterPage />} />
        <Route path="/register" element={<LoginRegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;