// Performant Font Loader Service for optimized font loading
// Requirements: 7.1, 7.2, 7.3 - Font loading optimization with priority queues and caching

import { 
  HandwritingFont, 
  CustomFont, 
  FontLoadResult, 
  FontLoadError 
} from '../types/fonts';
import { IFontStorageService } from '../types/fontStorage';

export interface IPerformantFontLoader {
  preloadCustomFonts(): Promise<void>;
  loadFontOnDemand(fontId: string): Promise<FontLoadResult>;
  unloadUnusedFonts(): Promise<void>;
  optimizeFontData(fontData: ArrayBuffer): Promise<ArrayBuffer>;
  getFontCache(): Map<string, FontFace>;
  clearCache(): void;
  getLoadingStats(): FontLoadingStats;
}

export interface FontLoadingStats {
  totalLoads: number;
  successfulLoads: number;
  failedLoads: number;
  averageLoadTime: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
}

export interface FontLoadPriority {
  fontId: string;
  priority: number;
  lastUsed?: Date;
  usageCount: number;
  estimatedSize: number;
}

export class PerformantFontLoader implements IPerformantFontLoader {
  private fontCache = new Map<string, FontFace>();
  private loadingPromises = new Map<string, Promise<FontLoadResult>>();
  private priorityQueue: FontLoadPriority[] = [];
  private loadingStats: FontLoadingStats = {
    totalLoads: 0,
    successfulLoads: 0,
    failedLoads: 0,
    averageLoadTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0
  };
  private loadTimes: number[] = [];
  private maxCacheSize: number = 10; // Maximum number of fonts to keep in cache
  private maxConcurrentLoads: number = 3; // Maximum concurrent font loads
  private currentLoads: number = 0;

  constructor(
    private fontStorageService: IFontStorageService,
    private customFonts: CustomFont[] = []
  ) {}

  /**
   * Preload custom fonts with intelligent priority-based loading
   * Requirements: 7.1, 7.2, 7.3 - Priority-based preloading
   */
  async preloadCustomFonts(): Promise<void> {
    if (this.customFonts.length === 0) {
      return;
    }

    // Build priority queue based on usage patterns
    this.buildPriorityQueue();

    // Load high-priority fonts first
    const highPriorityFonts = this.priorityQueue
      .filter(p => p.priority > 50)
      .slice(0, 3); // Limit to top 3 high-priority fonts

    if (highPriorityFonts.length === 0) {
      // If no high-priority fonts, load the most recently used
      const recentFonts = this.priorityQueue
        .sort((a, b) => {
          const aTime = a.lastUsed?.getTime() || 0;
          const bTime = b.lastUsed?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 2);

      await this.loadFontsWithBatching(recentFonts);
    } else {
      await this.loadFontsWithBatching(highPriorityFonts);
    }
  }

  /**
   * Load font on demand with caching
   * Requirements: 7.1, 7.2, 7.3 - On-demand loading with cache optimization
   */
  async loadFontOnDemand(fontId: string): Promise<FontLoadResult> {
    const startTime = performance.now();

    // Check cache first
    if (this.fontCache.has(fontId)) {
      this.loadingStats.cacheHits++;
      const cachedFont = this.customFonts.find(f => f.id === fontId);
      if (cachedFont) {
        return {
          font: { ...cachedFont, loaded: true },
          success: true,
          loadTime: performance.now() - startTime
        };
      }
    }

    this.loadingStats.cacheMisses++;

    // Check if loading is already in progress
    if (this.loadingPromises.has(fontId)) {
      return await this.loadingPromises.get(fontId)!;
    }

    // Wait for available loading slot
    await this.waitForLoadingSlot();

    const loadPromise = this.performOptimizedFontLoad(fontId, startTime);
    this.loadingPromises.set(fontId, loadPromise);

    try {
      const result = await loadPromise;
      this.updateLoadingStats(result);
      return result;
    } finally {
      this.loadingPromises.delete(fontId);
      this.currentLoads--;
    }
  }

  /**
   * Unload unused fonts to free memory
   * Requirements: 7.4, 7.5, 7.6 - Memory management
   */
  async unloadUnusedFonts(): Promise<void> {
    const now = Date.now();
    const maxUnusedTime = 30 * 60 * 1000; // 30 minutes

    // Find fonts that haven't been used recently
    const fontsToUnload: string[] = [];
    
    for (const [fontId, fontFace] of this.fontCache.entries()) {
      const customFont = this.customFonts.find(f => f.id === fontId);
      if (customFont && customFont.lastUsed) {
        const timeSinceLastUse = now - customFont.lastUsed.getTime();
        if (timeSinceLastUse > maxUnusedTime) {
          fontsToUnload.push(fontId);
        }
      }
    }

    // Unload fonts and update cache
    for (const fontId of fontsToUnload) {
      await this.unloadFont(fontId);
    }

    // If cache is still too large, remove least recently used fonts
    if (this.fontCache.size > this.maxCacheSize) {
      await this.evictLeastRecentlyUsedFonts();
    }
  }

  /**
   * Optimize font data for better performance
   * Requirements: 7.4, 7.5 - Storage and performance optimization
   */
  async optimizeFontData(fontData: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      // Use browser-native compression if available
      if ('CompressionStream' in window) {
        return await this.compressArrayBuffer(fontData);
      }

      // Fallback: return original data
      return fontData;
    } catch (error) {
      console.warn('Font data optimization failed:', error);
      return fontData;
    }
  }

