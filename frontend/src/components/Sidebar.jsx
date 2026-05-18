import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Plus, MessageSquare, Trash2, Edit2, Check, X,
  LogOut, Bot, Upload, ChevronLeft, Menu, UserCircle, Zap
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
      // reset count if no tap within 2 seconds
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
    <div id="sidebar" className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={handleLogoTap} style={{ cursor: 'default' }}>
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <span className="font-semibold text-white">Chat-App</span>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-gray-400 hover:text-white p-1 rounded">
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Actions */}
      <div className="p-3 flex gap-2">
        <button
          onClick={handleNewChat}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
        >
          <Plus size={16} /> New Chat
        </button>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center justify-center p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition"
          title="Upload documents"
        >
          <Upload size={16} />
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-8 px-4">No conversations yet. Start a new chat!</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelect(conv.id)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition ${
                  activeConversationId === conv.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
                }`}
              >
                <MessageSquare size={15} className="shrink-0 text-gray-400" />
                {editingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(e)}
                      className="flex-1 bg-gray-600 text-white text-sm px-2 py-0.5 rounded outline-none"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-400"><Check size={14} /></button>
                    <button onClick={cancelEdit} className="text-gray-400"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm truncate">{conv.title}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button onClick={(e) => startEdit(e, conv)} className="text-gray-400 hover:text-white p-0.5 rounded">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={(e) => handleDelete(e, conv.id)} className="text-gray-400 hover:text-red-400 p-0.5 rounded">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credits bar */}
      <div className="px-3 py-2 border-t border-gray-700">
        <button
          onClick={() => setShowBuyCredits(true)}
          className="w-full flex items-center justify-between bg-gray-700/60 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 transition group"
        >
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-xs text-gray-300">
              <span className="font-semibold text-white">{user?.credits ?? 0}</span> credits
            </span>
          </div>
          <span className="text-xs text-green-400 font-medium group-hover:text-green-300">+ Buy</span>
        </button>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-gray-700 flex items-center gap-3">
        <button onClick={() => { navigate('/profile'); setOpen(false); }} className="shrink-0 hover:opacity-80 transition">
          {user?.avatar ? (
            <img src={assetUrl(user.avatar)} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-600" />
          ) : (
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user?.username}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <button onClick={() => { navigate('/profile'); setOpen(false); }} className="text-gray-400 hover:text-white p-1 rounded transition">
          <UserCircle size={16} />
        </button>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-1 rounded transition">
          <LogOut size={16} />
        </button>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile: hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 w-9 h-9 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:text-white shadow-lg"
      >
        <Menu size={18} />
      </button>

      {/* Mobile: overlay + drawer */}
      {open && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 flex animate-slideRight">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
