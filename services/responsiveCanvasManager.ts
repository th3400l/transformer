/**
 * Responsive Canvas Manager
 * Handles canvas sizing, scaling, and full space utilization
 * Requirements: 8.1, 8.2, 8.3 - Canvas initialization, resizing, and scaling
 */

import type { ICanvasFallbackSystem } from './canvasFallbackSystem';

export interface CanvasContainerDimensions {
  width: number;
  height: number;
  devicePixelRatio: number;
  aspectRatio: number;
}

export interface CanvasScalingConfig {
  maintainAspectRatio?: boolean;
  fillContainer?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  scalingFactor?: number;
  aspectRatio?: number;
}

export interface CanvasRenderingMetrics {
  containerWidth: number;
  containerHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  scalingFactor: number;
  devicePixelRatio: number;
  actualRenderWidth: number;
  actualRenderHeight: number;
}

export interface IResponsiveCanvasManager {
  initializeCanvas(container: HTMLElement, config?: CanvasScalingConfig): HTMLCanvasElement;
  updateCanvasSize(canvas: HTMLCanvasElement, container: HTMLElement, config?: CanvasScalingConfig): CanvasRenderingMetrics;
  getOptimalDimensions(container: HTMLElement, config?: CanvasScalingConfig): CanvasContainerDimensions;
  setupResizeObserver(canvas: HTMLCanvasElement, container: HTMLElement, config?: CanvasScalingConfig): ResizeObserver;
  calculateScalingMetrics(containerDims: CanvasContainerDimensions, config?: CanvasScalingConfig): CanvasRenderingMetrics;
  applyCanvasScaling(canvas: HTMLCanvasElement, metrics: CanvasRenderingMetrics): void;
  getCanvasMetrics(canvas: HTMLCanvasElement): CanvasRenderingMetrics | null;
}

/**
 * Responsive Canvas Manager Implementation
 * Requirements: 8.1, 8.2, 8.3 - Full container utilization with proper scaling
 */
export class ResponsiveCanvasManager implements IResponsiveCanvasManager {
  private readonly defaultConfig: Required<Pick<CanvasScalingConfig, 'maintainAspectRatio' | 'fillContainer' | 'scalingFactor'>> & CanvasScalingConfig = {
    maintainAspectRatio: true,
    fillContainer: true,
    scalingFactor: 1.0
  };

  private fallbackSystem: ICanvasFallbackSystem | null = null;

  /**
   * Set fallback system (used to avoid circular dependencies)
   */
  setFallbackSystem(fallbackSystem: ICanvasFallbackSystem): void {
    this.fallbackSystem = fallbackSystem;
  }

  /**
   * Initialize canvas to fill entire container space with fallback support
   * Requirements: 8.1, 8.4 - Canvas initialization with fallback handling
   */
  initializeCanvas(container: HTMLElement, config: CanvasScalingConfig = {}): HTMLCanvasElement {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Validate canvas support first (if fallback system is available)
      if (this.fallbackSystem && !this.fallbackSystem.validateCanvasSupport()) {
        console.warn('Canvas support validation failed, using fallback');
        return this.fallbackSystem.createFallbackCanvas(container);
      }

      // Create canvas element
      const canvas = document.createElement('canvas');
      
      // Set initial canvas properties
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.border = '1px solid #e5e7eb';
      canvas.style.borderRadius = '8px';
      canvas.style.backgroundColor = '#ffffff';
      
      // Get container dimensions and calculate optimal canvas size
      const containerDims = this.getOptimalDimensions(container, finalConfig);
      console.log('Container dimensions:', containerDims);
      
      const metrics = this.calculateScalingMetrics(containerDims, finalConfig);
      console.log('Canvas metrics:', metrics);
      
      // Apply initial sizing
      this.applyCanvasScaling(canvas, metrics);
      
      // Test canvas functionality (if fallback system is available)
      if (this.fallbackSystem && !this.fallbackSystem.testCanvasOperations(canvas)) {
        console.warn('Canvas operations test failed, using fallback');
        return this.fallbackSystem.createFallbackCanvas(container);
      }
      
      // Append to container
      container.appendChild(canvas);
      
      // Initialize canvas with white background
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
      }
      
