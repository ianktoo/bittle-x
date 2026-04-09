/**
 * Unit tests for keyStorageService
 *
 * Setup required:
 * - npm install -D vitest @vitest/ui
 * - npm install -D @testing-library/dom happy-dom (for IndexedDB polyfill)
 * - Add to vite.config.ts:
 *   test: { globals: true, environment: 'happy-dom' }
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveApiKey,
  loadApiKey,
  hasApiKey,
  clearApiKey,
} from '../../services/keyStorageService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('keyStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveApiKey', () => {
    it('should encrypt and store an API key in localStorage', async () => {
      const testKey = 'AIzaTestKeyXYZ123456789';

      await saveApiKey(testKey);

      const stored = localStorage.getItem('bittle.gemini.encryptedKey');
      expect(stored).toBeDefined();
      expect(stored).not.toContain(testKey); // Key should not be in plaintext
    });

    it('should create valid JSON blob with iv and ciphertext', async () => {
      const testKey = 'AIzaTestKey12345';

      await saveApiKey(testKey);

      const stored = localStorage.getItem('bittle.gemini.encryptedKey');
      const blob = JSON.parse(stored!);
      expect(blob).toHaveProperty('iv');
      expect(blob).toHaveProperty('ciphertext');
      expect(typeof blob.iv).toBe('string');
      expect(typeof blob.ciphertext).toBe('string');
    });

    it('should use different IVs for multiple encryptions (randomness)', async () => {
      const testKey = 'AIzaTestKey12345';

      await saveApiKey(testKey);
      const blob1 = JSON.parse(localStorage.getItem('bittle.gemini.encryptedKey')!);

      await saveApiKey(testKey); // Save same key again
      const blob2 = JSON.parse(localStorage.getItem('bittle.gemini.encryptedKey')!);

      // IVs should differ (though ciphertext might too due to different encryption)
      expect(blob1.iv).not.toBe(blob2.iv);
    });
  });

  describe('loadApiKey', () => {
    it('should return null if no key is stored', async () => {
      const result = await loadApiKey();
      expect(result).toBeNull();
    });

    it('should decrypt and return the stored API key', async () => {
      const testKey = 'AIzaTestKeyDecrypt123';

      await saveApiKey(testKey);
      const loaded = await loadApiKey();

      expect(loaded).toBe(testKey);
    });

    it('should handle multiple save/load cycles', async () => {
      const key1 = 'AIzaKey1';
      const key2 = 'AIzaKey2';

      await saveApiKey(key1);
      let loaded = await loadApiKey();
      expect(loaded).toBe(key1);

      await saveApiKey(key2);
      loaded = await loadApiKey();
      expect(loaded).toBe(key2);
    });
  });

  describe('hasApiKey', () => {
    it('should return false if no key is stored', async () => {
      const result = await hasApiKey();
      expect(result).toBe(false);
    });

    it('should return true if a key is stored', async () => {
      await saveApiKey('AIzaTestKey');
      const result = await hasApiKey();
      expect(result).toBe(true);
    });

    it('should return false after key is cleared', async () => {
      await saveApiKey('AIzaTestKey');
      expect(await hasApiKey()).toBe(true);

      await clearApiKey();
      expect(await hasApiKey()).toBe(false);
    });
  });

  describe('clearApiKey', () => {
    it('should remove the encrypted key from localStorage', async () => {
      await saveApiKey('AIzaTestKey');
      expect(localStorage.getItem('bittle.gemini.encryptedKey')).toBeDefined();

      await clearApiKey();
      expect(localStorage.getItem('bittle.gemini.encryptedKey')).toBeNull();
    });

    it('should result in hasApiKey returning false', async () => {
      await saveApiKey('AIzaTestKey');
      expect(await hasApiKey()).toBe(true);

      await clearApiKey();
      expect(await hasApiKey()).toBe(false);
    });

    it('should allow saving a new key after clearing', async () => {
      await saveApiKey('AIzaTestKey1');
      await clearApiKey();
      await saveApiKey('AIzaTestKey2');

      const loaded = await loadApiKey();
      expect(loaded).toBe('AIzaTestKey2');
    });
  });

  describe('encryption security', () => {
    it('should not store plaintext key in localStorage', async () => {
      const testKey = 'AIzaVerySecretKey123';

      await saveApiKey(testKey);

      const allStorageValues = Object.values(localStorage).join('');
      expect(allStorageValues).not.toContain(testKey);
    });

    it('should handle special characters in API key', async () => {
      const testKey = 'AIza_-./=+!@#$%^&*()1234567890';

      await saveApiKey(testKey);
      const loaded = await loadApiKey();

      expect(loaded).toBe(testKey);
    });

    it('should handle very long API keys', async () => {
      const testKey = 'AIza' + 'x'.repeat(500);

      await saveApiKey(testKey);
      const loaded = await loadApiKey();

      expect(loaded).toBe(testKey);
    });
  });
});
