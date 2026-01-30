/**
 * Progressive Template Loader
 * Implements progressive loading for better mobile performance
 * Requirements: 5.1, 5.2, 6.1, 6.2 - Mobile performance optimization
 */

import { PaperTemplate, PaperTexture } from '../types/core';

export interface ProgressiveLoadConfig {
  enableProgressiveLoading: boolean;
  lowQualityFirst: boolean;
  preloadCommonTemplates: boolean;
  maxConcurrentLoads: number;
  loadTimeout: number;
  retryAttempts: number;
}

export interface LoadPriority {
  template: PaperTemplate;
  priority: number; // Higher number = higher priority
  estimatedSize: number;
}

export interface LoadProgress {
  templateId: string;
  stage: 'queued' | 'loading-low' | 'loading-high' | 'complete' | 'error';
  progress: number; // 0-100
  error?: string;
}

/**
 * Progressive Template Loader
 * Loads templates progressively based on device capabilities and usage patterns
 * Requirements: 5.1, 5.2 - Mobile performance optimization
 */
export class ProgressiveTemplateLoader {
  private config: ProgressiveLoadConfig;
  private loadQueue: LoadPriority[] = [];
  private activeLoads: Map<string, Promise<PaperTexture>> = new Map();
  private loadProgress: Map<string, LoadProgress> = new Map();
  private cache: Map<string, PaperTexture> = new Map();
  private preloadedTemplates: Set<string> = new Set();

  constructor(config: Partial<ProgressiveLoadConfig> = {}) {
    this.config = {
      enableProgressiveLoading: this.shouldEnableProgressiveLoading(),
      lowQualityFirst: true,
      preloadCommonTemplates: true,
      maxConcurrentLoads: this.getOptimalConcurrentLoads(),
      loadTimeout: 10000, // 10 seconds
      retryAttempts: 2,
      ...config
    };

    if (this.config.preloadCommonTemplates) {
      this.preloadCommonTemplates();
    }
  }

  /**
   * Determine if progressive loading should be enabled
   * Requirements: 5.1, 5.2 - Device capability detection
   */
  private shouldEnableProgressiveLoading(): boolean {
    const isMobile = window.innerWidth < 768;
    const isSlowConnection = this.isSlowConnection();
    const isLowEndDevice = this.isLowEndDevice();

    return isMobile || isSlowConnection || isLowEndDevice;
  }

  /**
   * Get optimal number of concurrent loads based on device
   * Requirements: 5.1, 5.2 - Performance optimization
   */
  private getOptimalConcurrentLoads(): number {
    const isMobile = window.innerWidth < 768;
    const isLowEndDevice = this.isLowEndDevice();
    const isSlowConnection = this.isSlowConnection();

    if (isMobile && (isLowEndDevice || isSlowConnection)) {
      return 1; // Single load for constrained devices
    } else if (isMobile) {
      return 2; // Limited concurrent loads for mobile
    } else {
      return 4; // More concurrent loads for desktop
    }
  }

  /**
   * Detect slow connection
   * Requirements: 5.1, 5.2 - Network-aware loading
   */
  private isSlowConnection(): boolean {
    const connection = (navigator as any).connection;
    if (!connection) return false;

    const slowTypes = ['slow-2g', '2g', '3g'];
    return slowTypes.includes(connection.effectiveType) || connection.downlink < 1.5;
  }

  /**
   * Detect low-end device
   * Requirements: 5.1, 5.2 - Device capability detection
   */
  private isLowEndDevice(): boolean {
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory <= 2) return true;

    const hardwareConcurrency = navigator.hardwareConcurrency;
    if (hardwareConcurrency && hardwareConcurrency <= 2) return true;

