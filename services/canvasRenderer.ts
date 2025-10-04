// Canvas rendering system implementation for Gear-1 handwriting system
// Implements SOLID architecture with dependency injection
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.5, 6.1

import { 
  ICanvasRenderer, 
  ITextVariationEngine, 
  IPaperTextureManager,
  RenderingConfig,
  RenderingContext,
  CharacterMetrics,
  TextVariation,
  PaperTexture,
  PaperTemplate
} from '../types';
import { CanvasRenderError, CanvasMemoryError } from '../types/errors';
import { getCanvasPool, PooledCanvas } from './canvasPool';
import { getQualityManager } from './qualityManager';
import { IInkRenderingSystem, createInkRenderingSystem, InkColor } from './inkRenderingSystem';
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
import { computeHandwritingLayoutMetrics } from './layoutMetrics';

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
    
    // Apply mobile-specific canvas optimizations (Requirements: 5.1, 5.2)
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
    
    return { canvas, ctx, pooled: pooledCanvas };
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

/**
 * Concrete canvas renderer implementation
 * Handles realistic handwriting rendering with paper texture integration
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 (text variations), 2.4, 2.5 (canvas rendering)
 */
export class CanvasRenderer extends BaseCanvasRenderer {
  private readonly defaultFont: string = 'Arial, sans-serif';
  private readonly defaultFontSize: number = 16;
  private readonly lineHeight: number = 1.5;

  /**
   * Render handwritten text on paper texture with mobile optimizations
   * Requirements: 5.1, 5.2, 6.1, 6.2 - Mobile performance optimization
   * @param config - Rendering configuration
   * @returns Promise resolving to rendered canvas
   */
  async render(config: RenderingConfig): Promise<HTMLCanvasElement> {
    const startTime = performance.now();
    let pooledCanvas: PooledCanvas | undefined;
    let fallbackAttempted = false;
    
    try {
      return await this.attemptRender(config, startTime);
    } catch (error) {
      console.warn('Primary render attempt failed, trying fallback:', error);
      
      // Clean up any pooled canvas from failed attempt
      if (pooledCanvas) {
        const canvasPool = getCanvasPool();
        canvasPool.releaseCanvas(pooledCanvas);
        pooledCanvas = undefined;
      }
      
      // Attempt graceful degradation
      if (!fallbackAttempted) {
        fallbackAttempted = true;
        try {
          return await this.renderWithFallback(config, error as Error);
        } catch (fallbackError) {
          console.error('Fallback render also failed:', fallbackError);
          throw new CanvasRenderError('Canvas rendering failed after fallback attempt', fallbackError as Error);
        }
      }
      
      throw new CanvasRenderError('Canvas rendering failed', error as Error);
    }
  }

  /**
   * Attempt primary render with full features
   * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.5 - Error handling and graceful degradation
   */
  private async attemptRender(config: RenderingConfig, startTime: number): Promise<HTMLCanvasElement> {
    let pooledCanvas: PooledCanvas | undefined;
    
    try {
      // Validate configuration
      this.validateConfig(config);

      // Get quality manager and apply optimizations
      const qualityManager = getQualityManager();
      const optimizedConfig = this.applyMobileOptimizations(config, qualityManager);

      // Create canvas with proper dimensions and pooling
      const canvasResult = this.createCanvas(optimizedConfig.canvasWidth, optimizedConfig.canvasHeight);
      const { canvas, ctx } = canvasResult;
      pooledCanvas = canvasResult.pooled;

      // Set up text variation engine with config parameters
      const variationIntensity = (() => {
        switch (optimizedConfig.distortionLevel) {
          case 1:
            return 1.1;
          case 3:
            return 0.92;
          default:
            return 1.0;
        }
      })();
      this.textEngine.setVariationIntensity(variationIntensity);
      if (typeof this.textEngine.configureRanges === 'function') {
        this.textEngine.configureRanges({
          baselineJitterRange: optimizedConfig.baselineJitterRange,
          slantJitterRange: optimizedConfig.slantJitterRange,
          microTiltRange: optimizedConfig.microTiltRange,
          colorVariationIntensity: optimizedConfig.colorVariationIntensity
        });
      }

      // Load paper texture using texture manager with retry
      const paperTemplate = optimizedConfig.paperTemplate || this.getDefaultPaperTemplate();
      const paperTexture = await this.loadTextureWithRetry(paperTemplate);

      // Create rendering context
      const renderingContext = this.createRenderingContext(canvas, ctx, paperTexture);

      // Render paper background with proper scaling (uses normal blend mode internally)
      await this.renderPaperBackground(renderingContext, optimizedConfig);

      // Set up text rendering properties including blend mode for ink-paper integration
      this.setupTextRendering(ctx, optimizedConfig);

      // Render text with character-by-character variations (uses configured blend mode)
      await this.renderTextWithVariations(renderingContext, optimizedConfig, optimizedConfig.text);

      if (optimizedConfig.distortionLevel === 1) {
        this.applyLowQualityPaperDegradation(renderingContext);
      } else if (optimizedConfig.distortionLevel === 2) {
        this.applyMediumTextureSoftening(renderingContext);
      }

      this.applyGlobalToneDown(renderingContext, optimizedConfig);

      // Record performance metrics
      this.recordPerformanceMetrics(startTime);

      return canvas;

    } catch (error) {
      // Clean up pooled canvas on error
      if (pooledCanvas) {
        const canvasPool = getCanvasPool();
        canvasPool.releaseCanvas(pooledCanvas);
      }
      throw error;
    }
  }

