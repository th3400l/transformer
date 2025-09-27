/**
 * Font Error Notification Service
 * Extends the base error notification service with font-specific error handling
 * 
 * Requirements: 8.1, 8.2, 8.4 - User-friendly error messages and notifications for font operations
 */

import {
  ErrorNotification,
  ErrorAction,
  IErrorNotificationService
} from './errorNotificationService';
import { FontErrorHandler } from './fontErrorHandler';
import { getFontProgressTracker } from './fontProgressTracker';
import {
  FontUploadError,
  FontErrorType,
  FontErrorContext,
  ErrorRecoveryAction
} from '../types/customFontUpload';

export interface FontErrorNotification extends ErrorNotification {
  fontContext?: FontErrorContext;
  recoveryActions: ErrorRecoveryAction[];
}

export interface IFontErrorNotificationService extends IErrorNotificationService {
  showFontError(error: Error | FontUploadError, context?: FontErrorContext): FontErrorNotification;
  showFontWarning(message: string, context?: FontErrorContext): ErrorNotification;
  showFontSuccess(message: string, context?: FontErrorContext): ErrorNotification;
  showProgressNotification(operationId: string, fileName?: string): ErrorNotification;
}

export class FontErrorNotificationService implements IFontErrorNotificationService {
  private notifications: Map<string, ErrorNotification> = new Map();
  private listeners: Set<(notifications: ErrorNotification[]) => void> = new Set();
  private notificationCounter = 0;
  private fontErrorHandler: FontErrorHandler;
  private progressTracker = getFontProgressTracker();

  constructor() {
    this.fontErrorHandler = new FontErrorHandler();
  }

  /**
   * Show font-specific error notification
   * Requirements: 8.2 - User-friendly error messages for font operations
   */
  showFontError(error: Error | FontUploadError, context?: FontErrorContext): FontErrorNotification {
    const classification = this.fontErrorHandler.classifyError(error, context);
    const id = `font-error-${++this.notificationCounter}`;

    // Log the error
    this.fontErrorHandler.logError(error, context);

    const notification: FontErrorNotification = {
      id,
      type: classification.severity === 'high' ? 'error' : 'warning',
      title: this.getErrorTitle(classification.type),
      message: classification.userMessage,
      actions: this.convertRecoveryActions(classification.recoveryActions, id),
      dismissible: classification.recoverable,
      autoHide: classification.severity === 'low',
      duration: classification.severity === 'low' ? 10000 : undefined,
      fontContext: context,
      recoveryActions: classification.recoveryActions
    };

    this.showNotification(notification);
    return notification;
  }

  /**
   * Show font warning notification
   */
  showFontWarning(message: string, context?: FontErrorContext): ErrorNotification {
    const id = `font-warning-${++this.notificationCounter}`;
    
    const notification: ErrorNotification = {
      id,
      type: 'warning',
      title: 'Font Upload Warning',
      message,
      actions: [
        {
          label: 'Continue',
          action: () => this.dismissNotification(id)
        }
      ],
      dismissible: true,
      autoHide: true,
      duration: 10000
    };

    this.showNotification(notification);
    return notification;
  }

  /**
   * Show font success notification
   */
  showFontSuccess(message: string, context?: FontErrorContext): ErrorNotification {
    const id = `font-success-${++this.notificationCounter}`;
    
    const notification: ErrorNotification = {
      id,
      type: 'success',
      title: 'Font Upload Success',
      message,
      actions: [],
      dismissible: true,
      autoHide: true,
      duration: 10000
    };

    this.showNotification(notification);
    return notification;
  }

  /**
   * Show progress notification for font operations
   * Requirements: 8.3 - Progress indicators for operations
   */
  showProgressNotification(operationId: string, fileName?: string): ErrorNotification {
    const id = `font-progress-${operationId}`;
    
    const notification: ErrorNotification = {
      id,
      type: 'info',
      title: 'Font Upload Progress',
      message: `Processing ${fileName || 'font file'}...`,
      actions: [
        {
          label: 'Cancel',
          action: () => {
            this.progressTracker.cancelOperation(operationId);
            this.dismissNotification(id);
          }
        }
      ],
      dismissible: false,
      autoHide: false
    };

    // Subscribe to progress updates
    const unsubscribe = this.progressTracker.subscribeToOperation(operationId, (progress) => {
      const updatedNotification = { ...notification };
      updatedNotification.message = `${progress.message} (${progress.progress}%)`;
      
      if (progress.stage === 'complete') {
        // Auto-dismiss on completion
        setTimeout(() => {
          this.dismissNotification(id);
          unsubscribe();
        }, 1000);
      }
      
      this.notifications.set(id, updatedNotification);
      this.notifyListeners();
    });

    this.showNotification(notification);
    return notification;
  }

