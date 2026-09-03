import React, { useState, useEffect } from 'react';
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
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'github' | null

  const register = useAuthStore((s) => s.register);
  const loginWithGoogleToken = useAuthStore((s) => s.loginWithGoogleToken);
  const loginWithGithubCode = useAuthStore((s) => s.loginWithGithubCode);
  const navigate = useNavigate();

  // Listen for Real OAuth Popup completion postMessages
  useEffect(() => {
    const handleOAuthMessage = async (event) => {
      if (event.origin !== window.location.origin) return;

      const { type, accessToken, code } = event.data || {};

      if (type === 'OAUTH_GOOGLE_SUCCESS' && accessToken) {
        setOauthLoading('google');
        try {
          await loginWithGoogleToken(accessToken);
          navigate('/');
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to verify Google account details.');
        } finally {
          setOauthLoading(null);
        }
      } else if (type === 'OAUTH_GITHUB_SUCCESS' && code) {
        setOauthLoading('github');
        try {
          await loginWithGithubCode(code);
          navigate('/');
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to verify GitHub account details.');
        } finally {
          setOauthLoading(null);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

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

  const handleOAuth = (provider) => {
    setError('');
    setOauthLoading(provider);

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    let popup = null;

    if (provider === 'google') {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '311510791510-57sj4ek9rsf5tec7meqigl93sqbqcu1b.apps.googleusercontent.com';
      const redirectUri = window.location.origin + '/oauth-callback.html';
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent('openid email profile')}&prompt=select_account`;

      popup = window.open(
        googleAuthUrl,
        'Google OAuth Sign In',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );
    } else if (provider === 'github') {
      const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23lig2Ojitx2TBIb03';
      const redirectUri = window.location.origin + '/oauth-callback.html';
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;

      popup = window.open(
        githubAuthUrl,
        'GitHub OAuth Sign In',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );
    }

    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setOauthLoading(null);
        }
      }, 500);
    } else {
      setOauthLoading(null);
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
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-opacity-20 backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium animate-fadeIn flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Real OAuth Social Buttons */}
          <div className="space-y-3 mb-5">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="w-full glass-card glass-card-hover rounded-2xl py-3 px-4 flex items-center justify-center gap-3 font-bold text-xs sm:text-sm theme-text-heading border border-opacity-20 transition shadow-sm active:scale-[0.98]"
            >
              {oauthLoading === 'google' ? (
                <Sparkles size={18} className="animate-spin text-indigo-400" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Sign up with Google</span>
            </button>

            {/* GitHub OAuth */}
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading}
              className="w-full glass-card glass-card-hover rounded-2xl py-3 px-4 flex items-center justify-center gap-3 font-bold text-xs sm:text-sm theme-text-heading border border-opacity-20 transition shadow-sm active:scale-[0.98]"
            >
              {oauthLoading === 'github' ? (
                <Sparkles size={18} className="animate-spin text-purple-400" />
              ) : (
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              <span>Sign up with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-slate-700/50"></div>
            <span className="flex-shrink mx-3 text-[10px] font-extrabold theme-text-muted uppercase tracking-widest">OR EMAIL</span>
            <div className="flex-grow border-t border-slate-700/50"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
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
                <span>Create Account with Email</span>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center theme-text-muted text-xs mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

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
            <span>Real Google & GitHub OAuth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
