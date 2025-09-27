// System Integration Manager for Gear-1 Handwriting System
// Coordinates all components and provides unified interface
// Requirements: 1.1-6.5 - Complete system integration and optimization

import { 
  ICanvasRenderer, 
  ITextVariationEngine, 
  IPaperTextureManager,
  IImageExportSystem,
  ITemplateProvider,
  RenderingConfig,
  PaperTemplate,
  ExportOptions,
  SystemHealth,
  PerformanceMetrics,
  OptimizationSettings
} from '../types/core';
import { ServiceContainer } from './ServiceContainer';
import { SERVICE_TOKENS, DEFAULT_RENDERING_CONFIG } from '../types/index';
import { getErrorNotificationService } from './errorNotificationService';
import { getQualityManager } from './qualityManager';
import { getCanvasPool } from './canvasPool';

/**
 * System Integration Manager
 * Provides unified interface for all Gear-1 handwriting system components
 * Handles optimization, monitoring, and error recovery
 */
export class SystemIntegrationManager {
  private serviceContainer: ServiceContainer;
  private canvasRenderer: ICanvasRenderer;
  private textEngine: ITextVariationEngine;
  private textureManager: IPaperTextureManager;
  private exportSystem: IImageExportSystem;
  private templateProvider: ITemplateProvider;
  
