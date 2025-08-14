// frontend/src/api/csrf.ts

import axios from './axiosInstance';

/**
 * Backend'den CSRF token'ı alır.
 * Bu token frontend'de saklanarak isteklerde kullanılır.
 */
export async function getCsrfToken(): Promise<string> {
  try {
    const response = await axios.get('/csrf-token');
    return response.data.csrfToken;
  } catch (error) {
    console.error('CSRF token alınamadı:', error);
    throw error;
  }
}