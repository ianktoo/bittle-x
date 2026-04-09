# Security Implementation Guide

## Overview

This document describes the security architecture and hardening measures implemented in Bittle X Explorer, including browser-side encrypted API key management, hardware rate limiting, and HTTP security headers.

---

## Browser-Side Encrypted API Keys

### Problem Solved

**Previous Architecture:** The app relied on a server-side environment variable (`GEMINI_API_KEY`) to provide the Gemini API key. The `/api/translate` endpoint had no authentication or rate limiting, making it a public proxy that anyone could abuse to consume your Gemini API quota without restriction.

**Risk Profile:**
- High: Unprotected API endpoint exposed to the internet
- The `GEMINI_API_KEY` never leaves the server, but the server acts as an open relay
- Attacker could bulk-request translations, costing you money and exhausting quota

### Solution Implemented

**New Architecture:** Users provide their own Gemini API key via a secure Settings panel. The key is encrypted locally and never sent to the app's server.

#### How It Works

1. **User enters API key in Settings panel** (SettingsPanel.tsx)
   - Input field with password masking and visibility toggle
   - Real-time validation via test Gemini API call before saving

2. **Key is encrypted with Web Crypto AES-GCM**
   - Algorithm: AES-GCM with 256-bit key
   - Fresh 96-bit IV generated for each encryption
   - Encryption key is non-extractable and stored in IndexedDB

3. **Encrypted blob stored in localStorage**
   - Format: `{ iv: "base64", ciphertext: "base64" }`
   - Stored at `localStorage['bittle.gemini.encryptedKey']`
   - Cannot be read as plaintext by XSS, only decrypted within same origin

4. **On command execution**
   - Key is decrypted in-memory from IndexedDB + localStorage
   - Decrypted key is used directly with `@google/genai` SDK in browser
   - No server roundtrip; direct call to `generativelanguage.googleapis.com`

### Threat Model & Security Properties

| Threat | Mitigation | Residual Risk |
|--------|-----------|---|
| Server compromise | Key never stored on server; only encrypted blob in localStorage | If server is fully compromised, attacker could inject code to intercept decrypted keys |
| XSS attack | Non-extractable AES key in IndexedDB; ciphertext-only in localStorage | XSS can still call `loadApiKey()` and get plaintext key in memory for in-session use only |
| Network sniffing | All communication over HTTPS; browser doesn't send key to server | HTTPS is required; CSP and security headers prevent cross-origin exfiltration |
| Data exfiltration | `connect-src` CSP restricts outbound connections; only `generativelanguage.googleapis.com` allowed | User must stay on `bittle-x.vercel.app` or trusted self-hosted domain |
| Key logging | Key only in memory during command translation; never logged or stored as plaintext | User's local machine is out of scope |

### Files Modified

- **New:** `services/keyStorageService.ts` — AES-GCM encryption/decryption, IndexedDB key storage
- **New:** `components/SettingsPanel.tsx` — User interface for key entry and robot model selection
- **Modified:** `services/geminiService.ts` — Rewritten to use browser SDK directly; throws `ApiKeyNotConfiguredError` if key missing
- **Modified:** `components/AIController.tsx` — Handles `ApiKeyNotConfiguredError`, shows key status badge, triggers Settings panel
- **Modified:** `App.tsx` — Wires Settings panel, adds Settings button to header

---

## Robot Model Support (Nybble Q)

### What Changed

The app now supports both **Bittle X** (dog) and **Nybble Q** (cat) robots. Both run the same OpenCat firmware and share the same command vocabulary; the difference is only in the AI system prompt identity.

- User selects model in Settings panel (default: Bittle X)
- Selection saved to `localStorage['bittle.robotModel']`
- AI system instruction adapts: "robot dog named Bittle" vs "robot cat named Nybble Q"

### Files Modified

- **Modified:** `services/geminiService.ts` — Added `getSystemInstruction(robotModel)` function
- **Modified:** `components/SettingsPanel.tsx` — Robot model selector buttons
- **Modified:** `components/AIController.tsx` — Reads robot model from localStorage, passes to `translateCommand()`

---

## Command Rate Limiting (Hardware Protection)

### Problem Solved

The Petoi Bittle X uses a resource-constrained microcontroller (NyBoard/BiBoard) that can be overwhelmed by rapid-fire commands, causing the robot to reboot or become unresponsive.

**Example:** Sending 10 commands in 100ms could exceed the robot's input buffer, leading to silent resets.

### Solution Implemented

**Minimum throttle of 150ms between commands** enforced at the `sendCommand()` function level in App.tsx.

#### How It Works

```typescript
const COMMAND_THROTTLE_MS = 150;
lastCommandTime = useRef<number>(0);

const sendCommand = async (cmd: string) => {
  // Check if enough time has passed since last command
  const now = Date.now();
  const timeSinceLastCommand = now - lastCommandTime.current;
  
  if (timeSinceLastCommand < COMMAND_THROTTLE_MS) {
    // Wait for the remaining throttle duration
    await new Promise(resolve => 
      setTimeout(resolve, COMMAND_THROTTLE_MS - timeSinceLastCommand)
    );
  }
  
  lastCommandTime.current = Date.now();
  // ... then send command to robot
};
```

