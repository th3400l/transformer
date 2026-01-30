/**
 * Texture Optimization Manager
 * Coordinates texture preloading, lazy loading, and caching strategies
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3
 */

import { IPaperTextureManager, PaperTemplate } from '../types/core';
import { TexturePreloader, PreloadConfig } from './texturePreloader';
import { LazyTextureLoader, LazyLoadConfig } from './lazyTextureLoader';
import { getProgressiveTemplateLoader } from './progressiveTemplateLoader';

export interface TextureOptimizationConfig {
  enablePreloading: boolean;
  enableLazyLoading: boolean;
  enableProgressiveLoading: boolean;
  enableAdaptiveStrategy: boolean;
  preloadConfig?: Partial<PreloadConfig>;
  lazyLoadConfig?: Partial<LazyLoadConfig>;
}

export interface OptimizationStats {
  preloadStats: any;
  lazyLoadStats: any;
  progressiveStats: any;
  cacheStats: any;
  totalTexturesLoaded: number;
  averageLoadTime: number;
  memoryUsage: number;
}

/**
 * Texture Optimization Manager
 * Central coordinator for all texture loading optimizations
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Comprehensive texture optimization
 */
export class TextureOptimizationManager {
  private textureManager: IPaperTextureManager;
  private config: TextureOptimizationConfig;
  private preloader: TexturePreloader | null = null;
  private lazyLoader: LazyTextureLoader | null = null;
  private loadTimes: number[] = [];
  private totalLoaded = 0;

  constructor(
    textureManager: IPaperTextureManager,
    config: Partial<TextureOptimizationConfig> = {}
  ) {
    this.textureManager = textureManager;
    this.config = {
      enablePreloading: config.enablePreloading ?? true,
      enableLazyLoading: config.enableLazyLoading ?? this.shouldEnableLazyLoading(),
      enableProgressiveLoading: config.enableProgressiveLoading ?? this.shouldEnableProgressiveLoading(),
      enableAdaptiveStrategy: config.enableAdaptiveStrategy ?? true,
      preloadConfig: config.preloadConfig,
      lazyLoadConfig: config.lazyLoadConfig
    };

    this.initialize();
  }

  /**
   * Initialize optimization services
   * Requirements: 6.2 - Service initialization
   */
  private initialize(): void {
    // Initialize preloader
    if (this.config.enablePreloading) {
      this.preloader = new TexturePreloader(
        this.textureManager,
        this.config.preloadConfig
      );
    }

    // Initialize lazy loader
    if (this.config.enableLazyLoading) {
      this.lazyLoader = new LazyTextureLoader(
        this.textureManager,
        this.config.lazyLoadConfig
      );
    }

    // Adaptive strategy adjustments
    if (this.config.enableAdaptiveStrategy) {
      this.applyAdaptiveStrategy();
    }
  }

  /**
   * Determine if lazy loading should be enabled
   * Requirements: 5.1, 5.2 - Device-aware optimization
   */
  private shouldEnableLazyLoading(): boolean {
    const isMobile = window.innerWidth < 768;
    const isSlowConnection = this.isSlowConnection();
    const isLowEndDevice = this.isLowEndDevice();

    return isMobile || isSlowConnection || isLowEndDevice;
  }

  /**
   * Determine if progressive loading should be enabled
   * Requirements: 5.1, 5.2 - Device-aware optimization
   */
  private shouldEnableProgressiveLoading(): boolean {
    const isMobile = window.innerWidth < 768;
    const isSlowConnection = this.isSlowConnection();
    const isLowEndDevice = this.isLowEndDevice();

    return isMobile || isSlowConnection || isLowEndDevice;
  }

  /**
   * Apply adaptive loading strategy based on device and network
   * Requirements: 5.1, 5.2, 5.3, 5.4 - Adaptive optimization
   */
  private applyAdaptiveStrategy(): void {
    const isMobile = window.innerWidth < 768;
    const isSlowConnection = this.isSlowConnection();
    const isLowEndDevice = this.isLowEndDevice();

    // Adjust strategies based on conditions
    if (isLowEndDevice && isSlowConnection) {
      // Most constrained: minimal preloading, aggressive lazy loading
      this.config.enablePreloading = false;
      this.config.enableLazyLoading = true;
      this.config.enableProgressiveLoading = true;
    } else if (isMobile) {
      // Mobile: balanced approach
      this.config.enablePreloading = true;
      this.config.enableLazyLoading = true;
      this.config.enableProgressiveLoading = true;
    } else {
      // Desktop: aggressive preloading, minimal lazy loading
      this.config.enablePreloading = true;
      this.config.enableLazyLoading = false;
      this.config.enableProgressiveLoading = false;
    }
  }

  /**
   * Preload critical textures
   * Requirements: 6.2 - Critical resource preloading
   */
  public preloadCriticalTextures(templateIds: string[]): void {
    if (this.preloader) {
      this.preloader.preloadTemplates(templateIds, 'critical');
    }
  }

  /**
   * Preload templates with priority
   * Requirements: 6.2 - Priority-based preloading
   */
  public preloadTemplates(
    templateIds: string[],
    priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  ): void {
    if (this.preloader) {
      this.preloader.preloadTemplates(templateIds, priority);
    }
  }

  /**
   * Register element for lazy loading
   * Requirements: 6.2, 6.3 - Lazy loading registration
   */
  public registerLazyElement(
    element: HTMLElement,
    templateId: string,
    priority: number = 1
  ): void {
    if (this.lazyLoader) {
      this.lazyLoader.registerElement(element, templateId, priority);
    }
  }

