/**
 * Error Recovery Service
 * Implements comprehensive error recovery mechanisms for texture loading and canvas rendering
 * Requirements: 5.3, 5.4, 5.5, 10.1, 10.2
 */

import {
  TemplateLoadError,
  TemplateNetworkError,
  TemplateFormatError,
  CanvasRenderError,
  CanvasMemoryError,
  CanvasFontLoadError,
  CanvasContextError,
  BlendModeError
} from '../types/errors';
import { RenderingConfig, PaperTemplate, PaperTexture } from '../types';

/**
 * Retry configuration for error recovery
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * User-friendly error message configuration
 */
export interface UserErrorMessage {
  title: string;
  message: string;
  suggestion: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  recoverable: boolean;
}

/**
 * Recovery attempt result
 */
export interface RecoveryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attemptCount: number;
  recoveryStrategy?: string;
}

/**
 * Error Recovery Service
 * Provides retry logic, fallback strategies, and user-friendly error messages
 * Requirements: 5.3, 5.4, 5.5 - Error handling and recovery
 */
export class ErrorRecoveryService {
  private retryConfig: RetryConfig;
  private recoveryAttempts: Map<string, number> = new Map();

  constructor(config: Partial<RetryConfig> = {}) {
    this.retryConfig = {
      maxRetries: config.maxRetries ?? 3,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 10000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      retryableErrors: config.retryableErrors ?? [
        'TemplateNetworkError',
        'CanvasMemoryError',
        'CanvasFontLoadError',
        'TemplateLoadError'
      ]
    };
  }

