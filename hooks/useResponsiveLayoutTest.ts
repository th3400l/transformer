/**
 * Responsive Layout Test Hook
 * Utility for testing responsive layout behavior
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { useState, useEffect, useCallback } from 'react';

export interface LayoutTestMetrics {
  viewport: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    hasTouch: boolean;
    pixelRatio: number;
  };
  layout: {
    gridColumns: number;
    expectedGap: string;
    expectedPadding: string;
  };
  issues: string[];
}

/**
 * Hook for testing responsive layout behavior
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */
export const useResponsiveLayoutTest = () => {
  const [metrics, setMetrics] = useState<LayoutTestMetrics | null>(null);

  const detectDevice = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const pixelRatio = window.devicePixelRatio || 1;

    let deviceType: 'mobile' | 'tablet' | 'desktop';
    let gridColumns: number;
    let expectedGap: string;
    let expectedPadding: string;

    if (width < 768) {
      deviceType = 'mobile';
      gridColumns = 1;
      expectedGap = '1rem';
      expectedPadding = '1rem';
    } else if (width >= 768 && width < 1024) {
      deviceType = 'tablet';
      gridColumns = 2;
      expectedGap = '1.5rem';
      expectedPadding = '1.5rem 2rem';
    } else {
      deviceType = 'desktop';
      gridColumns = 3;
      expectedGap = '2rem';
      expectedPadding = '2rem';
    }

    const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';

    return {
      viewport: { width, height, orientation },
      device: { type: deviceType, hasTouch, pixelRatio },
      layout: { gridColumns, expectedGap, expectedPadding }
    };
  }, []);

  const validateLayout = useCallback(() => {
    const detected = detectDevice();
    const issues: string[] = [];

    // Check grid layout
    const gridElements = document.querySelectorAll('.grid');
    gridElements.forEach((grid) => {
      const computedStyle = window.getComputedStyle(grid);
      const gridTemplateColumns = computedStyle.gridTemplateColumns;
      
      // Validate column count
      const columnCount = gridTemplateColumns.split(' ').length;
      if (columnCount !== detected.layout.gridColumns && detected.device.type !== 'mobile') {
        issues.push(`Grid has ${columnCount} columns, expected ${detected.layout.gridColumns}`);
      }
    });

    // Check touch target sizes on mobile/tablet
    if (detected.device.type === 'mobile' || detected.device.type === 'tablet') {
      const minSize = detected.device.type === 'mobile' ? 44 : 48;
      const interactiveElements = document.querySelectorAll('button, a, [role="button"], select');
      
      interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.height < minSize || rect.width < minSize) {
          issues.push(`Touch target too small: ${rect.width}x${rect.height}px (min: ${minSize}px)`);
        }
      });
    }

    // Check canvas sizing
    const canvasElements = document.querySelectorAll('canvas');
    canvasElements.forEach((canvas) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        issues.push('Canvas has zero dimensions');
      }
    });

    // Check orientation handling
    if (detected.viewport.orientation === 'landscape' && detected.viewport.height < 500) {
      const canvasOutput = document.querySelector('.canvas-output');
      if (canvasOutput) {
        const computedStyle = window.getComputedStyle(canvasOutput);
        const maxHeight = computedStyle.maxHeight;
        if (!maxHeight.includes('vh')) {
          issues.push('Canvas should use vh units in landscape mode');
        }
      }
    }

    return {
      ...detected,
      issues
    };
  }, [detectDevice]);

  const runTest = useCallback(() => {
    const result = validateLayout();
    setMetrics(result);
    return result;
  }, [validateLayout]);

  // Run test on mount and when window resizes
  useEffect(() => {
    runTest();

    const handleResize = () => {
      setTimeout(runTest, 300); // Debounce
    };

    const handleOrientationChange = () => {
      setTimeout(runTest, 500); // Wait for layout to stabilize
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [runTest]);

  return {
    metrics,
    runTest,
    isValid: metrics ? metrics.issues.length === 0 : false
  };
};

/**
 * Log responsive layout metrics to console
 */
export const logLayoutMetrics = (metrics: LayoutTestMetrics) => {
  console.group('📱 Responsive Layout Metrics');
  console.log('Viewport:', metrics.viewport);
  console.log('Device:', metrics.device);
  console.log('Layout:', metrics.layout);
  
  if (metrics.issues.length > 0) {
    console.warn('⚠️ Layout Issues:', metrics.issues);
  } else {
    console.log('✅ No layout issues detected');
  }
  
  console.groupEnd();
};

export default useResponsiveLayoutTest;
