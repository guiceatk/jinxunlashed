import React, { useState } from 'react';
import { MessageSquare, GitBranch, Globe, Sparkles, Settings, Terminal } from 'lucide-react';
import { ChatInterface } from './components/ChatInterface';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { BrowserPanel } from './components/BrowserPanel';

type ActiveTab = 'chat' | 'workflow' | 'browser';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workflow');

  return (
    <div className="flex h-screen w-screen bg-dark-900 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-16 bg-dark-900 border-r border-slate-800/80 flex flex-col items-center py-5 space-y-6">
        <div className="p-2.5 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30 text-white font-bold text-lg tracking-wider">
          JX
        </div>

        <nav className="flex-1 flex flex-col space-y-3">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`p-3 rounded-xl transition-all ${
              activeTab === 'workflow'
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Make.com Workflow Builder"
          >
            <GitBranch size={20} />
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`p-3 rounded-xl transition-all ${
              activeTab === 'chat'
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Model Conversation Workspace"
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`p-3 rounded-xl transition-all ${
              activeTab === 'browser'
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Async Browser Viewport"
          >
            <Globe size={20} />
          </button>
        </nav>

        <div className="flex flex-col space-y-3">
          <button className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-all">
            <Settings size={20} />
          </button>
        </div>
      </aside>

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="h-14 border-b border-slate-800/80 glass-panel px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-slate-100 text-sm tracking-wide">JINXUNLASHED</h1>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-slate-400 font-medium">Async Creative-AI OS & Workflow Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-dark-800 border border-slate-700/60 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-mono">Fastify Gateway: Connected</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-5 overflow-hidden">
          {activeTab === 'workflow' && <WorkflowBuilder />}
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'browser' && <BrowserPanel />}
        </main>
      </div>
    </div>
  );
}