  private performanceMetrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    frameRate: 60,
    cacheHitRate: 0,
    errorRate: 0,
    averageExportTime: 0
  };
  
  private systemHealth: SystemHealth = {
    status: 'initializing',
    componentsReady: false,
    memoryPressure: false,
    performanceGood: true,
    lastHealthCheck: Date.now()
  };
  
  private optimizationSettings: OptimizationSettings = {
    enableCanvasPooling: true,
    enableTextureCache: true,
    adaptiveQuality: true,
    memoryManagement: true,
    performanceMonitoring: true,
    errorRecovery: true
  };

  constructor(serviceContainer: ServiceContainer) {
    this.serviceContainer = serviceContainer;
    this.initializeComponents();
  }

  /**
   * Initialize all system components
   * Requirements: 6.1, 6.2, 6.3 - Dependency injection and service coordination
   */
  private initializeComponents(): void {
    try {
      // Resolve all services from container
      this.canvasRenderer = this.serviceContainer.resolve<ICanvasRenderer>(SERVICE_TOKENS.CANVAS_RENDERER);
      this.textEngine = this.serviceContainer.resolve<ITextVariationEngine>(SERVICE_TOKENS.TEXT_VARIATION_ENGINE);
      this.textureManager = this.serviceContainer.resolve<IPaperTextureManager>(SERVICE_TOKENS.PAPER_TEXTURE_MANAGER);
      this.exportSystem = this.serviceContainer.resolve<IImageExportSystem>(SERVICE_TOKENS.IMAGE_EXPORT_SYSTEM);
      this.templateProvider = this.serviceContainer.resolve<ITemplateProvider>(SERVICE_TOKENS.TEMPLATE_PROVIDER);
      
      // Initialize optimization systems
      this.initializeOptimizations();
      
      // Mark system as ready
      this.systemHealth.componentsReady = true;
      this.systemHealth.status = 'ready';
      

    } catch (error) {
      console.error('Failed to initialize system components:', error);
      this.systemHealth.status = 'error';
      this.systemHealth.componentsReady = false;
      
      const errorService = getErrorNotificationService();
      errorService.showError(error as Error, 'initializing handwriting system');
    }
  }

  /**
   * Initialize performance optimizations
   * Requirements: 5.1, 5.2, 6.1, 6.2 - Performance optimization and memory management
   */
  private initializeOptimizations(): void {
    if (this.optimizationSettings.enableCanvasPooling) {
      const canvasPool = getCanvasPool();
      canvasPool.initialize();
    }
    
    if (this.optimizationSettings.adaptiveQuality) {
      const qualityManager = getQualityManager();
      qualityManager.enableAdaptiveQuality();
    }
    
    if (this.optimizationSettings.performanceMonitoring) {
      this.startPerformanceMonitoring();
    }
    
    if (this.optimizationSettings.memoryManagement) {
      this.startMemoryManagement();
    }
  }

  /**
   * Render handwritten text with full system integration
   * Requirements: 1.1-1.5, 2.1-2.7, 3.1-3.5 - Complete rendering pipeline
   */
  async renderHandwriting(
    text: string,
    paperTemplate: PaperTemplate,
    options: Partial<RenderingConfig> = {}
  ): Promise<HTMLCanvasElement> {
    const startTime = performance.now();
    
    try {
      // Check system health before rendering
      await this.checkSystemHealth();
      
      if (!this.systemHealth.componentsReady) {
        throw new Error('System components not ready for rendering');
      }
      
      // Create optimized rendering configuration
      const config = this.createOptimizedConfig(text, paperTemplate, options);
      
      // Preload paper texture if not cached
      await this.preloadTexture(paperTemplate);
      
      // Render with performance monitoring
      const canvas = await this.canvasRenderer.render(config);
      
      // Update performance metrics
      this.updatePerformanceMetrics(startTime, 'render');
      
      return canvas;
      
    } catch (error) {
      console.error('Rendering failed:', error);
      this.handleRenderingError(error as Error);
      throw error;
    }
  }

  /**
   * Export handwritten content with system optimization
   * Requirements: 3.1-3.5 - Multi-page export with optimization
   */
  async exportHandwriting(
    text: string,
    paperTemplate: PaperTemplate,
    exportOptions: Partial<ExportOptions> = {}
  ): Promise<{ success: boolean; images: Blob[]; totalPages: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      // Check system health
      await this.checkSystemHealth();
      
      // Estimate pages and check limits
      const estimatedPages = this.estimatePageCount(text);
      const maxPages = exportOptions.maxPages || DEFAULT_RENDERING_CONFIG.maxPagesPerGeneration;
      
      if (estimatedPages > maxPages) {
        console.warn(`Content exceeds ${maxPages} page limit (estimated ${estimatedPages} pages)`);
      }
      
      // Generate canvases for all pages
      const canvases = await this.generateMultiplePages(text, paperTemplate, Math.min(estimatedPages, maxPages));
      
      // Export all pages
      const result = await this.exportSystem.exportMultiplePages(canvases, {
        format: 'png',
        quality: 0.9,
        maxPages,
        ...exportOptions
      });
      
      // Update performance metrics
      this.updatePerformanceMetrics(startTime, 'export');
      
      return result;
      
    } catch (error) {
      console.error('Export failed:', error);
      this.handleExportError(error as Error);
      return {
        success: false,
        images: [],
        totalPages: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get available paper templates with caching
   * Requirements: 2.1, 2.2, 2.6 - Template management
   */
  async getAvailableTemplates(): Promise<PaperTemplate[]> {
    try {
      return await this.templateProvider.getAvailableTemplates();
    } catch (error) {
      console.error('Failed to get templates:', error);
      const errorService = getErrorNotificationService();
      errorService.showError(error as Error, 'loading paper templates');
      
      // Return fallback templates
      return this.getFallbackTemplates();
    }
  }

  /**
   * Preload texture for better performance
   * Requirements: 2.1, 2.2, 2.3 - Texture preloading optimization
   */
  async preloadTexture(template: PaperTemplate): Promise<void> {
    try {
      await this.textureManager.loadTexture(template);
    } catch (error) {
      console.warn('Texture preload failed:', error);
      // Non-critical error, continue without preloading
    }
  }

  /**
   * Create optimized rendering configuration
   * Requirements: 5.1-5.5, 6.1, 6.2 - Adaptive optimization
   */
  private createOptimizedConfig(
    text: string,
    paperTemplate: PaperTemplate,
    options: Partial<RenderingConfig>
  ): RenderingConfig {
    const qualityManager = getQualityManager();
    const qualitySettings = qualityManager.getCurrentSettings();
    
    // Base configuration
    const baseConfig: RenderingConfig = {
      ...DEFAULT_RENDERING_CONFIG,
      text,
      paperTemplate,
      ...options
    };
    
    // Apply device-specific optimizations
    const canvasConfig = qualityManager.getCanvasConfig(
      baseConfig.canvasWidth,
      baseConfig.canvasHeight
    );
    
    return {
      ...baseConfig,
      canvasWidth: canvasConfig.width,
      canvasHeight: canvasConfig.height,
      renderingQuality: qualitySettings.renderingQuality,
      textureCache: qualitySettings.enableCanvasPooling,
      colorVariationIntensity: baseConfig.colorVariationIntensity * qualitySettings.textureQuality,
      baselineJitterRange: baseConfig.baselineJitterRange * qualitySettings.renderingQuality,
      slantJitterRange: baseConfig.slantJitterRange * qualitySettings.renderingQuality
    };
  }

  /**
   * Generate multiple pages for long text
   * Requirements: 3.1, 3.2, 3.3 - Multi-page generation
   */
  private async generateMultiplePages(
    text: string,
    paperTemplate: PaperTemplate,
    maxPages: number
  ): Promise<HTMLCanvasElement[]> {
    const wordsPerPage = DEFAULT_RENDERING_CONFIG.wordsPerPage;
    const words = text.trim().split(/\s+/);
    const pages: string[] = [];
    
    // Split text into pages
    for (let i = 0; i < words.length && pages.length < maxPages; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      pages.push(pageWords.join(' '));
    }
    
    // Generate canvas for each page
    const canvases: HTMLCanvasElement[] = [];
    
    for (let i = 0; i < pages.length; i++) {
      const pageConfig = this.createOptimizedConfig(pages[i], paperTemplate, {});
      const canvas = await this.canvasRenderer.render(pageConfig);
      canvases.push(canvas);
    }
    
    return canvases;
  }

  /**
   * Estimate page count for text
   * Requirements: 3.2, 3.3 - Page estimation
   */
  private estimatePageCount(text: string): number {
    const wordsPerPage = DEFAULT_RENDERING_CONFIG.wordsPerPage;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerPage);
  }

  /**
   * Check system health and performance
   * Requirements: 6.1, 6.2, 6.3 - System monitoring
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    try {
      // Check component readiness
      this.systemHealth.componentsReady = this.areComponentsReady();
      
      // Check memory pressure
      this.systemHealth.memoryPressure = this.checkMemoryPressure();
      
      // Check performance
      this.systemHealth.performanceGood = this.checkPerformance();
      
      // Update status
      if (this.systemHealth.componentsReady && !this.systemHealth.memoryPressure && this.systemHealth.performanceGood) {
        this.systemHealth.status = 'healthy';
      } else if (this.systemHealth.componentsReady) {
        this.systemHealth.status = 'degraded';
      } else {
        this.systemHealth.status = 'error';
      }
      
      this.systemHealth.lastHealthCheck = Date.now();
      
      return this.systemHealth;
      
    } catch (error) {
      console.error('Health check failed:', error);
      this.systemHealth.status = 'error';
      return this.systemHealth;
    }
  }

  /**
   * Check if all components are ready
   */
  private areComponentsReady(): boolean {
    return !!(
      this.canvasRenderer &&
      this.textEngine &&
      this.textureManager &&
      this.exportSystem &&
      this.templateProvider
    );
  }

  /**
   * Check for memory pressure
   * Requirements: 6.2, 6.3 - Memory management
   */
  private checkMemoryPressure(): boolean {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      
      return (usedMB / limitMB) > 0.8; // 80% threshold
    }
    
    return false;
  }

  /**
   * Check performance metrics
   */
  private checkPerformance(): boolean {
    return (
      this.performanceMetrics.renderTime < 2000 && // < 2 seconds
      this.performanceMetrics.frameRate > 30 &&    // > 30 FPS
      this.performanceMetrics.errorRate < 0.1      // < 10% error rate
    );
  }

  /**
   * Start performance monitoring
   * Requirements: 5.1, 5.2, 6.1, 6.2 - Performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Start memory management
   * Requirements: 6.2, 6.3 - Memory management
   */
  private startMemoryManagement(): void {
    setInterval(() => {
      this.performMemoryCleanup();
    }, 30000); // Cleanup every 30 seconds
  }

  /**
   * Update system performance metrics
   */
  private updateSystemMetrics(): void {
    // Update cache hit rate
    if (this.textureManager && 'getCacheStats' in this.textureManager) {
      const stats = (this.textureManager as any).getCacheStats();
      this.performanceMetrics.cacheHitRate = stats.hitRate || 0;
    }
    
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024);
    }
  }

  /**
   * Perform memory cleanup
   * Requirements: 6.2, 6.3 - Memory management
   */
  private performMemoryCleanup(): void {
    try {
      // Clear texture cache if memory pressure
      if (this.systemHealth.memoryPressure && this.textureManager && 'clearCache' in this.textureManager) {
        (this.textureManager as any).clearCache();

      }
      
      // Release canvas pool resources
      if (this.optimizationSettings.enableCanvasPooling) {
        const canvasPool = getCanvasPool();
        canvasPool.cleanup();
      }
      
      // Force garbage collection if available
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
      
    } catch (error) {
      console.warn('Memory cleanup failed:', error);
    }
  }

  /**
   * Update performance metrics after operation
   */
  private updatePerformanceMetrics(startTime: number, operation: 'render' | 'export'): void {
    const duration = performance.now() - startTime;
    
    if (operation === 'render') {
      this.performanceMetrics.renderTime = duration;
    } else if (operation === 'export') {
      this.performanceMetrics.averageExportTime = 
        (this.performanceMetrics.averageExportTime + duration) / 2;
    }
  }

  /**
   * Handle rendering errors with recovery
   * Requirements: 6.1, 6.2, 6.3, 6.5 - Error handling and recovery
   */
  private handleRenderingError(error: Error): void {
    this.performanceMetrics.errorRate = Math.min(this.performanceMetrics.errorRate + 0.1, 1.0);
    
    const errorService = getErrorNotificationService();
    errorService.showError(error, 'rendering handwritten text');
    
    // Attempt system recovery if needed
    if (this.optimizationSettings.errorRecovery) {
      this.attemptSystemRecovery();
    }
  }

  /**
   * Handle export errors with recovery
   */
  private handleExportError(error: Error): void {
    this.performanceMetrics.errorRate = Math.min(this.performanceMetrics.errorRate + 0.1, 1.0);
    
    const errorService = getErrorNotificationService();
    errorService.showError(error, 'exporting handwritten images');
  }

  /**
   * Attempt system recovery after errors
   * Requirements: 6.5 - Error recovery mechanisms
   */
  private attemptSystemRecovery(): void {
    try {

      
      // Clear caches
      if (this.textureManager && 'clearCache' in this.textureManager) {
        (this.textureManager as any).clearCache();
      }
      
      // Reset quality settings
      const qualityManager = getQualityManager();
      qualityManager.resetToDefaults();
      
      // Reinitialize canvas pool
      if (this.optimizationSettings.enableCanvasPooling) {
        const canvasPool = getCanvasPool();
        canvasPool.cleanup();
        canvasPool.initialize();
      }
      

      
    } catch (recoveryError) {
      console.error('System recovery failed:', recoveryError);
    }
  }

  /**
   * Get fallback templates when loading fails
   */
  private getFallbackTemplates(): PaperTemplate[] {
    return [
      {
        id: 'blank-1',
        name: 'Default Blank',
        filename: 'blank-1.jpeg',
        type: 'blank'
      },
      {
        id: 'lined-1',
        name: 'Default Lined',
        filename: 'lined-1.avif',
        type: 'lined'
      }
    ];
  }

  /**
   * Get current system status
   */
  getSystemStatus(): {
    health: SystemHealth;
    performance: PerformanceMetrics;
    optimization: OptimizationSettings;
  } {
    return {
      health: { ...this.systemHealth },
      performance: { ...this.performanceMetrics },
      optimization: { ...this.optimizationSettings }
    };
  }

  /**
   * Update optimization settings
   * Requirements: 5.1, 5.2, 6.1, 6.2 - Dynamic optimization control
   */
  updateOptimizationSettings(settings: Partial<OptimizationSettings>): void {
    this.optimizationSettings = {
      ...this.optimizationSettings,
      ...settings
    };
    
    // Reinitialize optimizations with new settings
    this.initializeOptimizations();
  }

  /**
   * Dispose of system resources
   */
  dispose(): void {
    try {
      // Clear all caches
      if (this.textureManager && 'clearCache' in this.textureManager) {
        (this.textureManager as any).clearCache();
      }
      
      // Cleanup canvas pool
      if (this.optimizationSettings.enableCanvasPooling) {
        const canvasPool = getCanvasPool();
        canvasPool.cleanup();
      }
      
      // Reset system status
      this.systemHealth.status = 'disposed';
      this.systemHealth.componentsReady = false;
      

      
    } catch (error) {
      console.error('Error during system disposal:', error);
    }
  }
}

/**
 * Global system integration manager instance
 */
let systemManager: SystemIntegrationManager | null = null;

/**
 * Get or create system integration manager
 */
export function getSystemIntegrationManager(serviceContainer?: ServiceContainer): SystemIntegrationManager {
  if (!systemManager && serviceContainer) {
    systemManager = new SystemIntegrationManager(serviceContainer);
  }
  
  if (!systemManager) {
    throw new Error('System integration manager not initialized');
  }
  
  return systemManager;
}

/**
 * Initialize system integration manager
 */
export function initializeSystemIntegration(serviceContainer: ServiceContainer): SystemIntegrationManager {
  systemManager = new SystemIntegrationManager(serviceContainer);
  return systemManager;
}

/**
 * Dispose system integration manager
 */
export function disposeSystemIntegration(): void {
  if (systemManager) {
    systemManager.dispose();
    systemManager = null;
  }
}