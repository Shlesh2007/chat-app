import React, { useRef, useEffect } from 'react';
import { FileText, Image, FileCode, Table, X } from 'lucide-react';

const MENU_ITEMS = [
  {
    icon: <Image size={18} className="text-blue-400" />,
    label: 'Upload Image',
    desc: 'Analyze or describe an image',
    accept: 'image/*',
    type: 'image',
  },
  {
    icon: <FileText size={18} className="text-red-400" />,
    label: 'Upload PDF',
    desc: 'Read and ask questions about a PDF',
    accept: '.pdf',
    type: 'doc',
  },
  {
    icon: <Table size={18} className="text-green-400" />,
    label: 'Upload Spreadsheet',
    desc: 'Analyze Excel or CSV data',
    accept: '.xls,.xlsx,.csv',
    type: 'doc',
  },
  {
    icon: <FileText size={18} className="text-yellow-400" />,
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
      className="absolute bottom-full left-0 mb-2 w-72 bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-sm font-semibold text-white">Add attachment</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      {/* Menu items */}
      <div className="py-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition text-left"
          >
            <div className="w-9 h-9 bg-gray-700 rounded-xl flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-gray-400 truncate">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
