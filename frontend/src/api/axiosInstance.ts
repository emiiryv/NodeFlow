import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add Authorization header if token is present
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;