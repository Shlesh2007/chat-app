import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, Download, Loader, Sparkles, Image as ImageIcon } from 'lucide-react';
import api from '../lib/api.js';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition opacity-0 group-hover:opacity-100 backdrop-blur-md border border-slate-700/50"
      title="Copy code"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

// Renders [GENERATE_IMAGE: prompt] or 🎨 Generated Image tags as actual image generation cards
function ImageBlock({ prompt }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const generate = async (currentRetry = 0) => {
    setLoading(true);
    setError('');
    setImageUrl(null);
    try {
      const { data } = await api.post('/image/generate', { prompt, retry: currentRetry });
      setImageUrl(data.url);
    } catch (err) {
      setError('Image server timeout. Click below to retry.');
    } finally {
      setLoading(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!imageUrl || downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanFileName = prompt.slice(0, 25).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'ai_image';
      link.download = `${cleanFileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handleRetry = () => {
    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);
    generate(nextRetry);
  };

  // Auto-generate on mount
  React.useEffect(() => { generate(0); }, []);

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950/80 shadow-xl shadow-indigo-950/30">
      <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-b border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-purple-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-xs font-semibold text-purple-200">AI Generated Image</span>
        </div>
        <span className="text-[11px] text-slate-400 truncate max-w-xs italic">{prompt}</span>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <ImageIcon size={18} className="absolute inset-0 m-auto text-indigo-400" />
          </div>
          <span className="text-xs font-medium text-slate-300">
            {retryCount > 0 ? 'Rendering fast retry preview...' : 'Rendering visual preview...'}
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 flex flex-col items-center gap-3 text-center bg-rose-950/20 border-t border-rose-950/30">
          <p className="text-rose-300 text-xs font-medium">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-all duration-200"
          >
            <Sparkles size={13} />
            <span>Retry Image Generation</span>
          </button>
        </div>
      )}

      {imageUrl && !loading && !error && (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full max-h-96 object-contain bg-slate-950"
            onError={() => setError('Image link timed out from server.')}
          />
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="absolute bottom-3 right-3 bg-slate-900/90 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold shadow-lg backdrop-blur-md border border-slate-700"
            title="Download image to local computer"
          >
            {downloading ? (
              <>
                <Loader size={14} className="animate-spin text-indigo-300" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Save Image</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Strip thinking tags <think>...</think> produced by Reasoning models like DeepSeek/Qwen
function cleanThinkingContent(raw) {
  if (!raw) return '';
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');
  return cleaned.trim();
}

// Parse message content — split out [GENERATE_IMAGE: ...] or 🎨 Generated Image blocks
function parseContent(rawContent) {
  const content = cleanThinkingContent(rawContent);
  let cleanStr = content.replace(/Failed to load image[\s\S]*/gi, '');
  cleanStr = cleanStr.replace(/\[Save\]\(https:\/\/image\.pollinations\.ai\/.*?\)/gi, '');

  const parts = [];
  const regex = /(?:\[GENERATE_IMAGE:\s*(.*?)\]|🎨\s*Generated Image:?\s*([^\n]+))/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleanStr)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: cleanStr.slice(lastIndex, match.index) });
    }
    const promptText = (match[1] || match[2] || '').trim();
    if (promptText) {
      parts.push({ type: 'image', prompt: promptText });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleanStr.length) {
    parts.push({ type: 'text', content: cleanStr.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: cleanStr }];
}

const markdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    if (!inline && match) {
      return (
        <div className="relative group my-3.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-indigo-400 font-mono uppercase tracking-wider">{match[1]}</span>
          </div>
          <CopyButton text={codeString} />
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, padding: '1rem', fontSize: '0.85rem', background: 'transparent' }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <code className="bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-md text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const parts = parseContent(message.content);

  return (
    <div className={`flex gap-3.5 group ${isUser ? 'flex-row-reverse' : ''} animate-fadeIn`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-md ${
        isUser
          ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
          : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 text-indigo-400'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Bubble Container */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`relative max-w-[88%] sm:max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${
          isUser
            ? 'theme-user-bubble rounded-tr-xs font-normal'
            : 'theme-bot-bubble rounded-tl-xs shadow-md backdrop-blur-md'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose-chat text-sm">
              {parts.map((part, i) =>
                part.type === 'image' ? (
                  <ImageBlock key={i} prompt={part.prompt} />
                ) : (
                  <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {part.content}
                  </ReactMarkdown>
                )
              )}
            </div>
          )}
        </div>

        {/* Copy + Timestamp Footer */}
        <div className={`flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isUser ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => { navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-slate-500 hover:text-slate-300 p-0.5 transition"
            title="Copy message"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <span className="text-[11px] text-slate-500 font-medium">
            {(() => {
              const s = message.created_at?.toString().endsWith('Z') ? message.created_at : message.created_at + 'Z';
              return new Date(s).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}
