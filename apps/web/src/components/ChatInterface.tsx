import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, Code2, Terminal } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Welcome to **JINXUNLASHED**. I am your async creative-AI orchestrator. How can I assist your workflow today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const replyMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: `Processing request: "${input}". Triggering background execution thread...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg, replyMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 glass-panel flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600/20 text-brand-500 rounded-lg border border-brand-500/30">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 text-sm tracking-wide">Model Conversation Workspace</h2>
            <p className="text-xs text-slate-400">Connected to Fastify Agent Gateway (WebSocket Active)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Streaming Ready
          </span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`p-2 rounded-lg text-slate-200 shrink-0 ${
                msg.sender === 'user' ? 'bg-brand-600' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`p-4 rounded-xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-brand-600/20 border border-brand-500/30 text-slate-100'
                  : 'glass-panel text-slate-200'
              }`}
            >
              <p>{msg.text}</p>
              <span className="block mt-2 text-[10px] text-slate-400">{msg.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800 glass-panel">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your instruction or type '/' for workflow slash commands..."
            className="w-full pl-4 pr-12 py-3 bg-dark-800 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