  /**
   * Unregister element from lazy loading
   */
  public unregisterLazyElement(templateId: string): void {
    if (this.lazyLoader) {
      this.lazyLoader.unregisterElement(templateId);
    }
  }

  /**
   * Load texture with optimization
   * Requirements: 5.1, 5.2, 5.3 - Optimized loading
   */
  public async loadTexture(template: PaperTemplate): Promise<any> {
    const startTime = performance.now();

    try {
      let texture;

      // Use progressive loading if enabled
      if (this.config.enableProgressiveLoading) {
        const progressiveLoader = getProgressiveTemplateLoader();
        texture = await progressiveLoader.loadTemplate(template, 1.0);
      } else {
        // Standard loading through texture manager
        texture = await this.textureManager.loadTexture(template);
      }

      // Track load time
      const loadTime = performance.now() - startTime;
      this.loadTimes.push(loadTime);
      this.totalLoaded++;

      // Keep only last 100 load times
      if (this.loadTimes.length > 100) {
        this.loadTimes.shift();
      }

      return texture;

    } catch (error) {
      console.error(`Failed to load texture ${template.id}:`, error);
      throw error;
    }
  }

  /**
   * Get optimization statistics
   * Requirements: 6.2 - Performance monitoring
   */
  public getStats(): OptimizationStats {
    const averageLoadTime = this.loadTimes.length > 0
      ? this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length
      : 0;

    // Get cache stats if available (PaperTextureManager has this method)
    const cacheStats = (this.textureManager as any).getCacheStats?.() || null;

    return {
      preloadStats: this.preloader?.getStats() || null,
      lazyLoadStats: this.lazyLoader?.getStats() || null,
      progressiveStats: getProgressiveTemplateLoader().getCacheStats(),
      cacheStats,
      totalTexturesLoaded: this.totalLoaded,
      averageLoadTime,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   * Requirements: 5.3, 5.4 - Memory monitoring
   */
  private estimateMemoryUsage(): number {
    const cacheStats = (this.textureManager as any).getCacheStats?.();
    if (cacheStats && typeof cacheStats.memoryUsageMB === 'number') {
      return cacheStats.memoryUsageMB;
    }
    return 0;
  }

  /**
   * Get current configuration
   */
  public getConfig(): TextureOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * Requirements: 6.2 - Dynamic configuration
   */
  public updateConfig(config: Partial<TextureOptimizationConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize if needed
    if (config.enablePreloading !== undefined) {
      if (config.enablePreloading && !this.preloader) {
        this.preloader = new TexturePreloader(
          this.textureManager,
          this.config.preloadConfig
        );
      } else if (!config.enablePreloading && this.preloader) {
        this.preloader.dispose();
        this.preloader = null;
      }
    }

    if (config.enableLazyLoading !== undefined) {
      if (config.enableLazyLoading && !this.lazyLoader) {
        this.lazyLoader = new LazyTextureLoader(
          this.textureManager,
          this.config.lazyLoadConfig
        );
      } else if (!config.enableLazyLoading && this.lazyLoader) {
        this.lazyLoader.dispose();
        this.lazyLoader = null;
      }
    }
  }

  /**
   * Clear all caches and reset
   * Requirements: 6.2 - Cache management
   */
  public clearAll(): void {
    if (this.preloader) {
      this.preloader.clear();
    }

    if (this.lazyLoader) {
      this.lazyLoader.clear();
    }

    getProgressiveTemplateLoader().clearCache();
    
    // Clear cache if available (PaperTextureManager has this method)
    if (typeof (this.textureManager as any).clearCache === 'function') {
      (this.textureManager as any).clearCache();
    }

    this.loadTimes = [];
    this.totalLoaded = 0;
  }

  /**
   * Detect low-end device
   */
  private isLowEndDevice(): boolean {
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory <= 2) return true;

    const hardwareConcurrency = navigator.hardwareConcurrency;
    if (hardwareConcurrency && hardwareConcurrency <= 2) return true;

    return false;
  }

  /**
   * Detect slow connection
   */
  private isSlowConnection(): boolean {
    const connection = (navigator as any).connection;
    if (!connection) return false;

    const slowTypes = ['slow-2g', '2g', '3g'];
    return slowTypes.includes(connection.effectiveType) || connection.downlink < 1.5;
  }

  /**
   * Dispose of manager and clean up resources
   */
  public dispose(): void {
    if (this.preloader) {
      this.preloader.dispose();
      this.preloader = null;
    }

    if (this.lazyLoader) {
      this.lazyLoader.dispose();
      this.lazyLoader = null;
    }

    this.loadTimes = [];
    this.totalLoaded = 0;
  }
}

// Global texture optimization manager instance
let globalOptimizationManager: TextureOptimizationManager | null = null;

/**
 * Get or create global texture optimization manager
 */
export function getTextureOptimizationManager(
  textureManager?: IPaperTextureManager
): TextureOptimizationManager {
  if (!globalOptimizationManager && textureManager) {
    globalOptimizationManager = new TextureOptimizationManager(textureManager);
  }
  
  if (!globalOptimizationManager) {
    throw new Error('Texture optimization manager not initialized');
  }
  
  return globalOptimizationManager;
}

/**
 * Initialize texture optimization manager with custom configuration
 */
export function initializeTextureOptimization(
  textureManager: IPaperTextureManager,
  config?: Partial<TextureOptimizationConfig>
): TextureOptimizationManager {
  if (globalOptimizationManager) {
    globalOptimizationManager.dispose();
  }
  
  globalOptimizationManager = new TextureOptimizationManager(textureManager, config);
  return globalOptimizationManager;
}
