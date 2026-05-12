import React from 'react';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Bot, Code, Image, FileText, Lightbulb, Globe } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: <Lightbulb size={16} className="text-yellow-400" />,
    label: 'Explain a concept',
    prompt: 'Explain how neural networks work in simple terms',
  },
  {
    icon: <Code size={16} className="text-blue-400" />,
    label: 'Write code',
    prompt: 'Write a Python function to find duplicates in a list',
  },
  {
    icon: <Image size={16} className="text-purple-400" />,
    label: 'Generate an image',
    prompt: 'Generate an image of a futuristic city at sunset',
  },
  {
    icon: <FileText size={16} className="text-green-400" />,
    label: 'Summarize text',
    prompt: 'Summarize the key points of the attached document',
  },
  {
    icon: <Globe size={16} className="text-cyan-400" />,
    label: 'Translate',
    prompt: 'Translate "Hello, how are you?" into French, Spanish, and Japanese',
  },
  {
    icon: <Code size={16} className="text-orange-400" />,
    label: 'Debug code',
    prompt: 'Help me debug this error: TypeError: Cannot read properties of undefined',
  },
];

export default function NewChatSuggestions() {
  const { sendMessage } = useChatStore();
  const { user } = useAuthStore();

  const handleSuggestion = async (prompt) => {
    try {
      await sendMessage(prompt);
    } catch (err) {
      console.error(err);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
      {/* Avatar + greeting */}
      <div
        className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
        style={{ animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        <Bot size={30} className="text-white" />
      </div>

      <h2
        className="text-2xl font-bold text-white mb-1"
        style={{ animation: 'slideUp 0.4s ease 0.1s both' }}
      >
        {greeting()}{user?.username ? `, ${user.username}` : ''}!
      </h2>
      <p
        className="text-gray-400 text-sm mb-8"
        style={{ animation: 'slideUp 0.4s ease 0.15s both' }}
      >
        What can I help you with today?
      </p>

      {/* Suggestion grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.prompt}
            onClick={() => handleSuggestion(s.prompt)}
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-3 text-left transition-all duration-200 group"
            style={{ animation: `slideUp 0.35s ease ${0.2 + i * 0.05}s both` }}
          >
            <div className="w-8 h-8 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center shrink-0 transition-colors">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-sm text-gray-200 truncate">{s.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
