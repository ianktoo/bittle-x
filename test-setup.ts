import '@testing-library/jest-dom';

// Mock Web Bluetooth API
Object.defineProperty(navigator, 'bluetooth', {
  value: {
    requestDevice: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock Web Serial API
Object.defineProperty(navigator, 'serial', {
  value: {
    requestPort: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock SpeechRecognition
const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
  continuous: false,
  lang: '',
  interimResults: false,
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
}));

Object.defineProperty(window, 'SpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
  configurable: true,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
  configurable: true,
});
