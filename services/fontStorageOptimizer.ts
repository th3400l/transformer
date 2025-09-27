// Font storage optimization service with compression and cleanup
// Requirements: 7.4, 7.5, 6.7, 6.8

import { 
  IFontStorageService, 
  StoredFontInfo, 
  IBrowserCompatibilityLayer,
  FontStorageError 
} from '../types/fontStorage';

export interface StorageOptimizationResult {
  freedSpace: number;
  removedFonts: string[];
  compressionSavings: number;
  memoryFreed: number;
  optimizationTime: number;
}

export interface MemoryUsageStats {
  totalMemoryUsage: number;
  activeFonts: number;
  cachedFonts: number;
  estimatedMemoryPerFont: number;
  memoryPressure: 'low' | 'medium' | 'high';
}

export interface StoragePerformanceMetrics {
  averageCompressionTime: number;
  averageDecompressionTime: number;
  compressionRatio: number;
  storageEfficiency: number;
  cleanupFrequency: number;
}

export interface IFontStorageOptimizer {
  compressFontData(fontData: ArrayBuffer): Promise<ArrayBuffer>;
  decompressFontData(compressedData: ArrayBuffer): Promise<ArrayBuffer>;
  cleanupOrphanedFonts(): Promise<void>;
  optimizeStorageUsage(): Promise<StorageOptimizationResult>;
  getCompressionRatio(originalSize: number, compressedSize: number): number;
  
  // Enhanced memory management methods
  monitorMemoryUsage(): Promise<MemoryUsageStats>;
  unloadUnusedFonts(maxUnusedDays?: number): Promise<void>;
  optimizeMemoryUsage(): Promise<void>;
  getPerformanceMetrics(): StoragePerformanceMetrics;
  
  // Automatic cleanup scheduling
  scheduleAutomaticCleanup(intervalHours?: number): void;
  stopAutomaticCleanup(): void;
}

/**
 * Font storage optimizer that provides compression and cleanup functionality
 * Requirements: 7.4, 7.5, 7.6 - Enhanced memory management and performance optimization
 */
export class FontStorageOptimizer implements IFontStorageOptimizer {
  private static readonly COMPRESSION_THRESHOLD = 1024; // Only compress files > 1KB
  private static readonly MAX_FONT_AGE_DAYS = 30; // Remove fonts older than 30 days if not used
  private static readonly MEMORY_PRESSURE_THRESHOLD_MB = 50; // Memory pressure threshold in MB
  private static readonly HIGH_MEMORY_PRESSURE_THRESHOLD_MB = 100; // High memory pressure threshold
  
  private performanceMetrics: StoragePerformanceMetrics = {
    averageCompressionTime: 0,
    averageDecompressionTime: 0,
    compressionRatio: 0,
    storageEfficiency: 0,
    cleanupFrequency: 0
  };
  
  private compressionTimes: number[] = [];
  private decompressionTimes: number[] = [];
  private cleanupCount: number = 0;
  private lastCleanupTime: number = Date.now();
  private automaticCleanupInterval?: number;
  
  constructor(
    private fontStorage: IFontStorageService,
    private compatibilityLayer: IBrowserCompatibilityLayer
  ) {}

  /**
   * Compress font data using browser-native compression when available
   * Requirements: 7.4, 7.5 - Storage optimization with performance tracking
   * @param fontData Original font data
   * @returns Compressed font data
   */
  async compressFontData(fontData: ArrayBuffer): Promise<ArrayBuffer> {
    const startTime = performance.now();
    
    // Skip compression for small files
    if (fontData.byteLength < FontStorageOptimizer.COMPRESSION_THRESHOLD) {
      return fontData;
    }

    // Check if compression is supported
    if (!this.compatibilityLayer.supportsFeature('compression')) {
      return fontData; // Return original if compression not supported
    }

    try {
      // Use CompressionStream for gzip compression
      const compressionStream = new CompressionStream('gzip');
      const compressedStream = new Response(fontData).body?.pipeThrough(compressionStream);
      
      if (!compressedStream) {
        throw new Error('Failed to create compression stream');
      }

      const compressedResponse = new Response(compressedStream);
      const compressedData = await compressedResponse.arrayBuffer();
      
      // Track compression performance
      const compressionTime = performance.now() - startTime;
      this.updateCompressionMetrics(compressionTime, fontData.byteLength, compressedData.byteLength);
      
      // Only return compressed data if it's actually smaller
      if (compressedData.byteLength < fontData.byteLength) {
        return compressedData;
      } else {
        return fontData; // Return original if compression didn't help
      }
    } catch (error) {
      console.warn('Font compression failed, using original data:', error);
      return fontData;
    }
  }

