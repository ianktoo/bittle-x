/**
 * LLM Provider Abstraction Layer
 *
 * Manages multiple LLM providers (Gemini, OpenAI, Anthropic, Ollama) with
 * provider selection, credential management, and configuration persistence.
 */

import type { ProviderType } from './keyStorageService';

/**
 * Configuration for each provider (non-sensitive, stored in localStorage).
 */
export interface ProviderConfig {
  modelId: string; // e.g., 'gpt-4o', 'gemini-2.0-flash', 'claude-opus-4-5'
  ollamaBaseUrl?: string; // Only for Ollama, e.g., 'http://localhost:11434'
}

/**
 * Result returned by provider.translateCommand()
 */
export interface LLMTranslateResult {
  commands: string[]; // Robot commands + "wait:N" pseudo-commands
  explanation?: string; // Optional explanation of what the robot will do
}

/**
 * Custom error for missing provider credentials
 */
export class ProviderNotConfiguredError extends Error {
  constructor(public readonly provider: ProviderType) {
    super(`No credentials configured for provider: ${provider}`);
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * The LLM provider interface that all implementations must satisfy.
 */
export interface LLMProvider {
  readonly id: ProviderType;
  readonly displayName: string;
  readonly defaultModel: string;
  readonly availableModels: string[];

  /**
   * Check if this provider has credentials configured.
   */
  hasCredentials(): Promise<boolean>;

  /**
   * Save credentials (API key or base URL for Ollama).
   */
  saveCredentials(value: string): Promise<void>;

  /**
   * Clear stored credentials.
   */
  clearCredentials(): Promise<void>;

  /**
   * Validate credentials by making a test API call.
   * Returns null on success, error message string on failure.
   */
  validateCredentials(value: string): Promise<string | null>;

  /**
   * Translate natural language to robot commands using function calling.
   * @param userInput User's natural language request
   * @param robotModel 'Bittle' or 'Nybble Q'
   * @param config Provider-specific configuration
   */
  translateCommand(
    userInput: string,
    robotModel: string,
    config: ProviderConfig
  ): Promise<LLMTranslateResult>;
}

/**
 * Default models per provider
 */
const DEFAULT_MODELS: Record<ProviderType, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-opus-4-5',
  ollama: 'llama3.2',
};

/**
 * Available models per provider
 */
const AVAILABLE_MODELS: Record<ProviderType, string[]> = {
  gemini: ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  ollama: [], // Dynamic — user types model name
};

/**
 * Stub implementations (replaced by real providers in Phase 2)
 */
class StubProvider implements LLMProvider {
  constructor(public id: ProviderType) {}

  readonly displayName = `${this.id.charAt(0).toUpperCase()}${this.id.slice(1)}`;
  readonly defaultModel = DEFAULT_MODELS[this.id];
  readonly availableModels = AVAILABLE_MODELS[this.id];

  async hasCredentials(): Promise<boolean> {
    throw new Error(`Provider ${this.id} not yet implemented`);
  }

  async saveCredentials(): Promise<void> {
    throw new Error(`Provider ${this.id} not yet implemented`);
  }

  async clearCredentials(): Promise<void> {
    throw new Error(`Provider ${this.id} not yet implemented`);
  }

  async validateCredentials(): Promise<string | null> {
    throw new Error(`Provider ${this.id} not yet implemented`);
  }

  async translateCommand(): Promise<LLMTranslateResult> {
    throw new Error(`Provider ${this.id} not yet implemented`);
  }
}

/**
 * Provider registry (lazily instantiated, singleton per provider type)
 */
const providerRegistry: Map<ProviderType, LLMProvider> = new Map();

function initializeProviderRegistry() {
  if (providerRegistry.size === 0) {
    // Stub implementations for now; replaced by real providers in Phase 2
    providerRegistry.set('gemini', new StubProvider('gemini'));
    providerRegistry.set('openai', new StubProvider('openai'));
    providerRegistry.set('anthropic', new StubProvider('anthropic'));
    providerRegistry.set('ollama', new StubProvider('ollama'));
  }
}

/**
 * Get a provider instance by type.
 * @param type Provider type ('gemini', 'openai', 'anthropic', 'ollama')
 */
export function getProvider(type: ProviderType): LLMProvider {
  initializeProviderRegistry();
  const provider = providerRegistry.get(type);
  if (!provider) {
    throw new Error(`Unknown provider: ${type}`);
  }
  return provider;
}

/**
 * Get the currently active provider type.
 * Persisted in localStorage['bittle.llm.provider']. Defaults to 'gemini'.
 */
export function getActiveProviderType(): ProviderType {
  const saved = localStorage.getItem('bittle.llm.provider') as ProviderType | null;
  return saved || 'gemini';
}

/**
 * Set the active provider type.
 * @param type Provider type
 */
export function setActiveProviderType(type: ProviderType): void {
  localStorage.setItem('bittle.llm.provider', type);
}

/**
 * Get the currently active provider instance.
 */
export function getActiveProvider(): LLMProvider {
  return getProvider(getActiveProviderType());
}

/**
 * Get configuration for a provider.
 * Persisted in localStorage['bittle.llm.config.<provider>']. Merges with defaults.
 * @param type Provider type
 */
export function getProviderConfig(type: ProviderType): ProviderConfig {
  const key = `bittle.llm.config.${type}`;
  const saved = localStorage.getItem(key);
  const defaults: ProviderConfig = {
    modelId: DEFAULT_MODELS[type],
  };

  if (!saved) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<ProviderConfig>;
    return { ...defaults, ...parsed };
  } catch {
    // If localStorage is corrupted, return defaults
    return defaults;
  }
}

/**
 * Set configuration for a provider.
 * @param type Provider type
 * @param config Partial config object (merged with existing config)
 */
export function setProviderConfig(
  type: ProviderType,
  config: Partial<ProviderConfig>
): void {
  const key = `bittle.llm.config.${type}`;
  const existing = getProviderConfig(type);
  const merged = { ...existing, ...config };
  localStorage.setItem(key, JSON.stringify(merged));
}

/**
 * Register a provider implementation (called by provider modules in Phase 2).
 * @internal Used by provider implementations to register themselves
 */
export function _registerProvider(provider: LLMProvider): void {
  providerRegistry.set(provider.id, provider);
}
