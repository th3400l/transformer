// Core canvas rendering system - Base classes and core logic
// Requirements: 2.1, 2.2, 2.3, 2.4, 8.1, 8.3

import { 
  ICanvasRenderer, 
  ITextVariationEngine, 
  IPaperTextureManager,
  RenderingConfig,
  RenderingContext,
  PaperTexture,
  PaperTemplate
} from '../types';
import { CanvasRenderError } from '../types/errors';
import { getCanvasPool, PooledCanvas } from './canvasPool';
import { getQualityManager } from './qualityManager';
import { IInkRenderingSystem, createInkRenderingSystem } from './inkRenderingSystem';
import { 
  IResponsiveCanvasManager, 
  responsiveCanvasManager, 
  CanvasScalingConfig,
  CanvasRenderingMetrics 
} from './responsiveCanvasManager';
import { 
  IResponsiveCanvasScaler, 
  responsiveCanvasScaler 
} from './responsiveCanvasScaler';

/**
 * Abstract base canvas renderer implementing SOLID principles
 * Provides dependency injection and extensible architecture
 * Requirements: 6.1 (SOLID architecture), 2.4, 2.5 (canvas rendering)
 */
export abstract class BaseCanvasRenderer implements ICanvasRenderer {
  protected textEngine: ITextVariationEngine;
  protected textureManager: IPaperTextureManager;
  protected inkRenderingSystem: IInkRenderingSystem;
  protected renderingQuality: number = 1.0;
  protected useCanvasPooling: boolean = false;
  protected responsiveCanvasManager: IResponsiveCanvasManager;
  protected responsiveCanvasScaler: IResponsiveCanvasScaler;
  protected performanceMetrics: {
    renderTime: number;
    memoryUsage: number;
    frameRate: number;
  } = { renderTime: 0, memoryUsage: 0, frameRate: 60 };

  /**
   * Constructor with dependency injection (Dependency Inversion Principle)
   * @param textEngine - Text variation engine for realistic handwriting effects
   * @param textureManager - Paper texture manager for background rendering
   */
  constructor(textEngine: ITextVariationEngine, textureManager: IPaperTextureManager) {
    this.textEngine = textEngine;
    this.textureManager = textureManager;
    this.inkRenderingSystem = createInkRenderingSystem();
    this.responsiveCanvasManager = responsiveCanvasManager;
    this.responsiveCanvasScaler = responsiveCanvasScaler;
  }

  /**
   * Abstract render method to be implemented by concrete classes (Open/Closed Principle)
   * @param config - Rendering configuration
   * @returns Promise resolving to rendered canvas
   */
  abstract render(config: RenderingConfig): Promise<HTMLCanvasElement>;

  /**
   * Set text variation engine (Dependency Inversion Principle)
   * @param engine - New text variation engine
   */
  setTextEngine(engine: ITextVariationEngine): void {
    this.textEngine = engine;
  }

  /**
   * Set paper texture manager (Dependency Inversion Principle)
   * @param manager - New paper texture manager
   */
  setTextureManager(manager: IPaperTextureManager): void {
    this.textureManager = manager;
  }

  /**
   * Set rendering quality for high-DPI displays with mobile optimization
   * Requirements: 5.1, 5.2 - Mobile performance optimization
   * @param quality - Quality multiplier (1.0 = normal, 2.0 = retina)
   */
  setRenderingQuality(quality: number): void {
    // Cap quality based on device capabilities
    const maxQuality = this.getMaxRenderingQuality();
    this.renderingQuality = Math.max(0.5, Math.min(maxQuality, quality));
  }

  /**
   * Get maximum rendering quality based on device capabilities
   * Requirements: 5.1, 5.2 - Device-specific performance optimization
   */
  private getMaxRenderingQuality(): number {
    // Detect device capabilities
    const isMobile = window.innerWidth < 768;
    const isLowEndDevice = this.isLowEndDevice();
    
    if (isMobile && isLowEndDevice) {
      return 1.0; // Standard quality for low-end mobile
    } else if (isMobile) {
      return 1.5; // Moderate quality for mobile
    } else {
      return 3.0; // Full quality for desktop
    }
  }

  /**
   * Detect low-end device characteristics
   * Requirements: 5.1, 5.2 - Performance optimization for lower-end devices
   */
  protected isLowEndDevice(): boolean {
    // Check for device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory <= 2) {
      return true;
    }

    // Check for hardware concurrency (CPU cores)
    const hardwareConcurrency = navigator.hardwareConcurrency;
    if (hardwareConcurrency && hardwareConcurrency <= 2) {
      return true;
    }

