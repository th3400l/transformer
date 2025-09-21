/**
 * Responsive Canvas Scaler
 * Handles advanced canvas scaling and positioning calculations
 * Requirements: 8.3 - Proper scaling and positioning to utilize complete canvas area
 */

import { CanvasRenderingMetrics, CanvasScalingConfig } from './responsiveCanvasManager';

export interface ScalingStrategy {
  name: string;
  calculate: (containerWidth: number, containerHeight: number, config: CanvasScalingConfig) => CanvasRenderingMetrics;
}

export interface ContentFitOptions {
  objectFit: 'fill' | 'contain' | 'cover' | 'scale-down' | 'none';
  objectPosition: string;
  preserveAspectRatio: boolean;
}

export interface CanvasPositioning {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

export interface IResponsiveCanvasScaler {
  calculateFillStrategy(containerWidth: number, containerHeight: number, config: CanvasScalingConfig): CanvasRenderingMetrics;
  calculateContainStrategy(containerWidth: number, containerHeight: number, config: CanvasScalingConfig): CanvasRenderingMetrics;
  calculateCoverStrategy(containerWidth: number, containerHeight: number, config: CanvasScalingConfig): CanvasRenderingMetrics;
  calculateOptimalScaling(containerWidth: number, containerHeight: number, targetAspectRatio?: number): CanvasPositioning;
  applyContentFit(canvas: HTMLCanvasElement, container: HTMLElement, options: ContentFitOptions): void;
  getScalingStrategy(strategyName: string): ScalingStrategy | null;
}

/**
 * Responsive Canvas Scaler Implementation
 * Requirements: 8.3 - Advanced scaling calculations for full space utilization
 */
export class ResponsiveCanvasScaler implements IResponsiveCanvasScaler {
  private strategies: Map<string, ScalingStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize scaling strategies
   */
  private initializeStrategies(): void {
    this.strategies.set('fill', {
      name: 'fill',
      calculate: (width, height, config) => this.calculateFillStrategy(width, height, config)
    });

    this.strategies.set('contain', {
      name: 'contain',
      calculate: (width, height, config) => this.calculateContainStrategy(width, height, config)
    });

    this.strategies.set('cover', {
      name: 'cover',
      calculate: (width, height, config) => this.calculateCoverStrategy(width, height, config)
    });
  }

  /**
   * Calculate fill strategy - stretch to fill entire container
   * Requirements: 8.1, 8.3 - Fill entire available container space
   */
  calculateFillStrategy(containerWidth: number, containerHeight: number, config: CanvasScalingConfig): CanvasRenderingMetrics {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scalingFactor = (config.scalingFactor || 1.0) * devicePixelRatio;

    return {
      containerWidth,
      containerHeight,
      canvasWidth: containerWidth,
      canvasHeight: containerHeight,
      scalingFactor,
      devicePixelRatio,
      actualRenderWidth: containerWidth * scalingFactor,
      actualRenderHeight: containerHeight * scalingFactor
    };
  }

  /**
   * Calculate contain strategy - fit within container while maintaining aspect ratio
   * Requirements: 8.5 - Maintain aspect ratio during canvas resizing
   */
  calculateContainStrategy(containerWidth: number, containerHeight: number, config: CanvasScalingConfig): CanvasRenderingMetrics {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scalingFactor = (config.scalingFactor || 1.0) * devicePixelRatio;
    
    // Default aspect ratio if not specified
    const targetAspectRatio = (config as any).aspectRatio || (4 / 3);
    const containerAspectRatio = containerWidth / containerHeight;
    
    let canvasWidth: number;
    let canvasHeight: number;
    
    if (containerAspectRatio > targetAspectRatio) {
      // Container is wider - fit to height
      canvasHeight = containerHeight;
      canvasWidth = canvasHeight * targetAspectRatio;
    } else {
      // Container is taller - fit to width
      canvasWidth = containerWidth;
      canvasHeight = canvasWidth / targetAspectRatio;
    }

    return {
      containerWidth,
      containerHeight,
      canvasWidth,
      canvasHeight,
      scalingFactor,
      devicePixelRatio,
      actualRenderWidth: canvasWidth * scalingFactor,
      actualRenderHeight: canvasHeight * scalingFactor
    };
  }

  /**
   * Calculate cover strategy - fill container while maintaining aspect ratio (may crop)
   * Requirements: 8.3 - Utilize complete canvas area with proper scaling
   */
  calculateCoverStrategy(containerWidth: number, containerHeight: number, config: CanvasScalingConfig): CanvasRenderingMetrics {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scalingFactor = (config.scalingFactor || 1.0) * devicePixelRatio;
    
    // Default aspect ratio if not specified
    const targetAspectRatio = (config as any).aspectRatio || (4 / 3);
    const containerAspectRatio = containerWidth / containerHeight;
    
    let canvasWidth: number;
    let canvasHeight: number;
    
    if (containerAspectRatio > targetAspectRatio) {
      // Container is wider - fit to width
      canvasWidth = containerWidth;
      canvasHeight = canvasWidth / targetAspectRatio;
    } else {
      // Container is taller - fit to height
      canvasHeight = containerHeight;
      canvasWidth = canvasHeight * targetAspectRatio;
    }

    return {
      containerWidth,
      containerHeight,
      canvasWidth,
      canvasHeight,
      scalingFactor,
      devicePixelRatio,
      actualRenderWidth: canvasWidth * scalingFactor,
      actualRenderHeight: canvasHeight * scalingFactor
    };
  }

