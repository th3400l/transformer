/**
 * Canvas Fallback System
 * Provides fallback rendering methods for canvas issues and error recovery
 * Requirements: 8.4, 8.5 - Fallback rendering and aspect ratio maintenance
 */

import { CanvasRenderingMetrics } from './responsiveCanvasManager';

export interface CanvasFallbackConfig {
  enableFallbacks: boolean;
  fallbackWidth: number;
  fallbackHeight: number;
  maintainAspectRatio: boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface FallbackRenderingOptions {
  useBasicRendering: boolean;
  disableAdvancedFeatures: boolean;
  reduceQuality: boolean;
  simplifyContent: boolean;
}

export interface CanvasRecoveryResult {
  success: boolean;
  canvas?: HTMLCanvasElement;
  fallbackUsed: boolean;
  error?: Error;
  recoveryMethod: string;
}

export interface ICanvasFallbackSystem {
  createFallbackCanvas(container: HTMLElement, config?: Partial<CanvasFallbackConfig>): HTMLCanvasElement;
  recoverFromCanvasError(error: Error, container: HTMLElement, originalConfig?: any): Promise<CanvasRecoveryResult>;
  validateCanvasSupport(): boolean;
  getEmergencyCanvas(width: number, height: number): HTMLCanvasElement;
  maintainAspectRatio(canvas: HTMLCanvasElement, targetAspectRatio: number): void;
  applyFallbackRendering(canvas: HTMLCanvasElement, options: FallbackRenderingOptions): void;
  testCanvasOperations?(canvas: HTMLCanvasElement): boolean;
  getCanvasCapabilities?(): Record<string, boolean>;
}

/**
 * Canvas Fallback System Implementation
 * Requirements: 8.4, 8.5 - Comprehensive fallback and recovery system
 */
export class CanvasFallbackSystem implements ICanvasFallbackSystem {
  private readonly defaultConfig: CanvasFallbackConfig = {
    enableFallbacks: true,
    fallbackWidth: 600,
    fallbackHeight: 400,
    maintainAspectRatio: true,
    maxRetries: 3,
    retryDelay: 1000
  };

  /**
   * Create fallback canvas when primary canvas creation fails
   * Requirements: 8.4 - Implement fallback rendering methods for canvas initialization issues
   */
  createFallbackCanvas(container: HTMLElement, config: Partial<CanvasFallbackConfig> = {}): HTMLCanvasElement {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Create basic canvas element
      const canvas = document.createElement('canvas');
      
      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      let canvasWidth = containerRect.width || finalConfig.fallbackWidth;
      let canvasHeight = containerRect.height || finalConfig.fallbackHeight;
      
      // Ensure minimum dimensions
      canvasWidth = Math.max(canvasWidth, 200);
      canvasHeight = Math.max(canvasHeight, 150);
      
      // Apply aspect ratio if needed
      if (finalConfig.maintainAspectRatio) {
        const aspectRatio = 4 / 3; // Default aspect ratio
        const containerAspectRatio = canvasWidth / canvasHeight;
        
        if (containerAspectRatio > aspectRatio) {
          canvasWidth = canvasHeight * aspectRatio;
        } else {
          canvasHeight = canvasWidth / aspectRatio;
        }
      }
      
      // Set canvas dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Set CSS dimensions to fill container
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.maxWidth = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.objectFit = 'contain';
      
      // Basic styling
      canvas.style.border = '1px solid #e5e7eb';
      canvas.style.borderRadius = '8px';
      canvas.style.backgroundColor = '#ffffff';
      
      // Validate canvas context
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context for fallback canvas');
      }
      
      // Initialize with basic content
      this.initializeFallbackCanvas(ctx, canvasWidth, canvasHeight);
      
