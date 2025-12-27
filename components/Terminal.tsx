import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
  onClear: () => void;
  onCommand?: (cmd: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ logs, onClear, onCommand }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onCommand) {
      onCommand(input.trim());
      setInput('');
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-mono transition-all shadow-sm"
      >
        <TerminalIcon size={14} />
        <span>Open Secret Debug Log</span>
        <ChevronDown size={14} />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-[400px] bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-slate-700 dark:border-slate-800">
        <button onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ChevronUp size={16} />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">Secret Debug Log</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600">{logs.length} events</span>
          <button 
            onClick={onClear}
            className="text-slate-400 hover:text-red-400 transition-colors"
            title="Clear Logs"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar bg-black/50">
        {logs.length === 0 && (
          <div className="text-slate-600 italic text-center mt-10">...waiting for robot signals...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 break-all hover:bg-white/5 p-0.5 rounded">
            <span className="text-slate-600 shrink-0">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit', fractionalSecondDigits: 2 } as any)}]
            </span>
            <span className={`shrink-0 font-bold w-12 text-center ${
              log.type === 'TX' ? 'text-green-500' :
              log.type === 'RX' ? 'text-purple-500' :
              log.type === 'AI' ? 'text-cyan-400' :
              log.type === 'ERROR' ? 'text-red-500' : 'text-slate-300'
            }`}>
              {log.type}
            </span>
            <span className={`
              ${log.type === 'ERROR' ? 'text-red-400' : 'text-slate-300'}
            `}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Command Input Area */}
      {onCommand && (
        <form onSubmit={handleSend} className="p-2 bg-slate-800 dark:bg-slate-900 border-t border-slate-700 dark:border-slate-800 flex gap-2">
            <span className="text-green-500 font-mono py-2 pl-2">{'>'}</span>
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter serial command..."
                className="flex-1 bg-transparent text-slate-200 font-mono text-sm focus:outline-none placeholder-slate-600"
            />
            <button 
                type="submit" 
                className="text-slate-400 hover:text-white px-2"
                disabled={!input.trim()}
            >
                <Send size={16} />
            </button>
        </form>
      )}
    </div>
  );
};

export default Terminal;