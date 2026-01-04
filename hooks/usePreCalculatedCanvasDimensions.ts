/**
 * Pre-Calculated Canvas Dimensions Hook
 * Calculates canvas dimensions synchronously before first render to eliminate expansion animations
 * Requirements: 1.1, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useLayoutEffect, useState, RefObject } from 'react';

export interface PreCalculatedDimensions {
  width: number;
  height: number;
  scale: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  containerWidth: number;
  containerHeight: number;
  devicePixelRatio: number;
}

export interface PreCalculationConfig {
  containerRef: RefObject<HTMLElement>;
  aspectRatio?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  padding?: number;
}

/**
 * Calculate canvas dimensions synchronously before paint
 * This eliminates the expansion animation by setting correct dimensions immediately
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
const calculateDimensionsSync = (
  container: HTMLElement,
  config: PreCalculationConfig
): PreCalculatedDimensions => {
  const {
    aspectRatio = 8.5 / 11,
    minWidth = 300,
    maxWidth = 1200,
    minHeight = 400,
    maxHeight = 1600,
    padding = 20
  } = config;

  // Get container dimensions
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  // Detect device type
  const viewportWidth = window.innerWidth;
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024;

  // Available space accounting for padding
  const availableWidth = containerWidth - (padding * 2);
  const availableHeight = containerHeight - (padding * 2);

  // Calculate dimensions based on aspect ratio and constraints
  let canvasWidth: number;
  let canvasHeight: number;

  // Try width-constrained first
  canvasWidth = Math.min(Math.max(availableWidth, minWidth), maxWidth);
  canvasHeight = canvasWidth / aspectRatio;

  // Check if height fits, otherwise constrain by height
  if (canvasHeight > availableHeight || canvasHeight > maxHeight) {
    canvasHeight = Math.min(Math.max(availableHeight, minHeight), maxHeight);
    canvasWidth = canvasHeight * aspectRatio;
  }

  // Ensure minimum dimensions
  canvasWidth = Math.max(canvasWidth, minWidth);
  canvasHeight = Math.max(canvasHeight, minHeight);

  // Device-specific adjustments
  if (isMobile) {
    // On mobile, prioritize width and allow scrolling for height
    canvasWidth = Math.min(canvasWidth, availableWidth);
    canvasHeight = canvasWidth / aspectRatio;
  } else if (isTablet) {
    // On tablet, balance width and height
    const maxDimension = Math.min(availableWidth, availableHeight * aspectRatio);
    canvasWidth = maxDimension;
    canvasHeight = maxDimension / aspectRatio;
  }

  // Calculate scale factor for high-DPI displays
  const devicePixelRatio = window.devicePixelRatio || 1;
  const scale = Math.min(devicePixelRatio, 2); // Cap at 2x for performance

  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
    scale,
    isMobile,
    isTablet,
    isDesktop,
    containerWidth,
    containerHeight,
    devicePixelRatio
  };
};

/**
 * Hook to pre-calculate canvas dimensions before first render
 * Uses useLayoutEffect to run synchronously before paint
 * Requirements: 1.1, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5
 */
export const usePreCalculatedCanvasDimensions = (
  config: PreCalculationConfig
): PreCalculatedDimensions | null => {
  const [dimensions, setDimensions] = useState<PreCalculatedDimensions | null>(null);

  useLayoutEffect(() => {
    // Calculate dimensions synchronously before paint
    if (config.containerRef.current) {
      const dims = calculateDimensionsSync(config.containerRef.current, config);
      setDimensions(dims);
    }
  }, [config.containerRef, config.aspectRatio, config.minWidth, config.maxWidth, config.minHeight, config.maxHeight, config.padding]);

  // Recalculate on container ref changes
  useLayoutEffect(() => {
    const handleResize = () => {
      if (config.containerRef.current) {
        const dims = calculateDimensionsSync(config.containerRef.current, config);
        setDimensions(dims);
      }
    };

    // Set up resize listener
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [config]);

  return dimensions;
};

export default usePreCalculatedCanvasDimensions;
