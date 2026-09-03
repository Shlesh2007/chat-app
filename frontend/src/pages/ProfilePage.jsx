import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { ArrowLeft, Camera, Trash2, AlertTriangle, Sparkles, Check, Palette } from 'lucide-react';
import api from '../lib/api.js';
import { assetUrl } from '../lib/utils.js';
import { THEMES, applyTheme, getStoredTheme } from '../lib/theme.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [autoDelete, setAutoDelete] = useState(!!user?.auto_delete);
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme());
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const avatarUrl = assetUrl(user?.avatar);
  const initials = user?.username?.[0]?.toUpperCase() || 'U';

  const handleThemeChange = (themeId) => {
    const updated = applyTheme(themeId);
    setCurrentTheme(updated);
    const themeName = THEMES.find(t => t.id === themeId)?.name;
    setSuccess(`Theme updated to ${themeName}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.patch('/profile', { username, auto_delete: autoDelete });
      updateUser(data.user);
      setSuccess('Profile saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploadingAvatar(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: data.avatar });
      setSuccess('Profile photo updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.delete('/profile/avatar');
      updateUser({ avatar: null });
      setSuccess('Profile photo removed');
    } catch (err) {
      setError('Failed to remove photo');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile/account');
      logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen theme-app-bg bg-grid-pattern flex flex-col select-none">
      {/* Top Header */}
      <div className="border-b theme-sidebar-bg backdrop-blur-md px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <button
          onClick={() => navigate('/')}
          className="theme-text-muted hover:theme-text-heading transition p-2 rounded-xl"
        >
          <ArrowLeft size={19} />
        </button>
        <h1 className="text-base font-heading font-extrabold theme-text-heading">Profile Settings</h1>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        {/* Feedback Messages */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-medium px-4 py-3 rounded-2xl flex items-center gap-2 animate-fadeIn">
            <Check size={16} className="text-emerald-500" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-medium px-4 py-3 rounded-2xl animate-fadeIn">
            {error}
          </div>
        )}

        {/* Theme Customization Section */}
        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <h2 className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <Palette size={16} className="text-indigo-500" />
            Theme & Appearance
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((t) => {
              const isSelected = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`group relative text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg scale-[1.02]'
                      : 'glass-card glass-card-hover hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{t.icon}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold theme-text-heading mb-0.5">{t.name}</p>
                    <p className="text-[10px] theme-text-muted leading-tight">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Avatar Section */}
        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <h2 className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-5">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {initials}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all duration-200"
              >
                <Camera size={15} />
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-2 glass-card hover:bg-slate-500/10 text-xs px-4 py-2 rounded-xl transition"
                >
                  <Trash2 size={14} />
                  Remove Photo
                </button>
              )}
              <p className="text-[11px] theme-text-muted">JPG, PNG, GIF · Max 5MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Account Info Section */}
        <div className="glass-card rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-semibold theme-text-muted uppercase tracking-wider">Account Info</h2>

          <div>
            <label className="block text-xs font-medium theme-text-muted mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium theme-text-muted mb-1.5">Email Address</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full glass-input opacity-60 rounded-xl px-4 py-2.5 text-xs cursor-not-allowed"
            />
          </div>
        </div>

        {/* Memory Settings */}
        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <h2 className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-4">Memory Settings</h2>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="theme-text-heading text-sm font-semibold">Auto-delete chat history</p>
              <p className="theme-text-muted text-xs mt-1 leading-relaxed">
                {autoDelete
                  ? '🗑️ Conversations older than 30 days are automatically purged.'
                  : '💾 All conversations are retained. Your AI remembers your chats.'}
              </p>
            </div>
            <button
              onClick={() => setAutoDelete(!autoDelete)}
              className={`relative shrink-0 w-12 h-6.5 rounded-full transition-colors duration-300 border ${
                autoDelete
                  ? 'bg-indigo-600 border-indigo-500'
                  : 'glass-card border-opacity-30'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-300 ${
                  autoDelete ? 'translate-x-5.5 bg-white' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {autoDelete && (
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2.5">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              <span>Conversations older than 30 days will be permanently deleted.</span>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Sparkles size={16} className="animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </button>

        {/* Danger Zone */}
        <div className="glass-card rounded-3xl p-6 border-rose-500/30 shadow-xl">
          <h2 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-3">Danger Zone</h2>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-500 text-xs font-semibold border border-rose-500/40 hover:border-rose-500 px-4 py-2.5 rounded-xl transition bg-rose-500/10"
            >
              <Trash2 size={15} />
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">This will permanently delete your account and chat data. Are you sure?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  Yes, delete everything
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="glass-card text-xs px-4 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
