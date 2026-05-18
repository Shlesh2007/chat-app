import React, { useState, useEffect } from 'react';
import {
  Users, MessageSquare, BarChart2, Shield, Trash2,
  Unlock, Lock, LogOut, RefreshCw, Key, X,
  ChevronRight, ChevronLeft, Bot, User
} from 'lucide-react';
import { backendUrl } from '../lib/utils.js';

const ADMIN_KEY = 'admin_token';

function adminFetch(path, options = {}) {
  const token = localStorage.getItem(ADMIN_KEY);
  return fetch(backendUrl(`/api/admin${path}`), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

// ── Login ─────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await fetch(backendUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; });
      localStorage.setItem(ADMIN_KEY, data.token);
      onLogin();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Restricted access</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// ── Password modal ────────────────────────────────────────────────────────────
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
      onSuccess(`Password updated for ${user.username}`);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">Reset Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-400 mb-4">Set new password for <span className="text-white font-medium">{user.username}</span></p>
        {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500" autoFocus />
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm py-2.5 rounded-lg transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User detail — conversations + messages ────────────────────────────────────
function UserDetail({ user, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    adminFetch(`/users/${user.id}/conversations`)
      .then((d) => setConversations(d.conversations))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, [user.id]);

  const loadMessages = async (conv) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    try {
      const d = await adminFetch(`/conversations/${conv.id}/messages`);
      setMessages(d.messages);
    } catch {}
    finally { setLoadingMsgs(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
        <ChevronLeft size={18} /> Back to users
      </button>

      <div className="flex items-center gap-3 mb-6">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
            {user.username?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-white">{user.username}</h2>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversations list */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-white text-sm">Conversations ({conversations.length})</h3>
          </div>
          {loadingConvs ? (
            <div className="p-4 text-gray-400 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">No conversations</div>
          ) : (
            <div className="overflow-y-auto max-h-96">
              {conversations.map((c) => (
                <button key={c.id} onClick={() => loadMessages(c)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700 transition flex items-center justify-between ${selectedConv?.id === c.id ? 'bg-gray-700' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{fmt(c.updated_at)}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="md:col-span-2 bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-white text-sm">
              {selectedConv ? `Messages — ${selectedConv.title}` : 'Select a conversation'}
            </h3>
          </div>
          <div className="overflow-y-auto max-h-96 p-4 space-y-3">
            {loadingMsgs ? (
              <div className="text-gray-400 text-sm">Loading messages...</div>
            ) : !selectedConv ? (
              <div className="text-gray-500 text-sm">Click a conversation to view messages</div>
            ) : messages.length === 0 ? (
              <div className="text-gray-500 text-sm">No messages</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}`}>
                    {m.role === 'user' ? <User size={13} className="text-white" /> : <Bot size={13} className="text-white" />}
                  </div>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className="text-xs opacity-60 mt-1">{fmt(m.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [pwdUser, setPwdUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([adminFetch('/stats'), adminFetch('/users')]);
      setStats(s);
      setUsers(u.users);
    } catch (err) {
      if (err.message.includes('Unauthorized') || err.message.includes('Invalid')) onLogout();
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleBlock = async (id, blocked) => {
    await adminFetch(`/users/${id}/${blocked ? 'unblock' : 'block'}`, { method: 'PATCH' });
    notify(blocked ? 'User unblocked' : 'User blocked');
    load();
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Delete user "${username}" and all their data?`)) return;
    await adminFetch(`/users/${id}`, { method: 'DELETE' });
    notify('User deleted');
    load();
  };

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm px-3 py-2 rounded-lg hover:bg-gray-700 transition">
            <LogOut size={15} /> Logout
          </button>
        </div>
        <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {pwdUser && (
        <PasswordModal user={pwdUser} onClose={() => setPwdUser(null)}
          onSuccess={(m) => { notify(m); setPwdUser(null); }} />
      )}

      <div className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition">
            <RefreshCw size={16} />
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm px-3 py-2 rounded-lg hover:bg-gray-700 transition">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {msg && <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm px-4 py-2 rounded-lg">{msg}</div>}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users size={22} className="text-white" />} label="Total Users" value={stats.totalUsers} color="bg-blue-600" />
            <StatCard icon={<MessageSquare size={22} className="text-white" />} label="Conversations" value={stats.totalConversations} color="bg-green-600" />
            <StatCard icon={<BarChart2 size={22} className="text-white" />} label="Messages" value={stats.totalMessages} color="bg-purple-600" />
            <StatCard icon={<Lock size={22} className="text-white" />} label="Blocked" value={stats.blockedUsers} color="bg-red-600" />
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-white">All Users ({users.length})</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 w-64" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                    <th className="text-left px-5 py-3">User</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Email</th>
                    <th className="text-left px-5 py-3 hidden lg:table-cell">Joined</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                      <td className="px-5 py-3">
                        <button onClick={() => setSelectedUser(u)} className="flex items-center gap-2 hover:text-green-400 transition">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-white">{u.username}</span>
                          <ChevronRight size={13} className="text-gray-500" />
                        </button>
                      </td>
                      <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{u.email}</td>
                      <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">{fmt(u.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.is_blocked ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-green-900/50 text-green-400 border border-green-800'
                        }`}>
                          {u.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setPwdUser(u)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-900/30 transition" title="Reset password">
                            <Key size={15} />
                          </button>
                          <button onClick={() => handleBlock(u.id, u.is_blocked)}
                            className={`p-1.5 rounded-lg transition ${u.is_blocked ? 'text-green-400 hover:bg-green-900/30' : 'text-yellow-400 hover:bg-yellow-900/30'}`}
                            title={u.is_blocked ? 'Unblock' : 'Block'}>
                            {u.is_blocked ? <Unlock size={15} /> : <Lock size={15} />}
                          </button>
                          <button onClick={() => handleDelete(u.id, u.username)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition" title="Delete user">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false); // always start logged out

  // Clear admin token on every page load — always require fresh login
  useEffect(() => {
    localStorage.removeItem(ADMIN_KEY);
  }, []);

  const handleLogout = () => { localStorage.removeItem(ADMIN_KEY); setLoggedIn(false); };
  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