    return false;
  }

  /**
   * Load template with progressive enhancement
   * Requirements: 5.1, 5.2 - Progressive loading strategy
   */
  async loadTemplate(template: PaperTemplate, priority: number = 1): Promise<PaperTexture> {
    // Check cache first
    const cached = this.cache.get(template.id);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const activeLoad = this.activeLoads.get(template.id);
    if (activeLoad) {
      return activeLoad;
    }

    // Start progressive load
    const loadPromise = this.performProgressiveLoad(template, priority);
    this.activeLoads.set(template.id, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(template.id, result);
      return result;
    } finally {
      this.activeLoads.delete(template.id);
    }
  }

  /**
   * Perform progressive loading with quality stages
   * Requirements: 5.1, 5.2 - Quality-based progressive loading
   */
  private async performProgressiveLoad(template: PaperTemplate, priority: number): Promise<PaperTexture> {
    this.updateProgress(template.id, 'queued', 0);

    if (!this.config.enableProgressiveLoading) {
      return this.loadFullQuality(template);
    }

    try {
      // Stage 1: Load low quality version first (if enabled)
      let texture: PaperTexture;
      
      if (this.config.lowQualityFirst && this.shouldLoadLowQualityFirst()) {
        this.updateProgress(template.id, 'loading-low', 25);
        texture = await this.loadLowQuality(template);
        this.updateProgress(template.id, 'loading-low', 50);
      } else {
        // Skip low quality and load full quality directly
        this.updateProgress(template.id, 'loading-high', 25);
        texture = await this.loadFullQuality(template);
        this.updateProgress(template.id, 'complete', 100);
        return texture;
      }

      // Stage 2: Upgrade to full quality in background
      if (priority > 0.5) { // Only upgrade high priority templates
        this.updateProgress(template.id, 'loading-high', 75);
        const fullQualityTexture = await this.loadFullQuality(template);
        this.updateProgress(template.id, 'complete', 100);
        return fullQualityTexture;
      }

      this.updateProgress(template.id, 'complete', 100);
      return texture;

    } catch (error) {
      this.updateProgress(template.id, 'error', 0, error instanceof Error ? error.message : 'Load failed');
      throw error;
    }
  }

  /**
   * Determine if low quality should be loaded first
   * Requirements: 5.1, 5.2 - Adaptive quality loading
   */
  private shouldLoadLowQualityFirst(): boolean {
    const isMobile = window.innerWidth < 768;
    const isSlowConnection = this.isSlowConnection();
    const isLowEndDevice = this.isLowEndDevice();

    return isMobile || isSlowConnection || isLowEndDevice;
  }

  /**
   * Load low quality version of template
   * Requirements: 5.1, 5.2 - Reduced quality for performance
   */
  private async loadLowQuality(template: PaperTemplate): Promise<PaperTexture> {
    // For low quality, we can:
    // 1. Load a smaller version of the image
    // 2. Use lower quality format (JPEG instead of PNG)
    // 3. Apply compression
    
    const lowQualityUrl = this.getLowQualityUrl(template.filename);
    const fallbackUrl = this.getFullQualityUrl(template.filename);

    let baseImage: HTMLImageElement;

    try {
      baseImage = await this.loadImageWithTimeout(lowQualityUrl);
    } catch (error) {
      // Fallback to full quality if low quality not available
      console.warn(`Low quality template load failed for ${template.id}, using full quality asset instead`, error);
      try {
        baseImage = await this.loadImageWithTimeout(fallbackUrl);
      } catch (fallbackError) {
        // If both fail, create emergency placeholder
        console.error(`Both low and full quality failed for ${template.id}, creating placeholder`, fallbackError);
        baseImage = await this.createPlaceholderImage();
      }
    }
    
    // Apply additional compression if needed
    const compressedImage = this.shouldCompress() ? 
      await this.compressImage(baseImage) : baseImage;

    return {
      baseImage: compressedImage,
      linesImage: template.type === 'lined' ? await this.loadLinesImage(template, true) : undefined,
      isLoaded: true
    };
  }

  /**
   * Load full quality version of template
   * Requirements: 5.1, 5.2 - Full quality loading
   */
  private async loadFullQuality(template: PaperTemplate): Promise<PaperTexture> {
    const fullQualityUrl = this.getFullQualityUrl(template.filename);
    const baseImage = await this.loadImageWithTimeout(fullQualityUrl);

    return {
      baseImage,
      linesImage: template.type === 'lined' ? await this.loadLinesImage(template, false) : undefined,
      isLoaded: true
    };
  }

  /**
   * Get low quality URL for template
   */
  private getLowQualityUrl(filename: string): string {
    // Try to find a low-quality version or use original with quality parameters
    const baseName = filename.split('.')[0];
    const extension = filename.split('.').pop();
    
    // Look for _low suffix or use original
    return `/template/${baseName}_low.${extension}`;
  }

  /**
   * Get full quality URL for template
   */
  private getFullQualityUrl(filename: string): string {
    return `/template/${filename}`;
  }

  /**
   * Load lines image for lined templates
   */
  private async loadLinesImage(template: PaperTemplate, lowQuality: boolean): Promise<HTMLImageElement | undefined> {
    if (template.type !== 'lined') return undefined;

    const suffix = lowQuality ? '_lines_low' : '_lines';
    const baseName = template.filename.split('.')[0];
    const extension = template.filename.split('.').pop();
    const linesUrl = `/template/${baseName}${suffix}.${extension}`;

    try {
      return await this.loadImageWithTimeout(linesUrl);
    } catch {
      // Fallback to no lines if lines image not found
      return undefined;
    }
  }

  /**
   * Load image with timeout and retry logic
   * Requirements: 5.1, 5.2 - Robust loading with error handling
   */
  private async loadImageWithTimeout(url: string): Promise<HTMLImageElement> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.loadImageWithTimeoutSingle(url);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Load failed');
        
        if (attempt < this.config.retryAttempts) {
          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Failed to load image after retries');
  }

  /**
   * Load single image with timeout
   */
  private loadImageWithTimeoutSingle(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${url}`));
      }, this.config.loadTimeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Compress image for low-end devices
   * Requirements: 5.1, 5.2 - Image compression for performance
   */
  private async compressImage(image: HTMLImageElement): Promise<HTMLImageElement> {
    if (!this.shouldCompress()) {
      return image;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return image;

    // Reduce size for compression
    const scale = 0.8;
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    // Draw with reduced quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Convert back to image
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(image); // Fallback to original
          return;
        }

        const compressedImg = new Image();
        compressedImg.onload = () => {
          URL.revokeObjectURL(compressedImg.src);
          resolve(compressedImg);
        };
        compressedImg.src = URL.createObjectURL(blob);
      }, 'image/jpeg', 0.8);
    });
  }

  /**
   * Determine if compression should be applied
   */
  private shouldCompress(): boolean {
    return this.isLowEndDevice() || this.isSlowConnection();
  }

  /**
   * Preload commonly used templates
   * Requirements: 5.1, 5.2 - Proactive loading optimization
   */
  private async preloadCommonTemplates(): Promise<void> {
    const commonTemplates: PaperTemplate[] = [
      { id: 'blank-1', name: 'Classic Blank', filename: 'blank-1.jpeg', type: 'blank' },
      { id: 'lined-1', name: 'College Ruled', filename: 'lined-1.avif', type: 'lined' }
    ];

    // Only preload on desktop or high-end mobile
    if (this.isLowEndDevice() || this.isSlowConnection()) {
      return;
    }

    // Preload with low priority
    for (const template of commonTemplates) {
      try {
        await this.loadTemplate(template, 0.1);
        this.preloadedTemplates.add(template.id);
      } catch (error) {
        console.warn(`Failed to preload template ${template.id}:`, error);
      }
    }
  }

  /**
   * Update loading progress
   */
  private updateProgress(templateId: string, stage: LoadProgress['stage'], progress: number, error?: string): void {
    this.loadProgress.set(templateId, {
      templateId,
      stage,
      progress,
      error
    });
  }

  /**
   * Get loading progress for a template
   */
  getProgress(templateId: string): LoadProgress | null {
    return this.loadProgress.get(templateId) || null;
  }

  /**
   * Get all loading progress
   */
  getAllProgress(): LoadProgress[] {
    return Array.from(this.loadProgress.values());
  }

  /**
   * Clear cache and reset loader
   */
  clearCache(): void {
    this.cache.clear();
    this.loadProgress.clear();
    this.preloadedTemplates.clear();
    this.activeLoads.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedTemplates: number;
    preloadedTemplates: number;
    activeLoads: number;
    totalMemoryEstimate: number;
  } {
    let memoryEstimate = 0;
    
    this.cache.forEach(texture => {
      // Rough estimate: width * height * 4 bytes per pixel
      memoryEstimate += texture.baseImage.width * texture.baseImage.height * 4;
      if (texture.linesImage) {
        memoryEstimate += texture.linesImage.width * texture.linesImage.height * 4;
      }
    });

    return {
      cachedTemplates: this.cache.size,
      preloadedTemplates: this.preloadedTemplates.size,
      activeLoads: this.activeLoads.size,
      totalMemoryEstimate: memoryEstimate
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create placeholder image for emergency fallback
   * Requirements: 5.5 - Ultimate fallback mechanism
   */
  private async createPlaceholderImage(): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create placeholder: no canvas context');
    }
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle grid pattern
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Convert to image
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create placeholder blob'));
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          resolve(img);
        };
        img.onerror = () => {
          reject(new Error('Failed to load placeholder image'));
        };
        img.src = URL.createObjectURL(blob);
      });
    });
  }

  /**
   * Dispose of loader and clean up resources
   */
  dispose(): void {
    this.clearCache();
    
    // Cancel active loads
    this.activeLoads.clear();
  }
}

// Global progressive loader instance
let globalProgressiveLoader: ProgressiveTemplateLoader | null = null;

/**
 * Get or create global progressive loader instance
 */
export function getProgressiveTemplateLoader(): ProgressiveTemplateLoader {
  if (!globalProgressiveLoader) {
    globalProgressiveLoader = new ProgressiveTemplateLoader();
  }
  return globalProgressiveLoader;
}

/**
 * Initialize progressive loader with custom configuration
 */
export function initializeProgressiveLoader(config?: Partial<ProgressiveLoadConfig>): ProgressiveTemplateLoader {
  if (globalProgressiveLoader) {
    globalProgressiveLoader.dispose();
  }
  globalProgressiveLoader = new ProgressiveTemplateLoader(config);
  return globalProgressiveLoader;
}
