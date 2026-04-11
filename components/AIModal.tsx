import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getActiveProvider,
  getActiveProviderType,
  getProviderConfig,
  ProviderNotConfiguredError,
} from '../services/llmProviderService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  commands?: string[];
}

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteSequence: (cmds: string[]) => void;
  disabled: boolean;
  onNeedApiKey: () => void;
}

const SUGGESTIONS = ['Do a pushup', 'Sing a song', 'Bark loudly', 'Walk then sit'];

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onExecuteSequence, disabled, onNeedApiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [providerInfo, setProviderInfo] = useState<{ displayName: string; model: string }>({
    displayName: 'Gemini',
    model: 'gemini-2.0-flash',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check provider credentials on mount and window focus
  useEffect(() => {
    const check = async () => {
      const provider = getActiveProvider();
      const hasCredentials = await provider.hasCredentials();
      setKeyConfigured(hasCredentials);
      const config = getProviderConfig(getActiveProviderType());
      setProviderInfo({ displayName: provider.displayName, model: config.modelId });
    };
    check();
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // ESC to close; focus input on open
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const friendlyError = (err: unknown, model: string): string => {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    if (
      lower.includes('not found') || lower.includes('does not exist') ||
      lower.includes('invalid model') || lower.includes('model_id field is invalid') ||
      lower.includes('no such model') || lower.includes('unknown model')
    ) {
      return `The model "${model}" wasn't recognized. Open Settings and pick a supported model.`;
    }
    if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429')) {
      return `Rate limit hit — wait a moment and try again.`;
    }
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
      return `API key looks invalid. Check it in Settings.`;
    }
    return `Something went wrong: ${msg}`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || disabled || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const robotModel = (localStorage.getItem('bittle.robotModel') as 'Bittle' | 'Nybble Q') || 'Bittle';
      const provider = getActiveProvider();
      const config = getProviderConfig(getActiveProviderType());
      const result = await provider.translateCommand(text, robotModel, config);

      if (result.commands.length > 0) {
        onExecuteSequence(result.commands);
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          text: `Sending ${result.commands.length} command${result.commands.length === 1 ? '' : 's'}`,
          commands: result.commands,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          text: "I didn't find any matching commands for that. Try rephrasing!",
        }]);
      }
    } catch (err) {
      if (err instanceof ProviderNotConfiguredError) {
        onNeedApiKey();
      } else {
        const config = getProviderConfig(getActiveProviderType());
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: 'error',
          text: friendlyError(err, config.modelId),
        }]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser doesn't support Speech Recognition.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl flex flex-col shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-700 rounded-t-3xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-xl shadow">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">AI Mode</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Talk to Bittle in plain English</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {keyConfigured ? (
              <div className="hidden sm:flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-semibold">
                <CheckCircle2 size={12} />
                <span>{providerInfo.displayName} · {providerInfo.model}</span>
              </div>
            ) : (
              <button
                onClick={onNeedApiKey}
                className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              >
                <AlertCircle size={12} />
                <span>Setup API Key</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-4">
              <div className="bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/20 dark:to-indigo-900/20 p-6 rounded-3xl">
                <Sparkles size={36} className="text-violet-500 dark:text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Tell Bittle what to do</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Natural language → robot commands</p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' && (
                <div className="max-w-[78%] bg-yellow-400 dark:bg-yellow-500 text-black px-4 py-2.5 rounded-2xl rounded-tr-sm font-semibold text-sm shadow-sm">
                  {msg.text}
                </div>
              )}
              {msg.role === 'assistant' && (
                <div className="max-w-[78%] bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1.5 text-violet-600 dark:text-violet-400">
                    <Sparkles size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Bittle</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-sm">{msg.text}</p>
                  {msg.commands && msg.commands.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.commands.map((cmd, i) => (
                        <span key={i} className="text-[11px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                          {cmd}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {msg.role === 'error' && (
                <div className="max-w-[78%] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex items-center gap-2 text-violet-500 dark:text-violet-400">
                  <Sparkles size={13} className="animate-spin" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        <div className="px-5 py-2 flex flex-wrap gap-1.5 shrink-0 border-t border-slate-100 dark:border-slate-800">
          {SUGGESTIONS.map(txt => (
            <button
              key={txt}
              onClick={() => { setInput(txt); inputRef.current?.focus(); }}
              disabled={isProcessing}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
            >
              {txt}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          {disabled && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center mb-2">
              Connect to Bittle first to send commands
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing || !keyConfigured}
                placeholder={
                  !keyConfigured ? 'Configure API key first…'
                  : disabled ? 'Connect to robot first…'
                  : 'Tell Bittle what to do…'
                }
                className="w-full rounded-xl py-3 pl-4 pr-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all font-medium border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={startListening}
                disabled={isProcessing}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-700 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}
                title="Voice input"
              >
                <Mic size={18} />
              </button>
            </div>
            <button
              type="submit"
              disabled={isProcessing || !input.trim() || !keyConfigured}
              className="bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold p-3 rounded-xl disabled:opacity-40 transition-all flex items-center justify-center shadow-lg min-w-[48px]"
            >
              {isProcessing
                ? <Sparkles size={18} className="animate-spin" />
                : <Send size={18} />
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIModal;
