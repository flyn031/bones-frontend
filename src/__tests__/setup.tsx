import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to global scope
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});