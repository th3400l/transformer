/**
 * useMobileTouchOptimization Hook
 * 
 * React hook for applying mobile touch optimizations to components
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */

import { useEffect, useRef, RefObject } from 'react';
import { mobileTouchOptimizer, TouchFeedbackOptions } from '../services/mobileTouchOptimizer';

export interface UseMobileTouchOptimizationOptions {
  /**
   * Enable touch feedback animations
   */
  enableFeedback?: boolean;

  /**
   * Touch feedback options
   */
  feedbackOptions?: TouchFeedbackOptions;

  /**
   * Automatically optimize all interactive children
   */
  optimizeChildren?: boolean;

  /**
   * Minimum touch target size (default: 44px)
   */
  minTouchTargetSize?: number;

  /**
   * Enable only on touch devices
   */
  touchDevicesOnly?: boolean;
}

/**
 * Hook to apply mobile touch optimizations to a component
 * 
 * @param ref - Reference to the element to optimize
 * @param options - Optimization options
 * 
 * @example
 * ```tsx
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useMobileTouchOptimization(buttonRef, {
 *   enableFeedback: true,
 *   feedbackOptions: { ripple: true }
 * });
 * ```
 */
export function useMobileTouchOptimization<T extends HTMLElement>(
  ref: RefObject<T>,
  options: UseMobileTouchOptimizationOptions = {}
): void {
  const {
    enableFeedback = true,
    feedbackOptions = {},
    optimizeChildren = false,
    minTouchTargetSize,
    touchDevicesOnly = true
  } = options;

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Skip if touch devices only and not a touch device
    if (touchDevicesOnly && !mobileTouchOptimizer.isTouchDevice()) {
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    // Ensure minimum touch target size
    if (minTouchTargetSize) {
      mobileTouchOptimizer.ensureTouchTargetSize(element, minTouchTargetSize);
    } else {
      mobileTouchOptimizer.ensureTouchTargetSize(element);
    }

    // Add touch feedback if enabled
    if (enableFeedback) {
      if (optimizeChildren) {
        cleanupRef.current = mobileTouchOptimizer.optimizeContainer(
          element,
          feedbackOptions
        );
      } else {
        cleanupRef.current = mobileTouchOptimizer.addTouchFeedback(
          element,
          feedbackOptions
        );
      }
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [ref, enableFeedback, feedbackOptions, optimizeChildren, minTouchTargetSize, touchDevicesOnly]);
}

/**
 * Hook to optimize multiple elements
 * 
 * @param refs - Array of element references
 * @param options - Optimization options
 * 
 * @example
 * ```tsx
 * const buttonRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];
 * useMobileTouchOptimizationMultiple(buttonRefs, { enableFeedback: true });
 * ```
 */
export function useMobileTouchOptimizationMultiple<T extends HTMLElement>(
  refs: RefObject<T>[],
  options: UseMobileTouchOptimizationOptions = {}
): void {
  const {
    enableFeedback = true,
    feedbackOptions = {},
    minTouchTargetSize,
    touchDevicesOnly = true
  } = options;

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Skip if touch devices only and not a touch device
    if (touchDevicesOnly && !mobileTouchOptimizer.isTouchDevice()) {
      return;
    }

    const elements = refs
      .map(ref => ref.current)
      .filter((el): el is T => el !== null);

    if (elements.length === 0) {
      return;
    }

    // Optimize all elements
    elements.forEach(element => {
      if (minTouchTargetSize) {
        mobileTouchOptimizer.ensureTouchTargetSize(element, minTouchTargetSize);
      } else {
        mobileTouchOptimizer.ensureTouchTargetSize(element);
      }
    });

    // Add touch feedback if enabled
    if (enableFeedback) {
      cleanupRef.current = mobileTouchOptimizer.optimizeElements(
        elements,
        feedbackOptions
      );
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [refs, enableFeedback, feedbackOptions, minTouchTargetSize, touchDevicesOnly]);
}

/**
 * Hook to get touch device information
 * 
 * @returns Object with touch device information
 * 
 * @example
 * ```tsx
 * const { isTouchDevice, optimalTouchSize } = useTouchDeviceInfo();
 * ```
 */
export function useTouchDeviceInfo() {
  const isTouchDevice = mobileTouchOptimizer.isTouchDevice();
  const optimalTouchSize = mobileTouchOptimizer.getOptimalTouchTargetSize();

  return {
    isTouchDevice,
    optimalTouchSize
  };
}

/**
 * Hook to create optimized touch event handler
 * 
 * @param handler - Event handler function
 * @param options - Optimization options (debounce or throttle)
 * 
 * @example
 * ```tsx
 * const handleTouch = useOptimizedTouchHandler(
 *   (e) => console.log('Touch event'),
 *   { throttle: 100 }
 * );
 * ```
 */
export function useOptimizedTouchHandler<T extends Event>(
  handler: (e: T) => void,
  options: { debounce?: number; throttle?: number } = {}
): (e: T) => void {
  const optimizedHandler = useRef(
    mobileTouchOptimizer.optimizeTouchHandler(handler, options)
  );

  useEffect(() => {
    optimizedHandler.current = mobileTouchOptimizer.optimizeTouchHandler(
      handler,
      options
    );
  }, [handler, options.debounce, options.throttle]);

  return optimizedHandler.current;
}
