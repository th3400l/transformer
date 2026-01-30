import { ICanvasExporter, ExportOptions, CanvasExportResult } from '../types/core';
import { ExportError } from '../types/errors';

/**
 * Implementation of ICanvasExporter for converting canvas elements to downloadable blobs
 * Handles various image formats and quality settings with error handling
 */
export class CanvasExporter implements ICanvasExporter {
  private readonly defaultQuality = 0.9;
  private readonly supportedFormats = ['image/png', 'image/jpeg', 'image/webp'];

  /**
   * Converts a canvas element to a blob with specified format and quality
   * @param canvas - The canvas element to export
   * @param options - Export configuration options
   * @returns Promise resolving to CanvasExportResult
   */
  async canvasToBlob(canvas: HTMLCanvasElement, options?: ExportOptions): Promise<CanvasExportResult> {
    try {
      const format = this.validateAndNormalizeFormat(options?.format || 'png');
      const quality = this.validateQuality(options?.quality);
      
      // Check canvas validity
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new ExportError('canvas-validation');
      }

      // Convert canvas to blob
      const blob = await this.convertCanvasToBlob(canvas, format, quality);
      
      if (!blob) {
        throw new ExportError('canvas-conversion');
      }

      return {
        blob,
        format: format.split('/')[1] as 'png' | 'jpeg' | 'webp',
        size: blob.size,
        width: canvas.width,
        height: canvas.height,
        success: true
      };

    } catch (error) {
      const exportError = error instanceof ExportError ? error : 
        new ExportError('canvas-export', undefined, new Error(`Canvas export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      
      return {
        blob: null,
        format: 'png',
        size: 0,
        width: 0,
        height: 0,
        success: false,
        error: exportError.message
      };
    }
  }

  /**
   * Converts multiple canvases to blobs in batch
   * @param canvases - Array of canvas elements to export
   * @param options - Export configuration options
   * @returns Promise resolving to array of CanvasExportResult
   */
  async batchCanvasToBlob(canvases: HTMLCanvasElement[], options?: ExportOptions): Promise<CanvasExportResult[]> {
    const results: CanvasExportResult[] = [];
    
    for (let i = 0; i < canvases.length; i++) {
      try {
        const result = await this.canvasToBlob(canvases[i], options);
        results.push(result);
      } catch (error) {
        // Continue with other canvases even if one fails
        results.push({
          blob: null,
          format: 'png',
          size: 0,
          width: 0,
          height: 0,
          success: false,
          error: `Canvas ${i + 1} export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    return results;
  }

  /**
   * Checks if a specific image format is supported by the browser
   * @param format - Image format to check (e.g., 'png', 'jpeg', 'webp')
   * @returns True if format is supported
   */
  isFormatSupported(format: string): boolean {
    const mimeType = format.startsWith('image/') ? format : `image/${format}`;
    return this.supportedFormats.includes(mimeType);
  }

  /**
   * Gets the optimal format based on browser support and content type
   * @param preferredFormat - Preferred format if supported
   * @returns Optimal format mime type
   */
  getOptimalFormat(preferredFormat?: string): string {
    if (preferredFormat && this.isFormatSupported(preferredFormat)) {
      return preferredFormat.startsWith('image/') ? preferredFormat : `image/${preferredFormat}`;
    }
    
    // Fallback priority: WebP > PNG > JPEG
    if (this.isFormatSupported('webp')) return 'image/webp';
    if (this.isFormatSupported('png')) return 'image/png';
    return 'image/jpeg';
  }

  /**
   * Validates and normalizes the image format
   * @param format - Format string to validate
   * @returns Normalized mime type
   */
  private validateAndNormalizeFormat(format: string): string {
    const normalizedFormat = format.toLowerCase();
    const mimeType = normalizedFormat.startsWith('image/') ? 
      normalizedFormat : `image/${normalizedFormat}`;
    
    if (!this.supportedFormats.includes(mimeType)) {
      console.warn(`Unsupported format: ${format}, falling back to PNG`);
      return 'image/png';
    }
    
    return mimeType;
  }

  /**
   * Validates quality parameter
   * @param quality - Quality value to validate
   * @returns Valid quality value between 0 and 1
   */
  private validateQuality(quality?: number): number {
    if (quality === undefined || quality === null) {
      return this.defaultQuality;
    }
    
    return Math.max(0.1, Math.min(1.0, quality));
  }

  /**
   * Converts canvas to blob using the appropriate method
   * @param canvas - Canvas element to convert
   * @param format - Image format mime type
   * @param quality - Image quality (0-1)
   * @returns Promise resolving to Blob
   */
  private async convertCanvasToBlob(
    canvas: HTMLCanvasElement, 
    format: string, 
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Use toBlob for better browser support
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new ExportError('canvas-conversion'));
            }
          },
          format,
          quality
        );
      } catch (error) {
        reject(new ExportError('canvas-conversion', undefined, error as Error));
      }
    });
  }
}
