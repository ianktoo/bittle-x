import React, { useEffect, useState } from 'react';
import { X, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import {
  getProvider,
  getActiveProviderType,
  setActiveProviderType,
  getProviderConfig,
  setProviderConfig,
  type ProviderType,
} from '../services/llmProviderService';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type ValidationStatus = 'idle' | 'validating' | 'success' | 'error';

interface ProviderState {
  keyStatus: 'unknown' | 'set' | 'unset';
  validationStatus: ValidationStatus;
  validationError: string;
  showPassword: boolean;
  inputValue: string;
  selectedModel: string;
}

const PROVIDERS: ProviderType[] = ['gemini', 'openai', 'anthropic', 'ollama'];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [activeProvider, setActiveProvider] = useState<ProviderType>('gemini');
  const [robotModel, setRobotModel] = useState<'Bittle' | 'Nybble Q'>('Bittle');
  const [providerStates, setProviderStates] = useState<Record<ProviderType, ProviderState>>({
    gemini: {
      keyStatus: 'unknown',
      validationStatus: 'idle',
      validationError: '',
      showPassword: false,
      inputValue: '',
      selectedModel: 'gemini-2.0-flash',
    },
    openai: {
      keyStatus: 'unknown',
      validationStatus: 'idle',
      validationError: '',
      showPassword: false,
      inputValue: '',
      selectedModel: 'gpt-4o',
    },
    anthropic: {
      keyStatus: 'unknown',
      validationStatus: 'idle',
      validationError: '',
      showPassword: false,
      inputValue: '',
      selectedModel: 'claude-opus-4-5',
    },
    ollama: {
      keyStatus: 'unknown',
      validationStatus: 'idle',
      validationError: '',
      showPassword: false,
      inputValue: '',
      selectedModel: 'llama3.2',
    },
  });

  // Load provider states and robot model on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadStates = async () => {
      const currentProvider = getActiveProviderType();
      setActiveProvider(currentProvider);

      // Load state for each provider
      const newStates: Record<ProviderType, ProviderState> = { ...providerStates };
      for (const providerType of PROVIDERS) {
        const provider = getProvider(providerType);
        const hasKey = await provider.hasCredentials();
        const config = getProviderConfig(providerType);

        newStates[providerType] = {
          ...providerStates[providerType],
          keyStatus: hasKey ? 'set' : 'unset',
          selectedModel: config.modelId,
        };

        // For Ollama, load the base URL
        if (providerType === 'ollama' && config.ollamaBaseUrl) {
          newStates[providerType].inputValue = config.ollamaBaseUrl;
        }
      }
      setProviderStates(newStates);

      // Load robot model
      const saved = localStorage.getItem('bittle.robotModel') as 'Bittle' | 'Nybble Q' | null;
      if (saved) setRobotModel(saved);
    };

    loadStates();
  }, [isOpen]);

  const updateProviderState = (provider: ProviderType, updates: Partial<ProviderState>) => {
    setProviderStates((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates },
    }));
  };

  const handleSaveKey = async (provider: ProviderType) => {
    const state = providerStates[provider];
    const credential = state.inputValue.trim();

    if (!credential) {
      updateProviderState(provider, {
        validationError: provider === 'ollama' ? 'Base URL cannot be empty' : 'API key cannot be empty',
      });
      return;
    }

    updateProviderState(provider, {
      validationStatus: 'validating',
      validationError: '',
    });

    try {
      const providerImpl = getProvider(provider);
      const error = await providerImpl.validateCredentials(credential);

      if (error) {
        updateProviderState(provider, {
          validationStatus: 'error',
          validationError: error,
        });
        return;
      }

      // Validation passed, save credentials
      await providerImpl.saveCredentials(credential);

      // Update config with selected model
      setProviderConfig(provider, { modelId: state.selectedModel });

      updateProviderState(provider, {
        validationStatus: 'success',
        inputValue: '',
        keyStatus: 'set',
      });

      // Set as active provider
      setActiveProviderType(provider);
      setActiveProvider(provider);

      // Reset success state after 2 seconds
      setTimeout(() => {
        updateProviderState(provider, { validationStatus: 'idle' });
      }, 2000);
    } catch (error) {
      updateProviderState(provider, {
        validationStatus: 'error',
        validationError: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  };

  const handleRemoveKey = async (provider: ProviderType) => {
    try {
      const providerImpl = getProvider(provider);
      await providerImpl.clearCredentials();
      updateProviderState(provider, {
        keyStatus: 'unset',
        inputValue: '',
        validationStatus: 'idle',
        validationError: '',
      });
    } catch (error) {
      console.error('Failed to remove key:', error);
    }
  };

  const handleReplaceKey = (provider: ProviderType) => {
    updateProviderState(provider, {
      keyStatus: 'unset',
      inputValue: '',
      validationStatus: 'idle',
      validationError: '',
    });
  };

  const handleModelChange = (provider: ProviderType, model: string) => {
    updateProviderState(provider, { selectedModel: model });
    setProviderConfig(provider, { modelId: model });
  };

  const handleRobotModelChange = (model: 'Bittle' | 'Nybble Q') => {
    setRobotModel(model);
    localStorage.setItem('bittle.robotModel', model);
  };

  const renderProviderTab = (provider: ProviderType) => {
    const providerImpl = getProvider(provider);
    const state = providerStates[provider];
    const isOllama = provider === 'ollama';
    const displayName = providerImpl.displayName;
    const icon =
      provider === 'gemini'
        ? '🔷'
        : provider === 'openai'
          ? '🤖'
          : provider === 'anthropic'
            ? '🧠'
            : '🦙';

    return (
      <div key={provider} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {icon} {displayName} {isOllama ? '(Local)' : ''}
          </h3>
          {provider !== activeProvider && (
            <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
              Inactive
            </span>
          )}
          {provider === activeProvider && (
            <span className="text-xs bg-green-500/20 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded font-semibold flex items-center gap-1">
              <Check size={12} /> Active
            </span>
          )}
        </div>

        {state.keyStatus === 'unset' ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-800 dark:text-slate-400">
              {isOllama
                ? 'Enter your Ollama base URL (e.g., http://localhost:11434)'
                : `Enter your ${displayName} API key to enable AI command translation.`}
              {!isOllama && (
                <a
                  href={
                    provider === 'gemini'
                      ? 'https://ai.google.dev/gemini-api'
                      : provider === 'openai'
                        ? 'https://platform.openai.com/api-keys'
                        : 'https://console.anthropic.com/account/keys'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                >
                  Get one here →
                </a>
              )}
            </p>

            <div className="relative">
              <input
                type={state.showPassword ? 'text' : 'password'}
                value={state.inputValue}
                onChange={(e) => updateProviderState(provider, { inputValue: e.target.value })}
                placeholder={isOllama ? 'http://localhost:11434' : `${provider === 'gemini' ? 'AIza' : provider === 'openai' ? 'sk-' : 'sk-ant-'}...`}
                className="w-full px-4 py-3 pr-10 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                disabled={state.validationStatus === 'validating'}
              />
              <button
                type="button"
                onClick={() => updateProviderState(provider, { showPassword: !state.showPassword })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                {state.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Model Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Model
              </label>
              <input
                type="text"
                list={`models-${provider}-unset`}
                value={state.selectedModel}
                onChange={(e) => handleModelChange(provider, e.target.value)}
                placeholder={isOllama ? 'e.g., llama3.2, mistral' : 'Type or select a model'}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {providerImpl.availableModels.length > 0 && (
                <datalist id={`models-${provider}-unset`}>
                  {providerImpl.availableModels.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              )}
            </div>

            {state.validationError && state.validationStatus === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{state.validationError}</p>
              </div>
            )}

            <button
              onClick={() => handleSaveKey(provider)}
              disabled={state.validationStatus === 'validating' || !state.inputValue.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
            >
              {state.validationStatus === 'validating' && <Loader2 size={18} className="animate-spin" />}
              {state.validationStatus === 'success' && <Check size={18} />}
              {state.validationStatus === 'validating'
                ? 'Validating...'
                : isOllama
                  ? 'Test Connection'
                  : 'Save Key'}
            </button>

            {state.validationStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Check size={18} className="text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  {isOllama ? 'Connection verified!' : 'Key saved successfully!'}
                </p>
              </div>
            )}

            {isOllama && (
              <p className="text-xs text-slate-700 dark:text-slate-400 italic">
                💡 Ollama must be running locally. This browser will connect via a secure HTTPS→HTTP proxy.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <Check size={18} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                {isOllama ? 'Connected' : 'Key saved'}
              </span>
            </div>

            {/* Model Selector for Configured Provider */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Model
              </label>
              <input
                type="text"
                list={`models-${provider}-set`}
                value={state.selectedModel}
                onChange={(e) => handleModelChange(provider, e.target.value)}
                placeholder={isOllama ? 'e.g., llama3.2, mistral' : 'Type or select a model'}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {providerImpl.availableModels.length > 0 && (
                <datalist id={`models-${provider}-set`}>
                  {providerImpl.availableModels.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleReplaceKey(provider)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                {isOllama ? 'Change URL' : 'Replace'}
              </button>
              <button
                onClick={() => handleRemoveKey(provider)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-400 italic">
              {isOllama
                ? "🔒 Base URL stored locally. Never sent to this app's server."
                : "🔒 Encrypted locally with AES-256. Never sent to this app's server."}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-slate-900 dark:text-slate-300">
          {/* Provider Tabs */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🤖 AI Provider</h3>

            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  onClick={() => setActiveProvider(provider)}
                  className={`px-4 py-3 font-semibold transition-colors whitespace-nowrap border-b-2 -mb-[2px] ${
                    activeProvider === provider
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                      : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {provider === 'gemini'
                    ? '🔷 Gemini'
                    : provider === 'openai'
                      ? '🤖 OpenAI'
                      : provider === 'anthropic'
                        ? '🧠 Claude'
                        : '🦙 Ollama'}
                </button>
              ))}
            </div>

            {/* Render active provider tab content */}
            {renderProviderTab(activeProvider)}
          </section>

          {/* Robot Model Section */}
          <section className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🤖 Robot Model</h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRobotModelChange('Bittle')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  robotModel === 'Bittle'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                🐕 Bittle X
              </button>
              <button
                onClick={() => handleRobotModelChange('Nybble Q')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  robotModel === 'Nybble Q'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-lg'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
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
