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

// Handle 401 globally — but NOT on auth endpoints (login/register)
// to allow the login page to show its own error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';

    if (err.response?.status === 401 && !isAuthEndpoint && !isLoginPage) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
