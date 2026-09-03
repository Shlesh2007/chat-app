import React from 'react';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';
import { Bot, Code, Image, FileText, Lightbulb, ArrowRight } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: <Lightbulb size={16} className="text-amber-400" />,
    label: 'Explain a concept',
    prompt: 'Explain how neural networks work in simple terms',
  },
  {
    icon: <Code size={16} className="text-indigo-400" />,
    label: 'Write code',
    prompt: 'Write a Python function to find duplicates in a list',
  },
  {
    icon: <Image size={16} className="text-purple-400" />,
    label: 'Generate an image',
    prompt: 'Generate an image of a futuristic city at sunset',
  },
  {
    icon: <FileText size={16} className="text-emerald-400" />,
    label: 'Summarize text',
    prompt: 'Summarize the key points of the attached document',
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
    <div className="flex flex-col items-center justify-center py-6 sm:py-8 animate-fadeIn select-none">
      {/* Avatar + greeting */}
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20"
        style={{ animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        <Bot size={26} className="text-white sm:w-7 sm:h-7" />
      </div>

      <h2
        className="text-xl sm:text-2xl font-heading font-extrabold theme-text-heading mb-1 text-center"
        style={{ animation: 'slideUp 0.4s ease 0.1s both' }}
      >
        {greeting()}{user?.username ? `, ${user.username}` : ''}!
      </h2>
      <p
        className="theme-text-muted text-xs sm:text-sm mb-6 text-center"
        style={{ animation: 'slideUp 0.4s ease 0.15s both' }}
      >
        What can I help you with today?
      </p>

      {/* Strict 2x2 Grid Format (4 Cards Total) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-2xl px-1">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.prompt}
            onClick={() => handleSuggestion(s.prompt)}
            className="flex items-center gap-2.5 sm:gap-3 glass-card glass-card-hover rounded-2xl p-3 sm:p-3.5 text-left transition-all duration-200 group border border-opacity-20 shadow-xs h-full"
            style={{ animation: `slideUp 0.35s ease ${0.2 + i * 0.05}s both` }}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900/40 flex items-center justify-center shrink-0 border border-slate-700/30">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] theme-text-muted font-bold uppercase tracking-wider mb-0.5 truncate">{s.label}</p>
              <p className="text-[11px] sm:text-xs font-medium theme-text-heading truncate">{s.prompt}</p>
            </div>
            <ArrowRight size={14} className="theme-text-muted group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
          </button>
        ))}
      </div>
    </div>
  );
}
