/**
 * Anthropic LLM Provider
 *
 * Implements the LLMProvider interface using Anthropic's Claude models with tool use.
 * Note: dangerouslyAllowBrowser: true is required because we're storing the API key
 * client-side with encryption. This is acceptable given our threat model.
 */

import Anthropic from '@anthropic-ai/sdk';
import { toAnthropicTool, getSystemInstruction } from '../robotTools';
import { loadProviderKey, saveProviderKey, hasProviderKey, clearProviderKey } from '../keyStorageService';
import type { LLMProvider, LLMTranslateResult, ProviderConfig } from '../llmProviderService';

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic' as const;
  readonly displayName = 'Anthropic Claude';
  readonly defaultModel = 'claude-opus-4-5';
  readonly availableModels = ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'];

  async hasCredentials(): Promise<boolean> {
    return await hasProviderKey('anthropic');
  }

  async saveCredentials(apiKey: string): Promise<void> {
    await saveProviderKey('anthropic', apiKey);
  }

  async clearCredentials(): Promise<void> {
    await clearProviderKey('anthropic');
  }

  async validateCredentials(apiKey: string): Promise<string | null> {
    try {
      const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      // Lightweight validation: list available models
      await anthropic.models.list();
      return null; // Success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return `Anthropic validation failed: ${message}`;
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

    const apiKey = await loadProviderKey('anthropic');
    if (!apiKey) {
      throw new Error('No Anthropic API key configured');
    }

    const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    try {
      const response = await anthropic.messages.create({
        model: config.modelId || this.defaultModel,
        max_tokens: 500,
        system: getSystemInstruction(robotModel),
        tools: [toAnthropicTool()] as any,
        messages: [
          {
            role: 'user',
            content: trimmedInput,
          },
        ],
      });

      // Extract tool use from response
      const toolUseBlock = response.content.find(
        (block: any) => block.type === 'tool_use' && block.name === 'execute_robot_commands'
      ) as any;

      if (!toolUseBlock) {
        console.warn('No tool use block in Anthropic response');
        return { commands: [] };
      }

      const input = toolUseBlock.input as any;
      const commands = Array.isArray(input?.commands) ? input.commands : [];
      const explanation = input?.explanation || '';

      return { commands, explanation };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }
}
