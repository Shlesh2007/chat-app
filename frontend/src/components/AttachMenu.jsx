import React, { useRef, useEffect } from 'react';
import { FileText, Image, FileCode, Table, X } from 'lucide-react';

const MENU_ITEMS = [
  {
    icon: <Image size={18} className="text-indigo-400" />,
    label: 'Upload Image',
    desc: 'Analyze or describe an image',
    accept: 'image/*',
    type: 'image',
  },
  {
    icon: <FileText size={18} className="text-rose-400" />,
    label: 'Upload PDF',
    desc: 'Read and ask questions about a PDF',
    accept: '.pdf',
    type: 'doc',
  },
  {
    icon: <Table size={18} className="text-emerald-400" />,
    label: 'Upload Spreadsheet',
    desc: 'Analyze Excel or CSV data',
    accept: '.xls,.xlsx,.csv',
    type: 'doc',
  },
  {
    icon: <FileText size={18} className="text-amber-400" />,
    label: 'Upload Word Doc',
    desc: 'Read a Word document',
    accept: '.doc,.docx',
    type: 'doc',
  },
  {
    icon: <FileCode size={18} className="text-purple-400" />,
    label: 'Upload Code / Text',
    desc: 'JS, TS, Python, JSON, TXT, MD...',
    accept: '.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.php,.rb,.html,.css,.json,.xml,.yaml,.yml,.sql,.txt,.md,.sh,.bat',
    type: 'doc',
  },
];

export default function AttachMenu({ onSelect, onClose }) {
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 w-72 glass-card rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-opacity-20">
        <span className="text-xs font-bold uppercase tracking-wider theme-text-heading">Add attachment</span>
        <button onClick={onClose} className="theme-text-muted hover:theme-text-heading transition">
          <X size={16} />
        </button>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelect(item.accept, item.type)}
            className="w-full flex items-center gap-3 px-4 py-2.5 glass-card-hover transition text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900/40 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold theme-text-heading">{item.label}</p>
              <p className="text-[11px] theme-text-muted truncate">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
