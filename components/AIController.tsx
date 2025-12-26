import React, { useState } from 'react';
import { Mic, Send, MessageCircle, Sparkles } from 'lucide-react';
import { translateCommand } from '../services/geminiService';

interface AIControllerProps {
  onExecuteSequence: (cmds: string[]) => void;
  disabled: boolean;
}

const AIController: React.FC<AIControllerProps> = ({ onExecuteSequence, disabled }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;

    setIsProcessing(true);
    try {
      const commands = await translateCommand(input);
      if (commands.length > 0) {
        onExecuteSequence(commands);
      }
    } catch (err) {
      console.error(err);
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
    <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-fun-accent p-2 rounded-full">
          <MessageCircle size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-xl text-white">Talk to Bittle</h3>
          <p className="text-xs text-slate-300">Tell the robot what to do!</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1 group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled || isProcessing}
            placeholder={disabled ? "Wake up the robot first..." : "Type 'Sing a song' or 'Walk'"}
            className="w-full bg-fun-bg border-2 border-slate-600 rounded-xl py-4 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-fun-primary focus:ring-4 focus:ring-fun-primary/20 disabled:opacity-50 transition-all font-bold"
          />
          <button
            type="button"
            onClick={startListening}
            disabled={disabled || isProcessing}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all hover:bg-slate-700 ${
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
          className="bg-fun-success hover:bg-green-400 text-white font-bold p-4 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center border-b-4 border-green-700 active:border-b-0 active:translate-y-1 shadow-lg min-w-[60px]"
        >
          {isProcessing ? <Sparkles size={24} className="animate-spin" /> : <Send size={24} />}
        </button>
      </form>
      
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Try saying:</span>
        {["Do a pushup", "Sing a song", "Bark loudly", "Walk then sit"].map(txt => (
          <button 
            key={txt} 
            onClick={() => setInput(txt)}
            disabled={disabled}
            className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md text-fun-primary transition-colors cursor-pointer"
          >
            "{txt}"
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIController;