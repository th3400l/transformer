/**
 * Mobile Touch Optimizer Service
 * 
 * Provides utilities and optimizations for mobile touch interactions
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */

export interface TouchTarget {
  element: HTMLElement;
  minSize: number;
  padding?: number;
}

export interface TouchFeedbackOptions {
  duration?: number;
  scale?: number;
  opacity?: number;
  ripple?: boolean;
}

export interface TouchOptimizationConfig {
  minTouchTargetSize: number; // Minimum 44px per WCAG guidelines
  touchFeedbackDuration: number;
  enableRippleEffect: boolean;
  enableHapticFeedback: boolean;
  passiveListeners: boolean;
}

const DEFAULT_CONFIG: TouchOptimizationConfig = {
  minTouchTargetSize: 44,
  touchFeedbackDuration: 150,
  enableRippleEffect: true,
  enableHapticFeedback: true,
  passiveListeners: true
};

/**
 * Mobile Touch Optimizer
 * 
 * Handles touch interaction optimizations for mobile devices
 */
export class MobileTouchOptimizer {
  private config: TouchOptimizationConfig;
  private touchStartHandlers: Map<HTMLElement, (e: TouchEvent) => void> = new Map();
  private touchEndHandlers: Map<HTMLElement, (e: TouchEvent) => void> = new Map();
  private activeTouch: Touch | null = null;

  constructor(config: Partial<TouchOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate touch target size
   * Requirements: 3.1 - Ensure minimum 44px touch targets
   */
  validateTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const minSize = this.config.minTouchTargetSize;
    
    return rect.width >= minSize && rect.height >= minSize;
  }

  /**
   * Ensure touch target meets minimum size requirements
   * Requirements: 3.1 - Ensure minimum 44px touch targets
   */
  ensureTouchTargetSize(element: HTMLElement, minSize?: number): void {
    const targetSize = minSize || this.config.minTouchTargetSize;
    const rect = element.getBoundingClientRect();
    
    if (rect.width < targetSize) {
      element.style.minWidth = `${targetSize}px`;
    }
    
    if (rect.height < targetSize) {
      element.style.minHeight = `${targetSize}px`;
    }
    
    // Ensure proper touch-action
    if (!element.style.touchAction) {
      element.style.touchAction = 'manipulation';
    }
  }

  /**
   * Add touch feedback animation to element
   * Requirements: 3.4 - Add touch feedback animations
   */
  addTouchFeedback(
    element: HTMLElement,
    options: TouchFeedbackOptions = {}
  ): () => void {
    const {
      duration = this.config.touchFeedbackDuration,
      scale = 0.95,
      opacity = 0.7,
      ripple = this.config.enableRippleEffect
    } = options;

    // Store original styles
    const originalTransition = element.style.transition;
    const originalTransform = element.style.transform;
    const originalOpacity = element.style.opacity;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        this.activeTouch = e.touches[0];
        
        // Apply touch feedback
        element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
        element.style.transform = `scale(${scale})`;
        element.style.opacity = opacity.toString();

        // Add ripple effect if enabled
        if (ripple) {
          this.createRippleEffect(element, e.touches[0]);
        }

        // Haptic feedback if supported
        if (this.config.enableHapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    };

    const handleTouchEnd = () => {
      this.activeTouch = null;
      
      // Reset styles
      element.style.transform = originalTransform;
      element.style.opacity = originalOpacity;
      
      // Remove transition after animation completes
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, duration);
    };

    const handleTouchCancel = () => {
      handleTouchEnd();
    };

    // Add event listeners
    const listenerOptions = this.config.passiveListeners ? { passive: true } : false;
    element.addEventListener('touchstart', handleTouchStart, listenerOptions);
    element.addEventListener('touchend', handleTouchEnd, listenerOptions);
    element.addEventListener('touchcancel', handleTouchCancel, listenerOptions);