  /**
   * Calculate optimal scaling for content positioning
   * Requirements: 8.3 - Proper scaling and positioning calculations
   */
  calculateOptimalScaling(containerWidth: number, containerHeight: number, targetAspectRatio?: number): CanvasPositioning {
    const aspectRatio = targetAspectRatio || (containerWidth / containerHeight);
    
    // Calculate dimensions that maintain aspect ratio
    let width = containerWidth;
    let height = containerHeight;
    let scaleX = 1;
    let scaleY = 1;
    
    const containerAspectRatio = containerWidth / containerHeight;
    
    if (containerAspectRatio > aspectRatio) {
      // Container is wider than target
      width = containerHeight * aspectRatio;
      scaleX = width / containerWidth;
    } else if (containerAspectRatio < aspectRatio) {
      // Container is taller than target
      height = containerWidth / aspectRatio;
      scaleY = height / containerHeight;
    }
    
    // Center the content
    const x = (containerWidth - width) / 2;
    const y = (containerHeight - height) / 2;
    
    return {
      x,
      y,
      width,
      height,
      scaleX,
      scaleY
    };
  }

  /**
   * Apply content fit options to canvas
   * Requirements: 8.3 - Proper positioning within canvas area
   */
  applyContentFit(canvas: HTMLCanvasElement, container: HTMLElement, options: ContentFitOptions): void {
    const containerRect = container.getBoundingClientRect();
    
    switch (options.objectFit) {
      case 'fill':
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'fill';
        break;
        
      case 'contain':
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        break;
        
      case 'cover':
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'cover';
        break;
        
      case 'scale-down':
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'scale-down';
        break;
        
      case 'none':
        canvas.style.objectFit = 'none';
        break;
    }
    
    // Apply object position
    canvas.style.objectPosition = options.objectPosition;
  }

  /**
   * Get scaling strategy by name
   */
  getScalingStrategy(strategyName: string): ScalingStrategy | null {
    return this.strategies.get(strategyName) || null;
  }

  /**
   * Calculate responsive scaling based on device characteristics
   * Requirements: 8.2, 8.3 - Device-aware scaling calculations
   */
  calculateResponsiveScaling(containerWidth: number, containerHeight: number, config: CanvasScalingConfig): CanvasRenderingMetrics {
    // Detect device characteristics
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isHighDPI = window.devicePixelRatio > 1.5;
    
    // Adjust scaling based on device
    let adjustedConfig = { ...config };
    
    if (isMobile) {
      // Mobile optimizations
      adjustedConfig.scalingFactor = Math.min(adjustedConfig.scalingFactor || 1.0, 2.0);
      if (!isHighDPI) {
        adjustedConfig.scalingFactor = Math.min(adjustedConfig.scalingFactor, 1.5);
      }
    } else if (isTablet) {
      // Tablet optimizations
      adjustedConfig.scalingFactor = Math.min(adjustedConfig.scalingFactor || 1.0, 2.5);
    }
    
    // Use appropriate strategy
    const strategy = config.fillContainer ? 'fill' : 'contain';
    const scalingStrategy = this.getScalingStrategy(strategy);
    
    if (scalingStrategy) {
      return scalingStrategy.calculate(containerWidth, containerHeight, adjustedConfig);
    }
    
    // Fallback to fill strategy
    return this.calculateFillStrategy(containerWidth, containerHeight, adjustedConfig);
  }

  /**
   * Calculate minimum viable canvas dimensions
   * Requirements: 8.1 - Ensure canvas has minimum usable size
   */
  calculateMinimumDimensions(containerWidth: number, containerHeight: number): { width: number; height: number } {
    const minWidth = Math.max(200, containerWidth * 0.3);
    const minHeight = Math.max(150, containerHeight * 0.3);
    
    return {
      width: Math.min(minWidth, containerWidth),
      height: Math.min(minHeight, containerHeight)
    };
  }

  /**
   * Validate scaling configuration
   */
  validateScalingConfig(config: CanvasScalingConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (config.scalingFactor && (config.scalingFactor <= 0 || config.scalingFactor > 5)) {
      errors.push('Scaling factor must be between 0 and 5');
    }
    
    if (config.maxWidth && config.minWidth && config.maxWidth < config.minWidth) {
      errors.push('Maximum width cannot be less than minimum width');
    }
    
    if (config.maxHeight && config.minHeight && config.maxHeight < config.minHeight) {
      errors.push('Maximum height cannot be less than minimum height');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create responsive canvas scaler instance
 */
export function createResponsiveCanvasScaler(): IResponsiveCanvasScaler {
  return new ResponsiveCanvasScaler();
}

/**
 * Default responsive canvas scaler instance
 */
export const responsiveCanvasScaler = createResponsiveCanvasScaler();