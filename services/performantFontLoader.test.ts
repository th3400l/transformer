/**
 * Tests for PerformantFontLoader
 * Requirements: 4.2, 4.3, 6.2, 6.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformantFontLoader, getPerformantFontLoader } from './performantFontLoader';

describe('PerformantFontLoader', () => {
  let fontLoader: PerformantFontLoader;

  beforeEach(() => {
    fontLoader = new PerformantFontLoader();
  });

  describe('Font Strategy Configuration', () => {
    it('should configure inkwell as critical font', () => {
      const strategy = fontLoader.getFontStrategy('inkwell');
      expect(strategy).toBeDefined();
      expect(strategy?.priority).toBe('critical');
      expect(strategy?.preload).toBe(true);
      expect(strategy?.lazyLoad).toBe(false);
    });

    it('should configure handwriting-1 as high priority font', () => {
      const strategy = fontLoader.getFontStrategy('handwriting-1');
      expect(strategy).toBeDefined();
      expect(strategy?.priority).toBe('high');
      expect(strategy?.preload).toBe(true);
      expect(strategy?.lazyLoad).toBe(false);
    });

    it('should configure handwriting-2 through handwriting-9 as low priority fonts', () => {
      for (let i = 2; i <= 9; i++) {
        const strategy = fontLoader.getFontStrategy(`handwriting-${i}`);
        expect(strategy).toBeDefined();
        expect(strategy?.priority).toBe('low');
        expect(strategy?.preload).toBe(false);
        expect(strategy?.lazyLoad).toBe(true);
      }
    });

    it('should configure web fonts as low priority', () => {
      const webFonts = ['elegant-script', 'casual-note', 'quick-jot'];
      webFonts.forEach(fontId => {
        const strategy = fontLoader.getFontStrategy(fontId);
        expect(strategy).toBeDefined();
        expect(strategy?.priority).toBe('low');
        expect(strategy?.lazyLoad).toBe(true);
      });
    });
  });

  describe('Font Loading State', () => {
    it('should track loaded fonts', () => {
      expect(fontLoader.isFontLoaded('inkwell')).toBe(false);
    });

    it('should return metrics', () => {
      const metrics = fontLoader.getMetrics();
      expect(metrics).toHaveProperty('totalFonts');
      expect(metrics).toHaveProperty('loadedFonts');
      expect(metrics).toHaveProperty('preloadedFonts');
      expect(metrics).toHaveProperty('pendingLoads');
      expect(metrics.totalFonts).toBeGreaterThan(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getPerformantFontLoader();
      const instance2 = getPerformantFontLoader();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Font URL Resolution', () => {
    it('should resolve handwriting font URLs correctly', () => {
      // Access private method through type assertion for testing
      const fontUrl = (fontLoader as any).getFontUrl('handwriting-1');
      expect(fontUrl).toBe('/fonts/Handwriting-1.ttf');
    });

    it('should return null for web fonts', () => {
      const fontUrl = (fontLoader as any).getFontUrl('inkwell');
      expect(fontUrl).toBeNull();
    });
  });

  describe('Font Family Resolution', () => {
    it('should resolve font families correctly', () => {
      const testCases = [
        { fontId: 'inkwell', expected: 'Caveat' },
        { fontId: 'handwriting-1', expected: 'Handwriting-1' },
        { fontId: 'elegant-script', expected: 'Dancing Script' },
        { fontId: 'casual-note', expected: 'Kalam' }
      ];

      testCases.forEach(({ fontId, expected }) => {
        const fontFamily = (fontLoader as any).getFontFamily(fontId);
        expect(fontFamily).toBe(expected);
      });
    });

    it('should return null for unknown fonts', () => {
      const fontFamily = (fontLoader as any).getFontFamily('unknown-font');
      expect(fontFamily).toBeNull();
    });
  });
});
