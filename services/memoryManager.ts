/**
 * Memory Manager - Coordinates memory management across all services
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Comprehensive memory management
 */

import { getCanvasPool } from './canvasPool';
import { TextureCache } from './textureCache';
import { getQualityManager } from './qualityManager';
import { IPerformanceMonitor } from './performanceMonitor';

export interface MemoryStatus {
  totalMemoryUsage: number;
  totalMemoryUsageMB: number;
  canvasPoolMemory: number;
  canvasPoolMemoryMB: number;
  textureCacheMemory: number;
  textureCacheMemoryMB: number;
  jsHeapUsage: number;
  jsHeapUsageMB: number;
  memoryPressure: number;
  pressureLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
}

export interface MemoryManagerConfig {
  enableAutoCleanup: boolean;
  cleanupIntervalMs: number;
  memoryCheckIntervalMs: number;
  enableGracefulDegradation: boolean;
  criticalMemoryThreshold: number; // 0-1
  highMemoryThreshold: number; // 0-1
  moderateMemoryThreshold: number; // 0-1
}

export interface IMemoryManager {
  initialize(): void;
  checkMemoryStatus(): MemoryStatus;
  performCleanup(): Promise<CleanupResult>;
  handleMemoryPressure(): Promise<void>;
  dispose(): void;
}

export interface CleanupResult {
  canvasesCleared: number;
  texturesCleared: number;
  memoryFreed: number;
  memoryFreedMB: number;
  qualityDegraded: boolean;
  degradationChanges: string[];
}

/**
 * Memory Manager
 * Coordinates memory management across canvas pool, texture cache, and quality settings
 */
