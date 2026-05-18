import React, { useEffect, useState } from 'react';
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

export default function App() {
  const { token, updateUser, logout } = useAuthStore();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [blocked, setBlocked] = useState(null); // { reason }

  useEffect(() => {
    if (!token) { setBlocked(null); return; }
    api.get('/profile')
      .then(({ data }) => {
        updateUser(data.user);
        setBlocked(null);
      })
      .catch((err) => {
        if (err.response?.status === 403 && err.response?.data?.error === 'BLOCKED') {
          setBlocked({ reason: err.response.data.reason });
        }
      });
  }, [token]);

  // Intercept all 403 BLOCKED responses globally
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 403 && err.response?.data?.error === 'BLOCKED') {
          setBlocked({ reason: err.response.data.reason });
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  // Admin route — completely isolated
  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    );
  }

  // Blocked user screen
  if (token && blocked) {
    return <BlockedPage reason={blocked.reason} onUnblocked={() => setBlocked(null)} />;
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
