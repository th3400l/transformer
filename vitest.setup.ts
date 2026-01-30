// Vitest setup file for canvas support in tests
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { heroContent, howItWorksSteps, features, useCases, tips, testimonials } from './content/homepage';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Map keys to actual content to pass tests
      if (key === 'hero.headline') return heroContent.headline;
      if (key === 'hero.subheadline') return heroContent.subheadline;
      if (key === 'hero.cta') return heroContent.cta;
      if (key === 'hero.keywords') return heroContent.keywords;
      
      if (key === 'howItWorks.heading') return 'How It Works';
      if (key === 'howItWorks.steps') return howItWorksSteps;
      
      if (key === 'features.heading') return 'Powerful Features';
      if (key === 'features.items') return features;
      
      if (key === 'useCases.heading') return 'Who Uses Our Handwriting Generator?';
      if (key === 'useCases.items') return useCases;
      
      if (key === 'testimonials.heading') return 'What Our Users Say';
      if (key === 'testimonials.items') return testimonials;
      
      if (key === 'tips.heading') return 'Tips & Best Practices';
      if (key === 'tips.items') return tips;

      if (key === 'common.startCreating') return 'Start Creating';
      
      // Return key for others
      return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

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