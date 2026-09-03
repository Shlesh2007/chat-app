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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-grid-pattern relative overflow-hidden select-none">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Icon */}
      <div className="relative mb-6 group cursor-pointer" onClick={onNewChat}>
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-md group-hover:opacity-100 transition duration-500 animate-pulseGlow" />
        <div className="relative w-20 h-20 glass-card rounded-3xl flex items-center justify-center shadow-2xl">
          <Bot size={42} className="text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-center mb-3 tracking-tight animate-slideUp theme-text-heading">
        Meet Your <span className="gradient-text">AI Assistant</span>
      </h1>
      <p className="theme-text-muted text-sm sm:text-base text-center max-w-md mb-8 animate-slideUp" style={{ animationDelay: '50ms' }}>
        Built by <span className="font-semibold theme-text-heading">Shlesh Darji</span> · LJ University · Supercharged by <span className="text-indigo-400 font-semibold">Groq</span>
      </p>

      {/* Feature Capabilities */}
      <div className="flex flex-wrap justify-center gap-2.5 mb-10 max-w-xl animate-slideUp" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-xs font-medium theme-text-muted shadow-md">
          <Zap size={14} className="text-amber-400" />
          <span>Real-time Ultra Streaming</span>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-xs font-medium theme-text-muted shadow-md">
          <FileText size={14} className="text-indigo-400" />
          <span>PDF, Code & Excel Analysis</span>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-xs font-medium theme-text-muted shadow-md">
          <Image size={14} className="text-purple-400" />
          <span>Text-to-Image Generation</span>
        </div>
      </div>

      {/* Suggestion Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl px-2">
        {suggestions.map((item, idx) => (
          <button
            key={item.title}
            onClick={onNewChat}
            className="group text-left glass-card glass-card-hover rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between"
            style={{ animation: `slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + idx * 0.05}s both` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{item.icon}</span>
              <ArrowRight size={14} className="theme-text-muted group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <p className="text-xs font-semibold theme-text-heading group-hover:text-indigo-400 transition-colors mb-1">
                {item.title}
              </p>
              <p className="text-[12px] theme-text-muted line-clamp-2 leading-relaxed">
                "{item.prompt}"
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
