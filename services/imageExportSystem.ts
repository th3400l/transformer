import { 
  IImageExportSystem, 
  IPageSplitter, 
  ICanvasExporter, 
  IDownloadManager,
  ExportOptions, 
  ExportResult,
  CanvasExportResult,
  DownloadResult
} from '../types/core';
import { ExportError } from '../types/errors';

/**
 * Abstract base class for image export systems following Open/Closed Principle
 * Provides common functionality and extension points for concrete implementations
 */
export abstract class BaseExportSystem implements IImageExportSystem {
  protected pageSplitter: IPageSplitter;
  protected canvasExporter: ICanvasExporter;
  protected downloadManager: IDownloadManager;

  constructor(
    pageSplitter: IPageSplitter,
    canvasExporter: ICanvasExporter,
    downloadManager: IDownloadManager
  ) {
    this.pageSplitter = pageSplitter;
    this.canvasExporter = canvasExporter;
    this.downloadManager = downloadManager;
  }

  abstract exportSinglePage(canvas: HTMLCanvasElement, options: ExportOptions): Promise<Blob>;
  abstract exportMultiplePages(canvases: HTMLCanvasElement[], options: ExportOptions): Promise<ExportResult>;

  /**
   * Validates export options and provides defaults
   * @param options - Export options to validate
   * @returns Validated options with defaults
   */
  protected validateExportOptions(options?: ExportOptions): Required<ExportOptions> {
    return {
      format: options?.format || 'png',
      quality: options?.quality !== undefined ? Math.max(0.1, Math.min(1.0, options.quality)) : 0.9,
      maxPages: options?.maxPages || 10,
      shouldDownload: options?.shouldDownload ?? false
    };
  }

  /**
   * Validates canvas array for export
   * @param canvases - Array of canvases to validate
   */
  protected validateCanvases(canvases: HTMLCanvasElement[]): void {
    if (!canvases || canvases.length === 0) {
      throw new ExportError('no-canvases');
    }

    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new ExportError('invalid-canvas');
      }
      // Enforce maximum canvas dimensions
      const maxDim = 4000;
      if (canvas.width > maxDim || canvas.height > maxDim) {
        throw new ExportError('oversize-canvas');
      }
    }
  }

  /** Validate approximate memory usage based on canvas sizes */
  protected validateMemory(canvases: HTMLCanvasElement[]): void {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const deviceMemory = (typeof navigator !== 'undefined' && (navigator as any).deviceMemory) || 4;
    const lowEnd = isMobile && deviceMemory <= 2;
    const maxMB = lowEnd ? 50 : (isMobile ? 100 : 200);
    const totalBytes = canvases.reduce((acc, c) => acc + c.width * c.height * 4, 0);
    const totalMB = totalBytes / (1024 * 1024);
    if (totalMB > maxMB) {
      throw new ExportError('memory-limit');
    }
  }

  /**
   * Handles memory management during export operations
   * @param operation - Function to execute with memory management
   * @returns Result of the operation
   */
  protected async withMemoryManagement<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Force garbage collection if available (development/testing)
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
      throw error;
    }
  }
}

/**
 * Standard implementation of the image export system
 * Handles single and multi-page exports with error recovery
 */
export class StandardExportSystem extends BaseExportSystem {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  /**
   * Exports a single canvas to a blob
   * @param canvas - Canvas element to export
   * @param options - Export configuration options
   * @returns Promise resolving to exported blob
   */
  async exportSinglePage(canvas: HTMLCanvasElement, options: ExportOptions): Promise<Blob> {
    const validatedOptions = this.validateExportOptions(options);
    
    return this.withMemoryManagement(async () => {
      const result = await this.canvasExporter.canvasToBlob(canvas, validatedOptions);
      
      if (!result.success || !result.blob) {
        throw new ExportError('single-page-export');
      }
      
      return result.blob;
    });
  }

