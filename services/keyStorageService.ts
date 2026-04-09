/**
 * Secure API Key Storage Service
 *
 * Uses Web Crypto API (AES-GCM) to encrypt the API key before storing in localStorage.
 * The encryption key itself is stored in IndexedDB as a non-extractable CryptoKey,
 * meaning XSS can use it but cannot export the raw key material.
 *
 * This provides defense-in-depth: localStorage alone is vulnerable to XSS, but here
 * even if XSS reads localStorage, it gets ciphertext. The decryption key is
 * non-extractable, so XSS cannot exfiltrate it—only use it within the same origin.
 *
 * Supports multiple LLM providers with separate encrypted key slots.
 */

const DB_NAME = 'bittle-key-store';
const STORE_NAME = 'keys';
const KEY_ID = 'aes-gcm-key';
const STORAGE_KEY = 'bittle.gemini.encryptedKey';

// Provider type (same as in llmProviderService.ts, but imported or repeated here)
export type ProviderType = 'gemini' | 'openai' | 'anthropic' | 'ollama';

/**
 * Per-provider localStorage keys for encrypted blobs.
 * Gemini maps to the existing key for backward compatibility (zero migration).
 */
const PROVIDER_STORAGE_KEYS: Record<ProviderType, string> = {
  gemini:    'bittle.gemini.encryptedKey',
  openai:    'bittle.openai.encryptedKey',
  anthropic: 'bittle.anthropic.encryptedKey',
  ollama:    'bittle.ollama.baseUrl', // Ollama stores plaintext URL, not encrypted
};

/**
 * Per-provider IndexedDB key IDs for AES-GCM CryptoKey storage.
 * Gemini maps to the existing key for backward compatibility.
 * Ollama uses null because base URL is not encrypted.
 */
const PROVIDER_IDB_KEY_IDS: Record<ProviderType, string | null> = {
  gemini:    'aes-gcm-key',
  openai:    'aes-gcm-key-openai',
  anthropic: 'aes-gcm-key-anthropic',
  ollama:    null,
};

interface EncryptedBlob {
  iv: string; // base64-encoded 96-bit IV
  ciphertext: string; // base64-encoded ciphertext
}

/**
 * Opens IndexedDB and returns the database instance.
 * Returns a Promise that resolves to IDBDatabase.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Gets or creates a non-extractable AES-GCM encryption key.
 * Persists the key in IndexedDB so it survives page reloads.
 * @param keyId The IDB key ID (defaults to 'aes-gcm-key' for backward compatibility)
 */
async function getOrCreateCryptoKey(keyId: string = KEY_ID): Promise<CryptoKey> {
  const db = await openDB();

  // Try to read existing key from IDB
  const readRequest = db
    .transaction(STORE_NAME, 'readonly')
    .objectStore(STORE_NAME)
    .get(keyId);

  const existingKey = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    readRequest.onerror = () => reject(readRequest.error);
    readRequest.onsuccess = () => {
      const result = readRequest.result as CryptoKey | undefined;
      resolve(result);
    };
  });

  if (existingKey) {
    return existingKey;
  }

  // Generate new key
  const newKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );

  // Persist to IDB
  const writeRequest = db
    .transaction(STORE_NAME, 'readwrite')
    .objectStore(STORE_NAME)
    .put(newKey, keyId);

  await new Promise<void>((resolve, reject) => {
    writeRequest.onerror = () => reject(writeRequest.error);
    writeRequest.onsuccess = () => resolve();
  });

  return newKey;
}

/**
 * Encrypts a plaintext API key and stores it in localStorage.
 */
