import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore.js';
import MessageBubble from './MessageBubble.jsx';
import NewChatSuggestions from './NewChatSuggestions.jsx';
import { Bot, Sparkles } from 'lucide-react';

export default function ChatWindow() {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Clean streaming content from <think> tags during live stream
  const cleanStreaming = streamingContent
    ? streamingContent.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*/gi, '').trim()
    : '';

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-2">
      <div className="max-w-3xl mx-auto px-2 sm:px-4 pt-16 sm:pt-8 pb-6">

        {/* Suggestions when chat is empty */}
        {messages.length === 0 && !isStreaming && (
          <NewChatSuggestions />
        )}

        {/* Message History */}
        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <MessageBubble message={msg} />
            </div>
          ))}
        </div>

        {/* Live Streaming Indicator */}
        {isStreaming && (
          <div className="flex gap-3.5 mt-6 animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-md">
              <Bot size={16} className="text-indigo-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 theme-bot-bubble rounded-2xl rounded-tl-xs px-4 py-3 shadow-lg backdrop-blur-md">
              <div className="prose-chat text-sm">
                {cleanStreaming ? (
                  <span className="typing-cursor theme-text-heading">{cleanStreaming}</span>
                ) : (
                  <span className="flex gap-1.5 items-center h-5 text-indigo-400">
                    <Sparkles size={14} className="animate-spin" />
                    <span className="text-xs theme-text-muted font-medium">Thinking & generating response...</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
