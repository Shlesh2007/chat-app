import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Bot, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] bg-grid-pattern flex items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Glow Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slideUp">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-md animate-pulseGlow" />
            <div className="relative w-16 h-16 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
              <Bot size={34} className="text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your Chat-App account</p>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 border border-slate-800/80 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 pr-12 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>

          <p className="text-center text-slate-400 text-xs mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
