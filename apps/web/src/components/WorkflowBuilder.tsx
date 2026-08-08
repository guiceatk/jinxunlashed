import React, { useState } from 'react';
import { Play, Plus, Trash2, ArrowRight, Globe, Cpu, Filter, Zap, RefreshCw } from 'lucide-react';

interface NodeItem {
  id: string;
  name: string;
  type: 'browser' | 'model' | 'filter' | 'transform';
  config: Record<string, string>;
}

export const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: 'node_1', name: 'Open Target Page', type: 'browser', config: { url: 'https://example.com' } },
    { id: 'node_2', name: 'Extract Main Content', type: 'browser', config: { selector: 'h1' } },
    { id: 'node_3', name: 'Summarize via LLM', type: 'model', config: { prompt: 'Summarize headline' } },
  ]);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  const addNode = (type: NodeItem['type']) => {
    const newNode: NodeItem = {
      id: `node_${Date.now()}`,
      name: `${type.toUpperCase()} Step ${nodes.length + 1}`,
      type,
      config: type === 'browser' ? { url: 'https://' } : { prompt: 'Analyze payload' },
    };
    setNodes(prev => [...prev, newNode]);
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const runWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs(['[00:00.000] Connecting to Fastify Workflow Socket...']);

    setTimeout(() => {
      setExecutionLogs(prev => [...prev, '[00:00.320] Workflow run initialized (run_id: run_84291)']);
    }, 400);

    setTimeout(() => {
      setExecutionLogs(prev => [...prev, '[00:01.100] [Node 1] Browser context navigated to https://example.com']);
    }, 1200);

    setTimeout(() => {
      setExecutionLogs(prev => [...prev, '[00:01.850] [Node 2] Extracted elementinnerText("h1") => "Example Domain"']);
    }, 2000);

    setTimeout(() => {
      setExecutionLogs(prev => [
        ...prev,
        '[00:02.600] [Node 3] LLM completion succeeded. Summary generated.',
        '[00:02.650] ✅ Workflow execution completed successfully.',
      ]);
      setIsExecuting(false);
    }, 2800);
  };

  const getNodeIcon = (type: NodeItem['type']) => {
    switch (type) {
      case 'browser': return <Globe className="text-blue-400" size={18} />;
      case 'model': return <Cpu className="text-indigo-400" size={18} />;
      case 'filter': return <Filter className="text-amber-400" size={18} />;
      default: return <Zap className="text-emerald-400" size={18} />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
      {/* Workflow Visual Canvas */}
      <div className="lg:col-span-2 flex flex-col bg-dark-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 glass-panel flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-100 text-sm tracking-wide">Make.com Visual Workflow Graph</h2>
            <p className="text-xs text-slate-400">Sequential & Parallel Async Execution DAG</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => addNode('browser')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> + Browser Node
            </button>
            <button
              onClick={() => addNode('model')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} /> + Model Node
            </button>
            <button
              onClick={runWorkflow}
              disabled={isExecuting}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-xs font-medium rounded-lg text-white flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all"
            >
              {isExecuting ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
              {isExecuting ? 'Executing...' : 'Run Graph'}
            </button>
          </div>
        </div>

        {/* Nodes Canvas Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {nodes.map((node, index) => (
            <div key={node.id} className="relative">
              <div className="glass-panel p-4 rounded-xl border border-slate-700/60 hover:border-brand-500/50 transition-all group flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-dark-800 rounded-lg border border-slate-700">
                    {getNodeIcon(node.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{node.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {node.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {JSON.stringify(node.config)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeNode(node.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {index < nodes.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight size={18} className="text-slate-600 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Execution Telemetry Console */}
      <div className="flex flex-col bg-dark-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 glass-panel">
          <h2 className="font-semibold text-slate-100 text-sm tracking-wide">Live Telemetry Console</h2>
          <p className="text-xs text-slate-400">WebSocket / SSE Streamed Output</p>
        </div>
        <div className="flex-1 p-4 bg-dark-900 font-mono text-xs text-emerald-400 overflow-y-auto space-y-2">
          {executionLogs.length === 0 ? (
            <p className="text-slate-500 italic">Click 'Run Graph' to trigger real-time telemetry stream.</p>
          ) : (
            executionLogs.map((log, i) => (
              <div key={i} className="leading-relaxed border-b border-slate-800/40 pb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
