import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';

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
        // Only show "starting up" message after 2 failed attempts (~8s)
        // so a normal fast load never shows it
        if (attempts >= 2) setWaking(true);
        if (attempts < maxAttempts) {
          setTimeout(ping, 3000);
        } else {
          // Give up waiting — show the app anyway
          setReady(true);
        }
      }
    };

    ping();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div
          className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-2"
          style={{ animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
        >
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <rect x="8" y="11" width="16" height="13" rx="3" fill="white"/>
            <circle cx="12.5" cy="16" r="2" fill="#16a34a"/>
            <circle cx="19.5" cy="16" r="2" fill="#16a34a"/>
            <rect x="11" y="20" width="10" height="2" rx="1" fill="#16a34a"/>
            <rect x="15" y="6" width="2" height="5" rx="1" fill="white"/>
            <circle cx="16" cy="5.5" r="1.5" fill="white"/>
          </svg>
        </div>

        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <p className="text-white font-semibold text-lg">Chat-App</p>
        {waking && (
          <p className="text-gray-400 text-sm text-center max-w-xs px-4">
            Starting up the server, please wait a moment...
          </p>
        )}
      </div>
    );
  }

  return children;
}
