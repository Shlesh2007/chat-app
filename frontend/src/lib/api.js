import axios from 'axios';

// In production (Vercel), use the backend URL from env.
// In development, use Vite proxy (/api → localhost:3001).
const BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  try {
    const { state } = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
  } catch {}
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
