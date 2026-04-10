import React, { useEffect, useState } from 'react';
import { Mic, Send, MessageCircle, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getActiveProvider,
  getActiveProviderType,
  getProviderConfig,
  ProviderNotConfiguredError,
} from '../services/llmProviderService';

interface AIControllerProps {
  onExecuteSequence: (cmds: string[]) => void;
  disabled: boolean;
  onNeedApiKey: () => void;
}

const AIController: React.FC<AIControllerProps> = ({ onExecuteSequence, disabled, onNeedApiKey }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [keyConfigured, setKeyConfigured] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerInfo, setProviderInfo] = useState<{ displayName: string; model: string }>({
    displayName: 'Gemini',
    model: 'gemini-2.0-flash',
  });

  // Check provider credentials on mount and when component becomes visible
  useEffect(() => {
    const checkKeyStatus = async () => {
      const provider = getActiveProvider();
      const hasCredentials = await provider.hasCredentials();
      setKeyConfigured(hasCredentials);

      // Update provider display info
      const config = getProviderConfig(getActiveProviderType());
      setProviderInfo({
        displayName: provider.displayName,
        model: config.modelId,
      });
    };

    checkKeyStatus();
    // Re-check when the window regains focus (in case user configured key in another tab)
    const handleFocus = () => checkKeyStatus();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const friendlyError = (err: unknown, model: string): string => {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();
    if (
      lower.includes('not found') ||
      lower.includes('does not exist') ||
      lower.includes('invalid model') ||
      lower.includes('model_id field is invalid') ||
      lower.includes('no such model') ||
      lower.includes('unknown model')
    ) {
      return `The model "${model}" wasn't recognized. Open Settings and pick a supported model, or check the spelling.`;
    }
    if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429')) {
      return `You've hit a rate limit. Wait a moment and try again.`;
    }
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
      return `Your API key looks invalid. Check it in Settings.`;
    }
    return `Something went wrong: ${msg}`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // Get robot model from localStorage
      const robotModel = (localStorage.getItem('bittle.robotModel') as 'Bittle' | 'Nybble Q') || 'Bittle';

      // Get active provider and its config
      const provider = getActiveProvider();
      const config = getProviderConfig(getActiveProviderType());

      // Translate command using active provider
      const result = await provider.translateCommand(input, robotModel, config);
      if (result.commands.length > 0) {
        onExecuteSequence(result.commands);
      }
    } catch (err) {
      if (err instanceof ProviderNotConfiguredError) {
        onNeedApiKey();
      } else {
        const config = getProviderConfig(getActiveProviderType());
        setErrorMessage(friendlyError(err, config.modelId));
        console.error(err);
      }
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Oops! Your browser doesn't have ears (Speech Recognition).");
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
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  return (
    <div className={`rounded-3xl p-5 shadow-xl transition-colors border-2 ${
      keyConfigured
        ? 'bg-white/90 dark:bg-white/10 backdrop-blur-sm border-slate-200 dark:border-white/20'
        : 'bg-amber-50/90 dark:bg-amber-900/20 backdrop-blur-sm border-amber-300 dark:border-amber-600'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-full ${keyConfigured ? 'bg-slate-900 dark:bg-fun-accent' : 'bg-amber-700 dark:bg-amber-600'}`}>
            <MessageCircle size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Talk to Bittle</h3>
            <p className={`text-xs ${keyConfigured ? 'text-slate-500 dark:text-slate-300' : 'text-amber-700 dark:text-amber-300 font-semibold'}`}>
              {keyConfigured ? 'Tell the robot what to do!' : 'Configure API key to enable AI commands'}
            </p>
          </div>
        </div>
        {/* API Key Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
          {keyConfigured ? (
            <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg">
              <CheckCircle2 size={14} />
              <span>{providerInfo.displayName} Ready</span>
            </div>
          ) : (
            <button
              onClick={onNeedApiKey}
              className="flex items-center gap-1.5 bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-300 dark:hover:bg-amber-600 transition-colors px-2 py-1 rounded-lg font-bold"
            >
              <AlertCircle size={14} />
              <span>Setup Now</span>
            </button>
          )}
        </div>
      </div>

      {!keyConfigured && (
        <div className="mb-3 p-4 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-600 rounded-xl">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
            🔑 API Key Required
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 mb-3">
            Set up your Gemini API key in Settings to enable AI command translation.
          </p>
          <button
            onClick={onNeedApiKey}
            className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors"
          >
            Open Settings
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled || isProcessing || !keyConfigured}
            placeholder={!keyConfigured ? "Configure API key first..." : disabled ? "Wake up the robot first..." : "Type 'Sing a song' or 'Walk'"}
            className={`w-full rounded-xl py-4 pl-4 pr-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all font-bold border-2 ${
              !keyConfigured
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600 disabled:opacity-70'
                : 'bg-slate-50 dark:bg-fun-bg border-slate-300 dark:border-slate-600 focus:border-fun-primary focus:ring-fun-primary/20 disabled:opacity-50'
            }`}
          />
          <button
            type="button"
            onClick={startListening}
            disabled={disabled || isProcessing}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all hover:bg-slate-200 dark:hover:bg-slate-700 ${
              isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'
            }`}
            title="Use Microphone"
          >
            <Mic size={24} />
          </button>
        </div>
        
        <button
          type="submit"
          disabled={disabled || isProcessing || !input.trim()}
          className="bg-green-500 dark:bg-fun-success hover:bg-green-600 dark:hover:bg-green-400 text-white font-bold p-4 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center border-b-4 border-green-700 dark:border-green-700 active:border-b-0 active:translate-y-1 shadow-lg min-w-[60px]"
        >
          {isProcessing ? <Sparkles size={24} className="animate-spin" /> : <Send size={24} />}
        </button>
      </form>
      
      {errorMessage && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Try saying:</span>
        {["Do a pushup", "Sing a song", "Bark loudly", "Walk then sit"].map(txt => (
          <button 
            key={txt} 
            onClick={() => setInput(txt)}
            disabled={disabled}
            className="text-xs bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 px-2 py-1 rounded-md text-yellow-700 dark:text-fun-primary transition-colors cursor-pointer"
          >
            "{txt}"
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIController;