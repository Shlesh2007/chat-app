import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { ArrowLeft, Camera, Trash2, AlertTriangle } from 'lucide-react';
import api from '../lib/api.js';
import { assetUrl } from '../lib/utils.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [autoDelete, setAutoDelete] = useState(!!user?.auto_delete);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const avatarUrl = assetUrl(user?.avatar);
  const initials = user?.username?.[0]?.toUpperCase() || 'U';

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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-white">Profile Settings</h1>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-8 space-y-8">

        {/* Feedback */}
        {success && (
          <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Avatar section */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-5">Profile Photo</h2>
          <div className="flex items-center gap-6">
            {/* Avatar display */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-2xl font-bold text-white border-2 border-gray-600">
                  {initials}
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                <Camera size={15} />
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition"
                >
                  <Trash2 size={15} />
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-gray-500">JPG, PNG, GIF · Max 5MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Account info */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Account Info</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Auto-delete toggle */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Memory Settings</h2>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Auto-delete chat history</p>
              <p className="text-gray-400 text-xs mt-1">
                {autoDelete
                  ? '🗑️ Conversations older than 30 days will be automatically deleted.'
                  : '💾 All conversations are kept forever. Your AI remembers everything.'}
              </p>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => setAutoDelete(!autoDelete)}
              className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
                autoDelete ? 'bg-red-500' : 'bg-green-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  autoDelete ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {autoDelete && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded-lg px-3 py-2">
              <AlertTriangle size={13} />
              Conversations older than 30 days will be permanently deleted automatically.
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Danger zone */}
        <div className="bg-gray-800 border border-red-900/50 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">Danger Zone</h2>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm border border-red-800 hover:border-red-600 px-4 py-2 rounded-lg transition"
            >
              <Trash2 size={15} />
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-300">This will permanently delete your account and all data. Are you sure?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  Yes, delete everything
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition"
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