  /**
   * Render with fallback options when primary render fails
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Graceful degradation when canvas operations fail
   */
  private async renderWithFallback(config: RenderingConfig, originalError: Error): Promise<HTMLCanvasElement> {

    
    // Create fallback configuration with reduced requirements
    const fallbackConfig = this.createFallbackConfig(config, originalError);
    
    let pooledCanvas: PooledCanvas | undefined;
    
    try {
      // Validate fallback configuration
      this.validateConfig(fallbackConfig);

      // Create canvas without pooling for fallback
      const canvasResult = this.createCanvas(fallbackConfig.canvasWidth, fallbackConfig.canvasHeight);
      const { canvas, ctx } = canvasResult;

      // Use minimal text variation for fallback
      this.textEngine.setVariationIntensity(0.1);

      // Try to load texture, use emergency texture if needed
      let paperTexture: PaperTexture;
      try {
        const paperTemplate = fallbackConfig.paperTemplate || this.getDefaultPaperTemplate();
        paperTexture = await this.textureManager.loadTexture(paperTemplate);
      } catch (textureError) {
        console.warn('Texture loading failed in fallback, using emergency texture:', textureError);
        paperTexture = await this.createEmergencyTexture();
      }

      // Create rendering context
      const renderingContext = this.createRenderingContext(canvas, ctx, paperTexture);

      // Render with simplified approach
      await this.renderFallbackBackground(renderingContext, fallbackConfig);
      this.setupFallbackTextRendering(ctx, fallbackConfig);
      await this.renderFallbackText(renderingContext, fallbackConfig);

      return canvas;

    } catch (error) {
      // Clean up pooled canvas on error
      if (pooledCanvas) {
        const canvasPool = getCanvasPool();
        canvasPool.releaseCanvas(pooledCanvas);
      }
      throw error;
    }
  }

  /**
   * Create fallback configuration based on the original error
   * Requirements: 6.5 - Memory management for large text rendering operations
   */
  private createFallbackConfig(config: RenderingConfig, error: Error): RenderingConfig {
    const fallbackConfig = { ...config };
    
    // Reduce canvas size if memory error
    if (error.message.includes('memory') || error.message.includes('Memory')) {
      fallbackConfig.canvasWidth = Math.min(config.canvasWidth, 800);
      fallbackConfig.canvasHeight = Math.min(config.canvasHeight, 600);

    }
    
    // Reduce text length if too large
    if (config.text && config.text.length > 1000) {
      fallbackConfig.text = config.text.substring(0, 1000) + '...';

    }
    
    // Disable advanced features
    fallbackConfig.colorVariationIntensity = 0.1;
    fallbackConfig.baselineJitterRange = 0.1;
    fallbackConfig.slantJitterRange = 0.1;
    
    return fallbackConfig;
  }

