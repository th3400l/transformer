/**
 * Responsive Canvas Hook
 * Handles canvas size calculation and responsive scaling
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React, { useState, useEffect, useCallback, RefObject } from 'react';

export interface ResponsiveCanvasConfig {
  containerRef: RefObject<HTMLElement>;
  aspectRatio?: number; // width/height ratio, defaults to 8.5/11 (letter paper)
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  padding?: number; // padding around canvas in container
}

export interface CanvasDimensions {
  width: number;
  height: number;
  scale: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface TouchOptimizations {
  touchTargetSize: number; // minimum 44px for accessibility
  gestureEnabled: boolean;
  scrollBehavior: 'auto' | 'smooth';
}

/**
 * Custom hook for responsive canvas sizing and touch optimization
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export const useResponsiveCanvas = (config: ResponsiveCanvasConfig) => {
  const {
    containerRef,
    aspectRatio = 8.5 / 11, // Standard letter paper ratio
    minWidth = 300,
    maxWidth = 1200,
    minHeight = 400,
    maxHeight = 1600,
    padding = 20
  } = config;

  const [dimensions, setDimensions] = useState<CanvasDimensions>({
    width: 800,
    height: 600,
    scale: 1,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  const [touchOptimizations, setTouchOptimizations] = useState<TouchOptimizations>({
    touchTargetSize: 44,
    gestureEnabled: false,
    scrollBehavior: 'auto'
  });

  /**
   * Detect device type based on screen dimensions and touch capability
   * Requirements: 5.1, 5.2, 5.3
   */
  const detectDeviceType = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Device type detection
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    // Touch optimizations based on device type
    const touchOptimizations: TouchOptimizations = {
      touchTargetSize: isMobile ? 48 : isTablet ? 44 : 40,
      gestureEnabled: hasTouch && (isMobile || isTablet),
      scrollBehavior: hasTouch ? 'smooth' : 'auto'
    };

    return {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      touchOptimizations
    };
  }, []);

  /**
   * Calculate optimal canvas dimensions based on container and device
   * Requirements: 5.4, 5.5 - responsive canvas scaling
   */
  const calculateCanvasDimensions = useCallback(() => {
    if (!containerRef.current) {
      return dimensions;
    }

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const deviceInfo = detectDeviceType();

    // Available space accounting for padding
    const availableWidth = containerRect.width - (padding * 2);
    const availableHeight = containerRect.height - (padding * 2);

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
    if (deviceInfo.isMobile) {
      // On mobile, prioritize width and allow scrolling for height
      canvasWidth = Math.min(canvasWidth, availableWidth);
      canvasHeight = canvasWidth / aspectRatio;
    } else if (deviceInfo.isTablet) {
      // On tablet, balance width and height
      const maxDimension = Math.min(availableWidth, availableHeight * aspectRatio);
      canvasWidth = maxDimension;
      canvasHeight = maxDimension / aspectRatio;
    }

    // Calculate scale factor for high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scale = Math.min(devicePixelRatio, 2); // Cap at 2x for performance

    const newDimensions: CanvasDimensions = {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight),
      scale,
      isMobile: deviceInfo.isMobile,
      isTablet: deviceInfo.isTablet,
      isDesktop: deviceInfo.isDesktop
    };

    return newDimensions;
  }, [containerRef, aspectRatio, minWidth, maxWidth, minHeight, maxHeight, padding, dimensions, detectDeviceType]);

  /**
   * Handle window resize with debouncing
   * Requirements: 5.5 - responsive scaling on resize
   */
  const handleResize = useCallback(() => {
    const newDimensions = calculateCanvasDimensions();
    const newTouchOptimizations = detectDeviceType().touchOptimizations;

    setDimensions(newDimensions);
    setTouchOptimizations(newTouchOptimizations);
  }, [calculateCanvasDimensions, detectDeviceType]);

  /**
   * Debounced resize handler to improve performance
   */
  const debouncedResize = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    
    const debounced = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    return debounced;
  }, [handleResize]);

  /**
   * Get responsive layout configuration for UI components
   * Requirements: 5.1, 5.2, 5.3 - device-specific layouts
   */
  const getLayoutConfig = useCallback(() => {
    return {
      // Grid layout adjustments
      gridColumns: dimensions.isMobile ? 1 : dimensions.isTablet ? 2 : 3,
      
      // Control panel sizing
      controlPanelWidth: dimensions.isMobile ? '100%' : dimensions.isTablet ? '40%' : '33%',
      
      // Canvas container sizing
      canvasContainerWidth: dimensions.isMobile ? '100%' : dimensions.isTablet ? '60%' : '67%',
      
      // Font size adjustments
      baseFontSize: dimensions.isMobile ? 14 : dimensions.isTablet ? 16 : 16,
      
      // Spacing adjustments
      spacing: {
        small: dimensions.isMobile ? 8 : 12,
        medium: dimensions.isMobile ? 12 : 16,
        large: dimensions.isMobile ? 16 : 24
      },
      
      // Touch target sizes
      touchTargetSize: touchOptimizations.touchTargetSize,
      
      // Interaction modes
      gestureEnabled: touchOptimizations.gestureEnabled,
      scrollBehavior: touchOptimizations.scrollBehavior
    };
  }, [dimensions, touchOptimizations]);

  /**
   * Get canvas-specific responsive properties
   * Requirements: 5.4, 5.5 - canvas scaling and optimization
   */
  const getCanvasConfig = useCallback(() => {
    return {
      // Canvas dimensions
      width: dimensions.width,
      height: dimensions.height,
      
      // Rendering quality
      pixelRatio: dimensions.scale,
      
      // Performance optimizations
      renderingQuality: dimensions.isMobile ? 0.8 : dimensions.isTablet ? 1.0 : 1.2,
      
      // Memory management
      maxTextureSize: dimensions.isMobile ? 1024 : dimensions.isTablet ? 2048 : 4096,
      
      // Canvas pooling
      enableCanvasPooling: dimensions.isMobile || dimensions.isTablet,
      
      // Progressive loading
      enableProgressiveLoading: dimensions.isMobile,
      
      // Touch interaction
      touchEnabled: touchOptimizations.gestureEnabled,
      
      // Scroll behavior
      scrollBehavior: touchOptimizations.scrollBehavior
    };
  }, [dimensions, touchOptimizations]);

  // Initialize dimensions and set up resize listener
  useEffect(() => {
    // Initial calculation
    handleResize();

    // Set up resize listener
    const debouncedHandler = debouncedResize();
    window.addEventListener('resize', debouncedHandler);
    window.addEventListener('orientationchange', debouncedHandler);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedHandler);
      window.removeEventListener('orientationchange', debouncedHandler);
    };
  }, [handleResize, debouncedResize]);

  // Recalculate when container ref changes
  useEffect(() => {
    if (containerRef.current) {
      handleResize();
    }
  }, [containerRef, handleResize]);

  return {
    dimensions,
    touchOptimizations,
    getLayoutConfig,
    getCanvasConfig,
    recalculate: handleResize
  };
};

/**
 * Hook for managing responsive canvas container
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export const useResponsiveCanvasContainer = () => {
  const [containerStyles, setContainerStyles] = useState<React.CSSProperties>({});

  const updateContainerStyles = useCallback((dimensions: CanvasDimensions) => {
    const styles: React.CSSProperties = {
      width: '100%',
      height: dimensions.isMobile ? 'auto' : '100%',
      minHeight: dimensions.isMobile ? `${dimensions.height}px` : 'auto',
      maxHeight: dimensions.isMobile ? 'none' : '75vh',
      overflow: dimensions.isMobile ? 'visible' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: dimensions.isMobile ? 'flex-start' : 'center',
      padding: dimensions.isMobile ? '10px' : '20px',
      
      // Touch optimizations
      touchAction: dimensions.isMobile || dimensions.isTablet ? 'pan-y' : 'auto',
      WebkitOverflowScrolling: 'touch',
      
      // Smooth scrolling
      scrollBehavior: 'smooth'
    };

    setContainerStyles(styles);
  }, []);

  return {
    containerStyles,
    updateContainerStyles
  };
};

export default useResponsiveCanvas;