import { IDownloadManager, DownloadOptions, DownloadResult } from '../types/core';
import { ExportError } from '../types/errors';

/**
 * Implementation of IDownloadManager for handling single and batch file downloads
 * Provides browser-compatible download functionality with error handling
 */
export class DownloadManager implements IDownloadManager {
  private readonly maxConcurrentDownloads = 5;
  private readonly downloadDelay = 100; // ms between downloads to avoid browser throttling

  /**
   * Downloads a single blob as a file
   * @param blob - The blob to download
   * @param filename - Name for the downloaded file
   * @param options - Optional download configuration
   * @returns Promise resolving to DownloadResult
   */
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

  /**
   * Downloads multiple blobs as separate files
   * @param blobs - Array of blobs to download
   * @param baseFilename - Base filename (will be numbered for multiple files)
   * @param options - Optional download configuration
   * @returns Promise resolving to array of DownloadResult
   */
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
    
    // Process downloads in batches to avoid overwhelming the browser
    for (let i = 0; i < blobs.length; i += this.maxConcurrentDownloads) {
      const batch = blobs.slice(i, i + this.maxConcurrentDownloads);
      const batchPromises = batch.map(async (blob, batchIndex) => {
        const globalIndex = i + batchIndex;
        const filename = this.generateNumberedFilename(sanitizedBase, globalIndex + 1, blobs.length);
        
        // Add delay between downloads to prevent browser throttling
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

  /**
   * Downloads multiple blobs as a ZIP file (if supported)
   * @param blobs - Array of blobs to zip and download
   * @param filenames - Corresponding filenames for each blob
   * @param zipFilename - Name for the ZIP file
   * @returns Promise resolving to DownloadResult
   */
  async downloadAsZip(
    blobs: Blob[], 
    filenames: string[], 
    zipFilename: string
  ): Promise<DownloadResult> {
    // Note: This is a placeholder for ZIP functionality
    // In a real implementation, you would use a library like JSZip
    throw new ExportError('zip-not-implemented');
  }

  /**
   * Checks if the browser supports file downloads
   * @returns True if downloads are supported
   */
  isDownloadSupported(): boolean {
    return typeof document !== 'undefined' && 
           typeof document.createElement === 'function' &&
           typeof URL !== 'undefined' &&
           typeof URL.createObjectURL === 'function';
  }

  /**
   * Gets the optimal download method for the current browser
   * @returns Download method identifier
   */
  getDownloadMethod(): 'anchor' | 'window' | 'unsupported' {
    if (!this.isDownloadSupported()) {
      return 'unsupported';
    }
    
    // Test if anchor download attribute is supported
    const testAnchor = document.createElement('a');
    if ('download' in testAnchor) {
      return 'anchor';
    }
    
    return 'window';
  }

  /**
   * Validates input parameters for download operations
   * @param blob - Blob to validate
   * @param filename - Filename to validate
   */
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

  /**
   * Sanitizes filename to be safe for download
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace unsafe characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace unsafe characters with underscore
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length to 255 characters
  }

  /**
   * Generates numbered filename for multiple downloads
   * @param baseFilename - Base filename without extension
   * @param index - Current file index (1-based)
   * @param total - Total number of files
   * @returns Numbered filename
   */
  private generateNumberedFilename(baseFilename: string, index: number, total: number): string {
    const extension = this.extractExtension(baseFilename);
    const nameWithoutExt = this.removeExtension(baseFilename);
    const padding = total.toString().length;
    const paddedIndex = index.toString().padStart(padding, '0');
    
    return `${nameWithoutExt}_${paddedIndex}${extension}`;
  }

  /**
   * Extracts file extension from filename
   * @param filename - Filename to process
   * @returns File extension including dot, or empty string
   */
  private extractExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

  /**
   * Removes file extension from filename
   * @param filename - Filename to process
   * @returns Filename without extension
   */
  private removeExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
  }

  /**
   * Performs the actual download using the best available method
   * @param blob - Blob to download
   * @param filename - Sanitized filename
   * @param options - Download options
   * @returns Promise resolving to success status
   */
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

  /**
   * Downloads file using anchor element with download attribute
   * @param blob - Blob to download
   * @param filename - Filename for download
   * @param options - Download options
   * @returns Success status
   */
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
      
      // Clean up object URL after a delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return true;
    } catch (error) {
      throw new ExportError('anchor-download-failed', undefined, error as Error);
    }
  }

  /**
   * Downloads file using window.open (fallback method)
   * @param blob - Blob to download
   * @param filename - Filename for download
   * @param options - Download options
   * @returns Success status
   */
  private downloadViaWindow(blob: Blob, filename: string, options?: DownloadOptions): boolean {
    try {
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new ExportError('popup-blocked');
      }
      
      // Clean up object URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      
      return true;
    } catch (error) {
      throw new ExportError('window-download-failed', undefined, error as Error);
    }
  }

  /**
   * Creates a delay for the specified number of milliseconds
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
