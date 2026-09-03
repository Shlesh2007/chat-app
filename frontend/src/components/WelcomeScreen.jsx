import React from 'react';
import { Bot, Zap, Image, FileText, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const suggestions = [
  { icon: '💡', title: 'Quantum Computing', prompt: 'Explain quantum computing in simple terms' },
  { icon: '💻', title: 'Python Sorting', prompt: 'Write a Python function to sort a list of dictionaries' },
  { icon: '⚡', title: 'REST API Design', prompt: 'What are the best practices for modern REST API design?' },
  { icon: '🎨', title: 'AI Image Prompt', prompt: 'Generate an image of a futuristic cyberpunk city at night' },
];

export default function WelcomeScreen({ onNewChat }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-10 bg-grid-pattern relative overflow-y-auto select-none">
      {/* Background Ambient Glow Orbs — Hidden on small mobile screens to optimize GPU performance */}
      <div className="hidden sm:block absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Icon */}
      <div className="relative mb-4 sm:mb-5 group cursor-pointer" onClick={onNewChat}>
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-md group-hover:opacity-100 transition duration-500 animate-pulseGlow" />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 glass-card rounded-3xl flex items-center justify-center shadow-2xl">
          <Bot size={36} className="text-indigo-400 sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-extrabold text-center mb-2 sm:mb-3 tracking-tight animate-slideUp theme-text-heading">
        Meet Your <span className="gradient-text">AI Assistant</span>
      </h1>
      <p className="theme-text-muted text-xs sm:text-base text-center max-w-md mb-6 sm:mb-8 animate-slideUp px-2" style={{ animationDelay: '50ms' }}>
        Built by <span className="font-semibold theme-text-heading">Shlesh Darji</span> · LJ University · Supercharged by <span className="text-indigo-400 font-semibold">Groq</span>
      </p>

      {/* Feature Capabilities Pill Cluster */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 max-w-lg animate-slideUp px-2" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-1.5 glass-card rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium theme-text-muted shadow-sm">
          <Zap size={13} className="text-amber-400 shrink-0" />
          <span>Real-time Ultra Streaming</span>
        </div>
        <div className="flex items-center gap-1.5 glass-card rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium theme-text-muted shadow-sm">
          <FileText size={13} className="text-indigo-400 shrink-0" />
          <span>PDF, Code & Excel Analysis</span>
        </div>
        <div className="flex items-center gap-1.5 glass-card rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs font-medium theme-text-muted shadow-sm">
          <Image size={13} className="text-purple-400 shrink-0" />
          <span>Text-to-Image Generation</span>
        </div>
      </div>

      {/* Strict 2x2 Grid Format (4 Cards Total) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-2xl px-1">
        {suggestions.map((item, idx) => (
          <button
            key={item.title}
            onClick={onNewChat}
            className="group text-left glass-card glass-card-hover rounded-2xl p-3 sm:p-4 transition-all duration-200 flex flex-col justify-between h-full min-h-[90px] sm:min-h-[100px] shadow-sm border border-opacity-20 active:scale-[0.98]"
            style={{ animation: `slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + idx * 0.03}s both` }}
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-sm sm:text-lg">{item.icon}</span>
              <ArrowRight size={14} className="theme-text-muted group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[11px] sm:text-xs font-bold theme-text-heading group-hover:text-indigo-400 transition-colors mb-0.5 truncate">
                {item.title}
              </p>
              <p className="text-[10px] sm:text-[11px] theme-text-muted line-clamp-2 leading-snug">
                "{item.prompt}"
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