  /**
   * Decompress font data using browser-native decompression
   * Requirements: 7.4, 7.5 - Storage optimization with performance tracking
   * @param compressedData Compressed font data
   * @returns Decompressed font data
   */
  async decompressFontData(compressedData: ArrayBuffer): Promise<ArrayBuffer> {
    const startTime = performance.now();
    
    if (!this.compatibilityLayer.supportsFeature('compression')) {
      return compressedData; // Assume it's not compressed
    }

    try {
      // Try to decompress - if it fails, assume data wasn't compressed
      const decompressionStream = new DecompressionStream('gzip');
      const decompressedStream = new Response(compressedData).body?.pipeThrough(decompressionStream);
      
      if (!decompressedStream) {
        return compressedData; // Return original if decompression stream fails
      }

      const decompressedResponse = new Response(decompressedStream);
      const decompressedData = await decompressedResponse.arrayBuffer();
      
      // Track decompression performance
      const decompressionTime = performance.now() - startTime;
      this.updateDecompressionMetrics(decompressionTime);
      
      return decompressedData;
    } catch (error) {
      // If decompression fails, assume data wasn't compressed
      return compressedData;
    }
  }

  /**
   * Clean up orphaned fonts and old unused fonts
   */
  async cleanupOrphanedFonts(): Promise<void> {
    try {
      const storedFonts = await this.fontStorage.listStoredFonts();
      const now = new Date();
      const maxAge = FontStorageOptimizer.MAX_FONT_AGE_DAYS * 24 * 60 * 60 * 1000; // Convert to milliseconds

      for (const font of storedFonts) {
        const fontAge = now.getTime() - font.uploadDate.getTime();
        
        // Remove fonts that are too old (this is a simple cleanup strategy)
        // In a real implementation, you might want to track last access time
        if (fontAge > maxAge) {
          try {
            await this.fontStorage.removeFont(font.storageKey);

          } catch (error) {
            console.warn(`Failed to clean up font ${font.storageKey}:`, error);
          }
        }
      }
    } catch (error) {
      throw new FontStorageError('cleanup', undefined, `Font cleanup failed: ${error}`);
    }
  }

  /**
   * Optimize storage usage by compressing fonts and cleaning up old data
   * Requirements: 7.4, 7.5, 7.6 - Enhanced optimization with memory tracking
   * @returns Optimization results
   */
  async optimizeStorageUsage(): Promise<StorageOptimizationResult> {
    const startTime = performance.now();
    const initialMemoryStats = await this.monitorMemoryUsage();
    
    const result: StorageOptimizationResult = {
      freedSpace: 0,
      removedFonts: [],
      compressionSavings: 0,
      memoryFreed: 0,
      optimizationTime: 0
    };

    try {
      // Get initial storage usage
      const initialUsage = await this.fontStorage.getStorageUsage();
      const initialSize = initialUsage.totalSize;

      // Clean up orphaned fonts first
      const fontsBeforeCleanup = await this.fontStorage.listStoredFonts();
      await this.cleanupOrphanedFonts();
      const fontsAfterCleanup = await this.fontStorage.listStoredFonts();

      // Calculate removed fonts
      const removedFontKeys = fontsBeforeCleanup
        .filter(before => !fontsAfterCleanup.some(after => after.storageKey === before.storageKey))
        .map(font => font.storageKey);
      
      result.removedFonts = removedFontKeys;

      // Compress remaining fonts if compression is available
      if (this.compatibilityLayer.supportsFeature('compression')) {
        await this.compressStoredFonts();
      }

      // Optimize memory usage
      await this.optimizeMemoryUsage();

      // Get final storage usage and memory stats
      const finalUsage = await this.fontStorage.getStorageUsage();
      const finalSize = finalUsage.totalSize;
      const finalMemoryStats = await this.monitorMemoryUsage();

      result.freedSpace = Math.max(0, initialSize - finalSize);
      result.compressionSavings = result.freedSpace - this.calculateCleanupSavings(fontsBeforeCleanup, removedFontKeys);
      result.memoryFreed = Math.max(0, initialMemoryStats.totalMemoryUsage - finalMemoryStats.totalMemoryUsage);
      result.optimizationTime = performance.now() - startTime;

      // Update cleanup frequency tracking
      this.cleanupCount++;
      this.updateCleanupFrequency();

      return result;
    } catch (error) {
      throw new FontStorageError('optimize', undefined, `Storage optimization failed: ${error}`);
    }
  }

