import React, { useState, useEffect } from 'react';
import { ShieldOff, Send, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { backendUrl } from '../lib/utils.js';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'shleshdarji317@gmail.com';

export default function BlockedPage({ reason, onUnblocked }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appealStatus, setAppealStatus] = useState(null); // pending/accepted/rejected

  // Check appeal status on load
  useEffect(() => {
    if (!user?.id) return;
    fetch(backendUrl(`/api/feedback/status/${user.id}`))
      .then(r => r.json())
      .then(d => {
        if (d.status && d.status !== 'none') {
          setAppealStatus(d);
          if (d.status === 'pending') setSubmitted(true);
          if (d.status === 'accepted') onUnblocked?.();
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(backendUrl('/api/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      setAppealStatus({ status: 'pending' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600/20 border-2 border-red-600 rounded-2xl flex items-center justify-center mb-4">
            <ShieldOff size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Account Blocked</h1>
          <p className="text-gray-400 text-sm mt-1 text-center">Your account has been suspended by the admin</p>
        </div>

        {/* Reason */}
        {reason && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-red-400 font-medium uppercase mb-1">Reason</p>
            <p className="text-red-200 text-sm">{reason}</p>
          </div>
        )}

        {/* Appeal status */}
        {appealStatus?.status === 'rejected' && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 mb-6 flex gap-3">
            <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-medium">Appeal Rejected</p>
              <p className="text-red-400 text-xs mt-1">{appealStatus.admin_reply || 'Your appeal was reviewed and rejected.'}</p>
            </div>
          </div>
        )}

        {appealStatus?.status === 'pending' || submitted ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl px-4 py-4 flex gap-3">
            <Clock size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 text-sm font-medium">Appeal Under Review</p>
              <p className="text-yellow-400 text-xs mt-1">Your appeal has been submitted. The admin will review it and you'll be notified of the decision.</p>
            </div>
          </div>
        ) : (
          /* Appeal form */
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-1">Submit an Appeal</h2>
            <p className="text-gray-400 text-sm mb-4">Explain why you think this block should be removed. The admin will review your appeal.</p>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your appeal here... (e.g. I believe this block was a mistake because...)"
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
              >
                <Send size={16} />
                {loading ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </form>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full mt-4 text-gray-500 hover:text-gray-300 text-sm py-2 transition"
        >
          Sign out
        </button>

        {/* Emergency admin access — only visible to admin email */}
        {user?.email === ADMIN_EMAIL && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full mt-2 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 text-sm py-2 transition"
          >
            <Shield size={14} />
            Open Admin Panel
          </button>
        )}
      </div>
    </div>
  );
}