      return canvas;
      
    } catch (error) {
      console.error('Fallback canvas creation failed:', error);
      return this.getEmergencyCanvas(finalConfig.fallbackWidth, finalConfig.fallbackHeight);
    }
  }

  /**
   * Recover from canvas errors with multiple fallback strategies
   * Requirements: 8.4 - Create error recovery for canvas rendering problems
   */
  async recoverFromCanvasError(error: Error, container: HTMLElement, originalConfig?: any): Promise<CanvasRecoveryResult> {
    console.warn('Canvas error detected, attempting recovery:', error.message);
    
    // Strategy 1: Try creating a new canvas with reduced features
    try {
      const fallbackCanvas = this.createFallbackCanvas(container);
      
      // Apply basic fallback rendering
      this.applyFallbackRendering(fallbackCanvas, {
        useBasicRendering: true,
        disableAdvancedFeatures: true,
        reduceQuality: true,
        simplifyContent: true
      });
      
      return {
        success: true,
        canvas: fallbackCanvas,
        fallbackUsed: true,
        recoveryMethod: 'fallback-canvas'
      };
    } catch (fallbackError) {
      console.warn('Fallback canvas creation failed:', fallbackError);
    }
    
    // Strategy 2: Try emergency canvas with minimal features
    try {
      const emergencyCanvas = this.getEmergencyCanvas(600, 400);
      
      return {
        success: true,
        canvas: emergencyCanvas,
        fallbackUsed: true,
        recoveryMethod: 'emergency-canvas'
      };
    } catch (emergencyError) {
      console.error('Emergency canvas creation failed:', emergencyError);
    }
    
    // Strategy 3: Return failure if all recovery attempts fail
    return {
      success: false,
      fallbackUsed: true,
      error: new Error('All canvas recovery strategies failed'),
      recoveryMethod: 'none'
    };
  }

  /**
   * Validate browser canvas support
   * Requirements: 8.4 - Validate canvas capabilities before use
   */
  validateCanvasSupport(): boolean {
    try {
      // Check if canvas element is supported
      const canvas = document.createElement('canvas');
      if (!canvas || typeof canvas.getContext !== 'function') {
        return false;
      }
      
      // Check if 2D context is supported
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return false;
      }
      
      // Check basic canvas operations
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1, 1);
      
      // Check if canvas can be converted to data URL
      const dataUrl = canvas.toDataURL();
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Canvas support validation failed:', error);
      return false;
    }
  }

  /**
   * Get emergency canvas with minimal functionality
   * Requirements: 8.4 - Emergency fallback when all else fails
   */
  getEmergencyCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Set basic styling
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.border = '2px dashed #ccc';
    canvas.style.backgroundColor = '#f9f9f9';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw emergency message
      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText('Canvas Unavailable', width / 2, height / 2 - 20);
      ctx.fillText('Please refresh the page', width / 2, height / 2 + 20);
      
      // Draw border
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(10, 10, width - 20, height - 20);
    }
    
    return canvas;
  }

  /**
   * Maintain aspect ratio during canvas resizing
   * Requirements: 8.5 - Add aspect ratio maintenance during dynamic resizing
   */
  maintainAspectRatio(canvas: HTMLCanvasElement, targetAspectRatio: number): void {
    try {
      const container = canvas.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerAspectRatio = containerRect.width / containerRect.height;
      
      let newWidth: number;
      let newHeight: number;
      
      if (containerAspectRatio > targetAspectRatio) {
        // Container is wider than target aspect ratio
        newHeight = containerRect.height;
        newWidth = newHeight * targetAspectRatio;
      } else {
        // Container is taller than target aspect ratio
        newWidth = containerRect.width;
        newHeight = newWidth / targetAspectRatio;
      }
      
      // Update canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Update CSS to center the canvas
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;
      canvas.style.margin = 'auto';
      canvas.style.display = 'block';
      
    } catch (error) {
      console.warn('Aspect ratio maintenance failed:', error);
    }
  }

  /**
   * Apply fallback rendering with reduced features
   * Requirements: 8.4 - Simplified rendering for fallback scenarios
   */
  applyFallbackRendering(canvas: HTMLCanvasElement, options: FallbackRenderingOptions): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set basic properties
      if (options.useBasicRendering) {
        ctx.imageSmoothingEnabled = false;
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // Draw basic background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add basic border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Add fallback message
      if (options.simplifyContent) {
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText('Simplified Preview Mode', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Full features available in exported images', canvas.width / 2, canvas.height / 2 + 10);
      }
      
    } catch (error) {
      console.warn('Fallback rendering failed:', error);
    }
  }

  /**
   * Initialize fallback canvas with basic content
   */
  private initializeFallbackCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    try {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Add subtle grid pattern
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 0.5;
      
      const gridSize = 20;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Add ready message
      ctx.fillStyle = '#999999';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Canvas Ready', width / 2, height / 2);
      
    } catch (error) {
      console.warn('Fallback canvas initialization failed:', error);
    }
  }

  /**
   * Test canvas functionality
   */
  testCanvasOperations(canvas: HTMLCanvasElement): boolean {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      // Test basic drawing operations
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1, 1);
      
      // Test text rendering
      ctx.font = '12px Arial';
      ctx.fillText('test', 0, 12);
      
      // Test image data operations
      const imageData = ctx.getImageData(0, 0, 1, 1);
      if (!imageData || !imageData.data) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get canvas capabilities
   */
  getCanvasCapabilities(): { [key: string]: boolean } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { supported: false };
    }
    
    return {
      supported: true,
      imageSmoothingEnabled: 'imageSmoothingEnabled' in ctx,
      filter: 'filter' in ctx,
      globalCompositeOperation: 'globalCompositeOperation' in ctx,
      textMetrics: 'measureText' in ctx,
      imageData: 'getImageData' in ctx && 'putImageData' in ctx,
      toDataURL: 'toDataURL' in canvas,
      toBlob: 'toBlob' in canvas
    };
  }
}

/**
 * Create canvas fallback system instance
 */
export function createCanvasFallbackSystem(): ICanvasFallbackSystem {
  return new CanvasFallbackSystem();
}

/**
 * Default canvas fallback system instance
 */
export const canvasFallbackSystem = createCanvasFallbackSystem();
