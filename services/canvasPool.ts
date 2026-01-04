/**
 * Canvas Pool for Memory Efficiency
 * Implements canvas pooling to reduce memory allocation/deallocation overhead
 * Requirements: 5.1, 5.2, 6.1, 6.2 - Mobile performance optimization
 */

export interface CanvasPoolConfig {
  maxPoolSize: number;
  maxCanvasSize: { width: number; height: number };
  enablePooling: boolean;
}

export interface PooledCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  inUse: boolean;
  lastUsed: number;
  size: { width: number; height: number };
}

/**
 * Canvas Pool Manager
 * Manages a pool of reusable canvas elements to improve performance
 * Requirements: 5.1, 5.2 - Mobile memory efficiency
 */
export class CanvasPool {
  private pool: PooledCanvas[] = [];
  private config: CanvasPoolConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CanvasPoolConfig> = {}) {
    this.config = {
      maxPoolSize: this.getOptimalPoolSize(),
      maxCanvasSize: { width: 2048, height: 2048 },
      enablePooling: this.shouldEnablePooling(),
      ...config
    };

    // Start cleanup interval if pooling is enabled
    if (this.config.enablePooling) {
      this.startCleanupInterval();
    }
  }

  /**
   * Get optimal pool size based on device capabilities
   * Requirements: 5.1, 5.2 - Device-specific optimization
   */
  private getOptimalPoolSize(): number {
    const isMobile = window.innerWidth < 768;
    const isLowEndDevice = this.isLowEndDevice();

    if (isMobile && isLowEndDevice) {
      return 2; // Minimal pool for low-end mobile
    } else if (isMobile) {
      return 4; // Small pool for mobile
    } else {
      return 8; // Larger pool for desktop
    }
  }

  /**
   * Determine if pooling should be enabled based on device capabilities
   * Requirements: 5.1, 5.2 - Performance optimization
   */
  private shouldEnablePooling(): boolean {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    // Enable pooling for mobile and tablet devices
    return isMobile || isTablet;
  }

  /**
   * Detect low-end device characteristics
   * Requirements: 5.1, 5.2 - Device capability detection
   */
  private isLowEndDevice(): boolean {
    // Check device memory
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory <= 2) {
      return true;
    }

    // Check hardware concurrency
    const hardwareConcurrency = navigator.hardwareConcurrency;
    if (hardwareConcurrency && hardwareConcurrency <= 2) {
      return true;
    }

    return false;
  }

  /**
   * Acquire a canvas from the pool or create a new one
   * Requirements: 5.1, 5.2 - Memory efficient canvas allocation
   */
  acquireCanvas(width: number, height: number): PooledCanvas {
    if (!this.config.enablePooling) {
      return this.createNewCanvas(width, height);
    }

    // Check if requested size exceeds maximum
    if (width > this.config.maxCanvasSize.width || height > this.config.maxCanvasSize.height) {
      console.warn('Canvas size exceeds maximum pool size, creating non-pooled canvas');
      return this.createNewCanvas(width, height);
    }

    // Look for available canvas in pool
    const availableCanvas = this.findAvailableCanvas(width, height);
    if (availableCanvas) {
      availableCanvas.inUse = true;
      availableCanvas.lastUsed = Date.now();
      this.resizeCanvas(availableCanvas, width, height);
      return availableCanvas;
    }

    // Create new canvas if pool has space
    if (this.pool.length < this.config.maxPoolSize) {
      const newCanvas = this.createNewCanvas(width, height);
      newCanvas.inUse = true;
      this.pool.push(newCanvas);
      return newCanvas;
    }

    // Pool is full, reuse least recently used canvas
    const lruCanvas = this.getLeastRecentlyUsedCanvas();
    if (lruCanvas) {
      lruCanvas.inUse = true;
      lruCanvas.lastUsed = Date.now();
      this.resizeCanvas(lruCanvas, width, height);
      return lruCanvas;
    }

    // Fallback to creating non-pooled canvas
    return this.createNewCanvas(width, height);
  }

  /**
   * Release a canvas back to the pool
   * Requirements: 5.1, 5.2 - Memory management
   */
  releaseCanvas(pooledCanvas: PooledCanvas): void {
    if (!this.config.enablePooling) {
      this.disposeCanvas(pooledCanvas);
      return;
    }

    // Clear the canvas for reuse
    this.clearCanvas(pooledCanvas);
    
    // Mark as available
    pooledCanvas.inUse = false;
    pooledCanvas.lastUsed = Date.now();
  }

  /**
   * Find available canvas in pool that can accommodate the requested size
   */
  private findAvailableCanvas(width: number, height: number): PooledCanvas | null {
    return this.pool.find(canvas => 
      !canvas.inUse && 
      canvas.size.width >= width && 
      canvas.size.height >= height
    ) || null;
  }

  /**
   * Get least recently used canvas from pool
   */
  private getLeastRecentlyUsedCanvas(): PooledCanvas | null {
    const availableCanvases = this.pool.filter(canvas => !canvas.inUse);
    if (availableCanvases.length === 0) {
      return null;
    }

    return availableCanvases.reduce((lru, current) => 
      current.lastUsed < lru.lastUsed ? current : lru
    );
  }

  /**
   * Create a new canvas element
   */
  private createNewCanvas(width: number, height: number): PooledCanvas {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    canvas.width = width;
    canvas.height = height;

    return {
      canvas,
      ctx,
      inUse: false,
      lastUsed: Date.now(),
      size: { width, height }
    };
  }

  /**
   * Resize canvas if needed
   */
  private resizeCanvas(pooledCanvas: PooledCanvas, width: number, height: number): void {
    if (pooledCanvas.size.width !== width || pooledCanvas.size.height !== height) {
      pooledCanvas.canvas.width = width;
      pooledCanvas.canvas.height = height;
      pooledCanvas.size = { width, height };
    }
  }

  /**
   * Clear canvas content for reuse
   */
  private clearCanvas(pooledCanvas: PooledCanvas): void {
    const { ctx, canvas } = pooledCanvas;
    
    // Reset transformation matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset context properties to defaults
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 10;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * Dispose of a canvas completely
   */
  private disposeCanvas(pooledCanvas: PooledCanvas): void {
    this.clearCanvas(pooledCanvas);
    
    // Remove from pool if it exists there
    const index = this.pool.indexOf(pooledCanvas);
    if (index !== -1) {
      this.pool.splice(index, 1);
    }
  }

  /**
   * Start cleanup interval to remove unused canvases
   * Requirements: 5.1, 5.2 - Memory management
   */
  private startCleanupInterval(): void {
    const cleanupIntervalMs = 30000; // 30 seconds
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupUnusedCanvases();
    }, cleanupIntervalMs);
  }

  /**
   * Clean up unused canvases to free memory
   * Enhanced with memory threshold monitoring
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Memory management
   */
  private cleanupUnusedCanvases(): void {
    const maxIdleTime = 60000; // 1 minute
    const now = Date.now();

    // Remove canvases that have been idle for too long
    this.pool = this.pool.filter(canvas => {
      if (!canvas.inUse && (now - canvas.lastUsed) > maxIdleTime) {
        this.disposeCanvas(canvas);
        return false;
      }
      return true;
    });

    // Check memory usage and cleanup if needed
    const memoryUsage = this.estimatePoolMemoryUsage();
    const memoryThreshold = this.getMemoryThreshold();
    
    if (memoryUsage > memoryThreshold) {
      this.aggressiveCleanup();
    }

    // Ensure we don't exceed memory limits on mobile
    if (this.isLowEndDevice() && this.pool.length > 2) {
      const excessCanvases = this.pool
        .filter(canvas => !canvas.inUse)
        .sort((a, b) => a.lastUsed - b.lastUsed)
        .slice(0, this.pool.length - 2);

      excessCanvases.forEach(canvas => {
        this.disposeCanvas(canvas);
      });
    }
  }

  /**
   * Estimate memory usage of canvas pool
   * Requirements: 5.3, 5.4 - Memory monitoring
   */
  private estimatePoolMemoryUsage(): number {
    let totalMemory = 0;
    
    for (const pooledCanvas of this.pool) {
      // Estimate memory: width * height * 4 bytes per pixel (RGBA)
      const canvasMemory = pooledCanvas.size.width * pooledCanvas.size.height * 4;
      totalMemory += canvasMemory;
    }
    
    return totalMemory;
  }

  /**
   * Get memory threshold based on device capabilities
   * Requirements: 5.3, 5.4 - Adaptive memory thresholds
   */
  private getMemoryThreshold(): number {
    const isMobile = window.innerWidth < 768;
    const isLowEnd = this.isLowEndDevice();
    
    if (isLowEnd) {
      return 25 * 1024 * 1024; // 25MB for low-end devices
    } else if (isMobile) {
      return 50 * 1024 * 1024; // 50MB for mobile
    } else {
      return 100 * 1024 * 1024; // 100MB for desktop
    }
  }

  /**
   * Aggressive cleanup when memory threshold is exceeded
   * Requirements: 5.3, 5.4, 5.5 - Memory pressure handling
   */
  private aggressiveCleanup(): void {
    // Remove all unused canvases
    const unusedCanvases = this.pool.filter(canvas => !canvas.inUse);
    
    // Sort by size (largest first) and last used time
    unusedCanvases.sort((a, b) => {
      const sizeA = a.size.width * a.size.height;
      const sizeB = b.size.width * b.size.height;
      
      if (sizeA !== sizeB) {
        return sizeB - sizeA; // Larger canvases first
      }
      
      return a.lastUsed - b.lastUsed; // Older canvases first
    });
    
    // Remove at least half of unused canvases
    const toRemove = Math.ceil(unusedCanvases.length / 2);
    
    for (let i = 0; i < toRemove && i < unusedCanvases.length; i++) {
      this.disposeCanvas(unusedCanvases[i]);
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats(): {
    totalCanvases: number;
    inUseCanvases: number;
    availableCanvases: number;
    poolEnabled: boolean;
    maxPoolSize: number;
  } {
    const inUse = this.pool.filter(canvas => canvas.inUse).length;
    
    return {
      totalCanvases: this.pool.length,
      inUseCanvases: inUse,
      availableCanvases: this.pool.length - inUse,
      poolEnabled: this.config.enablePooling,
      maxPoolSize: this.config.maxPoolSize
    };
  }

  /**
   * Update pool configuration
   */
  updateConfig(newConfig: Partial<CanvasPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup interval if pooling state changed
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.config.enablePooling) {
      this.startCleanupInterval();
    }
  }

  /**
   * Initialize the canvas pool
   */
  initialize(): void {
    if (this.config.enablePooling && !this.cleanupInterval) {
      this.startCleanupInterval();
    }

  }

  /**
   * Cleanup unused resources
   */
  cleanup(): void {
    this.cleanupUnusedCanvases();
  }

  /**
   * Force immediate cleanup of all unused canvases
   * Requirements: 5.3, 5.4, 5.5 - Emergency memory cleanup
   */
  forceCleanup(): void {
    const unusedCanvases = this.pool.filter(canvas => !canvas.inUse);
    
    unusedCanvases.forEach(canvas => {
      this.disposeCanvas(canvas);
    });
  }

  /**
   * Get memory usage statistics
   * Requirements: 5.3, 5.4 - Memory monitoring
   */
  getMemoryStats(): {
    estimatedMemoryUsage: number;
    estimatedMemoryUsageMB: number;
    memoryThreshold: number;
    memoryThresholdMB: number;
    memoryPressure: number;
    isUnderPressure: boolean;
  } {
    const memoryUsage = this.estimatePoolMemoryUsage();
    const threshold = this.getMemoryThreshold();
    const pressure = memoryUsage / threshold;
    
    return {
      estimatedMemoryUsage: memoryUsage,
      estimatedMemoryUsageMB: memoryUsage / (1024 * 1024),
      memoryThreshold: threshold,
      memoryThresholdMB: threshold / (1024 * 1024),
      memoryPressure: pressure,
      isUnderPressure: pressure > 0.8
    };
  }

  /**
   * Dispose of the entire pool
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.pool.forEach(canvas => {
      this.disposeCanvas(canvas);
    });

    this.pool = [];
  }
}

// Global canvas pool instance
let globalCanvasPool: CanvasPool | null = null;

/**
 * Get or create global canvas pool instance
 * Requirements: 5.1, 5.2 - Singleton pattern for memory efficiency
 */
export function getCanvasPool(): CanvasPool {
  if (!globalCanvasPool) {
    globalCanvasPool = new CanvasPool();
  }
  return globalCanvasPool;
}

/**
 * Initialize canvas pool with custom configuration
 */
export function initializeCanvasPool(config?: Partial<CanvasPoolConfig>): CanvasPool {
  if (globalCanvasPool) {
    globalCanvasPool.dispose();
  }
  globalCanvasPool = new CanvasPool(config);
  return globalCanvasPool;
}

/**
 * Dispose of global canvas pool
 */
export function disposeCanvasPool(): void {
  if (globalCanvasPool) {
    globalCanvasPool.dispose();
    globalCanvasPool = null;
  }
}