/**
 * Unit tests for geminiService
 *
 * Setup: Same as keyStorageService tests + mock @google/genai
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { translateCommand, ApiKeyNotConfiguredError } from '../../services/geminiService';
import * as keyStorageService from '../../services/keyStorageService';

// Mock keyStorageService
vi.mock('../../services/keyStorageService', () => ({
  loadApiKey: vi.fn(),
}));

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
  Type: {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
  },
}));

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ApiKeyNotConfiguredError', () => {
    it('should be an Error instance', () => {
      const error = new ApiKeyNotConfiguredError();
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApiKeyNotConfiguredError');
    });

    it('should have default message', () => {
      const error = new ApiKeyNotConfiguredError();
      expect(error.message).toContain('No API key');
    });

    it('should support custom message', () => {
      const customMsg = 'Custom error message';
      const error = new ApiKeyNotConfiguredError(customMsg);
      expect(error.message).toBe(customMsg);
    });
  });

  describe('translateCommand', () => {
    it('should throw ApiKeyNotConfiguredError if loadApiKey returns null', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue(null);

      await expect(translateCommand('walk forward')).rejects.toThrow(ApiKeyNotConfiguredError);
    });

    it('should return empty array for empty input', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const result = await translateCommand('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only input', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const result = await translateCommand('   ');
      expect(result).toEqual([]);
    });

    it('should call loadApiKey to get the encryption key', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      // Mock GoogleGenAI to avoid actual API calls
      const { GoogleGenAI } = await import('@google/genai');
      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({ commands: ['kbalance'] }),
          }),
        },
      } as any));

      await translateCommand('sit down');
      expect(keyStorageService.loadApiKey).toHaveBeenCalled();
    });

    it('should include robot model in system instruction for Bittle', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const { GoogleGenAI } = await import('@google/genai');
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ commands: ['kwkF'] }),
      });

      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      } as any));

      await translateCommand('walk', 'Bittle');

      const call = mockGenerateContent.mock.calls[0]?.[0];
      expect(call?.config?.systemInstruction).toContain('robot dog named Bittle');
    });

    it('should include robot model in system instruction for Nybble Q', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const { GoogleGenAI } = await import('@google/genai');
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify({ commands: ['kwkF'] }),
      });

      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      } as any));

      await translateCommand('walk', 'Nybble Q');

      const call = mockGenerateContent.mock.calls[0]?.[0];
      expect(call?.config?.systemInstruction).toContain('robot cat named Nybble Q');
    });

    it('should parse and return commands from Gemini response', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const { GoogleGenAI } = await import('@google/genai');
      const expectedCommands = ['kbf', 'wait:3000', 'ksit'];
      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({ commands: expectedCommands }),
          }),
        },
      } as any));

      const result = await translateCommand('do a backflip then sit');
      expect(result).toEqual(expectedCommands);
    });

    it('should return empty array if response has no commands property', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const { GoogleGenAI } = await import('@google/genai');
      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({ explanation: 'some text' }),
          }),
        },
      } as any));

      const result = await translateCommand('some command');
      expect(result).toEqual([]);
    });

    it('should return empty array if response text is empty', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const { GoogleGenAI } = await import('@google/genai');
      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: '',
          }),
        },
      } as any));

      const result = await translateCommand('walk');
      expect(result).toEqual([]);
    });

    it('should throw error if Gemini API call fails', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const { GoogleGenAI } = await import('@google/genai');
      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: vi
            .fn()
            .mockRejectedValue(new Error('Gemini API error')),
        },
      } as any));

      await expect(translateCommand('walk')).rejects.toThrow('Gemini API error');
    });

    it('should handle non-array commands gracefully', async () => {
      vi.mocked(keyStorageService.loadApiKey).mockResolvedValue('AIzaTestKey');

      const { GoogleGenAI } = await import('@google/genai');
      vi.mocked(GoogleGenAI).mockImplementation(() => ({
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({ commands: 'notanarray' }),
          }),
        },
      } as any));

      const result = await translateCommand('walk');
      expect(result).toEqual([]);
    });
  });
});
