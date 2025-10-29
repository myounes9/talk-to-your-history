import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    lastError: null,
    openOptionsPage: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
  },
  history: {
    search: vi.fn(),
    getVisits: vi.fn(),
  },
  tabs: {
    create: vi.fn(),
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
} as any;

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};
global.indexedDB = indexedDB as any;

// Mock Web Speech API
(global as any).SpeechRecognition = vi.fn(() => ({
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  onresult: null,
  onerror: null,
  onend: null,
}));

(global as any).webkitSpeechRecognition = (global as any).SpeechRecognition;

// Mock Chrome AI APIs
(global as any).window = {
  ...global.window,
  ai: {
    languageModel: {
      capabilities: vi.fn(async () => ({ available: 'readily' })),
      create: vi.fn(async () => ({
        prompt: vi.fn(async (input: string) => `Mocked response for: ${input}`),
        destroy: vi.fn(),
      })),
    },
    summarizer: {
      capabilities: vi.fn(async () => ({ available: 'readily' })),
      create: vi.fn(async () => ({
        summarize: vi.fn(async (input: string) => `Summary of: ${input.slice(0, 50)}...`),
        destroy: vi.fn(),
      })),
    },
    rewriter: {
      capabilities: vi.fn(async () => ({ available: 'readily' })),
      create: vi.fn(async () => ({
        rewrite: vi.fn(async (input: string) => `${input} [tag1][tag2][tag3]`),
        destroy: vi.fn(),
      })),
    },
  },
  translation: {
    canDetect: vi.fn(async () => 'readily'),
    createDetector: vi.fn(async () => ({
      detect: vi.fn(async () => [{ detectedLanguage: 'en', confidence: 0.99 }]),
    })),
  },
} as any;

