# Testing Guide

This document explains how to set up, run, and write tests for the Bittle X Explorer app.

## Setup

### Installation

Install testing dependencies:

```bash
npm install -D vitest @vitest/ui happy-dom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Configuration

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: [], // Add setup files if needed
    },
    // ... rest of config
  };
});
```

### package.json Scripts

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Running Tests

### Run all tests once:
```bash
npm test -- run
```

### Run tests in watch mode (re-run on file changes):
```bash
npm test
```

### Run specific test file:
```bash
npm test -- services/keyStorageService.test.ts
```

### Open UI dashboard:
```bash
npm run test:ui
```

---

## Test Structure

All tests are located in the `tests/` directory, mirroring the source structure:

```
tests/
├── services/
│   ├── keyStorageService.test.ts
│   └── geminiService.test.ts
└── components/
    └── SettingsPanel.test.tsx
```

---

## Writing New Tests

### Basic Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Mocking Services

```typescript
import { vi } from 'vitest';
import { loadApiKey } from '../services/keyStorageService';

vi.mock('../services/keyStorageService', () => ({
  loadApiKey: vi.fn(),
}));

// In test:
vi.mocked(loadApiKey).mockResolvedValue('test-key');
```

### Testing React Components

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user input', async () => {
    render(<MyComponent />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test');
    expect(input.value).toBe('test');
  });

  it('should call callback on button click', async () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## Key Testing Areas

### 1. keyStorageService Tests

**File:** `tests/services/keyStorageService.test.ts`

**What to test:**
- ✅ Encryption produces non-plaintext ciphertext
- ✅ Decryption returns original plaintext
- ✅ Multiple encryptions use different IVs (randomness)
- ✅ Special characters and long keys are handled
- ✅ `hasApiKey()` returns correct status
- ✅ `clearApiKey()` removes stored key

**Run:**
```bash
npm test -- keyStorageService.test.ts
```

### 2. geminiService Tests

**File:** `tests/services/geminiService.test.ts`

**What to test:**
- ✅ `ApiKeyNotConfiguredError` is thrown when no key exists
- ✅ Empty/whitespace input returns empty array
- ✅ Robot model is included in system instruction
- ✅ Commands are parsed correctly from Gemini response
- ✅ API errors are caught and re-thrown
- ✅ Response validation handles malformed JSON

**Run:**
```bash
npm test -- geminiService.test.ts
```

### 3. SettingsPanel Component Tests

**File:** `tests/components/SettingsPanel.test.tsx`

**What to test:**
- ✅ Modal opens/closes based on `isOpen` prop
- ✅ API key input field is shown when no key exists
- ✅ Saved key status badge is shown when key exists
- ✅ Password masking works; eye toggle reveals/hides
- ✅ Robot model selection saves to localStorage
- ✅ Remove button calls `clearApiKey()`
- ✅ Replace button switches to input mode
- ✅ Validation errors are displayed

**Run:**
```bash
npm test -- SettingsPanel.test.tsx
```

---

## Integration Testing

For end-to-end testing (optional), consider:

1. **Playwright** or **Cypress** for browser automation
2. **Test Scenarios:**
   - User opens Settings → enters key → validation succeeds → key is saved
   - User opens Settings → selects Nybble Q → AI responds with "cat" prompts
   - User sends AI command → throttle delay enforced → command executes after delay
   - Network tab shows request to `generativelanguage.googleapis.com`, not `/api/translate`

---

## Debugging Tests

### View test output:
```bash
npm test -- --reporter=verbose
```

### Debug a specific test:
```bash
npm test -- --inspect-brk keyStorageService.test.ts
# Then open chrome://inspect in Chrome
```

### Use test.only to run single test:
```typescript
it.only('should do something', () => {
  // Only this test runs
});
```

### Use test.skip to skip a test:
```typescript
it.skip('should do something', () => {
  // This test is skipped
});
```

---

## Mocking localStorage and IndexedDB

### localStorage Mock

```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

### IndexedDB Mock

IndexedDB is more complex. For unit tests, mock the `loadApiKey`/`saveApiKey` functions directly rather than mocking IndexedDB itself.

For integration tests, consider using a library like `fake-indexeddb`:

```bash
npm install -D fake-indexeddb
```

```typescript
import 'fake-indexeddb/auto';
```

---

## Best Practices

1. **Test behavior, not implementation** — Don't test internal state; test observable outcomes
2. **Use meaningful test names** — Describe what the test validates, e.g., "should throw error if key is not configured"
3. **Keep tests focused** — One assertion or closely related assertions per test
4. **Mock external dependencies** — Vitest, API calls, services
5. **Clean up after tests** — Use `afterEach()` to reset mocks and state
6. **Test error paths** — Not just happy paths; test what happens on failures

---

## Continuous Integration

For CI/CD pipelines (GitHub Actions, etc.):

```yaml
- name: Run tests
  run: npm test -- run

- name: Check coverage
  run: npm run test:coverage
```

---

## Coverage Goals

Aim for coverage of:
- **keyStorageService:** 90%+ (all encryption/decryption paths)
- **geminiService:** 85%+ (API call paths, error handling)
- **SettingsPanel:** 80%+ (UI interactions, state management)
- **AIController:** 70%+ (error handling, API key status)

Check coverage:
```bash
npm run test:coverage
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest UI](https://vitest.dev/guide/ui.html)
