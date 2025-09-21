// Texture loading implementation for Gear-1 handwriting system
// Handles image loading with error handling and retry mechanisms
// Requirements: 2.1, 2.2, 2.3, 6.1, 6.2

import { ITextureLoader } from '../types';
import { TemplateLoadError, TemplateNetworkError, TemplateFormatError } from '../types/errors';

export class TextureLoader implements ITextureLoader {
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly supportedFormats: Set<string>;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.supportedFormats = new Set(['jpeg', 'jpg', 'png', 'avif', 'webp']);
  }

  /**
   * Load an image from the specified URL with retry logic
   * Requirements: 2.1 (template loading), 6.1 (client-side processing)
   */
  async loadImage(url: string): Promise<HTMLImageElement> {
    this.validateUrl(url);
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.attemptImageLoad(url);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for format errors or final attempt
        if (error instanceof TemplateFormatError || attempt === this.maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }
    
    throw new TemplateLoadError(url, lastError || undefined);
  }

  /**
   * Validate URL format and supported image type
   * Requirements: 2.2 (template validation)
   */
  private validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new TemplateLoadError(url, new Error('Invalid URL provided'));
    }

    const extension = this.getFileExtension(url);
    if (!this.supportedFormats.has(extension.toLowerCase())) {
      throw new TemplateFormatError(url, extension);
    }
  }

  /**
   * Extract file extension from URL
   */
  private getFileExtension(url: string): string {
    const match = url.match(/\.([^./?#]+)(?:[?#]|$)/);
    return match ? match[1] : '';
  }

  /**
   * Attempt to load a single image
   * Requirements: 2.1 (template loading), 2.3 (error handling)
   */
  private attemptImageLoad(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set up event handlers before setting src
      img.onload = () => {
        // Validate image dimensions
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new TemplateFormatError(url, 'Invalid image dimensions'));
          return;
        }
        resolve(img);
      };
      
      img.onerror = (event) => {
        const error = this.createNetworkError(url, event);
        reject(error);
      };
      
      img.onabort = () => {
        reject(new TemplateNetworkError(url, undefined, new Error('Image loading aborted')));
      };
      
      // Enable CORS for cross-origin images
      img.crossOrigin = 'anonymous';
      
      // Start loading
      img.src = url;
      
      // Set timeout for loading
      setTimeout(() => {
        if (!img.complete) {
          img.src = ''; // Cancel loading
          reject(new TemplateNetworkError(url, undefined, new Error('Image loading timeout')));
        }
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Create appropriate network error based on event
   */
  private createNetworkError(url: string, event: Event | string): TemplateNetworkError {
    // Try to extract status code from error event
    let statusCode: number | undefined;
    
    if (typeof event === 'object' && event.target) {
      const target = event.target as any;
      if (target.status) {
        statusCode = target.status;
      }
    }
    
    return new TemplateNetworkError(url, statusCode, new Error('Image loading failed'));
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if image format is supported
   * Requirements: 2.2 (template validation)
   */
  isFormatSupported(url: string): boolean {
    try {
      const extension = this.getFileExtension(url);
      return this.supportedFormats.has(extension.toLowerCase());
    } catch {
      return false;
    }
  }

  /**
   * Get supported formats list
   */
  getSupportedFormats(): string[] {
    return Array.from(this.supportedFormats);
  }
}