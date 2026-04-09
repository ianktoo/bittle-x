/**
 * Google Gemini LLM Provider
 *
 * Implements the LLMProvider interface using Google's Gemini API with function calling.
 */

import { GoogleGenAI, type FunctionCallingMode } from '@google/genai';
import { toGeminiTool, getSystemInstruction } from '../robotTools';
import { loadProviderKey, saveProviderKey, hasProviderKey, clearProviderKey } from '../keyStorageService';
import type { LLMProvider, LLMTranslateResult, ProviderConfig } from '../llmProviderService';

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini' as const;
  readonly displayName = 'Google Gemini';
  readonly defaultModel = 'gemini-2.0-flash';
  readonly availableModels = ['gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview'];

  async hasCredentials(): Promise<boolean> {
    return await hasProviderKey('gemini');
  }

  async saveCredentials(apiKey: string): Promise<void> {
    await saveProviderKey('gemini', apiKey);
  }

  async clearCredentials(): Promise<void> {
    await clearProviderKey('gemini');
  }

  async validateCredentials(apiKey: string): Promise<string | null> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'test',
        config: { maxOutputTokens: 1 },
      });
      return null; // Success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return `Gemini validation failed: ${message}`;
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

    const apiKey = await loadProviderKey('gemini');
    if (!apiKey) {
      throw new Error('No Gemini API key configured');
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: config.modelId || this.defaultModel,
        contents: trimmedInput,
        config: {
          systemInstruction: getSystemInstruction(robotModel),
          tools: [toGeminiTool()] as any,
          toolConfig: {
            functionCallingConfig: {
              mode: 'ANY' as FunctionCallingMode,
            },
          },
        },
      });

      // Extract function call from response
      if (!response.functionCalls || response.functionCalls.length === 0) {
        console.warn('No function call in Gemini response');
        return { commands: [] };
      }

      const functionCall = response.functionCalls[0];
      if (functionCall.name !== 'execute_robot_commands') {
        console.warn(`Unexpected function call: ${functionCall.name}`);
        return { commands: [] };
      }

      const args = functionCall.args as any;
      const commands = Array.isArray(args?.commands) ? args.commands : [];
      const explanation = args?.explanation || '';

      return { commands, explanation };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }
}

// Auto-register this provider
import { _registerProvider } from '../llmProviderService';
_registerProvider(new GeminiProvider());
