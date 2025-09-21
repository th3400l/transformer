/**
 * Error Notification Service
 * Provides user-friendly error messages and notifications for the Gear-1 handwriting system
 * Requirements: 6.5 - User-friendly error messages for template issues
 */

import { 
  TemplateLoadError, 
  TemplateNotFoundError, 
  TemplateNetworkError, 
  TemplateFormatError,
  CanvasRenderError,
  CanvasMemoryError,
  CanvasFontLoadError,
  ExportError,
  ExportLimitError
} from '../types/errors';

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actions?: ErrorAction[];
  dismissible: boolean;
  autoHide: boolean;
  duration?: number;
}

export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface IErrorNotificationService {
  showError(error: Error, context?: string): ErrorNotification;
  showNotification(notification: ErrorNotification): void;
  dismissNotification(id: string): void;
  clearAll(): void;
  getActiveNotifications(): ErrorNotification[];
}

/**
 * Error notification service implementation
 * Converts technical errors into user-friendly messages with actionable suggestions
 */
export class ErrorNotificationService implements IErrorNotificationService {
  private notifications: Map<string, ErrorNotification> = new Map();
  private listeners: Set<(notifications: ErrorNotification[]) => void> = new Set();
  private notificationCounter = 0;

  /**
   * Convert error to user-friendly notification
   * Requirements: 6.5 - Create user-friendly error messages for template issues
   */
  showError(error: Error, context?: string): ErrorNotification {
    const notification = this.createErrorNotification(error, context);
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
   * Create user-friendly error notification from technical error
   */
  private createErrorNotification(error: Error, context?: string): ErrorNotification {
    const id = `error-${++this.notificationCounter}`;
    
    // Template loading errors
    if (error instanceof TemplateNotFoundError) {
      return {
        id,
        type: 'error',
        title: 'Paper Template Not Found',
        message: `The selected paper template "${error.templateId}" could not be found. We've switched to the default template.`,
        actions: [
          {
            label: 'Choose Different Template',
            action: () => this.triggerTemplateSelection(),
            primary: true
          }
        ],
        dismissible: true,
        autoHide: true,
        duration: 5000
      };
    }

    if (error instanceof TemplateNetworkError) {
      return {
        id,
        type: 'warning',
        title: 'Connection Issue',
        message: `Unable to load the paper template due to a network issue. Using default template instead.`,
        actions: [
          {
            label: 'Retry',
            action: () => this.triggerRetry(error.templateId),
            primary: true
          },
          {
            label: 'Use Default',
            action: () => this.dismissNotification(id)
          }
        ],
        dismissible: true,
        autoHide: false
      };
    }

    if (error instanceof TemplateFormatError) {
      return {
        id,
        type: 'error',
        title: 'Unsupported Template Format',
        message: `The template format "${error.format}" is not supported. Please use JPEG, PNG, or AVIF formats.`,
        actions: [
          {
            label: 'Choose Different Template',
            action: () => this.triggerTemplateSelection(),
            primary: true
          }
        ],
        dismissible: true,
        autoHide: false
      };
    }

    if (error instanceof TemplateLoadError) {
      return {
        id,
        type: 'warning',
        title: 'Template Loading Issue',
        message: `There was a problem loading the paper template. We've switched to a default template so you can continue.`,
        actions: [
          {
            label: 'Try Again',
            action: () => this.triggerRetry(error.templateId),
            primary: true
          }
        ],
        dismissible: true,
        autoHide: true,
        duration: 6000
      };
    }

    // Canvas rendering errors
    if (error instanceof CanvasMemoryError) {
      return {
        id,
        type: 'warning',
        title: 'Memory Limit Reached',
        message: `Your text is too large for the available memory. Try reducing the text length or font size.`,
        actions: [
          {
            label: 'Reduce Text Size',
            action: () => this.triggerTextReduction(),
            primary: true
          },
          {
            label: 'Split Into Pages',
            action: () => this.triggerPageSplit()
          }
        ],
        dismissible: true,
        autoHide: false
      };
    }

    if (error instanceof CanvasFontLoadError) {
      return {
        id,
        type: 'warning',
        title: 'Font Loading Issue',
        message: `The handwriting font "${error.fontFamily}" couldn't be loaded. Using a backup font instead.`,
        actions: [
          {
            label: 'Retry Font Loading',
            action: () => this.triggerFontRetry(error.fontFamily),
            primary: true
          }
        ],
        dismissible: true,
        autoHide: true,
        duration: 5000
      };
    }

    if (error instanceof CanvasRenderError) {
      return {
        id,
        type: 'error',
        title: 'Rendering Problem',
        message: `There was an issue creating your handwritten text. This might be due to browser limitations or system resources.`,
        actions: [
          {
            label: 'Try Again',
            action: () => this.triggerRenderRetry(),
            primary: true
          },
          {
            label: 'Reduce Quality',
            action: () => this.triggerQualityReduction()
          }
        ],
        dismissible: true,
        autoHide: false
      };
    }

    // Export errors
    if (error instanceof ExportLimitError) {
      return {
        id,
        type: 'info',
        title: 'Page Limit Reached',
        message: `Your text would create ${error.requestedPages} pages, but we can only generate ${error.maxAllowed} pages at once. The text has been trimmed to fit.`,
        actions: [
          {
            label: 'Continue with Trimmed Text',
            action: () => this.dismissNotification(id),
            primary: true
          },
          {
            label: 'Split Into Batches',
            action: () => this.triggerBatchExport()
          }
        ],
        dismissible: true,
        autoHide: false
      };
    }

    if (error instanceof ExportError) {
      return {
        id,
        type: 'error',
        title: 'Export Failed',
        message: `Unable to generate your handwritten images. This might be due to browser limitations or insufficient memory.`,
        actions: [
          {
            label: 'Try Again',
            action: () => this.triggerExportRetry(),
            primary: true
          },
          {
            label: 'Reduce Quality',
            action: () => this.triggerQualityReduction()
          }
        ],
        dismissible: true,
        autoHide: false
      };
    }

    // Generic error fallback
    return {
      id,
      type: 'error',
      title: 'Something Went Wrong',
      message: context 
        ? `An error occurred while ${context}. Please try again or contact support if the problem persists.`
        : 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      actions: [
        {
          label: 'Try Again',
          action: () => this.triggerGenericRetry(),
          primary: true
        }
      ],
      dismissible: true,
      autoHide: false
    };
  }

  /**
   * Notify all listeners of notification changes
   */
  private notifyListeners(): void {
    const notifications = this.getActiveNotifications();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Error notification listener failed:', error);
      }
    });
  }

  // Action handlers - these would be connected to actual app functionality
  private triggerTemplateSelection(): void {
    // This would trigger the template selector to open
    console.log('Triggering template selection');
  }

  private triggerRetry(templateId: string): void {
    // This would retry loading the specific template
    console.log(`Retrying template load: ${templateId}`);
  }

  private triggerTextReduction(): void {
    // This would suggest or automatically reduce text size
    console.log('Triggering text size reduction');
  }

  private triggerPageSplit(): void {
    // This would split content into multiple pages
    console.log('Triggering page split');
  }

  private triggerFontRetry(fontFamily: string): void {
    // This would retry loading the font
    console.log(`Retrying font load: ${fontFamily}`);
  }

  private triggerRenderRetry(): void {
    // This would retry the rendering process
    console.log('Triggering render retry');
  }

  private triggerQualityReduction(): void {
    // This would reduce rendering quality
    console.log('Triggering quality reduction');
  }

  private triggerBatchExport(): void {
    // This would split export into multiple batches
    console.log('Triggering batch export');
  }

  private triggerExportRetry(): void {
    // This would retry the export process
    console.log('Triggering export retry');
  }

  private triggerGenericRetry(): void {
    // This would trigger a generic retry action
    console.log('Triggering generic retry');
  }
}

// Singleton instance
let errorNotificationService: ErrorNotificationService | null = null;

export function getErrorNotificationService(): ErrorNotificationService {
  if (!errorNotificationService) {
    errorNotificationService = new ErrorNotificationService();
  }
  return errorNotificationService;
}
