import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Plus, MessageSquare, Trash2, Edit2, Check, X,
  LogOut, Bot, Upload, ChevronLeft, Menu, UserCircle, Zap, Sparkles
} from 'lucide-react';
import UploadModal from './UploadModal.jsx';
import { assetUrl } from '../lib/utils.js';

export default function Sidebar({ onNewChat }) {
  const navigate = useNavigate();
  const { conversations, activeConversationId, loadConversation, deleteConversation, renameConversation, setShowBuyCredits } = useChatStore();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false); // mobile drawer open
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef(null);

  // Close sidebar on mobile when navigating
  const handleSelect = (id) => {
    loadConversation(id);
    navigate(`/chat/${id}`);
    setOpen(false);
  };

  const handleNewChat = async () => {
    await onNewChat();
    setOpen(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
      if (activeConversationId === id) navigate('/');
    }
  };

  const startEdit = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveEdit = async (e) => {
    e.stopPropagation();
    if (editTitle.trim()) await renameConversation(editingId, editTitle.trim());
    setEditingId(null);
  };

  const cancelEdit = (e) => { e.stopPropagation(); setEditingId(null); };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleLogoTap = () => {
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      navigate('/admin');
      setOpen(false);
    } else {
      logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 2000);
    }
  };

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest('#sidebar')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const sidebarContent = (
    <div id="sidebar" className="w-72 theme-sidebar-bg backdrop-blur-xl border-r flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-4 border-b border-opacity-20 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogoTap}>
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <Bot size={20} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold theme-text-heading text-base tracking-wide">Chat-App</span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">Pro</span>
            </div>
            <p className="text-[11px] theme-text-muted truncate">Powered by Groq & AI</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition">
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 flex gap-2">
        <button
          onClick={handleNewChat}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold py-2.5 px-3 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New Chat</span>
        </button>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-white rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all duration-200"
          title="Upload documents"
        >
          <Upload size={18} />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Sparkles size={24} className="mx-auto text-indigo-400/50 mb-2 animate-bounce" />
            <p className="text-slate-400 text-xs font-medium">No chats yet.</p>
            <p className="text-slate-500 text-[11px] mt-1">Start a conversation above!</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">Recent Chats</p>
            {conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-md shadow-indigo-950/50'
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white border border-transparent'
                  }`}
                >
                  <MessageSquare size={16} className={`shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {editingId === conv.id ? (
                    <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(e)}
                        className="flex-1 bg-slate-900 text-white text-xs px-2 py-1 rounded-md border border-indigo-500 outline-none"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300 p-0.5"><Check size={14} /></button>
                      <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-200 p-0.5"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-xs font-medium truncate">{conv.title}</span>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button onClick={(e) => startEdit(e, conv)} className="text-slate-400 hover:text-indigo-300 p-1 hover:bg-slate-800 rounded-md transition">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={(e) => handleDelete(e, conv.id)} className="text-slate-400 hover:text-rose-400 p-1 hover:bg-slate-800 rounded-md transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Credits Bar */}
      <div className="px-3 py-2.5 border-t border-slate-800/80">
        <button
          onClick={() => setShowBuyCredits(true)}
          className="w-full flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-amber-500/30 hover:border-amber-500/60 rounded-xl px-3 py-2 transition-all duration-300 group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap size={14} className="text-amber-400 fill-amber-400/30 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs text-slate-300 font-medium">
              <span className="font-bold text-white text-sm">{user?.credits ?? 0}</span> credits
            </span>
          </div>
          <span className="text-xs text-amber-400 font-bold tracking-wide group-hover:text-amber-300 flex items-center gap-0.5">
            + Top Up
          </span>
        </button>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center gap-3 bg-slate-950/60">
        <button onClick={() => { navigate('/profile'); setOpen(false); }} className="shrink-0 hover:scale-105 transition-transform">
          {user?.avatar ? (
            <img src={assetUrl(user.avatar)} alt="avatar" className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-md" />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
        </div>
        <button onClick={() => { navigate('/profile'); setOpen(false); }} className="text-slate-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-slate-800/60 transition" title="Profile Settings">
          <UserCircle size={17} />
        </button>
        <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition" title="Log Out">
          <LogOut size={17} />
        </button>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl flex items-center justify-center text-slate-300 hover:text-white shadow-xl shadow-black/40"
      >
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 flex animate-slideRight">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