  /**
   * Load texture with retry mechanism
   * Requirements: 6.5 - Add retry mechanisms for network-related template loading failures
   */
  private async loadTextureWithRetry(paperTemplate: PaperTemplate, maxRetries: number = 2): Promise<PaperTexture> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.textureManager.loadTexture(paperTemplate);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Texture load attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('Texture loading failed after retries');
  }

  /**
   * Apply mobile optimizations to rendering configuration
   * Requirements: 5.1, 5.2 - Mobile-specific optimizations
   */
  private applyMobileOptimizations(config: RenderingConfig, qualityManager: any): RenderingConfig {
    const qualitySettings = qualityManager.getCurrentSettings();
    const canvasConfig = qualityManager.getCanvasConfig(config.canvasWidth, config.canvasHeight);
    
    const colorIntensityScale = 0.9 + (qualitySettings.textureQuality ?? 1) * 0.15;

    return {
      ...config,
      canvasWidth: canvasConfig.width,
      canvasHeight: canvasConfig.height,
      renderingQuality: qualitySettings.renderingQuality,
      textureCache: qualitySettings.enableCanvasPooling,
      colorVariationIntensity: Math.max(0.025, config.colorVariationIntensity * colorIntensityScale),
      baselineJitterRange: config.baselineJitterRange,
      slantJitterRange: config.slantJitterRange,
      microTiltRange: config.microTiltRange,
      distortionLevel: config.distortionLevel
    };
  }

  /**
   * Record performance metrics for adaptive optimization
   * Requirements: 5.1, 5.2 - Performance monitoring
   */
  private recordPerformanceMetrics(startTime: number): void {
    const endTime = performance.now();
    this.performanceMetrics.renderTime = endTime - startTime;
    
    // Record memory usage if available
    const memory = (performance as any).memory;
    if (memory) {
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize;
    }
    
    // Adapt quality based on performance
    const qualityManager = getQualityManager();
    qualityManager.adaptQualityBasedOnPerformance(this.performanceMetrics);
  }

  /**
   * Enable or disable canvas pooling
   * Requirements: 5.1, 5.2 - Canvas pooling control
   */
  setCanvasPooling(enabled: boolean): void {
    this.useCanvasPooling = enabled;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get default paper template when none is specified
   */
  private getDefaultPaperTemplate(): PaperTemplate {
    return {
      id: 'blank-1',
      name: 'Default Blank',
      filename: 'blank-1.jpeg',
      type: 'blank'
    };
  }

  /**
   * Render paper background with proper scaling and texture integration
   * Requirements: 2.4, 2.5, 2.7 (paper texture rendering and scaling)
   */
  private async renderPaperBackground(context: RenderingContext, config: RenderingConfig): Promise<void> {
    const { ctx, paperTexture } = context;
    
    if (!paperTexture.isLoaded || !paperTexture.baseImage) {
      // Fallback to white background if texture not available
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
      return;
    }

    // Calculate scaling to fit canvas while maintaining aspect ratio
    const baseWidth = paperTexture.baseImage.naturalWidth || paperTexture.baseImage.width;
    const baseHeight = paperTexture.baseImage.naturalHeight || paperTexture.baseImage.height;
    const scaleX = config.canvasWidth / baseWidth;
    const scaleY = config.canvasHeight / baseHeight;
    const scale = Math.max(scaleX, scaleY); // Cover the entire canvas

    // Calculate centered position
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    const offsetX = (config.canvasWidth - scaledWidth) / 2;
    const offsetY = (config.canvasHeight - scaledHeight) / 2;

    // Render base paper texture (background always uses source-over)
    ctx.drawImage(
      paperTexture.baseImage,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    // Render lines overlay if available (for lined paper templates)
    if (paperTexture.linesImage) {
      const linesWidth = paperTexture.linesImage.naturalWidth || paperTexture.linesImage.width;
      const linesHeight = paperTexture.linesImage.naturalHeight || paperTexture.linesImage.height;
      const linesScale = Math.max(config.canvasWidth / linesWidth, config.canvasHeight / linesHeight);
      const linesDrawWidth = linesWidth * linesScale;
      const linesDrawHeight = linesHeight * linesScale;
      const linesOffsetX = (config.canvasWidth - linesDrawWidth) / 2;
      const linesOffsetY = (config.canvasHeight - linesDrawHeight) / 2;
      ctx.drawImage(
        paperTexture.linesImage,
        linesOffsetX,
        linesOffsetY,
        linesDrawWidth,
        linesDrawHeight
      );
    }
  }

  /**
   * Set up text rendering properties with enhanced ink rendering
   * Requirements: 1.3 (off-black color), font configuration, 2.4, 2.5 (multiply blend mode), 5.1, 5.2, 5.3, 5.4, 5.5 (realistic ink)
   */
  private setupTextRendering(ctx: CanvasRenderingContext2D, config: RenderingConfig): void {
    // Set font properties using config or defaults
    const fontSize = config.fontSize || this.defaultFontSize;
    const fontFamily = config.fontFamily || this.defaultFont;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    
    // Apply subtle shadow to soften edges and blend with textures
    const level = config.distortionLevel ?? 2;
    if (level === 1) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
      ctx.shadowBlur = 0.7;
    } else if (level === 2) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.11)';
      ctx.shadowBlur = 0.55;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 0.4;
    }

    // Determine ink color from config or detect from base color
    const inkColorName = this.detectInkColorName(config.baseInkColor);
    const inkColor = this.inkRenderingSystem.getInkColorByName(inkColorName);
    
    if (inkColor) {
      if (typeof (this.textEngine as any).setBaseInkColor === 'function') {
        (this.textEngine as any).setBaseInkColor(inkColor.baseColor);
      }
      // Use realistic ink rendering (Requirements: 5.1, 5.2, 5.3, 5.4, 5.5)
      const inkResult = this.inkRenderingSystem.renderRealisticInk(inkColor, 1.0);
      
      // Apply ink texture effects
      this.inkRenderingSystem.applyInkTexture(ctx, inkColor);

      ctx.fillStyle = inkResult.color;
      ctx.globalAlpha = inkResult.opacity;
      ctx.globalCompositeOperation = inkResult.blendMode as GlobalCompositeOperation;
    } else {
      if (typeof (this.textEngine as any).setBaseInkColor === 'function') {
        (this.textEngine as any).setBaseInkColor(config.baseInkColor);
      }
      // Fallback to original rendering
      ctx.fillStyle = config.baseInkColor;
      ctx.globalCompositeOperation = config.blendMode as GlobalCompositeOperation;
    }
  }

  /**
   * Render text with character-by-character variations and realistic handwriting effects
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 (text variations), 2.4, 2.5 (multiply blend mode)
   */
  private async renderTextWithVariations(context: RenderingContext, config: RenderingConfig, text?: string): Promise<void> {
    const { ctx } = context;
    
    // Use provided text or default sample text
    const fontSize = config.fontSize || this.defaultFontSize;
    const layoutMetrics = computeHandwritingLayoutMetrics({
      canvasWidth: config.canvasWidth,
      canvasHeight: config.canvasHeight,
      fontSize,
      baselineJitterRange: config.baselineJitterRange,
      distortionLevel: config.distortionLevel
    });

    const textToRender = text || 'Sample handwritten text with realistic variations';
    
    const lines = this.splitTextIntoLines(textToRender, layoutMetrics.availableWidth, ctx);
    
    let currentY = layoutMetrics.topMargin;
    const leftMargin = layoutMetrics.sideMargin;

    for (let i = 0; i < lines.length; i++) {
      if (i >= layoutMetrics.linesPerPage) {
        break;
      }
      const line = lines[i];
      await this.renderLineWithVariations(ctx, line, leftMargin, currentY, config);
      currentY += layoutMetrics.lineSpacing;
    }

    // Reset shadow to avoid bleeding into other drawing operations
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  /**
   * Split text into lines that fit within the specified width
   */
  private splitTextIntoLines(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
    const lines: string[] = [];
    const paragraphs = (text || '').split(/\r?\n/);

    for (const paragraph of paragraphs) {
      if (paragraph.trim().length === 0) {
        lines.push('');
        continue;
      }

      const words = paragraph.split(/\s+/).filter(Boolean);
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  /**
   * Render a single line of text with character-by-character variations
   * Requirements: 1.1, 1.2, 1.4, 1.5 (individual character variations)
   */
  private async renderLineWithVariations(
    ctx: CanvasRenderingContext2D, 
    line: string, 
    startX: number, 
    startY: number, 
    config: RenderingConfig
  ): Promise<void> {
    let currentX = startX;
    
    // Render each character individually with variations
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Skip spaces but advance position
      if (char === ' ') {
        const baseSpace = ctx.measureText(' ').width;
        const variationSeed = Math.sin((i + 1) * 13.37) * 0.5 + 0.5;
        currentX += baseSpace * (0.85 + variationSeed * 0.25);
        continue;
      }
      
      // Calculate character metrics with variations
      const metrics = this.calculateCharacterMetrics(char, currentX, startY, i, ctx, config);
      
      // Apply character transformation and render
      this.applyCharacterTransformation(ctx, metrics);
      // Adjustable ink weight: 0..1 where 0.5 is baseline
      const fontSize = config.fontSize || this.defaultFontSize;
      const b = Math.max(0, Math.min(1, config.inkBoldness ?? 0.5));
      const t = (b - 0.5) * 2; // -1..+1
      if (t > 0.001) {
        // Bolder: multi-pass fills with small, smoothly increasing radius and subtle alpha boost
        const baseScale = fontSize * 0.006; // gentler scaling
        const radius = Math.min(1.6, Math.max(0, baseScale * (0.2 + 2.0 * t)));
        const s = radius / Math.SQRT2;
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = prevAlpha * (1 + 0.12 * t);
        ctx.fillText(char, 0, 0);
        ctx.fillText(char, radius, 0);
        ctx.fillText(char, -radius, 0);
        ctx.fillText(char, 0, radius);
        ctx.fillText(char, 0, -radius);
        ctx.fillText(char, s, s);
        ctx.fillText(char, -s, s);
        ctx.fillText(char, s, -s);
        ctx.fillText(char, -s, -s);
      } else if (t < -0.001) {
        // Lighter: reduce alpha slightly based on magnitude
        const lighten = Math.min(1, Math.abs(t));
        const alphaFactor = 1 - 0.45 * Math.pow(lighten, 1.2);
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = prevAlpha * alphaFactor;
        ctx.fillText(char, 0, 0);
      } else {
        ctx.fillText(char, 0, 0); // Baseline rendering
      }
      this.restoreCharacterTransformation(ctx);
      
      // Advance to next character position
      currentX += metrics.width;
    }
  }

  /**
   * Calculate character metrics for positioning
   * Requirements: 1.1, 1.2 (positioning with jitter)
   */
  private calculateCharacterMetrics(
    char: string, 
    x: number, 
    y: number, 
    position: number,
    ctx: CanvasRenderingContext2D,
    config: RenderingConfig
  ): CharacterMetrics {
    // Generate variation for this character
    const variation = this.textEngine.generateVariation(char, position);
    
    // Measure character width
    const metrics = ctx.measureText(char);
    const baseWidth = metrics.width;

    const fontSize = config.fontSize || this.defaultFontSize;
    const baselineRange = Math.max(config.baselineJitterRange || 0.5, 0.2);
    const jitterScaleX = fontSize * baselineRange * 0.42;
    const jitterScaleY = fontSize * baselineRange * 0.36;
    const microShift = variation.microTilt * fontSize * 0.55;
    const jitterX = variation.baselineJitter * jitterScaleX + microShift * 0.4;
    const jitterY = variation.baselineJitter * jitterScaleY + microShift * 0.25;

    const widthGrowth = 1 + Math.min(0.08, Math.abs(variation.microTilt) * 0.9);
    const baselineInfluence = 1 + Math.min(0.04, Math.abs(variation.baselineJitter) * 0.12);
    const width = Math.max(fontSize * 0.22, baseWidth * widthGrowth * baselineInfluence);
    
    return {
      char,
      x: x + jitterX,
      y: y + jitterY,
      width,
      variation
    };
  }

  /**
   * Apply character transformation based on variation with enhanced ink rendering
   * Requirements: 1.2 (slant jitter), 1.5 (micro-tilts), 1.4 (color variations), 5.5 (ink variations)
   */
  private applyCharacterTransformation(ctx: CanvasRenderingContext2D, metrics: CharacterMetrics): void {
    // Save current transformation state (preserves blend mode)
    ctx.save();
    
    // Move to character position
    ctx.translate(metrics.x, metrics.y);
    
    // Apply slant jitter (Requirement 1.2: +/- 0.5 degrees)
    ctx.rotate(metrics.variation.slantJitter);
    
    // Apply micro-tilt (Requirement 1.5: random micro-tilts)
    ctx.rotate(metrics.variation.microTilt);
    
    // Apply enhanced ink color variation (Requirements: 1.4, 5.5)
    this.applyInkColorVariation(ctx, metrics.variation.colorVariation);
    
    // Note: globalCompositeOperation (blend mode) is preserved by save/restore
  }

  /**
   * Restore character transformation
   */
  private restoreCharacterTransformation(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  private applyLowQualityPaperDegradation(context: RenderingContext): void {
    const { canvas, ctx } = context;

    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = Math.ceil(canvas.width / 2);
    grainCanvas.height = Math.ceil(canvas.height / 2);
    const grainCtx = grainCanvas.getContext('2d');
    if (grainCtx) {
      const imageData = grainCtx.createImageData(grainCanvas.width, grainCanvas.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = Math.floor(Math.random() * 60);
        imageData.data[i] = 110 + noise;
        imageData.data[i + 1] = 105 + noise;
        imageData.data[i + 2] = 95 + noise;
        imageData.data[i + 3] = 60 + Math.random() * 90;
      }
      grainCtx.putImageData(imageData, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.18;
      ctx.drawImage(grainCanvas, 0, 0, grainCanvas.width, grainCanvas.height, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    const streakCanvas = document.createElement('canvas');
    streakCanvas.width = canvas.width;
    streakCanvas.height = canvas.height;
    const streakCtx = streakCanvas.getContext('2d');
    if (streakCtx) {
      const bandWidth = Math.max(12, Math.floor(canvas.width / 18));
      streakCtx.fillStyle = '#000000';
      streakCtx.globalAlpha = 0.08;
      for (let x = 0; x < canvas.width; x += bandWidth * 2) {
        streakCtx.fillRect(x, 0, bandWidth, canvas.height);
      }

      streakCtx.globalAlpha = 0.05;
      streakCtx.fillStyle = '#d4c5a4';
      streakCtx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.16;
      ctx.drawImage(streakCanvas, 0, 0);
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = 'rgba(214, 196, 166, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = 'rgba(58, 50, 42, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = 'rgba(252, 246, 232, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private applyMediumTextureSoftening(context: RenderingContext): void {
    const { canvas, ctx } = context;

    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = Math.ceil(canvas.width / 3);
    grainCanvas.height = Math.ceil(canvas.height / 3);
    const grainCtx = grainCanvas.getContext('2d');
    if (grainCtx) {
      const imageData = grainCtx.createImageData(grainCanvas.width, grainCanvas.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const n = Math.floor(Math.random() * 40);
        imageData.data[i] = 128 + n;
        imageData.data[i + 1] = 128 + n;
        imageData.data[i + 2] = 128 + n;
        imageData.data[i + 3] = 30 + Math.random() * 40;
      }
      grainCtx.putImageData(imageData, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.14;
      ctx.drawImage(grainCanvas, 0, 0, grainCanvas.width, grainCanvas.height, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = 'rgba(236, 226, 210, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = 'rgba(250, 244, 230, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  }

  private applyGlobalToneDown(context: RenderingContext, config: RenderingConfig): void {
    const { canvas, ctx } = context;
    const level = config.distortionLevel ?? 2;

    const multiplyAlpha = level === 1 ? 0.05 : level === 2 ? 0.035 : 0.025;
    const overlayAlpha = level === 1 ? 0.02 : 0.015;
    const highlightAlpha = level === 1 ? 0.03 : level === 2 ? 0.022 : 0.016;

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = multiplyAlpha;
    ctx.fillStyle = 'rgba(86, 78, 70, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = overlayAlpha;
    ctx.fillStyle = 'rgba(218, 204, 184, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = highlightAlpha;
    ctx.fillStyle = 'rgba(254, 250, 240, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /**
   * Detect ink color name from base color
   * Requirements: 5.2, 5.3 - Map colors to realistic ink profiles
   */
  private detectInkColorName(baseColor: string): string {
    if (!baseColor) return 'black';
    
    const color = baseColor.toLowerCase();

    const hexMap: Record<string, string> = {
      '#2f4a92': 'blue',
      '#3554a0': 'blue',
      '#27417d': 'blue',
      '#3b5cae': 'blue',
      '#2c4689': 'blue',
      '#1e40af': 'blue',
      '#1d4ed8': 'blue',
      '#2563eb': 'blue',
      '#b13535': 'red',
      '#c24141': 'red',
      '#a32f30': 'red',
      '#d35151': 'red',
      '#993030': 'red',
      '#dc2626': 'red',
      '#ef4444': 'red',
      '#2a2620': 'black',
      '#352f27': 'black',
      '#1f1c17': 'black',
      '#3a342b': 'black',
      '#27221d': 'black',
      '#059669': 'green',
      '#10b981': 'green',
      '#2f6a52': 'green',
      '#357f61': 'green',
      '#2a5c48': 'green',
      '#3a7458': 'green',
      '#276147': 'green'
    };

    if (hexMap[color]) {
      return hexMap[color];
    }
    
    // Map common colors to ink profiles
    if (color.includes('blue') || color === '#1e3a8a' || color === '#1e40af') {
      return 'blue';
    }
    if (color.includes('red') || color === '#dc2626' || color === '#ef4444') {
      return 'red';
    }
    if (color.includes('green') || color === '#059669' || color === '#10b981') {
      return 'green';
    }
    
    // Default to black for dark colors or unknown colors
    return 'black';
  }

  /**
   * Apply ink color variation with realistic effects
   * Requirements: 5.5 - Subtle opacity and saturation variations
   */
  private applyInkColorVariation(ctx: CanvasRenderingContext2D, colorVariation: string): void {
    // Generate ink variations for this character
    const inkVariations = this.inkRenderingSystem.generateInkVariations(colorVariation);
    
    if (inkVariations.length > 0) {
      // Select a random variation for this character
      const variation = inkVariations[Math.floor(Math.random() * inkVariations.length)];
      
      // Apply the variation
      ctx.fillStyle = variation.color;
      
      // Apply opacity variation (Requirements: 5.5)
      const currentAlpha = ctx.globalAlpha;
      ctx.globalAlpha = currentAlpha * variation.opacity;
      
      // Apply saturation variation if filter is supported
      if (ctx.filter !== undefined) {
        ctx.filter = `saturate(${variation.saturation}) brightness(${variation.brightness})`;
      }
    } else {
      // Fallback to original color variation
      ctx.fillStyle = colorVariation;
    }
  }

  /**
   * Get estimated text dimensions for layout planning
   */
  getTextDimensions(text: string, fontSize: number, fontFamily?: string): { width: number; height: number } {
    // Create temporary canvas for measurement
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      throw new CanvasRenderError('Failed to create measurement context');
    }
    
    tempCtx.font = `${fontSize}px ${fontFamily || this.defaultFont}`;
    const metrics = tempCtx.measureText(text);
    
    return {
      width: metrics.width,
      height: fontSize * this.lineHeight
    };
  }

  /**
   * Check if renderer is ready for rendering
   */
  isReady(): boolean {
    return this.textEngine !== null && this.textureManager !== null;
  }

  /**
   * Get renderer capabilities
   */
  getCapabilities(): RendererCapabilities {
    return {
      supportsVariations: true,
      supportsTextureBlending: true,
      supportsHighDPI: true,
      maxCanvasSize: this.getMaxCanvasSize(),
      supportedBlendModes: this.getSupportedBlendModes()
    };
  }

  /**
   * Get maximum supported canvas size
   */
  private getMaxCanvasSize(): { width: number; height: number } {
    // Test maximum canvas size supported by browser
    const testCanvas = document.createElement('canvas');
    const maxSize = 16384; // Common browser limit
    
    try {
      testCanvas.width = maxSize;
      testCanvas.height = maxSize;
      const ctx = testCanvas.getContext('2d');
      
      if (ctx) {
        return { width: maxSize, height: maxSize };
      }
    } catch {
      // Fallback to smaller size
    }
    
    return { width: 8192, height: 8192 };
  }

  /**
   * Get supported blend modes
   */
  private getSupportedBlendModes(): string[] {
    return [
      'source-over',
      'multiply',
      'screen',
      'overlay',
      'darken',
      'lighten',
      'color-dodge',
      'color-burn',
      'hard-light',
      'soft-light',
      'difference',
      'exclusion'
    ];
  }
  /**

   * Create emergency texture when all texture loading fails
   * Requirements: 6.5 - Ultimate fallback mechanism
   */
  private async createEmergencyTexture(): Promise<PaperTexture> {
    // Create a simple white canvas as emergency texture
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create emergency texture: no canvas context');
    }
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle texture pattern
    ctx.fillStyle = '#f8f8f8';
    for (let x = 0; x < canvas.width; x += 20) {
      for (let y = 0; y < canvas.height; y += 20) {
        if ((x + y) % 40 === 0) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    // Convert canvas to image
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create emergency texture blob'));
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          resolve({
            baseImage: img,
            isLoaded: true
          });
        };
        img.onerror = () => {
          reject(new Error('Failed to load emergency texture image'));
        };
        img.src = URL.createObjectURL(blob);
      });
    });
  }

  /**
   * Render simplified background for fallback mode
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Graceful degradation when canvas operations fail
   */
  private async renderFallbackBackground(context: RenderingContext, config: RenderingConfig): Promise<void> {
    const { ctx, paperTexture } = context;
    
    try {
      // Try to render paper texture if available
      if (paperTexture && paperTexture.baseImage) {
        ctx.drawImage(
          paperTexture.baseImage,
          0, 0,
          config.canvasWidth,
          config.canvasHeight
        );
      } else {
        // Fallback to solid color background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
      }
    } catch (error) {
      console.warn('Fallback background rendering failed, using solid color:', error);
      // Ultimate fallback: solid white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    }
  }

  /**
   * Setup simplified text rendering for fallback mode
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Graceful degradation when canvas operations fail
   */
  private setupFallbackTextRendering(ctx: CanvasRenderingContext2D, config: RenderingConfig): void {
    try {
      // Use configured font or system font as fallback
      const fontSize = config.fontSize || this.defaultFontSize;
      const fontFamily = config.fontFamily || 'Arial, sans-serif';
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Use simple black color
      ctx.fillStyle = '#000000';
      
      // Use normal blend mode for compatibility
      ctx.globalCompositeOperation = 'source-over';
    } catch (error) {
      console.warn('Fallback text setup failed, using minimal settings:', error);
      // Minimal fallback settings
      ctx.fillStyle = '#000000';
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /**
   * Render text with minimal variations for fallback mode
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Graceful degradation when canvas operations fail
   */
  private async renderFallbackText(context: RenderingContext, config: RenderingConfig): Promise<void> {
    const { ctx } = context;
    
    try {
      const textToRender = config.text || 'Sample text';
      const fontSize = config.fontSize || this.defaultFontSize;

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      
      // Simple line splitting without complex measurements
      const lines = textToRender.split('\n');
      const maxLines = Math.floor((config.canvasHeight - 80) / (fontSize * 1.2));
      const linesToRender = lines.slice(0, maxLines);
      
      // Render each line simply
      let currentY = 40;
      const leftMargin = 20;
      const lineSpacing = fontSize * 1.2;

      for (const line of linesToRender) {
        // Simple word wrapping
        const words = line.split(' ');
        let currentLine = '';
        let currentX = leftMargin;
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = ctx.measureText(testLine).width;
          
          if (testWidth > config.canvasWidth - 40 && currentLine) {
            // Render current line and start new one
            ctx.fillText(currentLine, leftMargin, currentY);
            currentY += lineSpacing;
            currentLine = word;
            
            // Check if we exceed canvas height
            if (currentY > config.canvasHeight - 40) {
              return;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        // Render remaining text
        if (currentLine) {
          ctx.fillText(currentLine, leftMargin, currentY);
          currentY += lineSpacing;
        }
        
        // Check if we exceed canvas height
        if (currentY > config.canvasHeight - 40) {
          break;
        }
      }
    } catch (error) {
      console.warn('Fallback text rendering failed:', error);
      // Ultimate fallback: simple error message
      ctx.fillText('Text rendering error', 20, 40);
    }
  }

  /**
   * Enhanced memory management for large text operations
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Add memory management for large text rendering operations
   */
  private checkMemoryConstraints(config: RenderingConfig): void {
    const canvasPixels = config.canvasWidth * config.canvasHeight;
    const textLength = config.text?.length || 0;
    
    // Estimate memory usage (rough calculation)
    const estimatedMemoryMB = (canvasPixels * 4) / (1024 * 1024); // 4 bytes per pixel
    const maxMemoryMB = this.getMaxAllowedMemory();
    
    if (estimatedMemoryMB > maxMemoryMB) {
      throw new CanvasMemoryError(config.canvasWidth, config.canvasHeight);
    }
    
    // Check text length constraints
    const maxTextLength = this.getMaxTextLength();
    if (textLength > maxTextLength) {
      console.warn(`Text length ${textLength} exceeds recommended maximum ${maxTextLength}`);
    }
  }

  /**
   * Get maximum allowed memory based on device capabilities
   */
  private getMaxAllowedMemory(): number {
    const isMobile = window.innerWidth < 768;
    const isLowEndDevice = this.isLowEndDevice();
    
    if (isMobile && isLowEndDevice) {
      return 50; // 50MB for low-end mobile
    } else if (isMobile) {
      return 100; // 100MB for mobile
    } else {
      return 200; // 200MB for desktop
    }
  }

  /**
   * Get maximum text length based on device capabilities
   */
  private getMaxTextLength(): number {
    const isMobile = window.innerWidth < 768;
    const isLowEndDevice = this.isLowEndDevice();
    
    if (isMobile && isLowEndDevice) {
      return 2000; // 2000 characters for low-end mobile
    } else if (isMobile) {
      return 5000; // 5000 characters for mobile
    } else {
      return 10000; // 10000 characters for desktop
    }
  }

  /**
   * Enhanced configuration validation with memory checks
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Error handling and memory management
   */
  protected validateConfig(config: RenderingConfig): void {
    // Basic validation
    if (!config) {
      throw new CanvasRenderError('Rendering configuration is required');
    }
    
    if (config.canvasWidth <= 0 || config.canvasHeight <= 0) {
      throw new CanvasRenderError('Canvas dimensions must be positive');
    }
    
    if (config.canvasWidth > 4000 || config.canvasHeight > 4000) {
      throw new CanvasRenderError('Canvas dimensions exceed maximum allowed size');
    }
    
    // Memory constraint checks
    this.checkMemoryConstraints(config);
    
    // Validate color values
    if (config.baseInkColor && !this.isValidColor(config.baseInkColor)) {
      console.warn('Invalid ink color, using default');
      config.baseInkColor = '#1A1A2E';
    }
    
    // Validate blend mode
    if (config.blendMode && !this.isValidBlendMode(config.blendMode)) {
      console.warn('Invalid blend mode, using multiply');
      config.blendMode = 'multiply';
    }
  }

  /**
   * Validate color string format
   */
  private isValidColor(color: string): boolean {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color) || CSS.supports('color', color);
  }

  /**
   * Validate blend mode
   */
  private isValidBlendMode(blendMode: string): boolean {
    const validBlendModes = [
      'source-over', 'source-in', 'source-out', 'source-atop',
      'destination-over', 'destination-in', 'destination-out', 'destination-atop',
      'lighter', 'copy', 'xor', 'multiply', 'screen', 'overlay',
      'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light',
      'soft-light', 'difference', 'exclusion', 'hue', 'saturation',
      'color', 'luminosity'
    ];
    return validBlendModes.includes(blendMode);
  }
}


// Renderer capabilities interface
export interface RendererCapabilities {
  supportsVariations: boolean;
  supportsTextureBlending: boolean;
  supportsHighDPI: boolean;
  maxCanvasSize: { width: number; height: number };
  supportedBlendModes: string[];
}