export async function saveApiKey(rawKey: string): Promise<void> {
  const key = await getOrCreateCryptoKey();

  // Generate fresh random IV (96 bits for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const plaintext = new TextEncoder().encode(rawKey);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  // Store as JSON with base64-encoded iv and ciphertext
  const blob: EncryptedBlob = {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
}

/**
 * Decrypts and returns the plaintext API key.
 * Returns null if no key has been stored.
 */
export async function loadApiKey(): Promise<string | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  const blob: EncryptedBlob = JSON.parse(stored);
  const key = await getOrCreateCryptoKey();

  // Decode from base64
  const iv = base64ToArrayBuffer(blob.iv);
  const ciphertext = base64ToArrayBuffer(blob.ciphertext);

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Checks if an API key exists (without decrypting it).
 */
export async function hasApiKey(): Promise<boolean> {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Clears the stored API key from both localStorage and IndexedDB.
 */
export async function clearApiKey(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);

  const db = await openDB();
  const deleteRequest = db
    .transaction(STORE_NAME, 'readwrite')
    .objectStore(STORE_NAME)
    .delete(KEY_ID);

  await new Promise<void>((resolve, reject) => {
    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onsuccess = () => resolve();
  });
}

/**
 * ======================
 * Per-Provider API (New)
 * ======================
 * These functions support multiple LLM providers with separate key slots.
 */

/**
 * Encrypts and stores a provider's API key (or base URL for Ollama).
 * @param provider The provider type ('gemini', 'openai', 'anthropic', 'ollama')
 * @param value The API key or base URL to store
 */
export async function saveProviderKey(provider: ProviderType, value: string): Promise<void> {
  const storageKey = PROVIDER_STORAGE_KEYS[provider];
  const idbKeyId = PROVIDER_IDB_KEY_IDS[provider];

  // Ollama stores plaintext base URL (no encryption needed)
  if (provider === 'ollama') {
    localStorage.setItem(storageKey, value);
    return;
  }

  // For other providers, encrypt with AES-GCM
  const key = await getOrCreateCryptoKey(idbKeyId!);

  // Generate fresh random IV (96 bits for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const plaintext = new TextEncoder().encode(value);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  // Store as JSON with base64-encoded iv and ciphertext
  const blob: EncryptedBlob = {
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext),
  };

  localStorage.setItem(storageKey, JSON.stringify(blob));
}

/**
 * Decrypts and returns a provider's API key (or base URL for Ollama).
 * Returns null if no key has been stored.
 * @param provider The provider type
 */
export async function loadProviderKey(provider: ProviderType): Promise<string | null> {
  const storageKey = PROVIDER_STORAGE_KEYS[provider];
  const idbKeyId = PROVIDER_IDB_KEY_IDS[provider];
  const stored = localStorage.getItem(storageKey);

  if (!stored) {
    return null;
  }

  // Ollama stores plaintext base URL (no decryption needed)
  if (provider === 'ollama') {
    return stored;
  }

  // For other providers, decrypt from JSON blob
  const blob: EncryptedBlob = JSON.parse(stored);
  const key = await getOrCreateCryptoKey(idbKeyId!);

  // Decode from base64
  const iv = base64ToArrayBuffer(blob.iv);
  const ciphertext = base64ToArrayBuffer(blob.ciphertext);

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Checks if a provider has a stored key (without decrypting).
 * @param provider The provider type
 */
export async function hasProviderKey(provider: ProviderType): Promise<boolean> {
  const storageKey = PROVIDER_STORAGE_KEYS[provider];
  return localStorage.getItem(storageKey) !== null;
}

/**
 * Clears a provider's stored key from both localStorage and IndexedDB.
 * @param provider The provider type
 */
export async function clearProviderKey(provider: ProviderType): Promise<void> {
  const storageKey = PROVIDER_STORAGE_KEYS[provider];
  const idbKeyId = PROVIDER_IDB_KEY_IDS[provider];

  localStorage.removeItem(storageKey);

  // Only delete from IDB if this provider uses encryption (not Ollama)
  if (idbKeyId) {
    const db = await openDB();
    const deleteRequest = db
      .transaction(STORE_NAME, 'readwrite')
      .objectStore(STORE_NAME)
      .delete(idbKeyId);

    await new Promise<void>((resolve, reject) => {
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    });
  }
}

/**
 * Helper: Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
