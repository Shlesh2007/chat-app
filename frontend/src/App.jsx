import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import BlockedPage from './pages/BlockedPage.jsx';
import BackendWakeup from './components/BackendWakeup.jsx';
import api from './lib/api.js';

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return !token ? children : <Navigate to="/" replace />;
}

// Set up global interceptors once — outside component so they never re-register
let interceptorId = null;
function setupInterceptor() {
  if (interceptorId !== null) return;
  interceptorId = api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 403 && err.response?.data?.error === 'BLOCKED') {
        useAuthStore.getState().setBlocked(err.response.data.reason || 'Your account has been suspended.');
      }
      return Promise.reject(err);
    }
  );
}
setupInterceptor();

export default function App() {
  const { token, updateUser, setBlocked, clearBlocked, blocked } = useAuthStore();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  // On login — check if already blocked
  useEffect(() => {
    if (!token) return;
    api.get('/profile')
      .then(({ data }) => {
        updateUser(data.user);
        // don't touch blocked state here — interceptor handles it
      })
      .catch((err) => {
        if (err.response?.status === 403 && err.response?.data?.error === 'BLOCKED') {
          setBlocked(err.response.data.reason || 'Your account has been suspended.');
        }
      });
  }, [token]);

  // Listen for BLOCKED from raw fetch (chat stream uses fetch not axios)
  useEffect(() => {
    const handleUserBlocked = (e) => {
      setBlocked(e.detail?.reason || 'You have been blocked due to policy violations.');
    };
    window.addEventListener('user-blocked', handleUserBlocked);
    return () => window.removeEventListener('user-blocked', handleUserBlocked);
  }, []);

  // Admin route — completely isolated
  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    );
  }

  // Blocked — stays until explicitly cleared by onUnblocked
  if (token && blocked) {
    return <BlockedPage reason={blocked.reason} onUnblocked={clearBlocked} />;
  }

  return (
    <BackendWakeup>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/chat/:conversationId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BackendWakeup>
  );
}