  /**
   * Get compression ratio as a percentage
   * @param originalSize Original file size
   * @param compressedSize Compressed file size
   * @returns Compression ratio (0-100)
   */
  getCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }

  /**
   * Compress all stored fonts (private method for optimization)
   */
  private async compressStoredFonts(): Promise<void> {
    const storedFonts = await this.fontStorage.listStoredFonts();

    for (const fontInfo of storedFonts) {
      try {
        // Retrieve font data
        const fontData = await this.fontStorage.retrieveFont(fontInfo.storageKey);
        if (!fontData) continue;

        // Compress the data
        const compressedData = await this.compressFontData(fontData);
        
        // Only re-store if compression made a significant difference
        const compressionRatio = this.getCompressionRatio(fontData.byteLength, compressedData.byteLength);
        if (compressionRatio > 10) { // Only if we save more than 10%
          // Remove old version and store compressed version
          await this.fontStorage.removeFont(fontInfo.storageKey);
          await this.fontStorage.storeFont(compressedData, fontInfo.metadata);
        }
      } catch (error) {
        console.warn(`Failed to compress font ${fontInfo.storageKey}:`, error);
        // Continue with other fonts
      }
    }
  }

  /**
   * Monitor memory usage of font storage and caching
   * Requirements: 7.4, 7.5, 7.6 - Memory monitoring
   */
  async monitorMemoryUsage(): Promise<MemoryUsageStats> {
    try {
      const storedFonts = await this.fontStorage.listStoredFonts();
      const totalMemoryUsage = storedFonts.reduce((total, font) => total + font.size, 0);
      const activeFonts = storedFonts.length;
      
      // Estimate cached fonts (fonts loaded in browser memory)
      const cachedFonts = document.fonts.size || 0;
      const estimatedMemoryPerFont = activeFonts > 0 ? totalMemoryUsage / activeFonts : 0;
      
      // Determine memory pressure level
      const memoryUsageMB = totalMemoryUsage / (1024 * 1024);
      let memoryPressure: 'low' | 'medium' | 'high' = 'low';
      
      if (memoryUsageMB > FontStorageOptimizer.HIGH_MEMORY_PRESSURE_THRESHOLD_MB) {
        memoryPressure = 'high';
      } else if (memoryUsageMB > FontStorageOptimizer.MEMORY_PRESSURE_THRESHOLD_MB) {
        memoryPressure = 'medium';
      }
      
      return {
        totalMemoryUsage,
        activeFonts,
        cachedFonts,
        estimatedMemoryPerFont,
        memoryPressure
      };
    } catch (error) {
      console.warn('Failed to monitor memory usage:', error);
      return {
        totalMemoryUsage: 0,
        activeFonts: 0,
        cachedFonts: 0,
        estimatedMemoryPerFont: 0,
        memoryPressure: 'low'
      };
    }
  }

  /**
   * Unload unused fonts from memory to reduce memory pressure
   * Requirements: 7.4, 7.5, 7.6 - Memory management
   */
  async unloadUnusedFonts(maxUnusedDays: number = 7): Promise<void> {
    const now = Date.now();
    const maxUnusedMs = maxUnusedDays * 24 * 60 * 60 * 1000;
    
    try {
      const storedFonts = await this.fontStorage.listStoredFonts();
      
      for (const fontInfo of storedFonts) {
        // Check if font hasn't been accessed recently
        const timeSinceUpload = now - fontInfo.uploadDate.getTime();
        
        // For now, use upload date as proxy for last access
        // In a real implementation, you'd track last access time
        if (timeSinceUpload > maxUnusedMs) {
          // Find and remove from document.fonts if loaded
          const fontFaces = Array.from(document.fonts);
          const fontFamily = fontInfo.metadata.fontFamily;
          
          const loadedFontFace = fontFaces.find(ff => 
            ff.family === fontFamily || ff.family === `'${fontFamily}'`
          );
          
          if (loadedFontFace) {
            document.fonts.delete(loadedFontFace);

          }
        }
      }
    } catch (error) {
      console.warn('Failed to unload unused fonts:', error);
    }
  }

  /**
   * Optimize memory usage based on current memory pressure
   * Requirements: 7.4, 7.5, 7.6 - Adaptive memory optimization
   */
  async optimizeMemoryUsage(): Promise<void> {
    const memoryStats = await this.monitorMemoryUsage();
    
    switch (memoryStats.memoryPressure) {
      case 'high':
        // Aggressive cleanup for high memory pressure
        await this.unloadUnusedFonts(3); // Unload fonts unused for 3+ days
        await this.cleanupOrphanedFonts();
        break;
        
      case 'medium':
        // Moderate cleanup for medium memory pressure
        await this.unloadUnusedFonts(7); // Unload fonts unused for 7+ days
        break;
        
      case 'low':
        // Light cleanup for low memory pressure
        await this.unloadUnusedFonts(14); // Unload fonts unused for 14+ days
        break;
    }
  }

  /**
   * Get performance metrics for storage operations
   * Requirements: 7.1, 7.2, 7.3 - Performance monitoring
   */
  getPerformanceMetrics(): StoragePerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Schedule automatic cleanup at regular intervals
   * Requirements: 7.4, 7.5, 7.6 - Automated maintenance
   */
  scheduleAutomaticCleanup(intervalHours: number = 24): void {
    // Clear existing interval if any
    this.stopAutomaticCleanup();
    
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    this.automaticCleanupInterval = window.setInterval(async () => {
      try {

        await this.optimizeStorageUsage();

      } catch (error) {
        console.warn('Automatic cleanup failed:', error);
      }
    }, intervalMs);
    

  }

  /**
   * Stop automatic cleanup
   * Requirements: 7.4, 7.5, 7.6 - Cleanup management
   */
  stopAutomaticCleanup(): void {
    if (this.automaticCleanupInterval) {
      clearInterval(this.automaticCleanupInterval);
      this.automaticCleanupInterval = undefined;

    }
  }

  // Private helper methods for performance tracking

  /**
   * Update compression performance metrics
   */
  private updateCompressionMetrics(compressionTime: number, originalSize: number, compressedSize: number): void {
    this.compressionTimes.push(compressionTime);
    
    // Keep only last 50 measurements
    if (this.compressionTimes.length > 50) {
      this.compressionTimes = this.compressionTimes.slice(-25);
    }
    
    // Update average compression time
    this.performanceMetrics.averageCompressionTime = 
      this.compressionTimes.reduce((sum, time) => sum + time, 0) / this.compressionTimes.length;
    
    // Update compression ratio
    const ratio = this.getCompressionRatio(originalSize, compressedSize);
    this.performanceMetrics.compressionRatio = 
      (this.performanceMetrics.compressionRatio + ratio) / 2; // Running average
  }

  /**
   * Update decompression performance metrics
   */
  private updateDecompressionMetrics(decompressionTime: number): void {
    this.decompressionTimes.push(decompressionTime);
    
    // Keep only last 50 measurements
    if (this.decompressionTimes.length > 50) {
      this.decompressionTimes = this.decompressionTimes.slice(-25);
    }
    
    // Update average decompression time
    this.performanceMetrics.averageDecompressionTime = 
      this.decompressionTimes.reduce((sum, time) => sum + time, 0) / this.decompressionTimes.length;
  }

  /**
   * Update cleanup frequency metrics
   */
  private updateCleanupFrequency(): void {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.lastCleanupTime;
    
    // Calculate cleanup frequency (cleanups per day)
    const daysSinceLastCleanup = timeSinceLastCleanup / (1000 * 60 * 60 * 24);
    this.performanceMetrics.cleanupFrequency = daysSinceLastCleanup > 0 ? 1 / daysSinceLastCleanup : 0;
    
    this.lastCleanupTime = now;
  }

  /**
   * Calculate space savings from cleanup operations
   */
  private calculateCleanupSavings(originalFonts: StoredFontInfo[], removedKeys: string[]): number {
    return originalFonts
      .filter(font => removedKeys.includes(font.storageKey))
      .reduce((total, font) => total + font.size, 0);
  }
}