export class MemoryManager implements IMemoryManager {
  private config: MemoryManagerConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private textureCache: TextureCache | null = null;
  private performanceMonitor: IPerformanceMonitor | null = null;
  private lastMemoryPressure: number = 0;
  private consecutiveHighPressureCount: number = 0;

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = {
      enableAutoCleanup: true,
      cleanupIntervalMs: 30000, // 30 seconds
      memoryCheckIntervalMs: 5000, // 5 seconds
      enableGracefulDegradation: true,
      criticalMemoryThreshold: 0.9,
      highMemoryThreshold: 0.75,
      moderateMemoryThreshold: 0.6,
      ...config
    };
  }

  /**
   * Initialize memory manager
   * Requirements: 5.1, 5.2 - Initialization
   */
  initialize(): void {
    if (this.config.enableAutoCleanup) {
      this.startCleanupInterval();
    }

    this.startMemoryCheckInterval();
  }

  /**
   * Set texture cache reference
   */
  setTextureCache(cache: TextureCache): void {
    this.textureCache = cache;
  }

  /**
   * Set performance monitor reference
   */
  setPerformanceMonitor(monitor: IPerformanceMonitor): void {
    this.performanceMonitor = monitor;
  }

  /**
   * Check current memory status
   * Requirements: 5.3, 5.4 - Memory monitoring
   */
  checkMemoryStatus(): MemoryStatus {
    const canvasPool = getCanvasPool();
    const qualityManager = getQualityManager();
    
    // Get canvas pool memory stats
    const canvasMemoryStats = canvasPool.getMemoryStats();
    const canvasPoolMemory = canvasMemoryStats.estimatedMemoryUsage;
    
    // Get texture cache memory stats
    let textureCacheMemory = 0;
    if (this.textureCache) {
      const cacheStats = this.textureCache.getStats();
      textureCacheMemory = cacheStats.memoryUsageMB * 1024 * 1024;
    }
    
    // Get JS heap memory
    let jsHeapUsage = 0;
    if (this.performanceMonitor) {
      const memoryMetrics = this.performanceMonitor.getCurrentMemoryUsage();
      jsHeapUsage = memoryMetrics.usedJSHeapSize;
    }
    
    // Calculate total memory usage
    const totalMemoryUsage = canvasPoolMemory + textureCacheMemory;
    
    // Calculate memory pressure
    const memoryPressure = this.calculateMemoryPressure(
      canvasMemoryStats,
      textureCacheMemory
    );
    
    // Determine pressure level
    const pressureLevel = this.getPressureLevel(memoryPressure);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      memoryPressure,
      canvasMemoryStats,
      textureCacheMemory
    );
    
    return {
      totalMemoryUsage,
      totalMemoryUsageMB: totalMemoryUsage / (1024 * 1024),
      canvasPoolMemory,
      canvasPoolMemoryMB: canvasPoolMemory / (1024 * 1024),
      textureCacheMemory,
      textureCacheMemoryMB: textureCacheMemory / (1024 * 1024),
      jsHeapUsage,
      jsHeapUsageMB: jsHeapUsage / (1024 * 1024),
      memoryPressure,
      pressureLevel,
      recommendations
    };
  }

  /**
   * Perform cleanup of unused resources
   * Requirements: 5.3, 5.4, 5.5 - Memory cleanup
   */
  async performCleanup(): Promise<CleanupResult> {
    const canvasPool = getCanvasPool();
    const qualityManager = getQualityManager();
    
    const beforeMemory = this.checkMemoryStatus();
    
    // Cleanup canvas pool
    canvasPool.cleanup();
    const canvasPoolStats = canvasPool.getPoolStats();
    const canvasesCleared = canvasPoolStats.totalCanvases;
    
    // Cleanup texture cache
    let texturesCleared = 0;
    if (this.textureCache) {
      // Clear textures older than 5 minutes
      texturesCleared = this.textureCache.clearOldTextures(300000);
    }
    
    const afterMemory = this.checkMemoryStatus();
    const memoryFreed = beforeMemory.totalMemoryUsage - afterMemory.totalMemoryUsage;
    
    // Check if quality degradation is needed
    let qualityDegraded = false;
    let degradationChanges: string[] = [];
    
    if (this.config.enableGracefulDegradation && afterMemory.memoryPressure > this.config.moderateMemoryThreshold) {
      const result = qualityManager.degradeQualityForMemoryPressure(afterMemory.memoryPressure);
      qualityDegraded = result.degraded;
      degradationChanges = result.changes;
    }
    
    return {
      canvasesCleared,
      texturesCleared,
      memoryFreed,
      memoryFreedMB: memoryFreed / (1024 * 1024),
      qualityDegraded,
      degradationChanges
    };
  }

  /**
   * Handle memory pressure situation
   * Requirements: 5.3, 5.4, 5.5 - Memory pressure handling
   */
  async handleMemoryPressure(): Promise<void> {
    const status = this.checkMemoryStatus();
    const canvasPool = getCanvasPool();
    const qualityManager = getQualityManager();
    
    // Track consecutive high pressure events
    if (status.memoryPressure > this.config.highMemoryThreshold) {
      this.consecutiveHighPressureCount++;
    } else {
      this.consecutiveHighPressureCount = 0;
    }
    
    // Level 1: Moderate pressure - routine cleanup
    if (status.memoryPressure > this.config.moderateMemoryThreshold) {
      await this.performCleanup();
    }
    
    // Level 2: High pressure - aggressive cleanup
    if (status.memoryPressure > this.config.highMemoryThreshold) {
      // Force cleanup of canvas pool
      canvasPool.forceCleanup();
      
      // Clear texture cache to target memory
      if (this.textureCache) {
        const targetMemoryMB = 25; // Target 25MB for texture cache
        this.textureCache.clearToMemoryTarget(targetMemoryMB);
      }
      
      // Degrade quality if enabled
      if (this.config.enableGracefulDegradation) {
        qualityManager.degradeQualityForMemoryPressure(status.memoryPressure);
      }
    }
    
    // Level 3: Critical pressure - emergency measures
    if (status.memoryPressure > this.config.criticalMemoryThreshold) {
      // Clear all texture cache
      if (this.textureCache) {
        this.textureCache.clear();
      }
      
      // Force cleanup of all unused canvases
      canvasPool.forceCleanup();
      
      // Apply critical quality degradation
      if (this.config.enableGracefulDegradation) {
        qualityManager.degradeQualityForMemoryPressure(1.0);
      }
      
      // Suggest garbage collection if available
      if (typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
    }
    
    // Restore quality if pressure has been relieved
    if (status.memoryPressure < this.config.moderateMemoryThreshold && 
        this.lastMemoryPressure > this.config.highMemoryThreshold) {
      qualityManager.restoreQualityAfterMemoryRelief();
    }
    
    this.lastMemoryPressure = status.memoryPressure;
  }

  /**
   * Calculate overall memory pressure
   */
  private calculateMemoryPressure(
    canvasStats: any,
    textureCacheMemory: number
  ): number {
    // Combine canvas pool pressure and texture cache pressure
    const canvasPressure = canvasStats.memoryPressure || 0;
    
    let texturePressure = 0;
    if (this.textureCache) {
      texturePressure = this.textureCache.getMemoryPressure();
    }
    
    // Weight canvas pool more heavily as it's more critical
    const weightedPressure = (canvasPressure * 0.6) + (texturePressure * 0.4);
    
    // Also consider JS heap if available
    if (this.performanceMonitor) {
      const memoryMetrics = this.performanceMonitor.getCurrentMemoryUsage();
      if (memoryMetrics.percentage > 0) {
        const heapPressure = memoryMetrics.percentage / 100;
        return Math.max(weightedPressure, heapPressure);
      }
    }
    
    return weightedPressure;
  }

  /**
   * Get pressure level from numeric pressure
   */
  private getPressureLevel(pressure: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (pressure > this.config.criticalMemoryThreshold) return 'critical';
    if (pressure > this.config.highMemoryThreshold) return 'high';
    if (pressure > this.config.moderateMemoryThreshold) return 'moderate';
    return 'low';
  }

  /**
   * Generate recommendations based on memory status
   */
  private generateRecommendations(
    memoryPressure: number,
    canvasStats: any,
    textureCacheMemory: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (memoryPressure > this.config.criticalMemoryThreshold) {
      recommendations.push('Critical memory pressure detected - emergency cleanup in progress');
      recommendations.push('Consider reducing canvas size or text complexity');
    } else if (memoryPressure > this.config.highMemoryThreshold) {
      recommendations.push('High memory pressure - aggressive cleanup recommended');
      recommendations.push('Quality settings have been reduced to conserve memory');
    } else if (memoryPressure > this.config.moderateMemoryThreshold) {
      recommendations.push('Moderate memory pressure - routine cleanup in progress');
    }
    
    if (canvasStats.totalCanvases > 6) {
      recommendations.push(`Canvas pool has ${canvasStats.totalCanvases} canvases - consider cleanup`);
    }
    
    if (textureCacheMemory > 50 * 1024 * 1024) {
      recommendations.push('Texture cache is using significant memory - consider clearing old textures');
    }
    
    if (this.consecutiveHighPressureCount > 3) {
      recommendations.push('Persistent high memory pressure - consider reducing workload');
    }
    
    return recommendations;
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, this.config.cleanupIntervalMs);
  }

  /**
   * Start memory check interval
   */
  private startMemoryCheckInterval(): void {
    this.memoryCheckInterval = setInterval(async () => {
      await this.handleMemoryPressure();
    }, this.config.memoryCheckIntervalMs);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MemoryManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart intervals if needed
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    
    if (this.config.enableAutoCleanup) {
      this.startCleanupInterval();
    }
    
    this.startMemoryCheckInterval();
  }

  /**
   * Dispose of memory manager
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }
}

// Global memory manager instance
let globalMemoryManager: MemoryManager | null = null;

/**
 * Get or create global memory manager instance
 */
export function getMemoryManager(): MemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager();
  }
  return globalMemoryManager;
}

/**
 * Initialize memory manager with custom configuration
 */
export function initializeMemoryManager(config?: Partial<MemoryManagerConfig>): MemoryManager {
  if (globalMemoryManager) {
    globalMemoryManager.dispose();
  }
  globalMemoryManager = new MemoryManager(config);
  return globalMemoryManager;
}

/**
 * Dispose of global memory manager
 */
export function disposeMemoryManager(): void {
  if (globalMemoryManager) {
    globalMemoryManager.dispose();
    globalMemoryManager = null;
  }
}