  /**
   * Get current font cache
   * Requirements: 7.1, 7.2, 7.3 - Cache management
   */
  getFontCache(): Map<string, FontFace> {
    return new Map(this.fontCache);
  }

  /**
   * Clear font cache
   * Requirements: 7.4, 7.5, 7.6 - Memory management
   */
  clearCache(): void {
    // Remove all font faces from document
    for (const [fontId, fontFace] of this.fontCache.entries()) {
      try {
        document.fonts.delete(fontFace);
      } catch (error) {
        console.warn(`Failed to remove font face for ${fontId}:`, error);
      }
    }

    this.fontCache.clear();
    this.loadingPromises.clear();
    this.currentLoads = 0;
  }

  /**
   * Get loading statistics
   * Requirements: 7.1, 7.2, 7.3 - Performance monitoring
   */
  getLoadingStats(): FontLoadingStats {
    // Update memory usage estimate
    this.loadingStats.memoryUsage = this.estimateMemoryUsage();
    return { ...this.loadingStats };
  }

  /**
   * Update custom fonts reference
   */
  updateCustomFonts(customFonts: CustomFont[]): void {
    this.customFonts = customFonts;
    this.buildPriorityQueue();
  }

  // Private helper methods

  /**
   * Build priority queue based on usage patterns
   * Requirements: 7.1, 7.2 - Priority-based loading
   */
  private buildPriorityQueue(): void {
    const now = Date.now();
    
    this.priorityQueue = this.customFonts.map(font => {
      // Calculate priority based on usage count and recency
      const daysSinceLastUse = font.lastUsed 
        ? (now - font.lastUsed.getTime()) / (1000 * 60 * 60 * 24)
        : 365;
      
      const usageScore = (font.usageCount || 0) * 10;
      const recencyScore = Math.max(0, 30 - daysSinceLastUse);
      const priority = usageScore + recencyScore;

      return {
        fontId: font.id,
        priority,
        lastUsed: font.lastUsed,
        usageCount: font.usageCount || 0,
        estimatedSize: font.fileSize || 500000 // Default 500KB estimate
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Load fonts with batching to prevent browser overload
   * Requirements: 7.1, 7.2, 7.3 - Batched loading
   */
  private async loadFontsWithBatching(priorities: FontLoadPriority[]): Promise<void> {
    const batchSize = 2;
    
    for (let i = 0; i < priorities.length; i += batchSize) {
      const batch = priorities.slice(i, i + batchSize);
      
      // Load batch in parallel with error handling
      const loadPromises = batch.map(async (priority) => {
        try {
          await this.loadFontOnDemand(priority.fontId);
        } catch (error) {
          console.warn(`Failed to preload font ${priority.fontId}:`, error);
        }
      });

      await Promise.allSettled(loadPromises);
      
      // Small delay between batches
      if (i + batchSize < priorities.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Wait for available loading slot
   * Requirements: 7.1, 7.2, 7.3 - Concurrent load management
   */
  private async waitForLoadingSlot(): Promise<void> {
    while (this.currentLoads >= this.maxConcurrentLoads) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.currentLoads++;
  }

  /**
   * Perform optimized font load with caching
   * Requirements: 7.1, 7.2, 7.3 - Optimized loading
   */
  private async performOptimizedFontLoad(fontId: string, startTime: number): Promise<FontLoadResult> {
    const customFont = this.customFonts.find(f => f.id === fontId);
    if (!customFont) {
      throw new FontLoadError(fontId, 'load', `Custom font ${fontId} not found`);
    }

    try {
      // Get font data from storage
      const fontData = await this.fontStorageService.retrieveFont(customFont.storageKey);
      if (!fontData) {
        throw new FontLoadError(fontId, 'load', `Font data not available for ${fontId}`);
      }

      // Optimize font data
      const optimizedData = await this.optimizeFontData(fontData);

      // Create and load FontFace
      const primaryFamily = customFont.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      const fontFace = new FontFace(primaryFamily, optimizedData, {
        display: 'swap' // Allow fallback while loading
      });

      // Load with timeout
      const loadPromise = fontFace.load();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Font load timeout')), 5000);
      });

      await Promise.race([loadPromise, timeoutPromise]);
      
      // Add to document and cache
      document.fonts.add(fontFace);
      this.fontCache.set(fontId, fontFace);

      // Update font usage
      customFont.lastUsed = new Date();
      customFont.usageCount = (customFont.usageCount || 0) + 1;
      customFont.loaded = true;

      // Manage cache size
      if (this.fontCache.size > this.maxCacheSize) {
        await this.evictLeastRecentlyUsedFonts();
      }

      const loadTime = performance.now() - startTime;
      
      return {
        font: { ...customFont, loaded: true },
        success: true,
        loadTime
      };
    } catch (error) {
      const loadTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown font loading error';
      
      return {
        font: { ...customFont, loaded: false },
        success: false,
        error: errorMessage,
        loadTime
      };
    }
  }

  /**
   * Unload a specific font
   * Requirements: 7.4, 7.5, 7.6 - Memory management
   */
  private async unloadFont(fontId: string): Promise<void> {
    const fontFace = this.fontCache.get(fontId);
    if (fontFace) {
      try {
        document.fonts.delete(fontFace);
      } catch (error) {
        console.warn(`Failed to remove font face for ${fontId}:`, error);
      }
      this.fontCache.delete(fontId);
    }

    // Update font loaded status
    const customFont = this.customFonts.find(f => f.id === fontId);
    if (customFont) {
      customFont.loaded = false;
    }
  }

  /**
   * Evict least recently used fonts from cache
   * Requirements: 7.4, 7.5, 7.6 - Cache management
   */
  private async evictLeastRecentlyUsedFonts(): Promise<void> {
    const fontsToEvict = this.customFonts
      .filter(f => this.fontCache.has(f.id))
      .sort((a, b) => {
        const aTime = a.lastUsed?.getTime() || 0;
        const bTime = b.lastUsed?.getTime() || 0;
        return aTime - bTime; // Oldest first
      })
      .slice(0, this.fontCache.size - this.maxCacheSize + 1);

    for (const font of fontsToEvict) {
      await this.unloadFont(font.id);
    }
  }

  /**
   * Compress ArrayBuffer using browser-native compression
   * Requirements: 7.4, 7.5 - Storage optimization
   */
  private async compressArrayBuffer(data: ArrayBuffer): Promise<ArrayBuffer> {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write data to compression stream
    writer.write(new Uint8Array(data));
    writer.close();

    // Read compressed data
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks into single ArrayBuffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }

  /**
   * Update loading statistics
   * Requirements: 7.1, 7.2, 7.3 - Performance monitoring
   */
  private updateLoadingStats(result: FontLoadResult): void {
    this.loadingStats.totalLoads++;
    
    if (result.success) {
      this.loadingStats.successfulLoads++;
    } else {
      this.loadingStats.failedLoads++;
    }

    // Update average load time
    this.loadTimes.push(result.loadTime);
    if (this.loadTimes.length > 100) {
      this.loadTimes = this.loadTimes.slice(-50); // Keep last 50 measurements
    }
    
    this.loadingStats.averageLoadTime = 
      this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length;
  }

  /**
   * Estimate memory usage of cached fonts
   * Requirements: 7.4, 7.5, 7.6 - Memory monitoring
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const fontId of this.fontCache.keys()) {
      const customFont = this.customFonts.find(f => f.id === fontId);
      if (customFont) {
        totalSize += customFont.fileSize || 500000; // Default 500KB estimate
      }
    }
    
    return totalSize;
  }
}