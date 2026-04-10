/**
 * Ollama LLM Provider
 *
 * Implements the LLMProvider interface for local Ollama instances.
 * Uses the OpenAI SDK with a custom baseURL pointing to the /api/ollama-proxy
 * serverless function (which handles the HTTPS→HTTP bridge).
 *
 * Ollama stores the base URL as plaintext (no API key needed).
 */

import OpenAI from 'openai';
import { toOpenAITool, getSystemInstruction } from '../robotTools';
import { loadProviderKey, saveProviderKey, hasProviderKey, clearProviderKey } from '../keyStorageService';
import type { LLMProvider, LLMTranslateResult, ProviderConfig } from '../llmProviderService';

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama' as const;
  readonly displayName = 'Ollama (Local)';
  readonly defaultModel = 'llama3.2';
  readonly availableModels = []; // Dynamic — user types model name

  async hasCredentials(): Promise<boolean> {
    // Ollama doesn't need credentials, but base URL must be configured
    return await hasProviderKey('ollama');
  }

  async saveCredentials(baseUrl: string): Promise<void> {
    // Validate base URL format
    try {
      new URL(baseUrl);
    } catch {
      throw new Error('Invalid base URL format');
    }
    await saveProviderKey('ollama', baseUrl);
  }

  async clearCredentials(): Promise<void> {
    await clearProviderKey('ollama');
  }

  async validateCredentials(baseUrl: string): Promise<string | null> {
    try {
      // Validate URL format
      const url = new URL(baseUrl);

      // Make a test request through the proxy
      const openai = new OpenAI({
        baseURL: '/api/ollama-proxy',
        apiKey: 'ollama', // Dummy value required by SDK
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'user',
            content: 'test',
          },
        ],
        max_tokens: 1,
      });

      if (!response.choices || response.choices.length === 0) {
        return 'Ollama connection failed: empty response';
      }

      return null; // Success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return `Ollama validation failed: ${message}. Make sure Ollama is running at the configured URL.`;
    }
  }

  async translateCommand(
    userInput: string,
    robotModel: string,
    config: ProviderConfig
  ): Promise<LLMTranslateResult> {
    const trimmedInput = userInput?.trim();
    if (!trimmedInput) {
      return { commands: [] };
    }

    const baseUrl = await loadProviderKey('ollama');
    if (!baseUrl) {
      throw new Error('No Ollama base URL configured');
    }

    // Use OpenAI SDK with custom baseURL pointing to proxy
    const openai = new OpenAI({
      baseURL: '/api/ollama-proxy',
      apiKey: 'ollama',
      dangerouslyAllowBrowser: true,
    });

    try {
      const response = await openai.chat.completions.create({
        model: config.modelId || this.defaultModel,
        messages: [
          {
            role: 'system',
            content: getSystemInstruction(robotModel),
          },
          {
            role: 'user',
            content: trimmedInput,
          },
        ],
        tools: [toOpenAITool()] as any,
        tool_choice: { type: 'function', function: { name: 'execute_robot_commands' } },
        max_tokens: 500,
      });

      // Extract tool call from response
      const message = response.choices[0]?.message;
      if (!message || !message.tool_calls || message.tool_calls.length === 0) {
        console.warn('No tool call in Ollama response');
        return { commands: [] };
      }

      const toolCall = message.tool_calls[0];
      if (toolCall.type !== 'function' || toolCall.function.name !== 'execute_robot_commands') {
        console.warn(`Unexpected tool call: ${toolCall.function.name}`);
        return { commands: [] };
      }

      const args = JSON.parse(toolCall.function.arguments) as any;
      const commands = Array.isArray(args?.commands) ? args.commands : [];
      const explanation = args?.explanation || '';

      return { commands, explanation };
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }
}
