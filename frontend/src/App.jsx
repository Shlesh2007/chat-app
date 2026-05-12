import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
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
  const { token, updateUser } = useAuthStore();

  // On every page load, refresh user profile from backend
  // so avatar, username, auto_delete are always up to date
  useEffect(() => {
    if (!token) return;
    api.get('/profile')
      .then(({ data }) => updateUser(data.user))
      .catch(() => {}); // silently ignore if token expired
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="/chat/:conversationId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