  /**
   * Exports multiple canvases to blobs with download management and enhanced error handling
   * @param canvases - Array of canvas elements to export
   * @param options - Export configuration options
   * @returns Promise resolving to ExportResult with success/failure details
   */
  async exportMultiplePages(canvases: HTMLCanvasElement[], options: ExportOptions): Promise<ExportResult> {
    const validatedOptions = this.validateExportOptions(options);
    
    try {
      this.validateCanvases(canvases);
      this.validateMemory(canvases);
      
      // Limit canvases to max pages
      const limitedCanvases = canvases.slice(0, validatedOptions.maxPages);
      const wasLimited = canvases.length > validatedOptions.maxPages;
      
      return await this.withMemoryManagement(async () => {
        // Export all canvases to blobs with retry logic and fallback
        const exportResults = await this.exportCanvasesWithRetryAndFallback(limitedCanvases, validatedOptions);
        
        // Filter successful exports
        const successfulExports = exportResults.filter(result => result.success && result.blob);
        const blobs = successfulExports.map(result => result.blob!);
        
        if (blobs.length === 0) {
          // Try emergency export with reduced quality
          console.warn('All exports failed, attempting emergency export');
          const emergencyResults = await this.attemptEmergencyExport(limitedCanvases, validatedOptions);
          
          if (emergencyResults.length === 0) {
            return {
              images: [],
              totalPages: 0,
              success: false,
              error: 'All canvas exports failed, including emergency fallback'
            };
          }
          
          return {
            images: emergencyResults,
            totalPages: emergencyResults.length,
            success: true,
            error: 'Exported with reduced quality due to errors',
            fallbackUsed: true
          };
        }
        
        // Handle downloads if requested
        let downloadResults: DownloadResult[] = [];
        if (validatedOptions.shouldDownload) {
          try {
            const baseFilename = this.generateBaseFilename(validatedOptions.format);
            downloadResults = await this.downloadManager.downloadMultiple(blobs, baseFilename);
          } catch (downloadError) {
            console.warn('Download failed, but export succeeded:', downloadError);
            // Continue with export success even if download fails
          }
        }
        
        const failedExports = exportResults.filter(result => !result.success);
        const failedDownloads = downloadResults.filter(result => !result.success);
        
        return {
          images: blobs,
          totalPages: limitedCanvases.length,
          success: failedExports.length === 0 && failedDownloads.length === 0,
          error: this.generateErrorSummary(failedExports, failedDownloads, wasLimited),
          exportResults,
          downloadResults,
          limitedByMaxPages: wasLimited
        };
      });
      
    } catch (error) {
      console.error('Export system error:', error);
      
      // Attempt partial recovery
      try {
        const partialResults = await this.attemptPartialRecovery(canvases, validatedOptions);
        if (partialResults.length > 0) {
          return {
            images: partialResults,
            totalPages: partialResults.length,
            success: true,
            error: 'Partial export completed after error recovery',
            partialRecovery: true
          };
        }
      } catch (recoveryError) {
        console.error('Recovery also failed:', recoveryError);
      }
      
      return {
        images: [],
        totalPages: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Exports canvases with retry logic for failed exports
   * @param canvases - Canvases to export
   * @param options - Export options
   * @returns Array of export results
   */
  private async exportCanvasesWithRetry(
    canvases: HTMLCanvasElement[], 
    options: Required<ExportOptions>
  ): Promise<CanvasExportResult[]> {
    const results: CanvasExportResult[] = [];
    
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      let lastError: string | undefined;
      let success = false;
      
      // Retry failed exports
      for (let retry = 0; retry <= this.maxRetries; retry++) {
        try {
          const result = await this.canvasExporter.canvasToBlob(canvas, options);
          results.push(result);
          success = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          
          if (retry < this.maxRetries) {
            // Wait before retry, with exponential backoff
            await this.delay(this.retryDelay * Math.pow(2, retry));
          }
        }
      }
      
      // If all retries failed, add failed result
      if (!success) {
        results.push({
          blob: null,
          format: options.format,
          size: 0,
          width: 0,
          height: 0,
          success: false,
          error: `Canvas ${i + 1} export failed after ${this.maxRetries} retries: ${lastError}`
        });
      }
    }
    
    return results;
  }

  /**
   * Generates a base filename for exports
   * @param format - Image format
   * @returns Base filename
   */
  private generateBaseFilename(format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `handwriting-${timestamp}.${format}`;
  }

  /**
   * Generates error summary from failed operations
   * @param failedExports - Failed export results
   * @param failedDownloads - Failed download results
   * @param wasLimited - Whether pages were limited
   * @returns Error summary string
   */
  private generateErrorSummary(
    failedExports: CanvasExportResult[], 
    failedDownloads: DownloadResult[], 
    wasLimited: boolean
  ): string | undefined {
    const errors: string[] = [];
    
    if (failedExports.length > 0) {
      errors.push(`${failedExports.length} canvas export(s) failed`);
    }
    
    if (failedDownloads.length > 0) {
      errors.push(`${failedDownloads.length} download(s) failed`);
    }
    
    if (wasLimited) {
      errors.push('Some pages were excluded due to page limit');
    }
    
    return errors.length > 0 ? errors.join('; ') : undefined;
  }

  /**
   * Creates a delay for the specified number of milliseconds
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export with retries and then try a format fallback (e.g., PNG -> JPEG)
   */
  private async exportCanvasesWithRetryAndFallback(
    canvases: HTMLCanvasElement[],
    options: Required<ExportOptions>
  ): Promise<CanvasExportResult[]> {
    let results = await this.exportCanvasesWithRetry(canvases, options);
    const failed = results.map((r, i) => (!r.success ? i : -1)).filter(i => i >= 0);
    if (failed.length === 0) return results;

    // Try fallback format for failed ones
    const fallbackFormat: 'png' | 'jpeg' | 'webp' = options.format === 'png' ? 'jpeg' : 'png';
    const fallbackOptions: Required<ExportOptions> = { ...options, format: fallbackFormat };
    const fallbackResults = await this.exportCanvasesWithRetry(failed.map(i => canvases[i]), fallbackOptions);
    failed.forEach((idx, j) => {
      results[idx] = fallbackResults[j];
    });
    return results;
  }

  /**
   * Emergency export path using canvas.toBlob directly, capped to 5 pages
   */
  private async attemptEmergencyExport(
    canvases: HTMLCanvasElement[],
    _options: Required<ExportOptions>
  ): Promise<Blob[]> {
    const limit = Math.min(5, canvases.length);
    const blobs: Blob[] = [];
    for (let i = 0; i < limit; i++) {
      const canvas = canvases[i];
      const blob = await new Promise<Blob | null>((resolve) => {
        try {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8);
        } catch {
          resolve(null);
        }
      });
      if (blob) blobs.push(blob);
    }
    return blobs;
  }

  /**
   * Partial recovery that attempts to export a small number of pages individually
   */
  private async attemptPartialRecovery(
    canvases: HTMLCanvasElement[],
    options: Required<ExportOptions>
  ): Promise<Blob[]> {
    const limit = Math.min(3, canvases.length);
    const recovered: Blob[] = [];
    for (let i = 0; i < limit; i++) {
      try {
        const blob = await this.exportSinglePage(canvases[i], options);
        recovered.push(blob);
      } catch {
        // skip failures
      }
    }
    return recovered;
  }
}

/**
 * Factory function to create a StandardExportSystem with all dependencies
 * @param pageSplitter - Page splitting service
 * @param canvasExporter - Canvas export service
 * @param downloadManager - Download management service
 * @returns Configured StandardExportSystem instance
 */
export function createStandardExportSystem(
  pageSplitter: IPageSplitter,
  canvasExporter: ICanvasExporter,
  downloadManager: IDownloadManager
): StandardExportSystem {
  return new StandardExportSystem(pageSplitter, canvasExporter, downloadManager);
}