  /**
   * Show notification to user
   */
  showNotification(notification: ErrorNotification): void {
    this.notifications.set(notification.id, notification);
    this.notifyListeners();

    // Auto-hide if configured
    if (notification.autoHide && notification.duration) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Dismiss specific notification
   */
  dismissNotification(id: string): void {
    if (this.notifications.delete(id)) {
      this.notifyListeners();
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.clear();
    this.notifyListeners();
  }

  /**
   * Get all active notifications
   */
  getActiveNotifications(): ErrorNotification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: ErrorNotification[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Show error using base interface
   */
  showError(error: Error, context?: string): ErrorNotification {
    // Convert to font error context if possible
    const fontContext: FontErrorContext = {
      operation: context || 'unknown',
      timestamp: new Date(),
      sessionId: `session-${Date.now()}`
    };

    return this.showFontError(error, fontContext);
  }

  // Private helper methods

  private getErrorTitle(errorType: FontErrorType): string {
    switch (errorType) {
      case FontErrorType.INVALID_FORMAT:
        return 'Unsupported Font Format';
      case FontErrorType.FILE_TOO_LARGE:
        return 'Font File Too Large';
      case FontErrorType.FILE_CORRUPTED:
        return 'Corrupted Font File';
      case FontErrorType.MISSING_CHARACTERS:
        return 'Font Missing Characters';
      case FontErrorType.MALFORMED_FONT:
        return 'Invalid Font File';
      case FontErrorType.STORAGE_FULL:
        return 'Storage Space Full';
      case FontErrorType.STORAGE_UNAVAILABLE:
        return 'Storage Not Available';
      case FontErrorType.QUOTA_EXCEEDED:
        return 'Storage Limit Exceeded';
      case FontErrorType.FONT_LIMIT_REACHED:
        return 'Font Limit Reached';
      case FontErrorType.UPLOAD_TIMEOUT:
        return 'Upload Timeout';
      case FontErrorType.DUPLICATE_FONT:
        return 'Duplicate Font';
      case FontErrorType.FONT_ALREADY_EXISTS:
        return 'Font Already Exists';
      case FontErrorType.BROWSER_UNSUPPORTED:
        return 'Browser Not Supported';
      case FontErrorType.FEATURE_UNAVAILABLE:
        return 'Feature Not Available';
      case FontErrorType.FONTFACE_API_UNAVAILABLE:
        return 'Font Loading Not Supported';
      case FontErrorType.NETWORK_ERROR:
        return 'Network Error';
      case FontErrorType.FONT_LOAD_FAILED:
        return 'Font Loading Failed';
      case FontErrorType.RENDERING_FAILED:
        return 'Font Rendering Failed';
      case FontErrorType.PROCESSING_ERROR:
        return 'Processing Error';
      default:
        return 'Font Upload Error';
    }
  }

  private convertRecoveryActions(recoveryActions: ErrorRecoveryAction[], notificationId: string): ErrorAction[] {
    return recoveryActions.map(action => ({
      label: action.label,
      action: async () => {
        try {
          await action.action();
          // Dismiss notification after successful action (except for dismiss actions)
          if (action.type !== 'dismiss') {
            this.dismissNotification(notificationId);
          }
        } catch (error) {
          console.error('Recovery action failed:', error);
          // Show error for failed recovery action
          this.showFontError(error as Error, {
            operation: 'recovery action',
            timestamp: new Date(),
            sessionId: `recovery-${Date.now()}`
          });
        }
      },
      primary: action.primary
    }));
  }

  private notifyListeners(): void {
    const notifications = this.getActiveNotifications();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Font error notification listener failed:', error);
      }
    });
  }
}

// Singleton instance
let fontErrorNotificationService: FontErrorNotificationService | null = null;

export function getFontErrorNotificationService(): FontErrorNotificationService {
  if (!fontErrorNotificationService) {
    fontErrorNotificationService = new FontErrorNotificationService();
  }
  return fontErrorNotificationService;
}