#### Where It Applies

- ✅ Manual control pad clicks
- ✅ Gamepad input
- ✅ Direct terminal commands
- ✅ AI sequence execution (additive to existing 800ms inter-command waits)
- ✅ All connection types (Bluetooth, USB Serial, WiFi)

#### Tuning

- **Current:** 150ms minimum between commands
- **Rationale:** Bittle X firmware processes commands at ~100ms granularity; 150ms provides safe margin
- **To adjust:** Edit `COMMAND_THROTTLE_MS` in `App.tsx` line 57

### Emergency Stop Bypasses Throttle

The `handleEmergencyStop()` function sends `BALANCE` command directly without throttle, ensuring immediate robot stop in emergencies.

### Files Modified

- **Modified:** `App.tsx` — Added `COMMAND_THROTTLE_MS` constant, updated `sendCommand()` with throttle check

---

## HTTP Security Headers

### Added to vercel.json

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), camera=(), microphone=(self)"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://esm.sh; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://esm.sh https://generativelanguage.googleapis.com; img-src 'self' data:; worker-src 'none'; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
```

#### Header Details

| Header | Purpose | Value |
|--------|---------|-------|
| HSTS | Enforce HTTPS for 2 years | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | Prevent MIME-type sniffing | `nosniff` |
| X-Frame-Options | Prevent clickjacking | `DENY` |
| Referrer-Policy | Control referrer leakage | `strict-origin-when-cross-origin` |
| Permissions-Policy | Disable dangerous APIs | `geolocation=(), camera=(), microphone=(self)` |
| CSP | Prevent XSS and data exfiltration | See below |

#### Content Security Policy (CSP) Details

- `default-src 'self'` — Only load resources from same origin by default
- `script-src` — Allows:
  - `'self'` — App's own scripts
  - `'unsafe-inline'` — Required for inline `<style>` and config scripts (vite/tailwind)
  - `https://cdn.tailwindcss.com` — Tailwind CSS CDN
  - `https://esm.sh` — ES Module CDN (React, deps)
- `connect-src` — Allows:
  - `'self'` — Same origin (API routes, if any)
  - `https://esm.sh` — Module loading
  - `https://generativelanguage.googleapis.com` — **Gemini API endpoint** (critical for browser-side keys)
- `worker-src 'none'` — Web Workers disabled
- `frame-ancestors 'none'` — Cannot be framed

**Note:** `'unsafe-inline'` for scripts is necessary for inline Tailwind and vite module configs. A stricter nonce-based approach would require restructuring `index.html`.

### Dev Server Binding Fixed

**vite.config.ts:** Changed `host: '0.0.0.0'` → `host: 'localhost'`

- Prevents accidental exposure of dev server to LAN
- Only localhost connections allowed during development

---

## Testing

Unit tests are provided for all new/modified security-critical functions:

### To Run Tests

1. Install Vitest and testing dependencies:
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
   ```

2. Add to `vite.config.ts`:
   ```typescript
   export default defineConfig({
     test: {
       globals: true,
       environment: 'happy-dom',
     },
   });
   ```

3. Run tests:
   ```bash
   npm run test
   ```

### Test Coverage

| File | Test File | Coverage |
|------|-----------|----------|
| `services/keyStorageService.ts` | `tests/services/keyStorageService.test.ts` | Encryption, storage, retrieval, clearing |
| `services/geminiService.ts` | `tests/services/geminiService.test.ts` | Error handling, API calls, robot model switching |
| `components/SettingsPanel.tsx` | `tests/components/SettingsPanel.test.tsx` | UI interactions, key validation, model selection |

---

## Deprecation Notice

The server-side `/api/translate` endpoint is now deprecated. It remains in place as a fallback for self-hosted deployments that prefer server-side key management, but new usage should use the browser-side approach.

To re-enable the server endpoint, revert `services/geminiService.ts` to proxy mode and restore the `GEMINI_API_KEY` environment variable.

---

## Recommendations for Future Hardening

1. **Nonce-based CSP** — Use nonce for inline scripts to eliminate `'unsafe-inline'`
2. **Subresource Integrity (SRI)** — Add SRI hashes to CDN loads for added verification
3. **Certificate Pinning** — Pin Vercel/Gemini API certificates (if self-hosting)
4. **Rate Limiting at Edge** — Use Vercel Edge Middleware to rate-limit requests
5. **TOTP-backed Key Rotation** — Implement periodic key refresh prompts
6. **Audit Logging** — Log key creation/deletion events (e.g., to browser console or external service)

---

## References

- [Web Crypto API Spec](https://www.w3.org/TR/WebCryptoAPI/)
- [Google Generative AI SDK](https://github.com/google/generative-ai-js)
- [OWASP: Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [OWASP: Secure Headers](https://securityheaders.com/)
- [Petoi OpenCat Firmware](https://github.com/PetoiCamp/OpenCat)
