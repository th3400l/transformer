// Paper texture manager implementation for Gear-1 handwriting system
// Coordinates texture loading, caching, and processing operations
// Requirements: 2.3, 2.7, 5.5

import { 
  IPaperTextureManager, 
  ITextureLoader, 
  ITextureCache, 
  ITextureProcessor,
  PaperTemplate, 
  PaperTexture, 
  ProcessingOptions,
  TextureLoadResult 
} from '../types/core';
import { TemplateLoadError } from '../types/errors';
import { getProgressiveTemplateLoader } from './progressiveTemplateLoader';
import { getQualityManager } from './qualityManager';

export interface PaperTextureManagerOptions {
  enableCaching: boolean;
  enableProcessing: boolean;
  defaultProcessingOptions: ProcessingOptions;
  cacheKeyPrefix: string;
}

export class PaperTextureManager implements IPaperTextureManager {
  private readonly loader: ITextureLoader;
  private readonly cache: ITextureCache;
  private readonly processor: ITextureProcessor;
  private readonly options: PaperTextureManagerOptions;

  constructor(
    loader: ITextureLoader,
    cache: ITextureCache,
    processor: ITextureProcessor,
    options: Partial<PaperTextureManagerOptions> = {}
  ) {
    this.loader = loader;
    this.cache = cache;
    this.processor = processor;
    this.options = {
      enableCaching: options.enableCaching ?? true,
      enableProcessing: options.enableProcessing ?? true,
      defaultProcessingOptions: options.defaultProcessingOptions ?? {},
      cacheKeyPrefix: options.cacheKeyPrefix ?? 'texture:'
    };
  }

  /**
   * Load texture with caching, processing support, and error handling
   * Requirements: 2.1 (template loading), 2.3 (texture processing), 6.1 (caching)
   * Requirements: 6.5 - Error handling and fallback mechanisms
   */
  async loadTexture(template: PaperTemplate): Promise<PaperTexture> {
    const cacheKey = this.generateCacheKey(template.id);
    
    try {
      // Check cache first if enabled
      if (this.options.enableCaching) {
        const cachedTexture = this.cache.get(cacheKey);
        if (cachedTexture) {
          return cachedTexture;
        }
      }

      // Load texture from source with retry logic
      const texture = await this.loadTextureWithRetry(template);

      // Process texture if needed
      let processedTexture = texture;
      if (this.options.enableProcessing) {
        try {
          processedTexture = this.processor.processTexture(texture, this.options.defaultProcessingOptions);
        } catch (processingError) {
          console.warn(`Texture processing failed for ${template.id}, using unprocessed texture:`, processingError);
          // Continue with unprocessed texture
        }
      }

      // Cache the processed texture if enabled
      if (this.options.enableCaching) {
        try {
          this.cache.set(cacheKey, processedTexture);
        } catch (cacheError) {
          console.warn(`Failed to cache texture ${template.id}:`, cacheError);
          // Continue without caching
        }
      }

      return processedTexture;

    } catch (error) {
      // Try fallback to default template if this isn't already the default
      if (template.id !== 'blank-1') {
        console.warn(`Failed to load texture ${template.id}, attempting fallback to default template:`, error);
        try {
          const defaultTemplate = { id: 'blank-1', name: 'Default Blank', filename: 'blank-1.jpeg', type: 'blank' as const };
          return await this.loadTexture(defaultTemplate);
        } catch (fallbackError) {
          console.error(`Fallback template also failed:`, fallbackError);
        }
      }
      
      throw new TemplateLoadError(template.id, error as Error);
    }
  }

  /**
   * Load texture with retry logic for network failures
   * Requirements: 6.5 - Network error handling and retry mechanisms
   */
  private async loadTextureWithRetry(template: PaperTemplate, maxRetries: number = 3): Promise<PaperTexture> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.loadTextureFromSource(template);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for format errors or if this is the last attempt
        if (error instanceof Error && error.name === 'TemplateFormatError') {
          break;
        }
        
