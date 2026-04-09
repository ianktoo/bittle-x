import React, { useEffect, useState } from 'react';
import { X, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { saveApiKey, clearApiKey, hasApiKey } from '../services/keyStorageService';
import { GoogleGenAI } from '@google/genai';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type KeyStatus = 'unknown' | 'set' | 'unset';
type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('unknown');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationError, setValidationError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [robotModel, setRobotModel] = useState<'Bittle' | 'Nybble Q'>('Bittle');

  // Load key status and robot model on mount
  useEffect(() => {
    const loadStatus = async () => {
      const hasKey = await hasApiKey();
      setKeyStatus(hasKey ? 'set' : 'unset');
    };

    if (isOpen) {
      loadStatus();
      // Load robot model from localStorage
      const saved = localStorage.getItem('bittle.robotModel') as 'Bittle' | 'Nybble Q' | null;
      if (saved) setRobotModel(saved);
    }
  }, [isOpen]);

  const handleSaveKey = async () => {
    const key = inputValue.trim();
    if (!key) {
      setValidationError('API key cannot be empty');
      return;
    }

    setValidationStatus('validating');
    setValidationError('');

    try {
      // Validate the key by attempting a minimal API call
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'ping',
        config: { maxOutputTokens: 1 },
      });

      // Key is valid, save it
      await saveApiKey(key);
      setValidationStatus('success');
      setInputValue('');
      setKeyStatus('set');

      // Reset success state after 2 seconds
      setTimeout(() => {
        setValidationStatus('idle');
      }, 2000);
    } catch (error) {
      setValidationStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Invalid API key';
      setValidationError(`Invalid key: ${errorMsg}`);
    }
  };

  const handleReplaceKey = () => {
    setKeyStatus('unset');
    setInputValue('');
    setValidationStatus('idle');
    setValidationError('');
  };

  const handleRemoveKey = async () => {
    try {
      await clearApiKey();
      setKeyStatus('unset');
      setInputValue('');
      setValidationStatus('idle');
      setValidationError('');
    } catch (error) {
      console.error('Failed to remove key:', error);
    }
  };

  const handleRobotModelChange = (model: 'Bittle' | 'Nybble Q') => {
    setRobotModel(model);
    localStorage.setItem('bittle.robotModel', model);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/10 dark:bg-slate-900/90 border border-white/20 dark:border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-slate-800 sticky top-0 z-10 bg-white/5 dark:bg-slate-900/50">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-slate-900 dark:text-slate-300">
          {/* Gemini API Key Section */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              🔑 Gemini API Key
            </h3>

            {keyStatus === 'unset' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-800 dark:text-slate-400 mb-3">
                  Enter your Google Gemini API key to enable AI command translation.
                  <a
                    href="https://ai.google.dev/gemini-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                  >
                    Get one here →
                  </a>
                </p>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-3 pr-10 bg-white/20 dark:bg-slate-800 border border-white/30 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                    disabled={validationStatus === 'validating'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {validationError && validationStatus === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{validationError}</p>
                  </div>
                )}

                <button
                  onClick={handleSaveKey}
                  disabled={validationStatus === 'validating' || !inputValue.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
                >
                  {validationStatus === 'validating' && <Loader2 size={18} className="animate-spin" />}
                  {validationStatus === 'success' && <Check size={18} />}
                  {validationStatus === 'validating' ? 'Validating...' : 'Save Key'}
                </button>

                {validationStatus === 'success' && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <Check size={18} className="text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-700 dark:text-green-400">Key saved successfully!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <Check size={18} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Key saved: AIza••••••••
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleReplaceKey}
                    className="px-4 py-2 bg-slate-300/50 dark:bg-slate-800 hover:bg-slate-400/50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={handleRemoveKey}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-400 italic">
                  🔒 Encrypted locally with AES-256. Never sent to this app's server.
                </p>
              </div>
            )}
          </section>

          {/* Robot Model Section */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              🤖 Robot Model
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRobotModelChange('Bittle')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  robotModel === 'Bittle'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg'
                    : 'bg-slate-300/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-400/50 dark:hover:bg-slate-700'
                }`}
              >
                🐕 Bittle X
              </button>
              <button
                onClick={() => handleRobotModelChange('Nybble Q')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  robotModel === 'Nybble Q'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg'
                    : 'bg-slate-300/50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-400/50 dark:hover:bg-slate-700'
                }`}
              >
                🐱 Nybble Q
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-400 mt-3 italic">
              The AI will adapt its commands based on the selected robot model.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
