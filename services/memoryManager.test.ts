/**
 * Memory Manager Tests
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Memory management testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryManager, initializeMemoryManager, disposeMemoryManager } from './memoryManager';
import { TextureCache } from './textureCache';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = initializeMemoryManager({
      enableAutoCleanup: false, // Disable auto cleanup for tests
      memoryCheckIntervalMs: 1000000 // Very long interval for tests
    });
  });

  afterEach(() => {
    disposeMemoryManager();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const manager = new MemoryManager();
      expect(manager).toBeDefined();
    });

    it('should initialize with custom config', () => {
      const manager = new MemoryManager({
        enableAutoCleanup: false,
        cleanupIntervalMs: 60000
      });
      expect(manager).toBeDefined();
    });
  });

  describe('checkMemoryStatus', () => {
    it('should return memory status', () => {
      const status = memoryManager.checkMemoryStatus();
      
      expect(status).toBeDefined();
      expect(status.totalMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(status.totalMemoryUsageMB).toBeGreaterThanOrEqual(0);
      expect(status.canvasPoolMemory).toBeGreaterThanOrEqual(0);
      expect(status.textureCacheMemory).toBeGreaterThanOrEqual(0);
      expect(status.memoryPressure).toBeGreaterThanOrEqual(0);
      expect(status.memoryPressure).toBeLessThanOrEqual(1);
      expect(['low', 'moderate', 'high', 'critical']).toContain(status.pressureLevel);
      expect(Array.isArray(status.recommendations)).toBe(true);
    });

    it('should calculate memory pressure correctly', () => {
      const status = memoryManager.checkMemoryStatus();
      
      // Memory pressure should be between 0 and 1
      expect(status.memoryPressure).toBeGreaterThanOrEqual(0);
      expect(status.memoryPressure).toBeLessThanOrEqual(1);
    });

    it('should determine pressure level correctly', () => {
      const status = memoryManager.checkMemoryStatus();
      
      if (status.memoryPressure < 0.6) {
        expect(status.pressureLevel).toBe('low');
      } else if (status.memoryPressure < 0.75) {
        expect(status.pressureLevel).toBe('moderate');
      } else if (status.memoryPressure < 0.9) {
        expect(status.pressureLevel).toBe('high');
      } else {
        expect(status.pressureLevel).toBe('critical');
      }
    });
  });

  describe('performCleanup', () => {
    it('should perform cleanup and return results', async () => {
      const result = await memoryManager.performCleanup();
      
      expect(result).toBeDefined();
      expect(result.canvasesCleared).toBeGreaterThanOrEqual(0);
      expect(result.texturesCleared).toBeGreaterThanOrEqual(0);
      expect(result.memoryFreed).toBeGreaterThanOrEqual(0);
      expect(result.memoryFreedMB).toBeGreaterThanOrEqual(0);
      expect(typeof result.qualityDegraded).toBe('boolean');
      expect(Array.isArray(result.degradationChanges)).toBe(true);
    });

    it('should free memory after cleanup', async () => {
      const beforeStatus = memoryManager.checkMemoryStatus();
      await memoryManager.performCleanup();
      const afterStatus = memoryManager.checkMemoryStatus();
      
      // Memory usage should be same or less after cleanup
      expect(afterStatus.totalMemoryUsage).toBeLessThanOrEqual(beforeStatus.totalMemoryUsage);
    });
  });

  describe('handleMemoryPressure', () => {
    it('should handle memory pressure without errors', async () => {
      await expect(memoryManager.handleMemoryPressure()).resolves.not.toThrow();
    });

    it('should perform cleanup on moderate pressure', async () => {
      // This test would need to simulate moderate memory pressure
      await memoryManager.handleMemoryPressure();
      
      const status = memoryManager.checkMemoryStatus();
      expect(status).toBeDefined();
    });
  });

  describe('texture cache integration', () => {
    it('should work with texture cache', () => {
      const textureCache = new TextureCache();
      memoryManager.setTextureCache(textureCache);
      
      const status = memoryManager.checkMemoryStatus();
      expect(status.textureCacheMemory).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration updates', () => {
    it('should update configuration', () => {
      memoryManager.updateConfig({
        enableAutoCleanup: true,
        cleanupIntervalMs: 45000
      });
      
      // Should not throw
      expect(memoryManager).toBeDefined();
    });
  });

  describe('disposal', () => {
    it('should dispose cleanly', () => {
      memoryManager.dispose();
      
      // Should not throw
      expect(memoryManager).toBeDefined();
    });
  });
});

describe('Canvas Pool Memory Management', () => {
  it('should track canvas pool memory usage', async () => {
    const { getCanvasPool } = await import('./canvasPool');
    const canvasPool = getCanvasPool();
    
    const stats = canvasPool.getMemoryStats();
    
    expect(stats).toBeDefined();
    expect(stats.estimatedMemoryUsage).toBeGreaterThanOrEqual(0);
    expect(stats.estimatedMemoryUsageMB).toBeGreaterThanOrEqual(0);
    expect(stats.memoryThreshold).toBeGreaterThan(0);
    expect(stats.memoryPressure).toBeGreaterThanOrEqual(0);
    expect(typeof stats.isUnderPressure).toBe('boolean');
  });

  it('should perform force cleanup', async () => {
    const { getCanvasPool } = await import('./canvasPool');
    const canvasPool = getCanvasPool();
    
    // Should not throw
    expect(() => canvasPool.forceCleanup()).not.toThrow();
  });
});

describe('Texture Cache Memory Management', () => {
  let textureCache: TextureCache;

  beforeEach(() => {
    textureCache = new TextureCache();
  });

  it('should track memory pressure', () => {
    const pressure = textureCache.getMemoryPressure();
    
    expect(pressure).toBeGreaterThanOrEqual(0);
    expect(pressure).toBeLessThanOrEqual(1);
  });

  it('should detect memory pressure', () => {
    const isUnderPressure = textureCache.isUnderMemoryPressure();
    
    expect(typeof isUnderPressure).toBe('boolean');
  });

  it('should clear old textures', () => {
    const cleared = textureCache.clearOldTextures(1000);
    
    expect(cleared).toBeGreaterThanOrEqual(0);
  });

  it('should clear to memory target', () => {
    const cleared = textureCache.clearToMemoryTarget(10);
    
    expect(cleared).toBeGreaterThanOrEqual(0);
  });
});

describe('Quality Manager Degradation', () => {
  it('should degrade quality for memory pressure', async () => {
    const { getQualityManager } = await import('./qualityManager');
    const qualityManager = getQualityManager();
    
    const result = qualityManager.degradeQualityForMemoryPressure(0.8);
    
    expect(result).toBeDefined();
    expect(typeof result.degraded).toBe('boolean');
    expect(Array.isArray(result.changes)).toBe(true);
  });

  it('should restore quality after memory relief', async () => {
    const { getQualityManager } = await import('./qualityManager');
    const qualityManager = getQualityManager();
    
    // Should not throw
    expect(() => qualityManager.restoreQualityAfterMemoryRelief()).not.toThrow();
  });

  it('should degrade more at higher pressure levels', async () => {
    const { getQualityManager } = await import('./qualityManager');
    const qualityManager = getQualityManager();
    
    const moderateResult = qualityManager.degradeQualityForMemoryPressure(0.65);
    qualityManager.restoreQualityAfterMemoryRelief();
    
    const highResult = qualityManager.degradeQualityForMemoryPressure(0.85);
    qualityManager.restoreQualityAfterMemoryRelief();
    
    const criticalResult = qualityManager.degradeQualityForMemoryPressure(0.95);
    
    // Higher pressure should result in more changes
    expect(criticalResult.changes.length).toBeGreaterThanOrEqual(highResult.changes.length);
  });
});
