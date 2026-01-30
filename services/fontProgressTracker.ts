/**
 * Font Progress Tracker Service
 * Provides progress tracking for font upload, validation, and loading operations
 * 
 * Requirements: 8.3 - Progress tracking for all upload and validation operations
 */

import { ProgressInfo } from '../types/customFontUpload';

export interface ProgressListener {
  (progress: ProgressInfo): void;
}

export interface ProgressOperation {
  id: string;
  type: 'upload' | 'validation' | 'processing' | 'storage' | 'loading';
  fileName?: string;
  startTime: Date;
  currentStage: ProgressInfo['stage'];
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

export interface IFontProgressTracker {
  startOperation(type: ProgressOperation['type'], fileName?: string): string;
  updateProgress(operationId: string, stage: ProgressInfo['stage'], progress: number, message?: string): void;
  completeOperation(operationId: string, success: boolean, message?: string): void;
  cancelOperation(operationId: string): void;
  getOperation(operationId: string): ProgressOperation | null;
  getAllOperations(): ProgressOperation[];
  subscribe(listener: ProgressListener): () => void;
  subscribeToOperation(operationId: string, listener: ProgressListener): () => void;
}

export class FontProgressTracker implements IFontProgressTracker {
  private operations = new Map<string, ProgressOperation>();
  private globalListeners = new Set<ProgressListener>();
  private operationListeners = new Map<string, Set<ProgressListener>>();
  private operationCounter = 0;

  /**
   * Start a new progress operation
   */
  startOperation(type: ProgressOperation['type'], fileName?: string): string {
    const id = `${type}-${++this.operationCounter}-${Date.now()}`;
    
    const operation: ProgressOperation = {
      id,
      type,
      fileName,
      startTime: new Date(),
      currentStage: this.getInitialStage(type),
      progress: 0,
      message: this.getInitialMessage(type, fileName),
      estimatedTimeRemaining: this.getEstimatedDuration(type)
    };

    this.operations.set(id, operation);
    this.notifyListeners(operation);
    
    return id;
  }

  /**
   * Update progress for an operation
   */
  updateProgress(operationId: string, stage: ProgressInfo['stage'], progress: number, message?: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`Progress update for unknown operation: ${operationId}`);
      return;
    }

    // Update operation
    operation.currentStage = stage;
    operation.progress = Math.max(0, Math.min(100, progress));
    operation.message = message || this.getStageMessage(stage, operation.fileName);
    operation.estimatedTimeRemaining = this.calculateRemainingTime(operation);

