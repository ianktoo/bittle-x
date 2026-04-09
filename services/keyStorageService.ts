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
 */

const DB_NAME = 'bittle-key-store';
const STORE_NAME = 'keys';
const KEY_ID = 'aes-gcm-key';
const STORAGE_KEY = 'bittle.gemini.encryptedKey';

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
 */
async function getOrCreateCryptoKey(): Promise<CryptoKey> {
  const db = await openDB();

  // Try to read existing key from IDB
  const readRequest = db
    .transaction(STORE_NAME, 'readonly')
    .objectStore(STORE_NAME)
    .get(KEY_ID);

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
    .put(newKey, KEY_ID);

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
