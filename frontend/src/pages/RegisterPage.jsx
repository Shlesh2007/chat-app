import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Bot, Eye, EyeOff, Sparkles, Mail, Lock, User, Zap, Shield, Image } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-app-bg bg-grid-pattern flex items-center justify-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Glow Ambient Mesh */}
      <div className="hidden sm:block absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slideUp">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="relative mb-4 group cursor-pointer">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-md group-hover:opacity-100 transition duration-500 animate-pulseGlow" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 glass-card rounded-3xl flex items-center justify-center shadow-2xl">
              <Bot size={38} className="text-indigo-400 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold theme-text-heading tracking-tight">
            Create account
          </h1>
          <p className="theme-text-muted text-xs sm:text-sm mt-1">
            Start chatting with your personal AI assistant today
          </p>
        </div>

        {/* Premium Glass Card Form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-opacity-20 backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium animate-fadeIn flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold theme-text-muted mb-1.5 uppercase tracking-wider">Username</label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-3.5 theme-text-muted pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 theme-text-heading text-sm placeholder:theme-text-muted placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
                placeholder="johndoe"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold theme-text-muted mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3.5 theme-text-muted pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 theme-text-heading text-sm placeholder:theme-text-muted placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold theme-text-muted mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 theme-text-muted pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full glass-input rounded-2xl pl-10 pr-12 py-3 theme-text-heading text-sm placeholder:theme-text-muted placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 rounded-lg theme-text-muted hover:theme-text-heading transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            {loading ? (
              <>
                <Sparkles size={18} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>

          {/* Footer Link */}
          <p className="text-center theme-text-muted text-xs mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        {/* Feature Badges Footer */}
        <div className="mt-8 flex justify-center items-center gap-4 text-[11px] theme-text-muted">
          <div className="flex items-center gap-1">
            <Zap size={13} className="text-amber-400" />
            <span>Fast AI</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Image size={13} className="text-purple-400" />
            <span>Image Gen</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Shield size={13} className="text-emerald-400" />
            <span>Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
