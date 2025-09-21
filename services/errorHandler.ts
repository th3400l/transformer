export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: string;
  timestamp: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorHandlerConfig {
  enableConsoleLogging: boolean;
  enableRemoteReporting: boolean;
  maxRetries: number;
  retryDelay: number;
  reportingEndpoint?: string;
}

export class GlobalErrorHandler {
  private config: ErrorHandlerConfig;
  private errorQueue: ErrorReport[] = [];
  private isReporting = false;
  private sessionId: string;

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteReporting: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), 'global-error', 'high', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'unhandled-promise-rejection',
        'high'
      );
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.handleError(
          new Error(`Resource failed to load: ${target.tagName}`),
          'resource-error',
          'medium',
          {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
            outerHTML: target.outerHTML?.substring(0, 200)
          }
        );
      }
    }, true);
  }

  public handleError(
    error: Error,
    context: string,
    severity: ErrorReport['severity'] = 'medium',
    additionalData?: Record<string, any>
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity,
      sessionId: this.sessionId,
      additionalData
    };

    this.processError(errorReport);
  }

  private generateErrorId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private processError(errorReport: ErrorReport): void {
    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorReport);
    }

    // Add to queue for remote reporting
    if (this.config.enableRemoteReporting) {
      this.errorQueue.push(errorReport);
      this.processErrorQueue();
    }

    // Store in local storage for debugging
    this.storeErrorLocally(errorReport);
  }

  private logToConsole(errorReport: ErrorReport): void {
    const logMethod = this.getConsoleMethod(errorReport.severity);
    
    console.group(`🚨 Error Report [${errorReport.severity.toUpperCase()}]`);
    console[logMethod]('Message:', errorReport.message);
    console.log('Context:', errorReport.context);
    console.log('Error ID:', errorReport.id);
    console.log('Timestamp:', errorReport.timestamp);
    
    if (errorReport.stack) {
      console.log('Stack trace:', errorReport.stack);
    }
    
    if (errorReport.additionalData) {
      console.log('Additional data:', errorReport.additionalData);
    }
    
    console.groupEnd();
  }

  private getConsoleMethod(severity: ErrorReport['severity']): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'log';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'log';
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) {
      return;
    }

    this.isReporting = true;

    while (this.errorQueue.length > 0) {
      const errorReport = this.errorQueue.shift()!;
      
      try {
        await this.reportError(errorReport);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
        
        // Re-queue the error for retry if we haven't exceeded max retries
        if (!errorReport.additionalData?.retryCount || errorReport.additionalData.retryCount < this.config.maxRetries) {
          errorReport.additionalData = {
            ...errorReport.additionalData,
            retryCount: (errorReport.additionalData?.retryCount || 0) + 1
          };
          
          // Add back to queue with delay
          setTimeout(() => {
            this.errorQueue.unshift(errorReport);
          }, this.config.retryDelay);
        }
      }
    }

    this.isReporting = false;
  }

  private async reportError(errorReport: ErrorReport): Promise<void> {
    if (!this.config.reportingEndpoint) {
      throw new Error('No reporting endpoint configured');
    }

    const response = await fetch(this.config.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorReport)
    });

    if (!response.ok) {
      throw new Error(`Failed to report error: ${response.status} ${response.statusText}`);
    }
  }

  private storeErrorLocally(errorReport: ErrorReport): void {
    try {
      const storageKey = 'handwriting-app-errors';
      const existingErrors = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Keep only the last 50 errors to prevent storage bloat
      const updatedErrors = [errorReport, ...existingErrors].slice(0, 50);
      
      localStorage.setItem(storageKey, JSON.stringify(updatedErrors));
    } catch (storageError) {
      console.warn('Failed to store error locally:', storageError);
    }
  }

  public getStoredErrors(): ErrorReport[] {
    try {
      const storageKey = 'handwriting-app-errors';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  }

  public clearStoredErrors(): void {
    try {
      localStorage.removeItem('handwriting-app-errors');
    } catch (error) {
      console.warn('Failed to clear stored errors:', error);
    }
  }

  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getSessionId(): string {
    return this.sessionId;
  }
}

// Create global instance
export const globalErrorHandler = new GlobalErrorHandler({
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteReporting: process.env.NODE_ENV === 'production'
});

// Utility functions for common error scenarios
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> => {
  try {
    return await asyncFn();
  } catch (error) {
    globalErrorHandler.handleError(
      error instanceof Error ? error : new Error(String(error)),
      context,
      'medium'
    );
    return fallbackValue;
  }
};

export const handleSyncError = <T>(
  syncFn: () => T,
  context: string,
  fallbackValue?: T
): T | undefined => {
  try {
    return syncFn();
  } catch (error) {
    globalErrorHandler.handleError(
      error instanceof Error ? error : new Error(String(error)),
      context,
      'medium'
    );
    return fallbackValue;
  }
};