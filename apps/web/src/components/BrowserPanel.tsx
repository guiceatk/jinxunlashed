import React, { useState } from 'react';
import { Globe, RefreshCw, Layers, ShieldCheck, Search, Code, CheckCircle2 } from 'lucide-react';

export const BrowserPanel: React.FC = () => {
  const [url, setUrl] = useState('https://example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [domContent, setDomContent] = useState<string>(
    '<h1>Example Domain</h1>\n<p>This domain is for use in illustrative examples in documents.</p>'
  );

  const handleNavigate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDomContent(`<h1>Navigated to ${url}</h1>\n<p>Extracted page DOM content payload via Playwright Browser Controller.</p>`);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Navigation Address Bar */}
      <div className="px-5 py-4 border-b border-slate-800 glass-panel flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Globe size={18} />
          <span className="text-xs font-semibold text-slate-200">Async Browser Viewport</span>
        </div>
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNavigate()}
            placeholder="Enter target URL..."
            className="w-full pl-3 pr-10 py-1.5 bg-dark-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={handleNavigate}
            className="absolute right-2 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <ShieldCheck size={12} className="mr-1" /> Isolated Sandbox
        </span>
      </div>

      {/* Main Viewport & DOM Inspector */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-5 overflow-hidden">
        {/* Rendered Visual Viewport Frame */}
        <div className="glass-panel border border-slate-800 rounded-lg p-5 flex flex-col justify-between overflow-auto">
          <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Headless Visual Preview</span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Playwright Session Active
            </span>
          </div>
          <div className="flex-1 bg-white text-slate-900 p-6 rounded border border-slate-300 shadow-inner font-sans">
            <h1 className="text-2xl font-bold mb-2">Example Domain</h1>
            <p className="text-slate-600 text-sm">
              This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.
            </p>
          </div>
        </div>

        {/* DOM Inspection Output */}
        <div className="glass-panel border border-slate-800 rounded-lg p-5 flex flex-col overflow-hidden">
          <div className="border-b border-slate-800 pb-3 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={16} className="text-brand-400" />
              <span className="text-xs font-semibold text-slate-300">DOM Snapshot & Selector Extractor</span>
            </div>
          </div>
          <pre className="flex-1 p-4 bg-dark-900 text-xs font-mono text-slate-300 rounded border border-slate-800 overflow-auto">
            {domContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