      return canvas;
      
    } catch (error) {
      console.error('Canvas initialization failed:', error);
      if (this.fallbackSystem) {
        return this.fallbackSystem.createFallbackCanvas(container);
      }
      // Emergency fallback if no fallback system
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);
      return canvas;
    }
  }

  /**
   * Update canvas size based on container dimensions with error recovery
   * Requirements: 8.2, 8.4, 8.5 - Automatic resizing with fallback and aspect ratio maintenance
   */
  updateCanvasSize(canvas: HTMLCanvasElement, container: HTMLElement, config: CanvasScalingConfig = {}): CanvasRenderingMetrics {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Get current container dimensions
      const containerDims = this.getOptimalDimensions(container, finalConfig);
      
      // Calculate new scaling metrics
      const metrics = this.calculateScalingMetrics(containerDims, finalConfig);
      
      // Apply new scaling with error handling
      this.applyCanvasScaling(canvas, metrics);
      
      // Maintain aspect ratio if required (if fallback system is available)
      if (this.fallbackSystem && finalConfig.maintainAspectRatio && finalConfig.aspectRatio) {
        this.fallbackSystem.maintainAspectRatio(canvas, finalConfig.aspectRatio);
      }
      
      return metrics;
      
    } catch (error) {
      console.warn('Canvas resize failed, attempting recovery:', error);
      
      // Try to recover with fallback dimensions
      const fallbackMetrics: CanvasRenderingMetrics = {
        containerWidth: container.clientWidth || 600,
        containerHeight: container.clientHeight || 400,
        canvasWidth: container.clientWidth || 600,
        canvasHeight: container.clientHeight || 400,
        scalingFactor: 1.0,
        devicePixelRatio: window.devicePixelRatio || 1,
        actualRenderWidth: container.clientWidth || 600,
        actualRenderHeight: container.clientHeight || 400
      };
      
      // Apply fallback sizing
      try {
        canvas.width = fallbackMetrics.canvasWidth;
        canvas.height = fallbackMetrics.canvasHeight;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      } catch (fallbackError) {
        console.error('Fallback canvas sizing also failed:', fallbackError);
      }
      
      return fallbackMetrics;
    }
  }

  /**
   * Get optimal dimensions for canvas based on container
   * Requirements: 8.1, 8.2 - Calculate proper dimensions for full coverage
   */
  getOptimalDimensions(container: HTMLElement, config: CanvasScalingConfig = {}): CanvasContainerDimensions {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Get container's computed dimensions
    const containerRect = container.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(container);
    
    // Calculate available space (excluding padding)
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    
    const availableWidth = containerRect.width - paddingLeft - paddingRight;
    const availableHeight = containerRect.height - paddingTop - paddingBottom;
    
    // Apply constraints if specified
    let finalWidth = availableWidth;
    let finalHeight = availableHeight;
    
    if (finalConfig.maxWidth && finalWidth > finalConfig.maxWidth) {
      finalWidth = finalConfig.maxWidth;
    }
    if (finalConfig.maxHeight && finalHeight > finalConfig.maxHeight) {
      finalHeight = finalConfig.maxHeight;
    }
    if (finalConfig.minWidth && finalWidth < finalConfig.minWidth) {
      finalWidth = finalConfig.minWidth;
    }
    if (finalConfig.minHeight && finalHeight < finalConfig.minHeight) {
      finalHeight = finalConfig.minHeight;
    }
    
    // Ensure minimum viable dimensions
    finalWidth = Math.max(finalWidth, 200);
    finalHeight = Math.max(finalHeight, 150);
    
    return {
      width: finalWidth,
      height: finalHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      aspectRatio: finalWidth / finalHeight
    };
  }

  /**
   * Setup resize observer for automatic canvas resizing
   * Requirements: 8.2 - Automatic canvas resizing to maintain full coverage
   */
  setupResizeObserver(canvas: HTMLCanvasElement, container: HTMLElement, config: CanvasScalingConfig = {}): ResizeObserver {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          // Debounce resize operations
          this.debounceResize(() => {
            this.updateCanvasSize(canvas, container, finalConfig);
          }, 100);
        }
      }
    });
    
    resizeObserver.observe(container);
    return resizeObserver;
  }

  /**
   * Calculate scaling metrics for canvas rendering
   * Requirements: 8.3 - Add proper scaling calculations to maintain content quality
   */
  calculateScalingMetrics(containerDims: CanvasContainerDimensions, config: CanvasScalingConfig = {}): CanvasRenderingMetrics {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    let canvasWidth = containerDims.width;
    let canvasHeight = containerDims.height;
    
    // Apply aspect ratio constraints if needed
    if (finalConfig.maintainAspectRatio && finalConfig.aspectRatio) {
      const targetAspectRatio = finalConfig.aspectRatio;
      const containerAspectRatio = containerDims.aspectRatio;
      
      if (containerAspectRatio > targetAspectRatio) {
        // Container is wider than target aspect ratio
        canvasWidth = canvasHeight * targetAspectRatio;
      } else {
        // Container is taller than target aspect ratio
        canvasHeight = canvasWidth / targetAspectRatio;
      }
    }
    
    // Calculate scaling factor
    const baseScalingFactor = finalConfig.scalingFactor || 1.0;
    const devicePixelRatio = containerDims.devicePixelRatio;
    const finalScalingFactor = baseScalingFactor * devicePixelRatio;
    
    // Calculate actual render dimensions (for high-DPI displays)
    const actualRenderWidth = canvasWidth * finalScalingFactor;
    const actualRenderHeight = canvasHeight * finalScalingFactor;
    
    return {
      containerWidth: containerDims.width,
      containerHeight: containerDims.height,
      canvasWidth,
      canvasHeight,
      scalingFactor: finalScalingFactor,
      devicePixelRatio,
      actualRenderWidth,
      actualRenderHeight
    };
  }

  /**
   * Apply calculated scaling to canvas element
   * Requirements: 8.3 - Ensure proper scaling and positioning within full canvas area
   */
  applyCanvasScaling(canvas: HTMLCanvasElement, metrics: CanvasRenderingMetrics): void {
    // Set canvas internal dimensions (for rendering)
    canvas.width = metrics.actualRenderWidth;
    canvas.height = metrics.actualRenderHeight;
    
    // Set canvas display dimensions (CSS)
    canvas.style.width = `${metrics.canvasWidth}px`;
    canvas.style.height = `${metrics.canvasHeight}px`;
    
    // Get canvas context and apply scaling
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Scale context for high-DPI rendering
      ctx.scale(metrics.scalingFactor, metrics.scalingFactor);
      
      // Set image smoothing for quality
      ctx.imageSmoothingEnabled = true;
      if (ctx.imageSmoothingQuality) {
        ctx.imageSmoothingQuality = metrics.devicePixelRatio > 1 ? 'high' : 'medium';
      }
    }
  }

  /**
   * Debounce resize operations to prevent excessive updates
   */
  private debounceResize(func: () => void, delay: number): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(func, delay);
  }

  private resizeTimeout: NodeJS.Timeout | null = null;

  /**
   * Get canvas metrics for debugging and optimization
   */
  getCanvasMetrics(canvas: HTMLCanvasElement): CanvasRenderingMetrics | null {
    const container = canvas.parentElement;
    if (!container) return null;
    
    const containerDims = this.getOptimalDimensions(container);
    return this.calculateScalingMetrics(containerDims);
  }

  /**
   * Validate canvas configuration
   */
  validateConfig(config: CanvasScalingConfig): boolean {
    if (config.maxWidth && config.minWidth && config.maxWidth < config.minWidth) {
      return false;
    }
    if (config.maxHeight && config.minHeight && config.maxHeight < config.minHeight) {
      return false;
    }
    if (config.scalingFactor && (config.scalingFactor <= 0 || config.scalingFactor > 5)) {
      return false;
    }
    return true;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }
}

/**
 * Create responsive canvas manager instance
 */
export function createResponsiveCanvasManager(): IResponsiveCanvasManager {
  const manager = new ResponsiveCanvasManager();
  
  // Set up fallback system integration (lazy loading to avoid circular dependencies)
  try {
    import('./canvasFallbackSystem').then(module => {
      manager.setFallbackSystem(module.canvasFallbackSystem);
    }).catch(error => {
      console.warn('Failed to load canvas fallback system:', error);
    });
  } catch (error) {
    console.warn('Canvas fallback system not available:', error);
  }
  
  return manager;
}

/**
 * Default responsive canvas manager instance
 */
export const responsiveCanvasManager = createResponsiveCanvasManager();
