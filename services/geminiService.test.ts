import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateCommand, GeminiError } from './geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns command array on successful parse', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ commands: ['kwkF', 'wait:1500', 'ksit'] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await translateCommand('walk then sit');
    expect(result).toEqual(['kwkF', 'wait:1500', 'ksit']);
    expect(mockFetch).toHaveBeenCalledWith('/api/translate', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ prompt: 'walk then sit' }),
    }));
  });

  it('throws GeminiError on API error response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server configuration error' }),
    }));

    await expect(translateCommand('do something')).rejects.toThrow(GeminiError);
    await expect(translateCommand('do something')).rejects.toThrow('Server configuration error');
  });

  it('returns empty array when response commands is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ commands: [] }),
    }));

    const result = await translateCommand('gibberish');
    expect(result).toEqual([]);
  });

  it('returns empty array when commands key is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));

    const result = await translateCommand('gibberish');
    expect(result).toEqual([]);
  });
});
