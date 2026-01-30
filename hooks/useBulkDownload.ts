/**
 * useBulkDownload Hook
 * 
 * Manages bulk download operations with progress tracking and error handling.
 * Provides state management for download progress, results, and UI feedback.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { useState, useCallback, useRef } from 'react';
import { GeneratedImage } from '../types/gallery';
import { 
  BulkDownloadManager, 
  BulkDownloadProgress, 
  BulkDownloadResult,
  IBulkDownloadManager 
} from '../services/bulkDownloadManager';

export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'error';

export interface UseBulkDownloadState {
  status: DownloadStatus;
  progress: BulkDownloadProgress | null;
  result: BulkDownloadResult | null;
  error: string | null;
}

export interface UseBulkDownloadActions {
  startDownload: (images: GeneratedImage[], baseFilename?: string) => Promise<void>;
  cancelDownload: () => void;
  clearState: () => void;
  resetToIdle: () => void;
}

export interface UseBulkDownloadReturn extends UseBulkDownloadState, UseBulkDownloadActions {
  isDownloading: boolean;
  canDownload: boolean;
}

/**
 * Custom hook for managing bulk download operations
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export const useBulkDownload = (): UseBulkDownloadReturn => {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState<BulkDownloadProgress | null>(null);
  const [result, setResult] = useState<BulkDownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const downloadManagerRef = useRef<IBulkDownloadManager | null>(null);
  const cancelledRef = useRef<boolean>(false);

  // Initialize download manager if not already created
  const getDownloadManager = useCallback((): IBulkDownloadManager => {
    if (!downloadManagerRef.current) {
      downloadManagerRef.current = new BulkDownloadManager();
    }
    return downloadManagerRef.current;
  }, []);

  // Progress callback for download operations
  const handleProgress = useCallback((progressData: BulkDownloadProgress) => {
    if (!cancelledRef.current) {
      setProgress(progressData);
    }
  }, []);

  // Start bulk download operation
  const startDownload = useCallback(async (
    images: GeneratedImage[], 
    baseFilename: string = 'image'
  ): Promise<void> => {
    if (status === 'downloading') {
      console.warn('Download already in progress');
      return;
    }

    if (!images || images.length === 0) {
      setError('No images to download');
      setStatus('error');
      return;
    }

    try {
      // Reset state
      setStatus('downloading');
      setProgress(null);
      setResult(null);
      setError(null);
      cancelledRef.current = false;

      const manager = getDownloadManager();

      // Validate download capacity first
      const canDownload = await manager.validateDownloadCapacity(images);
      if (!canDownload) {
        throw new Error('Insufficient storage space or download capacity exceeded');
      }

      // Start the download with progress tracking
      const downloadResult = await manager.downloadSequential(
        images,
        baseFilename,
        handleProgress
      );

      // Check if download was cancelled
      if (cancelledRef.current) {
        setStatus('idle');
        return;
      }

      // Set final result
      setResult(downloadResult);
      setProgress(null);

      // Determine final status based on results
      if (downloadResult.success) {
        setStatus('completed');
      } else if (downloadResult.downloadedCount > 0) {
        // Partial success - some downloads failed but some succeeded
        setStatus('completed');
      } else {
        // Complete failure
        setStatus('error');
        setError('All downloads failed');
      }

    } catch (err) {
      if (!cancelledRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Download failed';
        setError(errorMessage);
        setStatus('error');
        setProgress(null);
      }
    }
  }, [status, getDownloadManager, handleProgress]);

  // Cancel ongoing download
  const cancelDownload = useCallback(() => {
    if (status === 'downloading') {
      cancelledRef.current = true;
      setStatus('idle');
      setProgress(null);
      setError(null);
    }
  }, [status]);

  // Clear all state
  const clearState = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setResult(null);
    setError(null);
    cancelledRef.current = false;
  }, []);

  // Reset to idle state (keeping result for display)
  const resetToIdle = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setError(null);
    cancelledRef.current = false;
  }, []);

  // Computed properties
  const isDownloading = status === 'downloading';
  const canDownload = status === 'idle' || status === 'completed' || status === 'error';

  return {
    // State
    status,
    progress,
    result,
    error,
    
    // Actions
    startDownload,
    cancelDownload,
    clearState,
    resetToIdle,
    
    // Computed
    isDownloading,
    canDownload
  };
};

export default useBulkDownload;