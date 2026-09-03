import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { Bot } from 'lucide-react';

export default function BackendWakeup({ children }) {
  const [ready, setReady] = useState(false);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    let cancelled = false;

    const ping = async () => {
      if (cancelled) return;
      try {
        await api.get('/health', { timeout: 4000 });
        if (!cancelled) setReady(true);
      } catch {
        if (cancelled) return;
        attempts++;
        if (attempts >= 2) setWaking(true);
        if (attempts < maxAttempts) {
          setTimeout(ping, 3000);
        } else {
          setReady(true);
        }
      }
    };

    ping();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0b0f19] bg-grid-pattern flex flex-col items-center justify-center gap-4 select-none relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute w-80 h-80 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

        {/* Brand Icon */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-md animate-pulseGlow" />
          <div className="relative w-16 h-16 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
            <Bot size={34} className="text-indigo-400" />
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-2">
          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <p className="text-white font-heading font-extrabold text-xl tracking-tight">Chat-App</p>
        {waking && (
          <p className="text-slate-400 text-xs text-center max-w-xs px-4 animate-fadeIn">
            Waking up server instance, please wait a moment...
          </p>
        )}
      </div>
    );
  }

  return children;
}
