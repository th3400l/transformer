/**
 * Font Error Handler Service
 * Provides comprehensive error classification, user-friendly messages, and recovery suggestions
 * for custom font upload operations.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4 - Error handling, classification, and user feedback
 */

import {
  FontUploadError,
  FontErrorType,
  FontErrorContext,
  FontErrorClassification,
  ErrorRecoveryAction,
  ProgressInfo,
  IFontErrorHandler,
  BrowserInfo
} from '../types/customFontUpload';

export class FontErrorHandler implements IFontErrorHandler {
  private sessionId: string;
  private browserInfo: BrowserInfo;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.browserInfo = this.detectBrowserInfo();
  }

  /**
   * Classify error and provide comprehensive error information
   * Requirements: 8.1 - Error classification system
   */
  classifyError(error: Error | FontUploadError, context?: FontErrorContext): FontErrorClassification {
    const errorType = this.determineErrorType(error);
    const severity = this.determineSeverity(errorType);
    const recoverable = this.isRecoverable(errorType);
    
    return {
      type: errorType,
      severity,
      recoverable,
      userMessage: this.createUserFriendlyMessage(error, context),
      technicalMessage: this.createTechnicalMessage(error, context),
      recoveryActions: this.getRecoveryActions(error, context),
      preventionTips: this.getPreventionTips(errorType)
    };
  }

  /**
   * Create user-friendly error message
   * Requirements: 8.2 - User-friendly error messages
   */
  createUserFriendlyMessage(error: Error | FontUploadError, context?: FontErrorContext): string {
    const errorType = this.determineErrorType(error);
    const fileName = context?.fileName || 'the font file';

    switch (errorType) {
      case FontErrorType.INVALID_FORMAT:
        return `${fileName} is not a supported font format. Please use TTF, OTF, WOFF, or WOFF2 files.`;
      
      case FontErrorType.FILE_TOO_LARGE:
        return `${fileName} is too large (maximum 5MB allowed). Try using a compressed font format like WOFF2.`;
      
      case FontErrorType.FILE_CORRUPTED:
        return `${fileName} appears to be corrupted or damaged. Please try a different font file.`;
      
      case FontErrorType.MISSING_CHARACTERS:
        return `${fileName} is missing some basic characters needed for text rendering. It may not display properly.`;
      
      case FontErrorType.MALFORMED_FONT:
        return `${fileName} has an invalid structure and cannot be used. Please try a different font file.`;
      
      case FontErrorType.STORAGE_FULL:
        return `Not enough storage space to save ${fileName}. Try removing unused fonts or clearing browser data.`;
      
      case FontErrorType.STORAGE_UNAVAILABLE:
        return `Cannot save fonts in your browser. This may be due to private browsing mode or browser settings.`;
      
      case FontErrorType.QUOTA_EXCEEDED:
        return `Storage limit exceeded. Please remove some existing fonts before uploading new ones.`;
      
      case FontErrorType.FONT_LIMIT_REACHED:
        return `You can only upload 2 custom fonts. Remove an existing font to upload a new one.`;
      
      case FontErrorType.UPLOAD_TIMEOUT:
        return `Upload of ${fileName} timed out. Please check your connection and try again.`;
      
      case FontErrorType.DUPLICATE_FONT:
        return `A font with the same name already exists. Choose a different name or replace the existing font.`;
      
      case FontErrorType.FONT_ALREADY_EXISTS:
        return `${fileName} is already uploaded. Use the existing font or replace it with a new version.`;
      
      case FontErrorType.BROWSER_UNSUPPORTED:
        return `Your browser doesn't support custom font uploads. Please update your browser or try a different one.`;
      
      case FontErrorType.FEATURE_UNAVAILABLE:
        return `Font upload is not available in your current browser environment. Try using a desktop browser.`;
      
      case FontErrorType.FONTFACE_API_UNAVAILABLE:
        return `Your browser doesn't support the required font loading features. Please update your browser.`;
      
      case FontErrorType.NETWORK_ERROR:
        return `Network connection issue prevented font upload. Please check your connection and try again.`;
      
      case FontErrorType.FONT_LOAD_FAILED:
        return `${fileName} uploaded successfully but couldn't be loaded for use. Try a different font format.`;
      
      case FontErrorType.RENDERING_FAILED:
        return `${fileName} cannot be used for text rendering. The font may be incompatible with the system.`;
      
      case FontErrorType.PROCESSING_ERROR:
        return `An error occurred while processing ${fileName}. Please try uploading again.`;
      
      default:
        return `An unexpected error occurred with ${fileName}. Please try again or contact support.`;
    }
  }

  /**
   * Get recovery actions for the error
   * Requirements: 8.2 - Actionable suggestions for resolution
   */
  getRecoveryActions(error: Error | FontUploadError, context?: FontErrorContext): ErrorRecoveryAction[] {
    const errorType = this.determineErrorType(error);
    const actions: ErrorRecoveryAction[] = [];

    switch (errorType) {
      case FontErrorType.INVALID_FORMAT:
        actions.push(
          {
            label: 'Choose Different File',
            action: () => this.triggerFileSelection(),
            type: 'alternative',
            primary: true
          },
          {
            label: 'Learn About Supported Formats',
            action: () => this.showFormatHelp(),
            type: 'manual'
          }
        );
        break;

      case FontErrorType.FILE_TOO_LARGE:
        actions.push(
          {
            label: 'Choose Smaller File',
            action: () => this.triggerFileSelection(),
            type: 'alternative',
            primary: true
          },
          {
            label: 'Learn About Font Compression',
            action: () => this.showCompressionHelp(),
            type: 'manual'
          }
        );
        break;

      case FontErrorType.FILE_CORRUPTED:
      case FontErrorType.MALFORMED_FONT:
        actions.push(
          {
            label: 'Try Different Font',
            action: () => this.triggerFileSelection(),
            type: 'alternative',
            primary: true
          },
          {
            label: 'Download Font Again',
            action: () => this.showRedownloadHelp(),
            type: 'manual'
          }
        );
        break;

      case FontErrorType.STORAGE_FULL:
      case FontErrorType.QUOTA_EXCEEDED:
        actions.push(
          {
            label: 'Remove Existing Fonts',
            action: () => this.triggerFontManagement(),
            type: 'manual',
            primary: true
          },
          {
            label: 'Clear Browser Data',
            action: () => this.showStorageHelp(),
            type: 'manual'
          }
        );
        break;

      case FontErrorType.FONT_LIMIT_REACHED:
        actions.push(
          {
            label: 'Manage Existing Fonts',
            action: () => this.triggerFontManagement(),
            type: 'manual',
            primary: true
          },
          {
            label: 'Replace Existing Font',
            action: () => this.triggerFontReplacement(),
            type: 'alternative'
          }
        );
        break;

      case FontErrorType.UPLOAD_TIMEOUT:
      case FontErrorType.NETWORK_ERROR:
        actions.push(
          {
            label: 'Try Again',
            action: () => this.triggerRetry(context),
            type: 'retry',
            primary: true
          },
          {
            label: 'Check Connection',
            action: () => this.showNetworkHelp(),
            type: 'manual'
          }
        );
        break;

      case FontErrorType.DUPLICATE_FONT:
      case FontErrorType.FONT_ALREADY_EXISTS:
        actions.push(
          {
            label: 'Replace Existing',
            action: () => this.triggerFontReplacement(),
            type: 'alternative',
            primary: true
          },
          {
            label: 'Choose Different Font',
            action: () => this.triggerFileSelection(),
            type: 'alternative'
          },
          {
            label: 'Cancel Upload',
            action: () => this.cancelUpload(),
            type: 'dismiss'
          }
        );
        break;

      case FontErrorType.BROWSER_UNSUPPORTED:
      case FontErrorType.FONTFACE_API_UNAVAILABLE:
        actions.push(
          {
            label: 'Update Browser',
            action: () => this.showBrowserUpdateHelp(),
            type: 'manual',
            primary: true
          },
          {
            label: 'Try Different Browser',
            action: () => this.showBrowserAlternatives(),
            type: 'manual'
          }
        );
        break;

      case FontErrorType.FONT_LOAD_FAILED:
      case FontErrorType.RENDERING_FAILED:
        actions.push(
          {
            label: 'Try Different Format',
            action: () => this.suggestAlternativeFormat(),
            type: 'alternative',
            primary: true
          },
          {
            label: 'Use Default Fonts',
            action: () => this.switchToDefaultFonts(),
            type: 'alternative'
          }
        );
        break;

      default:
        actions.push(
          {
            label: 'Try Again',
            action: () => this.triggerRetry(context),
            type: 'retry',
            primary: true
          },
          {
            label: 'Contact Support',
            action: () => this.showSupportHelp(),
            type: 'manual'
          }
        );
    }

    // Always add dismiss option
    actions.push({
      label: 'Dismiss',
      action: () => this.dismissError(),
      type: 'dismiss'
    });

    return actions;
  }

  /**
   * Log error for debugging and analytics
   * Requirements: 8.7, 8.8 - Anonymized error logging
   */
  logError(error: Error | FontUploadError, context?: FontErrorContext): void {
    const errorClassification = this.classifyError(error, context);
    
    // Create anonymized error log entry
    const errorName = error instanceof Error ? error.name : `FontUploadError:${error.type}`;
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      errorType: errorClassification.type,
      severity: errorClassification.severity,
      recoverable: errorClassification.recoverable,
      operation: context?.operation || 'unknown',
      browserInfo: this.browserInfo,
      // Only include non-sensitive technical details
      technicalDetails: {
        errorName,
        hasFileSize: !!context?.fileSize,
        fileSizeRange: context?.fileSize ? this.getFileSizeRange(context.fileSize) : null,
        hasFileName: !!context?.fileName,
        fileExtension: context?.fileName ? this.getFileExtension(context.fileName) : null
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Font Upload Error');
      console.error('Error:', error);

      console.groupEnd();
    }

    // In production, this would send to analytics service
    // For now, store in session storage for debugging
    try {
      const existingLogs = JSON.parse(sessionStorage.getItem('fontErrorLogs') || '[]');
      existingLogs.push(logEntry);
      // Keep only last 50 entries
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      sessionStorage.setItem('fontErrorLogs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.warn('Could not store error log:', storageError);
    }
  }

  /**
   * Create progress information for operations
   * Requirements: 8.3 - Progress tracking for operations
   */
  createProgressInfo(stage: ProgressInfo['stage'], progress: number, message?: string): ProgressInfo {
    const stageMessages = {
      uploading: 'Uploading font file...',
      validating: 'Validating font format and structure...',
      processing: 'Processing font data...',
      storing: 'Saving font to browser storage...',
      loading: 'Loading font for use...',
      complete: 'Font upload complete!'
    };

    const estimatedTimes = {
      uploading: 3000,    // 3 seconds
      validating: 2000,   // 2 seconds
      processing: 1500,   // 1.5 seconds
      storing: 1000,      // 1 second
      loading: 500,       // 0.5 seconds
      complete: 0
    };

    return {
      stage,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || stageMessages[stage],
      estimatedTimeRemaining: estimatedTimes[stage]
    };
  }

  // Private helper methods

  private determineErrorType(error: Error | FontUploadError): FontErrorType {
    if ('type' in error && Object.values(FontErrorType).includes(error.type as FontErrorType)) {
      return error.type as FontErrorType;
    }

    // Classify based on error message or type
    const message = error.message.toLowerCase();
    
    if (message.includes('format') || message.includes('mime')) {
      return FontErrorType.INVALID_FORMAT;
    }
    if (message.includes('size') || message.includes('large')) {
      return FontErrorType.FILE_TOO_LARGE;
    }
    if (message.includes('corrupt') || message.includes('invalid')) {
      return FontErrorType.FILE_CORRUPTED;
    }
    if (message.includes('storage') || message.includes('quota')) {
      return FontErrorType.STORAGE_FULL;
    }
    if (message.includes('limit') || message.includes('maximum')) {
      return FontErrorType.FONT_LIMIT_REACHED;
    }
    if (message.includes('timeout')) {
      return FontErrorType.UPLOAD_TIMEOUT;
    }
    if (message.includes('duplicate') || message.includes('exists')) {
      return FontErrorType.DUPLICATE_FONT;
    }
    if (message.includes('browser') || message.includes('support')) {
      return FontErrorType.BROWSER_UNSUPPORTED;
    }
    if (message.includes('network') || message.includes('connection')) {
      return FontErrorType.NETWORK_ERROR;
    }
    if (message.includes('load') || message.includes('render')) {
      return FontErrorType.FONT_LOAD_FAILED;
    }

    return FontErrorType.UNKNOWN_ERROR;
  }

  private determineSeverity(errorType: FontErrorType): 'low' | 'medium' | 'high' {
    const highSeverity = [
      FontErrorType.BROWSER_UNSUPPORTED,
      FontErrorType.FONTFACE_API_UNAVAILABLE,
      FontErrorType.STORAGE_UNAVAILABLE,
      FontErrorType.MALFORMED_FONT
    ];

    const mediumSeverity = [
      FontErrorType.FILE_CORRUPTED,
      FontErrorType.STORAGE_FULL,
      FontErrorType.QUOTA_EXCEEDED,
      FontErrorType.FONT_LOAD_FAILED,
      FontErrorType.RENDERING_FAILED
    ];

    if (highSeverity.includes(errorType)) return 'high';
    if (mediumSeverity.includes(errorType)) return 'medium';
    return 'low';
  }

  private isRecoverable(errorType: FontErrorType): boolean {
    const nonRecoverable = [
      FontErrorType.BROWSER_UNSUPPORTED,
      FontErrorType.FONTFACE_API_UNAVAILABLE,
      FontErrorType.STORAGE_UNAVAILABLE,
      FontErrorType.MALFORMED_FONT,
      FontErrorType.FILE_CORRUPTED
    ];

    return !nonRecoverable.includes(errorType);
  }

  private createTechnicalMessage(error: Error | FontUploadError, context?: FontErrorContext): string {
    const errorName = error instanceof Error ? error.name : `FontUploadError:${error.type}`;
    return `${errorName}: ${error.message}${context?.operation ? ` (during ${context.operation})` : ''}`;
  }

  private getPreventionTips(errorType: FontErrorType): string[] {
    const tips: Record<FontErrorType, string[]> = {
      [FontErrorType.INVALID_FORMAT]: [
        'Use TTF, OTF, WOFF, or WOFF2 font formats',
        'Download fonts from reputable sources',
        'Check file extension matches the actual format'
      ],
      [FontErrorType.FILE_TOO_LARGE]: [
        'Use WOFF2 format for better compression',
        'Choose fonts under 5MB in size',
        'Consider using web-optimized font versions'
      ],
      [FontErrorType.FILE_CORRUPTED]: [
        'Download fonts from original sources',
        'Verify file integrity after download',
        'Avoid fonts from untrusted websites'
      ],
      [FontErrorType.STORAGE_FULL]: [
        'Regularly clean up unused fonts',
        'Monitor browser storage usage',
        'Use smaller font formats when possible'
      ],
      [FontErrorType.FONT_LIMIT_REACHED]: [
        'Remove unused fonts before uploading new ones',
        'Choose versatile fonts that work for multiple purposes',
        'Consider which fonts you use most frequently'
      ],
      // Add more prevention tips for other error types as needed
    } as any;

    return tips[errorType] || [
      'Ensure stable internet connection',
      'Use updated browser version',
      'Try uploading one font at a time'
    ];
  }

  private detectBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    // Simple browser detection
    let name = 'Unknown';
    let version = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
      name = 'Edge';
      const match = userAgent.match(/Edge\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }

    return {
      name,
      version,
      platform: navigator.platform,
      supportsIndexedDB: 'indexedDB' in window,
      supportsLocalStorage: 'localStorage' in window,
      supportsFontFace: 'FontFace' in window,
      maxStorageQuota: undefined // Would need to be detected asynchronously
    };
  }

  private generateSessionId(): string {
    return `font-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFileSizeRange(size: number): string {
    if (size < 100 * 1024) return 'under-100kb';
    if (size < 500 * 1024) return '100kb-500kb';
    if (size < 1024 * 1024) return '500kb-1mb';
    if (size < 5 * 1024 * 1024) return '1mb-5mb';
    return 'over-5mb';
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'unknown';
  }

  // Action handlers - these would be connected to actual app functionality
  private triggerFileSelection(): void {
    // This would trigger the file selection dialog

  }

  private triggerFontManagement(): void {
    // This would open the font management panel

  }

  private triggerFontReplacement(): void {
    // This would start the font replacement flow

  }

  private triggerRetry(context?: FontErrorContext): void {
    // This would retry the failed operation

  }

  private cancelUpload(): void {
    // This would cancel the current upload

  }

  private dismissError(): void {
    // This would dismiss the error notification

  }

  private showFormatHelp(): void {
    // This would show help about supported formats

  }

  private showCompressionHelp(): void {
    // This would show help about font compression

  }

  private showRedownloadHelp(): void {
    // This would show help about redownloading fonts

  }

  private showStorageHelp(): void {
    // This would show help about browser storage

  }

  private showNetworkHelp(): void {
    // This would show help about network issues

  }

  private showBrowserUpdateHelp(): void {
    // This would show help about updating browser

  }

  private showBrowserAlternatives(): void {
    // This would show alternative browsers

  }

  private suggestAlternativeFormat(): void {
    // This would suggest alternative font formats

  }

  private switchToDefaultFonts(): void {
    // This would switch back to default fonts

  }

  private showSupportHelp(): void {
    // This would show support contact information

  }
}
