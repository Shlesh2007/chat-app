import React from 'react';
import { Bot, Zap, Image, FileText } from 'lucide-react';

const suggestions = [
  'Explain quantum computing in simple terms',
  'Write a Python function to sort a list of dictionaries',
  'What are the best practices for REST API design?',
  'Generate an image of a futuristic city at night',
];

export default function WelcomeScreen({ onNewChat }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div
        className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
        style={{ animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        <Bot size={36} className="text-white" />
      </div>

      <h1
        className="text-3xl font-bold text-white mb-2"
        style={{ animation: 'slideUp 0.4s ease 0.1s both' }}
      >
        Welcome to Chat-App
      </h1>
      <p
        className="text-gray-400 mb-10 text-center max-w-md"
        style={{ animation: 'slideUp 0.4s ease 0.15s both' }}
      >
        Built by Shlesh Darji · LJ University · Powered by Groq
      </p>

      {/* Feature pills */}
      <div
        className="flex flex-wrap justify-center gap-3 mb-10"
        style={{ animation: 'slideUp 0.4s ease 0.2s both' }}
      >
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-300">
          <Zap size={14} className="text-yellow-400" />
          Streaming responses
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-300">
          <FileText size={14} className="text-blue-400" />
          Read PDF, Word, Excel & code
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-300">
          <Image size={14} className="text-purple-400" />
          Generate images
        </div>
      </div>

      {/* Suggestion prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((s, i) => (
          <button
            key={s}
            onClick={onNewChat}
            className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-3 text-sm text-gray-300 hover:text-white transition-all duration-200"
            style={{ animation: `slideUp 0.35s ease ${0.25 + i * 0.05}s both` }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
