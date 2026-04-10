/**
 * OpenAI LLM Provider
 *
 * Implements the LLMProvider interface using OpenAI's GPT models with function calling.
 */

import OpenAI from 'openai';
import { toOpenAITool, getSystemInstruction } from '../robotTools';
import { loadProviderKey, saveProviderKey, hasProviderKey, clearProviderKey } from '../keyStorageService';
import type { LLMProvider, LLMTranslateResult, ProviderConfig } from '../llmProviderService';

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai' as const;
  readonly displayName = 'OpenAI';
  readonly defaultModel = 'gpt-4o';
  readonly availableModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

  async hasCredentials(): Promise<boolean> {
    return await hasProviderKey('openai');
  }

  async saveCredentials(apiKey: string): Promise<void> {
    await saveProviderKey('openai', apiKey);
  }

  async clearCredentials(): Promise<void> {
    await clearProviderKey('openai');
  }

  async validateCredentials(apiKey: string): Promise<string | null> {
    try {
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      // Lightweight validation: list available models
      await openai.models.list();
      return null; // Success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return `OpenAI validation failed: ${message}`;
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

    const apiKey = await loadProviderKey('openai');
    if (!apiKey) {
      throw new Error('No OpenAI API key configured');
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

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
        console.warn('No tool call in OpenAI response');
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
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}