    // Check for connection type (if available)
    const connection = (navigator as any).connection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return true;
    }

    return false;
  }

  /**
   * Get current rendering quality
   * @returns Current quality multiplier
   */
  getRenderingQuality(): number {
    return this.renderingQuality;
  }

  /**
   * Create responsive canvas that fills entire container space
   * Requirements: 8.1, 8.2, 8.3 - Canvas initialization, resizing, and scaling for full space utilization
   * @param container - Container element for the canvas
   * @param config - Canvas scaling configuration
   * @returns Canvas element with context and metrics
   */
  protected createResponsiveCanvas(container?: HTMLElement, config?: CanvasScalingConfig): { 
    canvas: HTMLCanvasElement; 
    ctx: CanvasRenderingContext2D; 
    metrics: CanvasRenderingMetrics;
    pooled?: PooledCanvas 
  } {
    // If container is provided, use responsive canvas management
    if (container) {
      const canvas = this.responsiveCanvasManager.initializeCanvas(container, config);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new CanvasRenderError('Failed to get 2D rendering context for responsive canvas');
      }
      
      const metrics = this.responsiveCanvasManager.getCanvasMetrics(canvas);
      if (!metrics) {
        throw new CanvasRenderError('Failed to get canvas metrics');
      }
      
      return { canvas, ctx, metrics };
    }
    
    // Fallback to traditional canvas creation
    const fallbackResult = this.createCanvas(800, 600);
    const fallbackMetrics: CanvasRenderingMetrics = {
      containerWidth: 800,
      containerHeight: 600,
      canvasWidth: 800,
      canvasHeight: 600,
      scalingFactor: 1.0,
      devicePixelRatio: window.devicePixelRatio || 1,
      actualRenderWidth: 800,
      actualRenderHeight: 600
    };
    
    return {
      canvas: fallbackResult.canvas,
      ctx: fallbackResult.ctx,
      metrics: fallbackMetrics,
      pooled: fallbackResult.pooled
    };
  }

  /**
   * Protected method to create canvas with proper dimensions and quality
   * Requirements: 5.1, 5.2, 5.4, 5.5 - Responsive canvas creation with mobile optimization
   * @param width - Canvas width
   * @param height - Canvas height
   * @returns Canvas element with context or pooled canvas
   */
  protected createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; pooled?: PooledCanvas } {
    // Get quality manager for optimization settings
    const qualityManager = getQualityManager();
    const qualitySettings = qualityManager.getCurrentSettings();
    
    // Use canvas pooling if enabled (Requirements: 5.1, 5.2)
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let pooledCanvas: PooledCanvas | undefined;
    
    if (qualitySettings.enableCanvasPooling && this.useCanvasPooling) {
      const canvasPool = getCanvasPool();
      pooledCanvas = canvasPool.acquireCanvas(width, height);
      canvas = pooledCanvas.canvas;
      ctx = pooledCanvas.ctx;
    } else {
      canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new CanvasRenderError('Failed to get 2D rendering context');
      }
      ctx = context;
    }

    // Apply device-specific optimizations
    const isMobile = window.innerWidth < 768;
    const isLowEndDevice = this.isLowEndDevice();
    
    // Adjust quality for mobile devices (Requirements: 5.1, 5.2)
    let effectiveQuality = this.renderingQuality;
    if (isMobile && isLowEndDevice) {
      effectiveQuality = Math.min(effectiveQuality, 1.0);
    } else if (isMobile) {
      effectiveQuality = Math.min(effectiveQuality, 1.5);
    }

    // Set actual canvas size with quality multiplier
    const actualWidth = width * effectiveQuality;
    const actualHeight = height * effectiveQuality;
    
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    
    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale context for high-DPI rendering
    ctx.scale(effectiveQuality, effectiveQuality);
    
    // Apply rendering optimizations
    this.applyCanvasOptimizations(canvas, ctx, isMobile, isLowEndDevice);
    
    return { canvas, ctx, pooled: pooledCanvas };
  }

  /**
   * Apply canvas-specific optimizations based on device
   */
  private applyCanvasOptimizations(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    isMobile: boolean,
    isLowEndDevice: boolean
  ): void {
    if (isMobile) {
      // Enable touch-friendly interactions
      canvas.style.touchAction = 'pan-y';
      canvas.style.userSelect = 'none';
      canvas.style.webkitUserSelect = 'none';
      
      // Optimize for mobile rendering
      ctx.imageSmoothingEnabled = !isLowEndDevice;
      if (ctx.imageSmoothingQuality) {
        ctx.imageSmoothingQuality = isLowEndDevice ? 'low' : 'medium';
      }
    } else {
      // Desktop optimizations
      ctx.imageSmoothingEnabled = true;
      if (ctx.imageSmoothingQuality) {
        ctx.imageSmoothingQuality = 'high';
      }
    }
  }

  /**
   * Protected method to prepare rendering context
   * @param canvas - Canvas element
   * @param ctx - Canvas 2D context
   * @param paperTexture - Paper texture to render
   * @returns Rendering context object
   */
  protected createRenderingContext(
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    paperTexture: PaperTexture
  ): RenderingContext {
    // Get text metrics for the context
    const textMetrics = ctx.measureText('M'); // Use 'M' as baseline character
    
    return {
      canvas,
      ctx,
      paperTexture,
      textMetrics
    };
  }

  /**
   * Protected method to validate rendering configuration
   * @param config - Configuration to validate
   * @throws CanvasRenderError if configuration is invalid
   */
  protected validateConfig(config: RenderingConfig): void {
    if (config.canvasWidth <= 0 || config.canvasHeight <= 0) {
      throw new CanvasRenderError('Canvas dimensions must be positive');
    }
    
    if (!config.baseInkColor || !config.baseInkColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      throw new CanvasRenderError('Invalid base ink color format');
    }
    
    if (config.baselineJitterRange < 0 || config.slantJitterRange < 0) {
      throw new CanvasRenderError('Jitter ranges must be non-negative');
    }
  }

  /**
   * Protected method to dispose of canvas resources
   * @param canvas - Canvas to dispose
   */
  protected disposeCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Remove from DOM if attached
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}