    this.operations.set(operationId, operation);
    this.notifyListeners(operation);
  }

  /**
   * Complete an operation
   */
  completeOperation(operationId: string, success: boolean, message?: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`Completion for unknown operation: ${operationId}`);
      return;
    }

    // Update to completion state
    operation.currentStage = 'complete';
    operation.progress = 100;
    operation.message = message || (success 
      ? `${operation.fileName || 'Font'} ${this.getSuccessMessage(operation.type)}`
      : `${operation.fileName || 'Font'} ${this.getFailureMessage(operation.type)}`
    );
    operation.estimatedTimeRemaining = 0;

    this.operations.set(operationId, operation);
    this.notifyListeners(operation);

    // Clean up after a delay
    setTimeout(() => {
      this.operations.delete(operationId);
      this.operationListeners.delete(operationId);
    }, 3000); // Keep completed operations for 3 seconds
  }

  /**
   * Cancel an operation
   */
  cancelOperation(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return;
    }

    // Notify cancellation before removing listeners
    const cancelledProgress: ProgressInfo = {
      stage: 'complete',
      progress: 0,
      message: `${operation.fileName || 'Font'} upload cancelled`,
      estimatedTimeRemaining: 0
    };

    this.notifyOperationListeners(operationId, cancelledProgress);

    // Remove operation and listeners after notification
    this.operations.delete(operationId);
    this.operationListeners.delete(operationId);
  }

  /**
   * Get specific operation
   */
  getOperation(operationId: string): ProgressOperation | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get all active operations
   */
  getAllOperations(): ProgressOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Subscribe to all progress updates
   */
  subscribe(listener: ProgressListener): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  /**
   * Subscribe to specific operation progress
   */
  subscribeToOperation(operationId: string, listener: ProgressListener): () => void {
    if (!this.operationListeners.has(operationId)) {
      this.operationListeners.set(operationId, new Set());
    }
    
    const listeners = this.operationListeners.get(operationId)!;
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.operationListeners.delete(operationId);
      }
    };
  }

  /**
   * Create progress info from operation
   */
  createProgressInfo(operation: ProgressOperation): ProgressInfo {
    return {
      stage: operation.currentStage,
      progress: operation.progress,
      message: operation.message,
      estimatedTimeRemaining: operation.estimatedTimeRemaining
    };
  }

  // Private helper methods

  private getInitialStage(type: ProgressOperation['type']): ProgressInfo['stage'] {
    switch (type) {
      case 'upload':
        return 'uploading';
      case 'validation':
        return 'validating';
      case 'processing':
        return 'processing';
      case 'storage':
        return 'storing';
      case 'loading':
        return 'loading';
      default:
        return 'uploading';
    }
  }

  private getInitialMessage(type: ProgressOperation['type'], fileName?: string): string {
    const file = fileName || 'font file';
    
    switch (type) {
      case 'upload':
        return `Starting upload of ${file}...`;
      case 'validation':
        return `Preparing to validate ${file}...`;
      case 'processing':
        return `Preparing to process ${file}...`;
      case 'storage':
        return `Preparing to save ${file}...`;
      case 'loading':
        return `Preparing to load ${file}...`;
      default:
        return `Processing ${file}...`;
    }
  }

  private getStageMessage(stage: ProgressInfo['stage'], fileName?: string): string {
    const file = fileName || 'font';
    
    switch (stage) {
      case 'uploading':
        return `Uploading ${file}...`;
      case 'validating':
        return `Validating ${file} format and structure...`;
      case 'processing':
        return `Processing ${file} data...`;
      case 'storing':
        return `Saving ${file} to browser storage...`;
      case 'loading':
        return `Loading ${file} for use...`;
      case 'complete':
        return `${file} ready to use!`;
      default:
        return `Processing ${file}...`;
    }
  }

  private getEstimatedDuration(type: ProgressOperation['type']): number {
    // Estimated durations in milliseconds
    switch (type) {
      case 'upload':
        return 5000;    // 5 seconds
      case 'validation':
        return 3000;    // 3 seconds
      case 'processing':
        return 2000;    // 2 seconds
      case 'storage':
        return 1500;    // 1.5 seconds
      case 'loading':
        return 1000;    // 1 second
      default:
        return 3000;    // 3 seconds default
    }
  }

  private calculateRemainingTime(operation: ProgressOperation): number {
    if (operation.progress >= 100) {
      return 0;
    }

    const elapsed = Date.now() - operation.startTime.getTime();
    const estimatedTotal = this.getEstimatedDuration(operation.type);
    
    // Use actual elapsed time if it's more accurate
    if (elapsed > estimatedTotal * 0.5) {
      // Extrapolate based on current progress
      const progressRatio = operation.progress / 100;
      if (progressRatio > 0) {
        const estimatedTotalTime = elapsed / progressRatio;
        return Math.max(0, estimatedTotalTime - elapsed);
      }
    }

    // Use original estimate adjusted for progress
    const progressRatio = operation.progress / 100;
    return Math.max(0, estimatedTotal * (1 - progressRatio));
  }

  private getSuccessMessage(type: ProgressOperation['type']): string {
    switch (type) {
      case 'upload':
        return 'uploaded successfully';
      case 'validation':
        return 'validated successfully';
      case 'processing':
        return 'processed successfully';
      case 'storage':
        return 'saved successfully';
      case 'loading':
        return 'loaded successfully';
      default:
        return 'completed successfully';
    }
  }

  private getFailureMessage(type: ProgressOperation['type']): string {
    switch (type) {
      case 'upload':
        return 'upload failed';
      case 'validation':
        return 'validation failed';
      case 'processing':
        return 'processing failed';
      case 'storage':
        return 'save failed';
      case 'loading':
        return 'loading failed';
      default:
        return 'operation failed';
    }
  }

  private notifyListeners(operation: ProgressOperation): void {
    const progressInfo = this.createProgressInfo(operation);
    
    // Notify global listeners
    this.globalListeners.forEach(listener => {
      try {
        listener(progressInfo);
      } catch (error) {
        console.error('Progress listener error:', error);
      }
    });

    // Notify operation-specific listeners
    this.notifyOperationListeners(operation.id, progressInfo);
  }

  private notifyOperationListeners(operationId: string, progressInfo: ProgressInfo): void {
    const listeners = this.operationListeners.get(operationId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(progressInfo);
        } catch (error) {
          console.error('Operation progress listener error:', error);
        }
      });
    }
  }
}

// Singleton instance
let fontProgressTracker: FontProgressTracker | null = null;

export function getFontProgressTracker(): FontProgressTracker {
  if (!fontProgressTracker) {
    fontProgressTracker = new FontProgressTracker();
  }
  return fontProgressTracker;
}