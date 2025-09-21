import { IDownloadManager, DownloadOptions, DownloadResult } from '../types/core';
import { GeneratedImage } from '../types/gallery';
import { ExportError } from '../types/errors';

/**
 * Progress tracking for bulk download operations
 */
export interface BulkDownloadProgress {
  current: number;
  total: number;
  percentage: number;
  currentFilename: string;
  estimatedTimeRemaining: number;
  bytesDownloaded: number;
  totalBytes: number;
}

/**
 * Result of a bulk download operation
 */
export interface BulkDownloadResult {
  success: boolean;
  downloadedCount: number;
  totalCount: number;
  failedDownloads: FailedDownload[];
  estimatedTime: number;
  totalBytes: number;
  downloadedBytes: number;
}

/**
 * Information about a failed download
 */
export interface FailedDownload {
  imageId: string;
  filename: string;
  error: string;
  index: number;
}

/**
 * Progress callback function type
 */
export type ProgressCallback = (progress: BulkDownloadProgress) => void;

/**
 * Enhanced download manager interface for bulk operations
 */
export interface IBulkDownloadManager extends IDownloadManager {
  downloadSequential(
    images: GeneratedImage[], 
    baseFilename: string, 
    onProgress?: ProgressCallback
  ): Promise<BulkDownloadResult>;
  
  generateSequentialFilenames(count: number, format: string): string[];
  validateDownloadCapacity(images: GeneratedImage[]): Promise<boolean>;
  estimateDownloadTime(images: GeneratedImage[]): number;
}

/**
 * Implementation of IBulkDownloadManager for handling bulk image downloads
 * Provides sequential naming, progress tracking, and error handling
 * Requirements: 2.1, 2.2, 2.4
 */
export class BulkDownloadManager implements IBulkDownloadManager {
  private readonly maxConcurrentDownloads = 3; // Reduced for bulk operations
  private readonly downloadDelay = 200; // ms between downloads
  private readonly maxRetries = 2;
  private readonly timeoutMs = 30000; // 30 seconds per download

  /**
   * Downloads multiple images sequentially with progress tracking
   * Requirements: 2.1, 2.2, 2.4
   */
  async downloadSequential(
    images: GeneratedImage[], 
    baseFilename: string = 'image', 
    onProgress?: ProgressCallback
  ): Promise<BulkDownloadResult> {
    if (!images || images.length === 0) {
      return {
        success: true,
        downloadedCount: 0,
        totalCount: 0,
        failedDownloads: [],
        estimatedTime: 0,
        totalBytes: 0,
        downloadedBytes: 0
      };
    }

    const startTime = Date.now();
    const totalBytes = images.reduce((sum, img) => sum + img.blob.size, 0);
    const results: DownloadResult[] = [];
    const failedDownloads: FailedDownload[] = [];
    let downloadedBytes = 0;

    // Validate download capacity
    const canDownload = await this.validateDownloadCapacity(images);
    if (!canDownload) {
      throw new ExportError('insufficient-storage');
    }

    // Generate sequential filenames
    const filenames = this.generateSequentialFilenames(images.length, 'png');

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = filenames[i];
      
      // Update progress
      if (onProgress) {
        const progress: BulkDownloadProgress = {
          current: i + 1,
          total: images.length,
          percentage: Math.round(((i + 1) / images.length) * 100),
          currentFilename: filename,
          estimatedTimeRemaining: this.calculateRemainingTime(startTime, i + 1, images.length),
          bytesDownloaded: downloadedBytes,
          totalBytes
        };
        onProgress(progress);
      }

      try {
        // Add delay between downloads to prevent browser throttling
        if (i > 0) {
          await this.delay(this.downloadDelay);
        }

        const result = await this.downloadSingleWithRetry(image.blob, filename);
        results.push(result);

        if (result.success) {
          downloadedBytes += image.blob.size;
        } else {
          failedDownloads.push({
            imageId: image.id,
            filename,
            error: result.error || 'Unknown error',
            index: i
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Download failed';
        failedDownloads.push({
          imageId: image.id,
          filename,
          error: errorMessage,
          index: i
        });
      }
    }

    const successfulDownloads = results.filter(r => r.success).length;
    const actualTime = Date.now() - startTime;

    return {
      success: failedDownloads.length === 0,
      downloadedCount: successfulDownloads,
      totalCount: images.length,
      failedDownloads,
      estimatedTime: actualTime,
      totalBytes,
      downloadedBytes
    };
  }

  /**
   * Generates sequential filenames for bulk downloads
   * Requirements: 2.1, 2.2
   */
  generateSequentialFilenames(count: number, format: string): string[] {
    const filenames: string[] = [];
    const padding = count.toString().length;
    
    for (let i = 1; i <= count; i++) {
      const paddedNumber = i.toString().padStart(padding, '0');
      filenames.push(`image-${paddedNumber}.${format}`);
    }
    
    return filenames;
  }

  /**
   * Validates if the browser can handle the download capacity
   * Requirements: 2.4
   */
  async validateDownloadCapacity(images: GeneratedImage[]): Promise<boolean> {
    try {
      // Check if downloads are supported
      if (!this.isDownloadSupported()) {
        return false;
      }

      // Calculate total size
      const totalSize = images.reduce((sum, img) => sum + img.blob.size, 0);
      
      // Check if total size is reasonable (less than 100MB)
      const maxTotalSize = 100 * 1024 * 1024; // 100MB
      if (totalSize > maxTotalSize) {
        return false;
      }

      // Check available storage (if supported)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          const availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
          
          // Require at least 2x the total size for safety
          if (availableSpace < totalSize * 2) {
            return false;
          }
        } catch (error) {
          // If storage estimation fails, continue with size-based validation
        }
      }

      return true;
    } catch (error) {
      // If we can't determine capacity, assume it's okay for small downloads
      const totalSize = images.reduce((sum, img) => sum + img.blob.size, 0);
      return totalSize < 10 * 1024 * 1024; // 10MB fallback limit
    }
  }

