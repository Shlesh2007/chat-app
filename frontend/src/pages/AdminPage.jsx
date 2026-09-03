// Admin Panel v2 — Pure Theme Adaptation
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageSquare, Shield, Trash2,
  ShieldOff, ShieldCheck, LogOut, RefreshCw, Key, X,
  ChevronRight, Bot, User, CheckCircle, XCircle, Zap, ArrowLeft
} from 'lucide-react';
import { backendUrl } from '../lib/utils.js';

const assetUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
  return `${BACKEND}${path}`;
};

const ADMIN_KEY = 'admin_token';

function adminFetch(path, options = {}) {
  const token = localStorage.getItem(ADMIN_KEY);
  return fetch(backendUrl(`/api/admin${path}`), {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  }).then(async (r) => {
    const text = await r.text();
    if (!text) throw new Error('Server returned empty response. It may be starting up, please try again.');
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Invalid server response. Please try again.'); }
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

const parseUTC = (d) => {
  if (!d) return null;
  const s = d.toString().endsWith('Z') ? d : d + 'Z';
  return new Date(s);
};

const fmt = (d) => {
  const dt = parseUTC(d);
  if (!dt) return 'Never';
  return dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await fetch(backendUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }).then(async (r) => {
        const text = await r.text();
        if (!text) throw new Error('Server is starting up, please wait 15 seconds and try again.');
        let d;
        try { d = JSON.parse(text); } catch { throw new Error('Invalid server response. Please try again.'); }
        if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
        return d;
      });
      localStorage.setItem(ADMIN_KEY, data.token);
      onLogin();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen theme-app-bg bg-grid-pattern flex items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Background glow orb */}
      <div className="absolute w-96 h-96 bg-rose-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-slideUp">
        {/* Navigation back to main site */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 theme-text-muted hover:theme-text-heading text-xs font-semibold px-3.5 py-2 rounded-xl glass-card transition"
        >
          <ArrowLeft size={14} /> Back to Main Chat
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-500 opacity-75 blur-md animate-pulseGlow" />
            <div className="relative w-14 h-14 glass-card rounded-2xl flex items-center justify-center shadow-xl">
              <Shield size={28} className="text-rose-400" />
            </div>
          </div>
          <h1 className="text-2xl font-heading font-extrabold theme-text-heading">Admin Dashboard</h1>
          <p className="theme-text-muted text-xs mt-1">Restricted Administrative Controls</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 space-y-4 shadow-2xl">
          {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl font-medium">{error}</div>}
          
          <div>
            <label className="block text-xs font-semibold theme-text-muted mb-1.5 uppercase tracking-wider">Admin Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full glass-input rounded-xl px-4 py-2.5 theme-text-heading text-sm focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-muted mb-1.5 uppercase tracking-wider">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full glass-input rounded-xl px-4 py-2.5 theme-text-heading text-sm focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-lg text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign in as Admin'}
          </button>

          {/* Default Credentials Hint Box */}
          <div className="pt-2 border-t border-opacity-20 text-center">
            <p className="text-[11px] theme-text-muted">
              🔑 <span className="font-semibold theme-text-heading">Default Credentials:</span><br />
              Username: <code className="text-indigo-400 font-mono">admin</code> | Password: <code className="text-indigo-400 font-mono">admin123</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-lg">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold font-heading theme-text-heading">{value ?? '—'}</p>
        <p className="text-xs theme-text-muted font-medium">{label}</p>
      </div>
    </div>
  );
}

function BlockModal({ user, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await adminFetch(`/users/${user.id}/block`, { method: 'PATCH', body: JSON.stringify({ reason }) });
      onSuccess(`${user.username} has been blocked`); onClose();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold theme-text-heading">Block User</h3>
          <button onClick={onClose} className="theme-text-muted hover:theme-text-heading"><X size={18} /></button>
        </div>
        <p className="text-xs theme-text-muted mb-4">Block <span className="theme-text-heading font-semibold">{user.username}</span>? They will see the reason.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for blocking..." rows={3} autoFocus
            className="w-full glass-input rounded-xl px-4 py-2.5 theme-text-heading text-sm focus:outline-none focus:border-rose-500 resize-none" />
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-md">
              {loading ? 'Blocking...' : 'Block User'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 glass-card text-xs py-2.5 rounded-xl transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordModal({ user, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Min 6 characters'); return; }
    setLoading(true); setError('');
    try {
      await adminFetch(`/users/${user.id}/password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) });
      onSuccess(`Password updated for ${user.username}`); onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold theme-text-heading">Reset Password</h3>
          <button onClick={onClose} className="theme-text-muted hover:theme-text-heading"><X size={18} /></button>
        </div>
        <p className="text-xs theme-text-muted mb-4">New password for <span className="theme-text-heading font-medium">{user.username}</span></p>
        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 chars)" autoFocus
            className="w-full glass-input rounded-xl px-4 py-2.5 theme-text-heading text-sm focus:outline-none focus:border-indigo-500" />
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-md">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 glass-card text-xs py-2.5 rounded-xl transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreditsModal({ user, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = parseInt(amount, 10);
    if (!n || n < 1 || n > 10000) { setError('Enter a number between 1 and 10000'); return; }
    setLoading(true); setError('');
    try {
      const data = await adminFetch(`/users/${user.id}/credits`, { method: 'PATCH', body: JSON.stringify({ credits: n }) });
      onSuccess(`Added ${n} credits to ${user.username} (now ${data.credits})`);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-card rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold theme-text-heading flex items-center gap-2"><Zap size={16} className="text-amber-400" /> Add Credits</h3>
          <button onClick={onClose} className="theme-text-muted hover:theme-text-heading"><X size={18} /></button>
        </div>
        <p className="text-xs theme-text-muted mb-1">Add credits to <span className="theme-text-heading font-medium">{user.username}</span></p>
        <p className="text-xs theme-text-muted mb-4">Current balance: <span className="text-amber-400 font-semibold">⚡ {user.credits ?? 0}</span></p>
        {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="Credits to add (e.g. 100)" min="1" max="10000" autoFocus
            className="w-full glass-input rounded-xl px-4 py-2.5 theme-text-heading text-sm focus:outline-none focus:border-amber-500" />
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-md">
              {loading ? 'Adding...' : 'Add Credits'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 glass-card text-xs py-2.5 rounded-xl transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserDetail({ user, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [spamLogs, setSpamLogs] = useState([]);
  const [detailTab, setDetailTab] = useState('conversations');

  useEffect(() => {
    adminFetch(`/users/${user.id}/conversations`)
      .then(d => { setConversations(Array.isArray(d?.conversations) ? d.conversations : []); setLoadingConvs(false); })
      .catch(() => { setConversations([]); setLoadingConvs(false); });

    adminFetch(`/users/${user.id}/spam-logs`)
      .then(d => setSpamLogs(Array.isArray(d?.spamLogs) ? d.spamLogs : Array.isArray(d?.logs) ? d.logs : []))
      .catch(() => setSpamLogs([]));
  }, [user.id]);

  const loadMessages = (conv) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    adminFetch(`/conversations/${conv.id}/messages`)
      .then(d => { setMessages(Array.isArray(d?.messages) ? d.messages : []); setLoadingMsgs(false); })
      .catch(() => { setMessages([]); setLoadingMsgs(false); });
  };

  const safeConvs = Array.isArray(conversations) ? conversations : [];
  const safeLogs = Array.isArray(spamLogs) ? spamLogs : [];
  const safeMsgs = Array.isArray(messages) ? messages : [];

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* User Header Card */}
      <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl glass-card glass-card-hover theme-text-muted hover:theme-text-heading transition" title="Back to user list">
            <ArrowLeft size={18} />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold theme-text-heading">{user.username}</h2>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${user.is_blocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                {user.is_blocked ? 'Blocked' : 'Active'}
              </span>
            </div>
            <p className="text-xs theme-text-muted">{user.email} · Joined {fmt(user.created_at)}</p>
          </div>
        </div>

        {/* Tab selector inside user details */}
        <div className="flex gap-2">
          <button onClick={() => setDetailTab('conversations')} className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${detailTab === 'conversations' ? 'bg-indigo-600 text-white shadow-md' : 'glass-card theme-text-muted hover:theme-text-heading'}`}>
            Chats ({safeConvs.length})
          </button>
          <button onClick={() => setDetailTab('spam')} className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${detailTab === 'spam' ? 'bg-rose-600 text-white shadow-md' : 'glass-card theme-text-muted hover:theme-text-heading'}`}>
            Spam Logs ({safeLogs.length})
          </button>
        </div>
      </div>

      {detailTab === 'spam' && (
        <div className="glass-card rounded-3xl p-6 shadow-xl">
          <h3 className="font-semibold theme-text-heading text-sm mb-4">Spam Violation Logs</h3>
          {safeLogs.length === 0 ? (
            <p className="theme-text-muted text-xs">No spam violations logged for this user.</p>
          ) : (
            <div className="space-y-3">
              {safeLogs.map((log) => (
                <div key={log.id} className="glass-card rounded-xl p-3.5 text-xs space-y-1">
                  <div className="flex justify-between theme-text-muted">
                    <span>{fmt(log.created_at)}</span>
                  </div>
                  <p className="theme-text-heading font-mono glass-input p-2 rounded-lg">
                    "{log.message}"
                  </p>
                  <p className="text-amber-400 text-xs">
                    🤖 Reason: <span className="theme-text-muted">{log.reason}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {detailTab === 'conversations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-3xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-opacity-20">
              <h3 className="font-semibold theme-text-heading text-xs uppercase tracking-wider">Conversations ({safeConvs.length})</h3>
            </div>
            {loadingConvs ? <div className="p-4 theme-text-muted text-xs">Loading...</div>
              : safeConvs.length === 0 ? <div className="p-4 theme-text-muted text-xs">No conversations</div>
              : (
                <div className="overflow-y-auto max-h-96">
                  {safeConvs.map((c) => (
                    <button key={c.id} onClick={() => loadMessages(c)}
                      className={`w-full text-left px-4 py-3 border-b border-opacity-10 hover:glass-card-hover transition flex items-center justify-between ${selectedConv?.id === c.id ? 'bg-indigo-600/20 theme-text-heading font-bold' : 'theme-text-muted'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{c.title}</p>
                        <p className="text-[11px] theme-text-muted opacity-70">{fmt(c.updated_at)}</p>
                      </div>
                      <ChevronRight size={14} className="theme-text-muted shrink-0" />
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div className="md:col-span-2 glass-card rounded-3xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-opacity-20">
              <h3 className="font-semibold theme-text-heading text-xs uppercase tracking-wider">{selectedConv ? `Messages — ${selectedConv.title}` : 'Select a conversation'}</h3>
            </div>
            <div className="overflow-y-auto max-h-96 p-4 space-y-3">
              {loadingMsgs ? <div className="theme-text-muted text-xs">Loading...</div>
                : !selectedConv ? <div className="theme-text-muted text-xs">Click a conversation on the left to view messages</div>
                : safeMsgs.length === 0 ? <div className="theme-text-muted text-xs">No messages found</div>
                : safeMsgs.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${m.role === 'user' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                      {m.role === 'user' ? <User size={13} className="text-white" /> : <Bot size={13} className="text-white" />}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs ${m.role === 'user' ? 'theme-user-bubble' : 'theme-bot-bubble'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="text-[10px] opacity-60 mt-1">{fmt(m.created_at)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [pwdUser, setPwdUser] = useState(null);
  const [blockUser, setBlockUser] = useState(null);
  const [creditsUser, setCreditsUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, f] = await Promise.all([adminFetch('/stats'), adminFetch('/users'), adminFetch('/feedbacks')]);
      setStats(s); setUsers(u.users); setFeedbacks(f.feedbacks);
    } catch (err) {
      if (err.message.includes('Unauthorized') || err.message.includes('Invalid')) onLogout();
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleBlock = async (id, isBlocked) => {
    const blocked = Boolean(isBlocked);
    if (!blocked) {
      setBlockUser(users.find(u => u.id === id));
    } else {
      try {
        await adminFetch(`/users/${id}/unblock`, { method: 'PATCH' });
        notify('User unblocked');
        setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: 0, spam_count: 0 } : u));
        setStats(prev => prev ? { ...prev, blockedUsers: Math.max(0, Number(prev.blockedUsers) - 1) } : prev);
      } catch (err) {
        notify('Failed to unblock: ' + err.message);
      }
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    await adminFetch(`/users/${id}`, { method: 'DELETE' });
    notify('User deleted');
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen theme-app-bg bg-grid-pattern text-slate-100 select-none">
      {pwdUser && <PasswordModal user={pwdUser} onClose={() => setPwdUser(null)} onSuccess={(m) => { notify(m); setPwdUser(null); }} />}
      {creditsUser && (
        <CreditsModal user={creditsUser} onClose={() => setCreditsUser(null)}
          onSuccess={(m) => {
            notify(m);
            load();
            setCreditsUser(null);
          }} />
      )}
      {blockUser && (
        <BlockModal user={blockUser} onClose={() => setBlockUser(null)}
          onSuccess={(m) => {
            notify(m);
            setUsers(prev => prev.map(u => u.id === blockUser.id ? { ...u, is_blocked: 1 } : u));
            setStats(prev => prev ? { ...prev, blockedUsers: Number(prev.blockedUsers) + 1 } : prev);
            setBlockUser(null);
          }} />
      )}

      {/* ADMIN NAVIGATION HEADER */}
      <header className="border-b theme-sidebar-bg backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold theme-text-muted hover:theme-text-heading px-3 py-1.5 rounded-xl glass-card transition"
            title="Return to Main App"
          >
            <ArrowLeft size={14} /> Main App
          </button>

          <div className="h-5 w-[1px] bg-slate-500/20 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-heading font-extrabold text-sm sm:text-base theme-text-heading">Admin Portal</span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button onClick={load} className="theme-text-muted hover:theme-text-heading p-2 rounded-xl glass-card transition" title="Refresh Dashboard">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 theme-text-muted hover:text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-xl glass-card transition">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* MAIN ADMIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {msg && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-medium px-4 py-2.5 rounded-2xl animate-fadeIn">
            {msg}
          </div>
        )}

        {selectedUser ? (
          <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
        ) : (
          <>
            {/* Overview Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <StatCard icon={<Users size={20} className="text-indigo-400" />} label="Total Registered Users" value={stats.totalUsers} color="bg-indigo-500/15 border border-indigo-500/30" />
                <StatCard icon={<MessageSquare size={20} className="text-purple-400" />} label="Total Conversations" value={stats.totalConversations} color="bg-purple-500/15 border border-purple-500/30" />
                <StatCard icon={<Zap size={20} className="text-amber-400" />} label="Total AI Prompts Sent" value={stats.totalMessages} color="bg-amber-500/15 border border-amber-500/30" />
                <StatCard icon={<ShieldOff size={20} className="text-rose-400" />} label="Blocked Users" value={stats.blockedUsers} color="bg-rose-500/15 border border-rose-500/30" />
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-opacity-20 pt-2">
              <button
                onClick={() => setTab('users')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl transition-all ${
                  tab === 'users'
                    ? 'glass-card theme-text-heading border-b-0 shadow-md'
                    : 'theme-text-muted hover:theme-text-heading'
                }`}
              >
                Users Directory ({users.length})
              </button>
              <button
                onClick={() => setTab('feedbacks')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-2xl transition-all flex items-center gap-2 ${
                  tab === 'feedbacks'
                    ? 'glass-card text-rose-400 border-b-0 shadow-md'
                    : 'theme-text-muted hover:theme-text-heading'
                }`}
              >
                <span>Appeals</span>
                {feedbacks.filter((f) => f.status === 'pending').length > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-extrabold">
                    {feedbacks.filter((f) => f.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>

            {/* Users Tab */}
            {tab === 'users' && (
              <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-5 py-4 border-b border-opacity-20 flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="font-heading font-bold text-sm theme-text-heading">Registered Users</h2>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by username or email..."
                    className="glass-input rounded-xl px-3.5 py-1.5 text-xs theme-text-heading placeholder-opacity-60 outline-none focus:border-indigo-500 w-64"
                  />
                </div>

                {loading ? (
                  <div className="p-8 text-center text-xs theme-text-muted">Loading user database...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="theme-sidebar-bg theme-text-muted uppercase font-semibold border-b border-opacity-20">
                        <tr>
                          <th className="px-5 py-3">User</th>
                          <th className="px-5 py-3 hidden lg:table-cell">Joined</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 hidden md:table-cell">Credits</th>
                          <th className="px-5 py-3 hidden md:table-cell">Spam Strikes</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-500/10">
                        {filtered.map((u) => (
                          <tr key={u.id} className="hover:glass-card-hover transition">
                            <td className="px-5 py-3 cursor-pointer" onClick={() => setSelectedUser(u)}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                                  {u.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-semibold theme-text-heading hover:text-indigo-400 transition">{u.username}</p>
                                  <p className="text-[11px] theme-text-muted">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 theme-text-muted hidden lg:table-cell">{fmt(u.created_at)}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${u.is_blocked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                                {u.is_blocked ? 'Blocked' : 'Active'}
                              </span>
                            </td>
                            <td className="px-5 py-3 hidden md:table-cell">
                              <span className="font-semibold text-amber-400">⚡ {u.credits ?? 0}</span>
                            </td>
                            <td className="px-5 py-3 hidden md:table-cell">
                              {Number(u.spam_count) > 0 ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  Number(u.spam_count) >= 2
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                }`}>
                                  ⚠️ {u.spam_count} strike{Number(u.spam_count) !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="theme-text-muted opacity-50">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => setPwdUser(u)} className="p-1.5 rounded-lg text-indigo-400 hover:glass-card transition" title="Reset password"><Key size={14} /></button>
                                <button onClick={() => setCreditsUser(u)} className="p-1.5 rounded-lg text-amber-400 hover:glass-card transition" title="Add credits"><Zap size={14} /></button>
                                <button onClick={() => handleBlock(u.id, u.is_blocked)}
                                  className={`p-1.5 rounded-lg transition ${u.is_blocked ? 'text-rose-400 hover:text-emerald-400 hover:glass-card' : 'theme-text-muted hover:text-rose-400 hover:glass-card'}`}
                                  title={u.is_blocked ? 'Click to unblock' : 'Click to block'}>
                                  {u.is_blocked ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                                </button>
                                <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 rounded-lg text-rose-400 hover:glass-card transition" title="Delete user"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 theme-text-muted">No matching users found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Appeals Tab */}
            {tab === 'feedbacks' && (
              <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-5 py-4 border-b border-opacity-20">
                  <h2 className="font-heading font-bold text-sm theme-text-heading">User Appeals ({feedbacks.length})</h2>
                </div>
                {feedbacks.length === 0 ? (
                  <div className="text-center py-10 theme-text-muted text-xs">No appeals submitted yet</div>
                ) : (
                  <div className="divide-y divide-slate-500/10">
                    {feedbacks.map((f) => (
                      <div key={f.id} className="p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold theme-text-heading">{f.username}</span>
                              <span className="text-xs theme-text-muted">{f.email}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                f.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                                f.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                                'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>{f.status}</span>
                            </div>
                            <p className="theme-text-heading text-xs glass-card rounded-xl px-3.5 py-2.5 mt-2 leading-relaxed">{f.message}</p>
                            {f.admin_reply && <p className="theme-text-muted text-xs mt-2 italic">Admin reply: {f.admin_reply}</p>}
                          </div>
                          {f.status === 'pending' && (
                            <div className="flex gap-2 shrink-0">
                              <button onClick={async () => {
                                const reply = prompt('Message to user:', 'Your appeal has been accepted. You have been unblocked.');
                                if (reply === null) return;
                                await adminFetch(`/feedbacks/${f.id}/accept`, { method: 'PATCH', body: JSON.stringify({ reply }) });
                                notify(`${f.username} unblocked`);
                                setUsers(prev => prev.map(u => u.id === f.user_id ? { ...u, is_blocked: 0, spam_count: 0 } : u));
                                load();
                              }} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-md">
                                <CheckCircle size={14} /> Accept
                              </button>
                              <button onClick={async () => {
                                const reply = prompt('Message to user:', 'Your appeal has been reviewed and rejected. You remain blocked.');
                                if (reply === null) return;
                                await adminFetch(`/feedbacks/${f.id}/reject`, { method: 'PATCH', body: JSON.stringify({ reply }) });
                                notify(`${f.username}'s appeal rejected`);
                                load();
                              }} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-md">
                                <XCircle size={14} /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    localStorage.removeItem(ADMIN_KEY);
  }, []);

  const handleLogout = () => { localStorage.removeItem(ADMIN_KEY); setLoggedIn(false); };
  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
