import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore.js';
import { Send, Paperclip, X, Image as ImageIcon, Sparkles, FileText } from 'lucide-react';
import AttachMenu from './AttachMenu.jsx';

export default function ChatInput({ inputRef: externalRef }) {
  const [input, setInput] = useState('');
  const [attachedDoc, setAttachedDoc] = useState(null);   // { name, text } for docs
  const [attachedImage, setAttachedImage] = useState(null); // { name, previewUrl, base64 }
  const [loadingAttach, setLoadingAttach] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { sendMessage, isStreaming } = useChatStore();
  const internalRef = useRef(null);
  const textareaRef = externalRef || internalRef;
  const fileInputRef = useRef(null);
  const [fileAccept, setFileAccept] = useState('*');
  const [fileType, setFileType] = useState('doc');

  // Auto-focus
  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => { if (!isStreaming) textareaRef.current?.focus(); }, [isStreaming]);

  // Auto-resize textarea — starts at 1 line, grows as needed
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '24px';
    const newHeight = Math.min(ta.scrollHeight, 180);
    ta.style.height = newHeight + 'px';
    ta.style.overflowY = newHeight >= 180 ? 'auto' : 'hidden';
  }, [input]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachedImage && !attachedDoc) || isStreaming) return;

    let aiContent = trimmed;
    let displayContent = trimmed;

    if (attachedDoc) {
      const truncated = attachedDoc.text.slice(0, 8000);
      aiContent = `I have uploaded a file called "${attachedDoc.name}". Here is its content:\n\n${truncated}\n\n---\n\nMy question: ${trimmed || 'Please summarize this.'}`;
      displayContent = `📎 ${attachedDoc.name}${trimmed ? '\n' + trimmed : ''}`;
      setAttachedDoc(null);
    }

    if (attachedImage) {
      aiContent = `User Request: ${trimmed || 'Please describe and analyze this image.'}\n\n[Attached Image: ${attachedImage.name}]`;
      displayContent = `🖼️ ${attachedImage.name}${trimmed ? '\n' + trimmed : ''}`;
      setAttachedImage(null);
    }

    setInput('');
    try {
      await sendMessage(aiContent, displayContent);
    } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAttach(true);

    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAttachedImage({
          name: file.name,
          previewUrl: URL.createObjectURL(file),
          base64: evt.target.result,
        });
        setLoadingAttach(false);
      };
      reader.readAsDataURL(file);
    } else {
      const formData = new FormData();
      formData.append('file', file);
      import('../lib/api.js').then(({ default: api }) => {
        api.post('/upload/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then(({ data }) => {
            setAttachedDoc({ name: data.originalName, text: data.text });
          })
          .catch((err) => {
            alert(err.response?.data?.error || 'File upload failed');
          })
          .finally(() => setLoadingAttach(false));
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openPicker = (accept, type) => {
    setFileAccept(accept);
    setFileType(type);
    setShowMenu(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  return (
    <div className="p-3 sm:p-4 max-w-4xl w-full mx-auto select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept={fileAccept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main Floating Glass Input Box */}
      <div className="relative glass-input rounded-2xl p-2 sm:p-2.5 transition-all duration-300 shadow-2xl">
        {/* Attachment Previews */}
        {(attachedDoc || attachedImage || loadingAttach) && (
          <div className="flex flex-wrap gap-2 p-2 mb-2 border-b border-slate-800">
            {loadingAttach && (
              <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs text-indigo-300 animate-pulse">
                <Sparkles size={14} className="animate-spin" />
                Processing file...
              </div>
            )}
            {attachedDoc && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 shadow-md">
                <FileText size={14} className="text-indigo-400" />
                <span className="max-w-xs truncate font-medium">{attachedDoc.name}</span>
                <button onClick={() => setAttachedDoc(null)} className="text-slate-400 hover:text-rose-400 p-0.5 transition">
                  <X size={13} />
                </button>
              </div>
            )}
            {attachedImage && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-2 py-1 rounded-xl text-xs text-slate-200 shadow-md">
                <img src={attachedImage.previewUrl} alt="preview" className="w-6 h-6 rounded-lg object-cover" />
                <span className="max-w-xs truncate font-medium">{attachedImage.name}</span>
                <button onClick={() => setAttachedImage(null)} className="text-slate-400 hover:text-rose-400 p-0.5 transition">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Bar Row */}
        <div className="flex items-end gap-2 px-1">
          {/* Paperclip / Attach menu trigger */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 rounded-xl transition duration-200 shrink-0"
              title="Attach document or image"
            >
              <Paperclip size={19} />
            </button>
            {showMenu && (
              <AttachMenu
                onSelect={(accept, type) => openPicker(accept, type)}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything, generate images, analyze files..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent theme-text-heading placeholder-opacity-60 text-sm focus:outline-none resize-none py-1.5 px-1 leading-relaxed max-h-44 scrollbar-thin"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !attachedImage && !attachedDoc) || isStreaming}
            className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 shadow-lg ${
              input.trim() || attachedImage || attachedDoc
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-105'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <Send size={17} className={isStreaming ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