  /**
   * Execute operation with retry logic
   * Requirements: 5.3 - Retry logic for texture loading
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<RecoveryResult<T>> {
    const config = { ...this.retryConfig, ...customConfig };
    let lastError: Error | undefined;
    let attemptCount = 0;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      attemptCount++;
      
      try {
        const result = await operation();
        
        // Success - clear recovery attempts counter
        this.recoveryAttempts.delete(operationId);
        
        return {
          success: true,
          data: result,
          attemptCount,
          recoveryStrategy: attempt > 0 ? 'retry' : 'direct'
        };
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt === config.maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        
        console.warn(
          `Operation ${operationId} failed (attempt ${attempt + 1}/${config.maxRetries + 1}), ` +
          `retrying in ${delay}ms...`,
          lastError
        );
        
        // Wait before retry
        await this.delay(delay);
      }
    }

    // All retries failed
    this.recoveryAttempts.set(operationId, attemptCount);
    
    return {
      success: false,
      error: lastError,
      attemptCount,
      recoveryStrategy: 'failed'
    };
  }

  /**
   * Load texture with retry and fallback
   * Requirements: 5.3, 5.4 - Texture loading with error recovery
   */
  async loadTextureWithRecovery(
    loadTexture: (template: PaperTemplate) => Promise<PaperTexture>,
    template: PaperTemplate,
    fallbackTemplates?: PaperTemplate[]
  ): Promise<RecoveryResult<PaperTexture>> {
    // Try primary template with retry
    const primaryResult = await this.withRetry(
      () => loadTexture(template),
      `texture-${template.id}`,
      { maxRetries: 2 }
    );

    if (primaryResult.success) {
      return primaryResult;
    }

    // Try fallback templates if provided
    if (fallbackTemplates && fallbackTemplates.length > 0) {
      console.warn(
        `Primary texture ${template.id} failed, trying ${fallbackTemplates.length} fallback(s)...`
      );

      for (const fallbackTemplate of fallbackTemplates) {
        const fallbackResult = await this.withRetry(
          () => loadTexture(fallbackTemplate),
          `texture-fallback-${fallbackTemplate.id}`,
          { maxRetries: 1 }
        );

        if (fallbackResult.success) {
          return {
            ...fallbackResult,
            recoveryStrategy: 'fallback-template'
          };
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      error: primaryResult.error,
      attemptCount: primaryResult.attemptCount,
      recoveryStrategy: 'all-failed'
    };
  }

  /**
   * Render canvas with fallback strategies
   * Requirements: 5.4, 5.5 - Fallback rendering for canvas errors
   */
  async renderWithRecovery(
    primaryRender: () => Promise<HTMLCanvasElement>,
    fallbackRender: (error: Error) => Promise<HTMLCanvasElement>,
    emergencyRender?: () => Promise<HTMLCanvasElement>
  ): Promise<RecoveryResult<HTMLCanvasElement>> {
    // Try primary render
    try {
      const canvas = await primaryRender();
      return {
        success: true,
        data: canvas,
        attemptCount: 1,
        recoveryStrategy: 'primary'
      };
    } catch (primaryError) {
      console.warn('Primary render failed, attempting fallback:', primaryError);

      // Try fallback render
      try {
        const canvas = await fallbackRender(primaryError as Error);
        return {
          success: true,
          data: canvas,
          attemptCount: 2,
          recoveryStrategy: 'fallback'
        };
      } catch (fallbackError) {
        console.error('Fallback render failed:', fallbackError);

        // Try emergency render if provided
        if (emergencyRender) {
          try {
            const canvas = await emergencyRender();
            return {
              success: true,
              data: canvas,
              attemptCount: 3,
              recoveryStrategy: 'emergency'
            };
          } catch (emergencyError) {
            console.error('Emergency render failed:', emergencyError);
            return {
              success: false,
              error: emergencyError as Error,
              attemptCount: 3,
              recoveryStrategy: 'all-failed'
            };
          }
        }

        return {
          success: false,
          error: fallbackError as Error,
          attemptCount: 2,
          recoveryStrategy: 'fallback-failed'
        };
      }
    }
  }

  /**
   * Get user-friendly error message
   * Requirements: 10.1, 10.2 - User-friendly error messages
   */
  getUserErrorMessage(error: Error): UserErrorMessage {
    // Template loading errors
    if (error instanceof TemplateNetworkError) {
      return {
        title: 'Network Connection Issue',
        message: 'Unable to load the paper template due to a network problem.',
        suggestion: 'Please check your internet connection and try again.',
        severity: 'warning',
        recoverable: true
      };
    }

    if (error instanceof TemplateFormatError) {
      return {
        title: 'Unsupported Template Format',
        message: `The template format '${error.format}' is not supported.`,
        suggestion: 'Please select a different paper template.',
        severity: 'error',
        recoverable: true
      };
    }

    if (error instanceof TemplateLoadError) {
      return {
        title: 'Template Loading Failed',
        message: 'Unable to load the selected paper template.',
        suggestion: 'Try selecting a different template or refresh the page.',
        severity: 'warning',
        recoverable: true
      };
    }

    // Canvas rendering errors
    if (error instanceof CanvasMemoryError) {
      return {
        title: 'Memory Limit Reached',
        message: 'Your device doesn\'t have enough memory to render this content.',
        suggestion: 'Try reducing the text length or using a simpler template.',
        severity: 'error',
        recoverable: true
      };
    }

    if (error instanceof CanvasFontLoadError) {
      return {
        title: 'Font Loading Failed',
        message: `Unable to load the font '${error.fontFamily}'.`,
        suggestion: 'The app will use a default font instead. You can try reloading the page.',
        severity: 'warning',
        recoverable: true
      };
    }

    if (error instanceof CanvasContextError) {
      return {
        title: 'Canvas Not Supported',
        message: 'Your browser doesn\'t support the required canvas features.',
        suggestion: 'Please try using a modern browser like Chrome, Firefox, or Safari.',
        severity: 'critical',
        recoverable: false
      };
    }

    if (error instanceof BlendModeError) {
      return {
        title: 'Rendering Feature Unavailable',
        message: 'Some visual effects are not supported on your device.',
        suggestion: 'The app will render with simplified effects.',
        severity: 'info',
        recoverable: true
      };
    }

    if (error instanceof CanvasRenderError) {
      return {
        title: 'Rendering Error',
        message: 'An error occurred while generating your handwriting.',
        suggestion: 'Please try again. If the problem persists, try reducing the text length.',
        severity: 'error',
        recoverable: true
      };
    }

    // Generic error
    return {
      title: 'Unexpected Error',
      message: error.message || 'An unexpected error occurred.',
      suggestion: 'Please try refreshing the page. If the problem persists, contact support.',
      severity: 'error',
      recoverable: false
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    return this.retryConfig.retryableErrors.some(
      errorType => error.constructor.name === errorType
    );
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): {
    totalRecoveryAttempts: number;
    operationsWithRecovery: number;
    averageAttempts: number;
  } {
    const attempts = Array.from(this.recoveryAttempts.values());
    const totalRecoveryAttempts = attempts.reduce((sum, count) => sum + count, 0);
    const operationsWithRecovery = attempts.length;
    const averageAttempts = operationsWithRecovery > 0
      ? totalRecoveryAttempts / operationsWithRecovery
      : 0;

    return {
      totalRecoveryAttempts,
      operationsWithRecovery,
      averageAttempts
    };
  }

  /**
   * Clear recovery statistics
   */
  clearStats(): void {
    this.recoveryAttempts.clear();
  }

  /**
   * Update retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }
}

/**
 * Create default error recovery service instance
 */
export function createErrorRecoveryService(config?: Partial<RetryConfig>): ErrorRecoveryService {
  return new ErrorRecoveryService(config);
}
