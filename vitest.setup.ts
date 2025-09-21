// Vitest setup file for canvas support in tests
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Create a proper mock context
const createMockContext = () => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  fillStyle: '#000000',
  strokeStyle: '#000000',
  globalCompositeOperation: 'source-over',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
});

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    const mockCanvas = {
      getContext: vi.fn(() => createMockContext()),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
      width: 0,
      height: 0,
      style: {},
      parentNode: null,
    };
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock Image constructor
global.Image = class MockImage {
  width = 0;
  height = 0;
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  
  constructor() {
    // Simulate immediate loading for tests
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;