import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, BarChart2, Shield, Trash2, Unlock, Lock, LogOut, RefreshCw } from 'lucide-react';
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

// ── Login screen ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await fetch(backendUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      });
      localStorage.setItem(ADMIN_KEY, data.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

// ── Main dashboard ────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([adminFetch('/stats'), adminFetch('/users')]);
      setStats(s);
      setUsers(u.users);
    } catch (err) {
      if (err.message.includes('Unauthorized') || err.message.includes('Invalid')) onLogout();
    } finally {
      setLoading(false);
    }
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

  const fmt = (d) => d ? new Date(d).toLocaleString() : 'Never';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
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
        {/* Notification */}
        {msg && <div className="bg-green-900/40 border border-green-700 text-green-300 text-sm px-4 py-2 rounded-lg">{msg}</div>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users size={22} className="text-white" />} label="Total Users" value={stats.totalUsers} color="bg-blue-600" />
            <StatCard icon={<MessageSquare size={22} className="text-white" />} label="Conversations" value={stats.totalConversations} color="bg-green-600" />
            <StatCard icon={<BarChart2 size={22} className="text-white" />} label="Messages" value={stats.totalMessages} color="bg-purple-600" />
            <StatCard icon={<Lock size={22} className="text-white" />} label="Blocked" value={stats.blockedUsers} color="bg-red-600" />
          </div>
        )}

        {/* Users table */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-white">All Users ({users.length})</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 w-64"
            />
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
                    <th className="text-left px-5 py-3 hidden lg:table-cell">Last Seen</th>
                    <th className="text-left px-5 py-3 hidden lg:table-cell">Joined</th>
                    <th className="text-left px-5 py-3">Chats</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-white">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{u.email}</td>
                      <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">{fmt(u.last_seen)}</td>
                      <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">{fmt(u.created_at)}</td>
                      <td className="px-5 py-3 text-gray-300">{u.conversation_count ?? 0}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.is_blocked ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-green-900/50 text-green-400 border border-green-800'
                        }`}>
                          {u.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleBlock(u.id, u.is_blocked)}
                            className={`p-1.5 rounded-lg transition ${u.is_blocked ? 'text-green-400 hover:bg-green-900/30' : 'text-yellow-400 hover:bg-yellow-900/30'}`}
                            title={u.is_blocked ? 'Unblock' : 'Block'}
                          >
                            {u.is_blocked ? <Unlock size={15} /> : <Lock size={15} />}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">No users found</td></tr>
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem(ADMIN_KEY));

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setLoggedIn(false);
  };

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
