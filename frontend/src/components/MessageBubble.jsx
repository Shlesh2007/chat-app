import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, Download, Loader } from 'lucide-react';
import api from '../lib/api.js';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition opacity-0 group-hover:opacity-100"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

// Renders [GENERATE_IMAGE: prompt] tags as actual images
function ImageBlock({ prompt }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/image/generate', { prompt });
      setImageUrl(data.url);
    } catch (err) {
      setError('Image generation failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount
  React.useEffect(() => { generate(); }, []);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-gray-600 bg-gray-800">
      <div className="px-3 py-2 bg-gray-700 flex items-center justify-between">
        <span className="text-xs text-purple-300 font-medium">🎨 Generated Image</span>
        <span className="text-xs text-gray-400 truncate max-w-xs">{prompt}</span>
      </div>
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm">Generating image...</span>
        </div>
      )}
      {error && (
        <div className="p-4 text-red-400 text-sm text-center">{error}</div>
      )}
      {imageUrl && !loading && (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full max-h-96 object-contain bg-gray-900"
            onError={() => setError('Failed to load image')}
          />
          <a
            href={imageUrl}
            download="generated-image.jpg"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-2 right-2 bg-gray-800/80 hover:bg-gray-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-xs"
          >
            <Download size={14} /> Save
          </a>
        </div>
      )}
    </div>
  );
}

// Parse message content — split out [GENERATE_IMAGE: ...] blocks
function parseContent(content) {
  const parts = [];
  const regex = /\[GENERATE_IMAGE:\s*(.*?)\]/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'image', prompt: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
}

const markdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    if (!inline && match) {
      return (
        <div className="relative group my-3">
          <div className="flex items-center justify-between bg-gray-700 px-4 py-1.5 rounded-t-lg">
            <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
          </div>
          <CopyButton text={codeString} />
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', fontSize: '0.85rem' }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <code className="bg-gray-700 text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
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
    <div className={`flex gap-4 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-blue-600' : 'bg-green-600'}`}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`relative max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
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

        {/* Copy + timestamp */}
        <div className={`flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition ${isUser ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => { navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-gray-500 hover:text-gray-300 transition"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <span className="text-xs text-gray-500">
            {new Date(message.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
