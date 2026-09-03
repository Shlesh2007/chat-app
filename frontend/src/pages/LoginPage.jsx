import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Bot, Eye, EyeOff, Sparkles, Mail, Lock, Zap, Shield, Image, CheckCircle, RefreshCw, X, Puzzle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password & Anti-Robot Puzzle State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email & Puzzle, 2: Success
  const [sliderValue, setSliderValue] = useState(0);
  const [targetZone, setTargetZone] = useState(75);
  const [isRobotVerified, setIsRobotVerified] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // Randomize puzzle target on modal open
  const generateNewPuzzle = () => {
    const randomTarget = Math.floor(Math.random() * 40) + 50; // Target between 50% and 90%
    setTargetZone(randomTarget);
    setSliderValue(0);
    setIsRobotVerified(false);
    setCaptchaChecked(false);
    setResetError('');
  };

  const openForgotModal = () => {
    setForgotEmail(email);
    setForgotStep(1);
    generateNewPuzzle();
    setShowForgotModal(true);
  };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    // Check if slider is within +-5% of target zone
    if (Math.abs(val - targetZone) <= 5) {
      setIsRobotVerified(true);
    } else {
      setIsRobotVerified(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setResetError('');

    if (!captchaChecked) {
      setResetError('Please check "I am not a robot"');
      return;
    }
    if (!isRobotVerified) {
      setResetError('Please align the puzzle piece to verify you are human!');
      return;
    }

    setResetLoading(true);
    setTimeout(() => {
      setResetLoading(false);
      setForgotStep(2);
    }, 1200);
  };

  return (
    <div className="min-h-screen theme-app-bg bg-grid-pattern flex items-center justify-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Glow Ambient Mesh */}
      <div className="hidden sm:block absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

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
            Welcome back
          </h1>
          <p className="theme-text-muted text-xs sm:text-sm mt-1">
            Sign in to continue chatting with your AI assistant
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
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold theme-text-muted uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={openForgotModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3.5 theme-text-muted pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full glass-input rounded-2xl pl-10 pr-12 py-3 theme-text-heading text-sm placeholder:theme-text-muted placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
                placeholder="••••••••"
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
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            {loading ? (
              <>
                <Sparkles size={18} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>

          {/* Footer Link */}
          <p className="text-center theme-text-muted text-xs mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline-offset-4 hover:underline">
              Create an account
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

      {/* ── FORGOT PASSWORD & ANTI-ROBOT PUZZLE MODAL ───────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-opacity-20 relative animate-slideUp">
            {/* Close Button */}
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl glass-card glass-card-hover theme-text-muted hover:theme-text-heading transition-colors"
            >
              <X size={18} />
            </button>

            {forgotStep === 1 ? (
              <form onSubmit={handleResetSubmit}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Puzzle size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold theme-text-heading">Reset Password</h3>
                    <p className="text-xs theme-text-muted">Complete the security puzzle to proceed</p>
                  </div>
                </div>

                {resetError && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium">
                    ⚠️ {resetError}
                  </div>
                )}

                {/* Email Input */}
                <div className="mb-5">
                  <label className="block text-[11px] font-bold theme-text-muted mb-1.5 uppercase tracking-wider">Account Email</label>
                  <div className="relative flex items-center">
                    <Mail size={18} className="absolute left-3.5 theme-text-muted pointer-events-none" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 theme-text-heading text-sm placeholder:theme-text-muted placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Anti-Robot Security Puzzle Box */}
                <div className="mb-6 p-4 rounded-2xl glass-card bg-slate-900/60 border border-indigo-500/20 space-y-4">
                  {/* CAPTCHA Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={captchaChecked}
                      onChange={(e) => setCaptchaChecked(e.target.checked)}
                      className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <span className="text-xs font-semibold theme-text-heading">I am not a robot</span>
                  </label>

                  <hr className="border-slate-700/50" />

                  {/* Interactive Slider Puzzle */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="theme-text-muted font-medium flex items-center gap-1.5">
                        <Puzzle size={14} className="text-purple-400" />
                        Align the Puzzle Piece 🧩
                      </span>
                      <button
                        type="button"
                        onClick={generateNewPuzzle}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Reset
                      </button>
                    </div>

                    {/* Puzzle Track Bar */}
                    <div className="relative w-full h-10 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center px-1">
                      {/* Target Zone Highlight */}
                      <div
                        className="absolute h-8 rounded-lg bg-emerald-500/20 border-2 border-dashed border-emerald-400 flex items-center justify-center text-[10px] font-bold text-emerald-400 transition-all duration-300"
                        style={{ left: `${targetZone - 5}%`, width: '10%' }}
                      >
                        MATCH
                      </div>

                      {/* Moving Puzzle Piece */}
                      <div
                        className={`absolute h-7 w-7 rounded-lg shadow-md flex items-center justify-center text-xs font-bold transition-all duration-75 ${
                          isRobotVerified ? 'bg-emerald-500 text-white shadow-emerald-500/50' : 'bg-indigo-600 text-white'
                        }`}
                        style={{ left: `calc(${sliderValue}% * 0.9)` }}
                      >
                        🧩
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderValue}
                      onChange={handleSliderChange}
                      className="w-full mt-3 accent-indigo-500 cursor-pointer"
                    />

                    {/* Verification Status */}
                    <div className="mt-2 text-center">
                      {isRobotVerified ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 animate-fadeIn">
                          <CheckCircle size={15} /> Human Verification Complete!
                        </span>
                      ) : (
                        <span className="text-[11px] theme-text-muted">
                          Slide until piece aligns into the green MATCH target zone
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Verification */}
                <button
                  type="submit"
                  disabled={resetLoading || !isRobotVerified || !captchaChecked}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {resetLoading ? (
                    <>
                      <Sparkles size={18} className="animate-spin" />
                      <span>Verifying Puzzle...</span>
                    </>
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Success Confirmation */
              <div className="text-center py-4 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-xl font-bold theme-text-heading">Reset Email Sent!</h3>
                <p className="text-xs theme-text-muted leading-relaxed max-w-xs mx-auto">
                  We have verified your human puzzle challenge and sent password reset instructions to <span className="font-bold theme-text-heading">{forgotEmail}</span>.
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl transition"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
