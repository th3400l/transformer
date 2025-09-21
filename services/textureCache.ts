// Texture caching implementation for Gear-1 handwriting system
// Provides Map-based caching with size limits and LRU eviction
// Requirements: 2.1, 2.2, 2.3, 6.1, 6.2

import { ITextureCache, PaperTexture } from '../types';

export interface TextureCacheOptions {
  maxSize: number;
  maxMemoryMB: number;
  enableLRU: boolean;
}

export class TextureCache implements ITextureCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly accessOrder = new Map<string, number>();
  private readonly options: TextureCacheOptions;
  private accessCounter = 0;
  private currentMemoryUsage = 0;

  constructor(options: Partial<TextureCacheOptions> = {}) {
    this.options = {
      maxSize: options.maxSize ?? 50,
      maxMemoryMB: options.maxMemoryMB ?? 100,
      enableLRU: options.enableLRU ?? true
    };
  }

  /**
   * Get texture from cache
   * Requirements: 6.1 (client-side caching), 6.2 (performance)
   */
  get(key: string): PaperTexture | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Update access time for LRU
    if (this.options.enableLRU) {
      this.accessOrder.set(key, ++this.accessCounter);
    }

    return entry.texture;
  }

  /**
   * Set texture in cache with memory management
   * Requirements: 6.1 (client-side caching), 6.2 (performance optimization)
   */
  set(key: string, texture: PaperTexture): void {
    if (!texture || !texture.isLoaded) {
      throw new Error('Cannot cache unloaded texture');
    }

    const memorySize = this.calculateTextureMemory(texture);
    
    // Check if we need to evict entries
    this.ensureCapacity(memorySize);
    
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // Add new entry
    const entry: CacheEntry = {
      texture,
      memorySize,
      timestamp: Date.now()
    };

    this.cache.set(key, entry);
    this.currentMemoryUsage += memorySize;
    
    if (this.options.enableLRU) {
      this.accessOrder.set(key, ++this.accessCounter);
    }
  }

  /**
   * Clear all cached textures
   * Requirements: 6.2 (memory management)
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.currentMemoryUsage = 0;
    this.accessCounter = 0;
  }

  /**
   * Remove specific texture from cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.currentMemoryUsage -= entry.memorySize;
    
    return true;
  }

  /**
   * Get cache statistics
   * Requirements: 6.2 (performance monitoring)
   */
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      memoryUsageMB: this.currentMemoryUsage / (1024 * 1024),
      maxMemoryMB: this.options.maxMemoryMB,
      hitRate: this.calculateHitRate(),
      oldestEntry: this.getOldestEntryAge(),
      newestEntry: this.getNewestEntryAge()
    };
  }

  /**
   * Check if cache has specific key
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get all cached keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Ensure cache has capacity for new entry
   * Requirements: 6.2 (memory management)
   */
  private ensureCapacity(requiredMemory: number): void {
    const maxMemoryBytes = this.options.maxMemoryMB * 1024 * 1024;
    
    // Evict entries if we exceed size or memory limits
    while (
      this.cache.size >= this.options.maxSize ||
      this.currentMemoryUsage + requiredMemory > maxMemoryBytes
    ) {
      if (this.cache.size === 0) {
        break; // Prevent infinite loop
      }
      
      const keyToEvict = this.selectEvictionCandidate();
      if (keyToEvict) {
        this.remove(keyToEvict);
      } else {
        break; // No more candidates
      }
    }
  }

  /**
   * Select entry for eviction using LRU or FIFO strategy
   */
  private selectEvictionCandidate(): string | null {
    if (this.cache.size === 0) {
      return null;
    }

    if (this.options.enableLRU && this.accessOrder.size > 0) {
      // Find least recently used entry
      let lruKey: string | null = null;
      let lruAccess = Infinity;
      
      for (const [key, accessTime] of this.accessOrder) {
        if (accessTime < lruAccess) {
          lruAccess = accessTime;
          lruKey = key;
        }
      }
      
      return lruKey;
    } else {
      // Use FIFO - find oldest entry by timestamp
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [key, entry] of this.cache) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      
      return oldestKey;
    }
  }

  /**
   * Calculate memory usage of a texture
   * Requirements: 6.2 (memory monitoring)
   */
  private calculateTextureMemory(texture: PaperTexture): number {
    let totalMemory = 0;
    
    // Calculate base image memory (width * height * 4 bytes per pixel for RGBA)
    if (texture.baseImage) {
      totalMemory += texture.baseImage.naturalWidth * texture.baseImage.naturalHeight * 4;
    }
    
    // Calculate lines image memory if present
    if (texture.linesImage) {
      totalMemory += texture.linesImage.naturalWidth * texture.linesImage.naturalHeight * 4;
    }
    
    return totalMemory;
  }

  /**
   * Calculate cache hit rate (placeholder - would need hit/miss tracking)
   */
  private calculateHitRate(): number {
    // This would require tracking hits and misses over time
    // For now, return a placeholder value
    return 0;
  }

  /**
   * Get age of oldest cache entry in milliseconds
   */
  private getOldestEntryAge(): number {
    if (this.cache.size === 0) {
      return 0;
    }
    
    let oldestTime = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
      }
    }
    
    return Date.now() - oldestTime;
  }

  /**
   * Get age of newest cache entry in milliseconds
   */
  private getNewestEntryAge(): number {
    if (this.cache.size === 0) {
      return 0;
    }
    
    let newestTime = 0;
    for (const entry of this.cache.values()) {
      if (entry.timestamp > newestTime) {
        newestTime = entry.timestamp;
      }
    }
    
    return Date.now() - newestTime;
  }
}

// Internal cache entry interface
interface CacheEntry {
  texture: PaperTexture;
  memorySize: number;
  timestamp: number;
}

// Cache statistics interface
export interface CacheStats {
  size: number;
  maxSize: number;
  memoryUsageMB: number;
  maxMemoryMB: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}