        if (attempt < maxRetries - 1) {
          // Wait before retry with exponential backoff
          const delay = 1000 * Math.pow(2, attempt);
          console.warn(`Texture load attempt ${attempt + 1} failed for ${template.id}, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new TemplateLoadError(template.id);
  }

  /**
   * Load texture with custom processing options and enhanced error handling
   * Requirements: 2.3 (texture processing), 5.5 (responsive scaling)
   * Requirements: 6.5 - Error handling and graceful degradation
   */
  async loadTextureWithOptions(template: PaperTemplate, processingOptions: ProcessingOptions): Promise<PaperTexture> {
    const cacheKey = this.generateCacheKey(template.id, processingOptions);
    
    try {
      // Check cache first if enabled
      if (this.options.enableCaching) {
        const cachedTexture = this.cache.get(cacheKey);
        if (cachedTexture) {
          return cachedTexture;
        }
      }

      // Load base texture with retry logic
      const baseTexture = await this.loadTextureWithRetry(template);

      // Process texture with custom options
      let processedTexture = baseTexture;
      if (this.options.enableProcessing && this.processor.needsProcessing(baseTexture, processingOptions)) {
        try {
          processedTexture = this.processor.processTexture(baseTexture, processingOptions);
        } catch (processingError) {
          console.warn(`Custom texture processing failed for ${template.id}, using base texture:`, processingError);
          // Graceful degradation: use base texture without processing
        }
      }

      // Cache the processed texture if enabled
      if (this.options.enableCaching) {
        try {
          this.cache.set(cacheKey, processedTexture);
        } catch (cacheError) {
          console.warn(`Failed to cache processed texture ${template.id}:`, cacheError);
          // Continue without caching
        }
      }

      return processedTexture;

    } catch (error) {
      // Try fallback with simpler processing options
      if (processingOptions.scale && processingOptions.scale !== 1.0) {
        console.warn(`Failed to load texture with custom options for ${template.id}, trying with default options:`, error);
        try {
          return await this.loadTexture(template);
        } catch (fallbackError) {
          console.error(`Fallback to default options also failed:`, fallbackError);
        }
      }
      
      throw new TemplateLoadError(template.id, error as Error);
    }
  }

  /**
   * Get cached texture if available
   * Requirements: 6.1 (client-side caching)
   */
  getCachedTexture(templateId: string): PaperTexture | null {
    if (!this.options.enableCaching) {
      return null;
    }

    const cacheKey = this.generateCacheKey(templateId);
    return this.cache.get(cacheKey);
  }

  /**
   * Get cached texture with specific processing options
   */
  getCachedTextureWithOptions(templateId: string, processingOptions: ProcessingOptions): PaperTexture | null {
    if (!this.options.enableCaching) {
      return null;
    }

    const cacheKey = this.generateCacheKey(templateId, processingOptions);
    return this.cache.get(cacheKey);
  }

  /**
   * Preload multiple textures with enhanced error handling
   * Requirements: 6.2 (performance optimization)
   * Requirements: 6.5 - Error handling for batch operations
   */
  async preloadTextures(templates: PaperTemplate[]): Promise<TextureLoadResult[]> {
    const results: TextureLoadResult[] = [];

    // Load textures in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(templates, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (template) => {
        try {
          const texture = await this.loadTexture(template);
          return {
            success: true,
            texture,
            templateId: template.id
          } as TextureLoadResult & { templateId: string };
        } catch (error) {
          console.warn(`Failed to preload texture ${template.id}:`, error);
          
          // Try to provide a fallback result for critical templates
          if (template.id === 'blank-1' || template.type === 'blank') {
            try {
              // Attempt emergency fallback
              const emergencyTexture = await this.createEmergencyTexture();
              return {
                success: true,
                texture: emergencyTexture,
                templateId: template.id,
                fallback: true
              } as TextureLoadResult & { templateId: string; fallback: boolean };
            } catch (emergencyError) {
              console.error(`Emergency texture creation failed for ${template.id}:`, emergencyError);
            }
          }
          
          return {
            success: false,
            error: (error as Error).message,
            templateId: template.id
          } as TextureLoadResult & { templateId: string };
        }
      });

      const chunkResults = await Promise.allSettled(chunkPromises);
      
      // Process settled results
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Preload chunk failed:', result.reason);
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      }
    }

    return results;
  }

  /**
   * Create emergency fallback texture when all else fails
   * Requirements: 6.5 - Ultimate fallback mechanism
   */
  private async createEmergencyTexture(): Promise<PaperTexture> {
    // Create a simple white canvas as emergency texture
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create emergency texture: no canvas context');
    }
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle texture pattern
    ctx.fillStyle = '#f8f8f8';
    for (let x = 0; x < canvas.width; x += 20) {
      for (let y = 0; y < canvas.height; y += 20) {
        if ((x + y) % 40 === 0) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    // Convert canvas to image
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create emergency texture blob'));
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          resolve({
            baseImage: img,
            isLoaded: true
          });
        };
        img.onerror = () => {
          reject(new Error('Failed to load emergency texture image'));
        };
        img.src = URL.createObjectURL(blob);
      });
    });
  }

  /**
   * Scale texture for responsive display
   * Requirements: 5.5 (responsive scaling)
   */
  async scaleTextureForDisplay(template: PaperTemplate, maxWidth: number, maxHeight: number): Promise<PaperTexture> {
    // Load base texture first
    const baseTexture = await this.loadTexture(template);
    
    // Calculate optimal size
    const optimalSize = this.processor.getOptimalSize(
      baseTexture.baseImage.naturalWidth,
      baseTexture.baseImage.naturalHeight,
      maxWidth,
      maxHeight
    );

    // If no scaling needed, return base texture
    if (optimalSize.width === baseTexture.baseImage.naturalWidth && 
        optimalSize.height === baseTexture.baseImage.naturalHeight) {
      return baseTexture;
    }

    // Scale texture
    const processingOptions: ProcessingOptions = {
      scale: optimalSize.width / baseTexture.baseImage.naturalWidth
    };

    return this.loadTextureWithOptions(template, processingOptions);
  }

  /**
   * Clear texture cache
   * Requirements: 6.2 (memory management)
   */
  clearCache(): void {
    if (this.options.enableCaching) {
      this.cache.clear();
    }
  }

  /**
   * Remove specific texture from cache
   */
  removeCachedTexture(templateId: string): boolean {
    if (!this.options.enableCaching) {
      return false;
    }

    const cacheKey = this.generateCacheKey(templateId);
    return this.cache.remove(cacheKey);
  }

  /**
   * Get cache statistics
   * Requirements: 6.2 (performance monitoring)
   */
  getCacheStats() {
    if (!this.options.enableCaching) {
      return null;
    }

    return this.cache.getStats();
  }

  /**
   * Get manager statistics
   */
  getManagerStats(): ManagerStats {
    return {
      cachingEnabled: this.options.enableCaching,
      processingEnabled: this.options.enableProcessing,
      cacheStats: this.getCacheStats(),
      processingStats: this.processor.getProcessingStats(),
      supportedFormats: this.loader.getSupportedFormats()
    };
  }

  /**
   * Load texture from source with progressive loading support
   * Requirements: 2.1 (template loading), 2.2 (template validation), 5.1, 5.2 (mobile optimization)
   */
  private async loadTextureFromSource(template: PaperTemplate): Promise<PaperTexture> {
    // Get quality manager for optimization settings
    const qualityManager = getQualityManager();
    const qualitySettings = qualityManager.getCurrentSettings();

    // Use progressive loading for mobile devices (Requirements: 5.1, 5.2)
    if (qualitySettings.enableProgressiveLoading) {
      const progressiveLoader = getProgressiveTemplateLoader();
      return await progressiveLoader.loadTemplate(template, 1.0);
    }

    // Fallback to standard loading for desktop/high-end devices
    return this.loadTextureStandard(template);
  }

  /**
   * Standard texture loading (non-progressive)
   * Requirements: 2.1, 2.2 - Standard loading for desktop
   */
  private async loadTextureStandard(template: PaperTemplate): Promise<PaperTexture> {
    // Construct template URL
    const baseUrl = this.getTemplateUrl(template.filename);
    
    // Load base image
    const baseImage = await this.loader.loadImage(baseUrl);

    // For lined templates, try to load lines overlay
    let linesImage: HTMLImageElement | undefined;
    if (template.type === 'lined') {
      try {
        // Try to load a separate lines overlay if it exists
        const linesUrl = this.getTemplateUrl(template.filename.replace(/\.(jpeg|jpg|png|avif|webp)$/i, '-lines.$1'));
        linesImage = await this.loader.loadImage(linesUrl);
      } catch {
        // Lines overlay not found or failed to load - that's okay
        // The lines are probably part of the base image
      }
    }

    return {
      baseImage,
      linesImage,
      isLoaded: true
    };
  }

  /**
   * Generate cache key for texture
   */
  private generateCacheKey(templateId: string, processingOptions?: ProcessingOptions): string {
    let key = `${this.options.cacheKeyPrefix}${templateId}`;
    
    if (processingOptions) {
      const optionsHash = this.hashProcessingOptions(processingOptions);
      key += `_${optionsHash}`;
    }
    
    return key;
  }

  /**
   * Create hash from processing options for cache key
   */
  private hashProcessingOptions(options: ProcessingOptions): string {
    const parts: string[] = [];
    
    if (options.scale) {
      parts.push(`s${options.scale}`);
    }
    
    if (options.quality) {
      parts.push(`q${options.quality}`);
    }
    
    if (options.filters && options.filters.length > 0) {
      parts.push(`f${options.filters.join(',')}`);
    }
    
    return parts.join('_') || 'default';
  }

  /**
   * Get template URL from filename
   */
  private getTemplateUrl(filename: string): string {
    // Assume templates are in the template/ directory
    return `template/${filename}`;
  }

  /**
   * Split array into chunks for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.clearCache();
    this.processor.dispose();
  }
}

// Manager statistics interface
export interface ManagerStats {
  cachingEnabled: boolean;
  processingEnabled: boolean;
  cacheStats: any;
  processingStats: any;
  supportedFormats: string[];
}