  /**
   * Estimates download time based on image sizes
   */
  estimateDownloadTime(images: GeneratedImage[]): number {
    const totalSize = images.reduce((sum, img) => sum + img.blob.size, 0);
    const avgBytesPerSecond = 1024 * 1024; // Assume 1MB/s download speed
    const baseTimePerImage = 500; // 500ms base time per image
    
    return (totalSize / avgBytesPerSecond * 1000) + (images.length * baseTimePerImage);
  }

  /**
   * Downloads a single image with retry logic
   */
  private async downloadSingleWithRetry(
    blob: Blob, 
    filename: string, 
    retries: number = this.maxRetries
  ): Promise<DownloadResult> {
    let lastError: string = 'Unknown error';
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.downloadSingle(blob, filename, {
          timeout: this.timeoutMs
        });
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error || 'Download failed';
        
        // If not the last attempt, wait before retrying
        if (attempt < retries) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Download failed';
        
        if (attempt < retries) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    return {
      success: false,
      filename,
      size: 0,
      error: lastError
    };
  }

  /**
   * Calculates remaining time based on current progress
   */
  private calculateRemainingTime(startTime: number, completed: number, total: number): number {
    if (completed === 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const avgTimePerItem = elapsed / completed;
    const remaining = total - completed;
    
    return Math.round(remaining * avgTimePerItem);
  }

  /**
   * Creates a delay for the specified number of milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Implement IDownloadManager interface methods by delegating to existing DownloadManager
  async downloadSingle(blob: Blob, filename: string, options?: DownloadOptions): Promise<DownloadResult> {
    try {
      this.validateInputs(blob, filename);
      
      const sanitizedFilename = this.sanitizeFilename(filename);
      const success = await this.performDownload(blob, sanitizedFilename, options);
      
      return {
        success,
        filename: sanitizedFilename,
        size: blob.size,
        error: success ? undefined : 'Download failed'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error';
      return {
        success: false,
        filename,
        size: 0,
        error: errorMessage
      };
    }
  }

  async downloadMultiple(
    blobs: Blob[], 
    baseFilename: string, 
    options?: DownloadOptions
  ): Promise<DownloadResult[]> {
    if (!blobs || blobs.length === 0) {
      return [];
    }

    const results: DownloadResult[] = [];
    const sanitizedBase = this.sanitizeFilename(baseFilename);
    
    for (let i = 0; i < blobs.length; i += this.maxConcurrentDownloads) {
      const batch = blobs.slice(i, i + this.maxConcurrentDownloads);
      const batchPromises = batch.map(async (blob, batchIndex) => {
        const globalIndex = i + batchIndex;
        const filename = this.generateNumberedFilename(sanitizedBase, globalIndex + 1, blobs.length);
        
        if (globalIndex > 0) {
          await this.delay(this.downloadDelay);
        }
        
        return this.downloadSingle(blob, filename, options);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  async downloadAsZip(
    blobs: Blob[], 
    filenames: string[], 
    zipFilename: string
  ): Promise<DownloadResult> {
    throw new ExportError('zip-not-implemented');
  }

  isDownloadSupported(): boolean {
    return typeof document !== 'undefined' && 
           typeof document.createElement === 'function' &&
           typeof URL !== 'undefined' &&
           typeof URL.createObjectURL === 'function';
  }

  getDownloadMethod(): 'anchor' | 'window' | 'unsupported' {
    if (!this.isDownloadSupported()) {
      return 'unsupported';
    }
    
    const testAnchor = document.createElement('a');
    if ('download' in testAnchor) {
      return 'anchor';
    }
    
    return 'window';
  }

  // Private helper methods (copied from DownloadManager)
  private validateInputs(blob: Blob, filename: string): void {
    if (!blob || !(blob instanceof Blob)) {
      throw new ExportError('invalid-blob');
    }
    
    if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
      throw new ExportError('invalid-filename');
    }
    
    if (blob.size === 0) {
      throw new ExportError('empty-blob');
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 255);
  }

  private generateNumberedFilename(baseFilename: string, index: number, total: number): string {
    const extension = this.extractExtension(baseFilename);
    const nameWithoutExt = this.removeExtension(baseFilename);
    const padding = total.toString().length;
    const paddedIndex = index.toString().padStart(padding, '0');
    
    return `${nameWithoutExt}_${paddedIndex}${extension}`;
  }

  private extractExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

  private removeExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  }

  private async performDownload(
    blob: Blob, 
    filename: string, 
    options?: DownloadOptions
  ): Promise<boolean> {
    const method = this.getDownloadMethod();
    
    switch (method) {
      case 'anchor':
        return this.downloadViaAnchor(blob, filename, options);
      case 'window':
        return this.downloadViaWindow(blob, filename, options);
      default:
        throw new ExportError('download-unsupported');
    }
  }

  private downloadViaAnchor(blob: Blob, filename: string, options?: DownloadOptions): boolean {
    try {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return true;
    } catch (error) {
      throw new ExportError('anchor-download-failed', undefined, error as Error);
    }
  }

  private downloadViaWindow(blob: Blob, filename: string, options?: DownloadOptions): boolean {
    try {
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new ExportError('popup-blocked');
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      
      return true;
    } catch (error) {
      throw new ExportError('window-download-failed', undefined, error as Error);
    }
  }
}