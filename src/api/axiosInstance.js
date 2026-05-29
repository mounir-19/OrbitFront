import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Read token from Zustand store state directly (always in sync)
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');

    const token = useAuthStore.getState().token;
    if (status === 401 && !isAuthRequest && token) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;