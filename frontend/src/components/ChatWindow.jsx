import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore.js';
import MessageBubble from './MessageBubble.jsx';
import NewChatSuggestions from './NewChatSuggestions.jsx';
import { Bot } from 'lucide-react';

export default function ChatWindow() {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Show suggestions when no messages yet */}
        {messages.length === 0 && !isStreaming && (
          <NewChatSuggestions />
        )}

        {/* Messages */}
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

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex gap-4 mt-6 animate-fadeIn">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0 mt-1">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="prose-chat text-sm">
                {streamingContent ? (
                  <span className="typing-cursor">{streamingContent}</span>
                ) : (
                  <span className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
