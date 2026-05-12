import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore.js';
import { Send, Square, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import api from '../lib/api.js';
import AttachMenu from './AttachMenu.jsx';
import { assetUrl } from '../lib/utils.js';

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
    ta.style.height = '24px'; // reset to single line height
    const newHeight = Math.min(ta.scrollHeight, 180);
    ta.style.height = newHeight + 'px';
    ta.style.overflowY = newHeight >= 180 ? 'auto' : 'hidden';
  }, [input]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachedImage && !attachedDoc) || isStreaming) return;

    // What the AI receives (full content)
    let aiContent = trimmed;

    // What shows in the chat bubble (clean, no raw file dump)
    let displayContent = trimmed;

    if (attachedDoc) {
      const truncated = attachedDoc.text.slice(0, 8000);
      aiContent = `I have uploaded a file called "${attachedDoc.name}". Here is its content:\n\n${truncated}\n\n---\n\nMy question: ${trimmed || 'Please summarize this.'}`;
      displayContent = `📎 ${attachedDoc.name}${trimmed ? '\n' + trimmed : ''}`;
      setAttachedDoc(null);
    }

    if (attachedImage) {
      aiContent = `[IMAGE ATTACHED: ${attachedImage.name}]\nData: ${attachedImage.base64}\n\n${trimmed || 'Please describe and analyze this image.'}`;
      displayContent = `🖼️ ${attachedImage.name}${trimmed ? '\n' + trimmed : ''}`;
      setAttachedImage(null);
    }

    setInput('');
    try {
      await sendMessage(aiContent, displayContent);
    } catch (err) {
      console.error('Send error:', err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Called when user picks an item from the attach menu
  const handleMenuSelect = (item) => {
    setShowMenu(false);
    setFileAccept(item.accept);
    setFileType(item.type);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setLoadingAttach(true);

    try {
      if (fileType === 'image') {
        // Read image as base64 for AI vision
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result; // data:image/...;base64,...
          const previewUrl = reader.result;
          setAttachedImage({ name: file.name, previewUrl, base64 });
          setLoadingAttach(false);
        };
        reader.readAsDataURL(file);
      } else {
        // Upload doc and extract text
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const textRes = await api.get(`/upload/${data.document.id}/text`);
        setAttachedDoc({ name: file.name, text: textRes.data.text });
        setLoadingAttach(false);
      }
    } catch (err) {
      alert('Failed to read file: ' + (err.response?.data?.error || err.message));
      setLoadingAttach(false);
    }
  };

  const canSend = (input.trim() || attachedDoc || attachedImage) && !isStreaming;

  return (
    <div className="border-t border-gray-700 bg-gray-900 px-4 py-4">
      <div className="max-w-3xl mx-auto">

        {/* Attached doc pill */}
        {attachedDoc && (
          <div className="flex items-center gap-2 mb-2 bg-blue-900/30 border border-blue-700 rounded-lg px-3 py-2">
            <Paperclip size={14} className="text-blue-400 shrink-0" />
            <span className="text-sm text-blue-300 flex-1 truncate">{attachedDoc.name}</span>
            <span className="text-xs text-gray-400">{(attachedDoc.text.length / 1000).toFixed(1)}k chars</span>
            <button onClick={() => setAttachedDoc(null)} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Attached image preview */}
        {attachedImage && (
          <div className="flex items-center gap-3 mb-2 bg-purple-900/20 border border-purple-700 rounded-lg px-3 py-2">
            <img src={attachedImage.previewUrl} alt="preview" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            <span className="text-sm text-purple-300 flex-1 truncate">{attachedImage.name}</span>
            <button onClick={() => setAttachedImage(null)} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loadingAttach && (
          <div className="mb-2 text-xs text-gray-400 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Reading file...
          </div>
        )}

        {/* Input row */}
        <div className="relative flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-2xl px-3 py-2.5 focus-within:border-gray-500 transition min-h-[48px]">

          {/* Attach menu trigger */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu((v) => !v)}
              disabled={isStreaming || loadingAttach}
              className="text-gray-400 hover:text-white transition disabled:opacity-40 p-1"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>

            {showMenu && (
              <AttachMenu
                onSelect={handleMenuSelect}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            className="hidden"
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedDoc
                ? `Ask anything about "${attachedDoc.name}"...`
                : attachedImage
                ? 'Ask about this image...'
                : 'Message... (Shift+Enter for new line)'
            }
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-5 max-h-48 disabled:opacity-50 py-1 self-center"
            style={{ overflowY: 'hidden' }}
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition ${
              canSend
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isStreaming ? <Square size={15} /> : <Send size={15} />}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-2">
          Built by Shlesh Darji · LJ University · Powered by Groq
        </p>
      </div>
    </div>
  );
}