/**
 * Enhanced FontStorageService with built-in optimization
 */
export class OptimizedFontStorageService implements IFontStorageService {
  private optimizer: FontStorageOptimizer;

  constructor(
    private baseStorage: IFontStorageService,
    compatibilityLayer: IBrowserCompatibilityLayer
  ) {
    this.optimizer = new FontStorageOptimizer(baseStorage, compatibilityLayer);
  }

  /**
   * Store font with automatic compression
   */
  async storeFont(fontData: ArrayBuffer, metadata: any): Promise<string> {
    // Compress font data before storing
    const compressedData = await this.optimizer.compressFontData(fontData);
    return this.baseStorage.storeFont(compressedData, metadata);
  }

  /**
   * Retrieve font with automatic decompression
   */
  async retrieveFont(storageKey: string): Promise<ArrayBuffer | null> {
    const data = await this.baseStorage.retrieveFont(storageKey);
    if (!data) return null;

    // Attempt to decompress the data
    return this.optimizer.decompressFontData(data);
  }

  /**
   * Remove font (delegates to base storage)
   */
  async removeFont(storageKey: string): Promise<void> {
    return this.baseStorage.removeFont(storageKey);
  }

  /**
   * List stored fonts (delegates to base storage)
   */
  async listStoredFonts(): Promise<StoredFontInfo[]> {
    return this.baseStorage.listStoredFonts();
  }

  /**
   * Get storage usage (delegates to base storage)
   */
  async getStorageUsage(): Promise<any> {
    return this.baseStorage.getStorageUsage();
  }

  /**
   * Clear all fonts (delegates to base storage)
   */
  async clearAllFonts(): Promise<void> {
    return this.baseStorage.clearAllFonts();
  }

  /**
   * Get the optimizer instance for manual optimization operations
   */
  getOptimizer(): FontStorageOptimizer {
    return this.optimizer;
  }
}