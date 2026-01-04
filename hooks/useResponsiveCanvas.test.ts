/**
 * Responsive Canvas Hook Tests
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsiveCanvas } from './useResponsiveCanvas';
import { createRef } from 'react';

describe('useResponsiveCanvas', () => {
  let mockContainer: HTMLDivElement;
  let containerRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }));
    document.body.appendChild(mockContainer);

    containerRef = { current: mockContainer };

    // Mock window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1
    });
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    vi.clearAllMocks();
  });

  describe('Device Detection', () => {
    it('should detect desktop device', () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      expect(result.current.dimensions.isDesktop).toBe(true);
      expect(result.current.dimensions.isMobile).toBe(false);
      expect(result.current.dimensions.isTablet).toBe(false);
    });

    it('should detect tablet device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      expect(result.current.dimensions.isTablet).toBe(true);
      expect(result.current.dimensions.isMobile).toBe(false);
      expect(result.current.dimensions.isDesktop).toBe(false);
    });

    it('should detect mobile device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      expect(result.current.dimensions.isMobile).toBe(true);
      expect(result.current.dimensions.isTablet).toBe(false);
      expect(result.current.dimensions.isDesktop).toBe(false);
    });
  });

  describe('Touch Optimizations', () => {
    it('should set correct touch target size for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      expect(result.current.touchOptimizations.touchTargetSize).toBe(48);
    });

    it('should set correct touch target size for tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      expect(result.current.touchOptimizations.touchTargetSize).toBe(44);
    });

    it('should set correct touch target size for desktop', () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      expect(result.current.touchOptimizations.touchTargetSize).toBe(40);
    });
  });

  describe('Canvas Dimensions', () => {
    it('should calculate dimensions based on container', () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      expect(result.current.dimensions.width).toBeGreaterThan(0);
      expect(result.current.dimensions.height).toBeGreaterThan(0);
    });

    it('should respect aspect ratio', () => {
      const aspectRatio = 16 / 9;
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef, aspectRatio })
      );

      const calculatedRatio = result.current.dimensions.width / result.current.dimensions.height;
      expect(Math.abs(calculatedRatio - aspectRatio)).toBeLessThan(0.1);
    });

    it('should respect minimum dimensions', () => {
      const minWidth = 400;
      const minHeight = 300;

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef, minWidth, minHeight })
      );

      expect(result.current.dimensions.width).toBeGreaterThanOrEqual(minWidth);
      expect(result.current.dimensions.height).toBeGreaterThanOrEqual(minHeight);
    });
  });

  describe('Orientation Change Handling', () => {
    it('should handle orientation change event', async () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const initialDimensions = { ...result.current.dimensions };

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024
      });

      await act(async () => {
        window.dispatchEvent(new Event('orientationchange'));
        // Wait for debounce and orientation change handler
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Dimensions should have updated
      expect(result.current.dimensions).not.toEqual(initialDimensions);
    });

    it('should recalculate dimensions after orientation change', async () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      await act(async () => {
        // Trigger recalculation
        result.current.recalculate();
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(result.current.dimensions.width).toBeGreaterThan(0);
      expect(result.current.dimensions.height).toBeGreaterThan(0);
    });
  });

  describe('Layout Configuration', () => {
    it('should provide correct layout config for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const layoutConfig = result.current.getLayoutConfig();

      expect(layoutConfig.gridColumns).toBe(1);
      expect(layoutConfig.controlPanelWidth).toBe('100%');
      expect(layoutConfig.canvasContainerWidth).toBe('100%');
    });

    it('should provide correct layout config for tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const layoutConfig = result.current.getLayoutConfig();

      expect(layoutConfig.gridColumns).toBe(2);
      expect(layoutConfig.controlPanelWidth).toBe('40%');
      expect(layoutConfig.canvasContainerWidth).toBe('60%');
    });

    it('should provide correct layout config for desktop', () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const layoutConfig = result.current.getLayoutConfig();

      expect(layoutConfig.gridColumns).toBe(3);
      expect(layoutConfig.controlPanelWidth).toBe('33%');
      expect(layoutConfig.canvasContainerWidth).toBe('67%');
    });
  });

  describe('Canvas Configuration', () => {
    it('should provide appropriate rendering quality for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const canvasConfig = result.current.getCanvasConfig();

      expect(canvasConfig.renderingQuality).toBe(0.8);
      expect(canvasConfig.enableProgressiveLoading).toBe(true);
    });

    it('should provide appropriate rendering quality for tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const canvasConfig = result.current.getCanvasConfig();

      expect(canvasConfig.renderingQuality).toBe(1.0);
    });

    it('should provide appropriate rendering quality for desktop', () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const canvasConfig = result.current.getCanvasConfig();

      expect(canvasConfig.renderingQuality).toBe(1.2);
      expect(canvasConfig.enableProgressiveLoading).toBe(false);
    });
  });

  describe('Resize Handling', () => {
    it('should handle window resize', async () => {
      const { result } = renderHook(() =>
        useResponsiveCanvas({ containerRef })
      );

      const initialWidth = result.current.dimensions.width;

      // Change container size
      mockContainer.getBoundingClientRect = vi.fn(() => ({
        width: 1200,
        height: 800,
        top: 0,
        left: 0,
        bottom: 800,
        right: 1200,
        x: 0,
        y: 0,
        toJSON: () => ({})
      }));

      await act(async () => {
        window.dispatchEvent(new Event('resize'));
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      // Width should have changed
      expect(result.current.dimensions.width).not.toBe(initialWidth);
    });
  });
});
