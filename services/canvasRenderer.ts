// Canvas rendering system implementation for Gear-1 handwriting system
// Implements SOLID architecture with dependency injection
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.5, 6.1

import {
  ITextVariationEngine,
  IPaperTextureManager,
  RenderingConfig
} from '../types';
import { CanvasRenderError } from '../types/errors';
import { getCanvasPool, PooledCanvas } from './canvasPool';
import { getQualityManager } from './qualityManager';
import { ErrorRecoveryService } from './errorRecoveryService';

// Import from new modules
import { BaseCanvasRenderer } from './canvasRenderer.core';
import {
  applyMobileOptimizations,
  recordPerformanceMetrics,
  checkMemoryConstraints
} from './canvasRenderer.mobile';
import {
  setupTextRendering,
  renderTextWithVariations
} from './canvasRenderer.effects';
import {
  createFallbackConfig,
  createEmergencyTexture,
  renderFallbackBackground,
  setupFallbackTextRendering,
  renderFallbackText
} from './canvasRenderer.fallback';
import {
  getDefaultPaperTemplate,
  loadTextureWithRetry,
  renderPaperBackground,
  applyLowQualityPaperDegradation,
  applyMediumTextureSoftening,
  applyUltraRealismEffects,
  applyGlobalToneDown
} from './canvasRenderer.utils';

/**
 * Concrete canvas renderer implementation
 * Handles realistic handwriting rendering with paper texture integration
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 (text variations), 2.4, 2.5 (canvas rendering)
 */
export class CanvasRenderer extends BaseCanvasRenderer {
  private readonly defaultFont: string = 'Arial, sans-serif';
  private readonly defaultFontSize: number = 16;
  private readonly errorRecovery: ErrorRecoveryService;

  constructor(textEngine: ITextVariationEngine, textureManager: IPaperTextureManager) {
    super(textEngine, textureManager);
    this.errorRecovery = new ErrorRecoveryService({
      maxRetries: 2,
      initialDelay: 500,
      backoffMultiplier: 2
    });
  }

  /**
   * Render handwritten text on paper texture with mobile optimizations and error recovery
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2 - Mobile performance optimization and error recovery
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
      const optimizedConfig = applyMobileOptimizations(config, qualityManager);

      // Create canvas with proper dimensions and pooling
      const canvasResult = this.createCanvas(optimizedConfig.canvasWidth, optimizedConfig.canvasHeight);
      const { canvas, ctx } = canvasResult;
      pooledCanvas = canvasResult.pooled;

      // Set up text variation engine with config parameters
      const variationIntensity = (() => {
        switch (optimizedConfig.distortionLevel) {
          case 1:
          case 2: return 1.35;
          case 3: return 1.1;
          case 4: return 1.0;
          case 5: return 0.92;
          default: return 1.0;
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
      const paperTemplate = optimizedConfig.paperTemplate || getDefaultPaperTemplate();
      const paperTexture = await loadTextureWithRetry(this.textureManager, paperTemplate);

      // Create rendering context
      const renderingContext = this.createRenderingContext(canvas, ctx, paperTexture);

      // Render paper background with proper scaling (uses normal blend mode internally)
      await renderPaperBackground(renderingContext, optimizedConfig);

      // Set up text rendering properties including blend mode for ink-paper integration
      setupTextRendering(ctx, optimizedConfig, this.inkRenderingSystem, this.textEngine, this.defaultFont, this.defaultFontSize);

      // Render text with character-by-character variations (uses configured blend mode)
      await renderTextWithVariations(renderingContext, optimizedConfig, this.textEngine, this.defaultFontSize, optimizedConfig.text);

      if (optimizedConfig.distortionLevel === 1) {
        applyUltraRealismEffects(renderingContext, 1);
        applyLowQualityPaperDegradation(renderingContext);
      } else if (optimizedConfig.distortionLevel === 2) {
        applyUltraRealismEffects(renderingContext, 2);
        applyLowQualityPaperDegradation(renderingContext);
      } else if (optimizedConfig.distortionLevel === 3) {
        applyLowQualityPaperDegradation(renderingContext);
      } else if (optimizedConfig.distortionLevel === 4) {
        applyMediumTextureSoftening(renderingContext);
      }

      applyGlobalToneDown(renderingContext, optimizedConfig);

      // Record performance metrics
      recordPerformanceMetrics(startTime, this.performanceMetrics);

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
    const fallbackConfig = createFallbackConfig(config, originalError);

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
      let paperTexture;
      try {
        const paperTemplate = fallbackConfig.paperTemplate || getDefaultPaperTemplate();
        paperTexture = await this.textureManager.loadTexture(paperTemplate);
      } catch (textureError) {
        console.warn('Texture loading failed in fallback, using emergency texture:', textureError);
        paperTexture = await createEmergencyTexture();
      }

      // Create rendering context
      const renderingContext = this.createRenderingContext(canvas, ctx, paperTexture);

      // Render with simplified approach
      await renderFallbackBackground(renderingContext, fallbackConfig);
      setupFallbackTextRendering(ctx, fallbackConfig, this.defaultFont, this.defaultFontSize);
      await renderFallbackText(renderingContext, fallbackConfig, this.defaultFontSize);

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
   * Get error recovery service for external use
   * Requirements: 5.3, 5.4, 5.5 - Error recovery integration
   */
  getErrorRecoveryService(): ErrorRecoveryService {
    return this.errorRecovery;
  }

  /**
   * Get user-friendly error message for display
   * Requirements: 10.1, 10.2 - User-friendly error messages
   */
  getUserErrorMessage(error: Error): ReturnType<ErrorRecoveryService['getUserErrorMessage']> {
    return this.errorRecovery.getUserErrorMessage(error);
  }

  /**
   * Validate rendering configuration with memory constraints
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Error handling and memory management
   */
  protected validateConfig(config: RenderingConfig): void {
    // Call parent validation
    super.validateConfig(config);

    // Check memory constraints
    checkMemoryConstraints(config);
  }
}

// Re-export BaseCanvasRenderer for backward compatibility
export { BaseCanvasRenderer } from './canvasRenderer.core';