    // Store handlers for cleanup
    this.touchStartHandlers.set(element, handleTouchStart);
    this.touchEndHandlers.set(element, handleTouchEnd);

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      this.touchStartHandlers.delete(element);
      this.touchEndHandlers.delete(element);
    };
  }

  /**
   * Create ripple effect on touch
   * Requirements: 3.4 - Add touch feedback animations
   */
  private createRippleEffect(element: HTMLElement, touch: Touch): void {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = touch.clientX - rect.left - size / 2;
    const y = touch.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      pointer-events: none;
      left: ${x}px;
      top: ${y}px;
      transform: scale(0);
      opacity: 1;
      transition: transform ${this.config.touchFeedbackDuration}ms ease-out, 
                  opacity ${this.config.touchFeedbackDuration}ms ease-out;
    `;

    // Ensure element has position context
    const originalPosition = element.style.position;
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(ripple);

    // Trigger animation
    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(2)';
      ripple.style.opacity = '0';
    });

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
      if (!originalPosition || originalPosition === 'static') {
        element.style.position = originalPosition;
      }
    }, this.config.touchFeedbackDuration);
  }

  /**
   * Optimize touch event handler
   * Requirements: 3.2 - Optimize touch event handlers
   */
  optimizeTouchHandler<T extends Event>(
    handler: (e: T) => void,
    options: { debounce?: number; throttle?: number } = {}
  ): (e: T) => void {
    const { debounce, throttle } = options;

    if (debounce) {
      return this.debounce(handler, debounce);
    }

    if (throttle) {
      return this.throttle(handler, throttle);
    }

    return handler;
  }

  /**
   * Debounce function for touch handlers
   */
  private debounce<T extends Event>(
    func: (e: T) => void,
    wait: number
  ): (e: T) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (event: T) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(event);
        timeout = null;
      }, wait);
    };
  }

  /**
   * Throttle function for touch handlers
   */
  private throttle<T extends Event>(
    func: (e: T) => void,
    limit: number
  ): (e: T) => void {
    let inThrottle = false;

    return (event: T) => {
      if (!inThrottle) {
        func(event);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * Detect if device supports touch
   */
  isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * Get optimal touch target size for current device
   */
  getOptimalTouchTargetSize(): number {
    // iOS recommends 44px, Android recommends 48px
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS ? 44 : 48;
  }

  /**
   * Apply touch optimizations to multiple elements
   * Requirements: 3.1, 3.4 - Ensure touch targets and feedback
   */
  optimizeElements(
    elements: HTMLElement[],
    options: TouchFeedbackOptions = {}
  ): () => void {
    const cleanupFunctions: (() => void)[] = [];

    elements.forEach(element => {
      // Ensure minimum touch target size
      this.ensureTouchTargetSize(element);

      // Add touch feedback
      const cleanup = this.addTouchFeedback(element, options);
      cleanupFunctions.push(cleanup);
    });

    // Return combined cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }

  /**
   * Scan and optimize all interactive elements in container
   * Requirements: 3.1, 3.4 - Ensure touch targets and feedback
   */
  optimizeContainer(
    container: HTMLElement,
    options: TouchFeedbackOptions = {}
  ): () => void {
    const interactiveSelectors = [
      'button',
      'a',
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
      '[role="button"]',
      '[onclick]',
      '.clickable',
      '.interactive'
    ];

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(interactiveSelectors.join(','))
    );

    return this.optimizeElements(elements, options);
  }

  /**
   * Cleanup all touch handlers
   */
  cleanup(): void {
    this.touchStartHandlers.clear();
    this.touchEndHandlers.clear();
    this.activeTouch = null;
  }
}

// Export singleton instance
export const mobileTouchOptimizer = new MobileTouchOptimizer();

// Export factory function for custom configurations
export function createMobileTouchOptimizer(
  config?: Partial<TouchOptimizationConfig>
): MobileTouchOptimizer {
  return new MobileTouchOptimizer(config);
}
