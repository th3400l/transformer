// Anonymized error logging service for custom font upload feature
// Requirements: 8.7, 8.8

import { IBrowserCompatibilityLayer } from '../types/fontStorage';

export interface ErrorContext {
  fontId?: string;
  fileName?: string;
  fileSize?: number;
  browserInfo: BrowserInfo;
  timestamp: Date;
  userAgent: string;
  sessionId: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  supportsIndexedDB: boolean;
  supportsLocalStorage: boolean;
  supportsFontFace: boolean;
  maxStorageQuota?: number;
}

export interface AnonymizedContext {
  sessionId: string; // Generated, not personal
  browserFingerprint: string; // Technical only
  errorFrequency: number;
  featureUsage: string[];
}

export interface FontUploadError {
  type: 'validation' | 'storage' | 'limit' | 'duplicate' | 'browser';
  message: string;
  details?: any;
}

export interface FontRenderingError {
  type: 'loading' | 'rendering' | 'fallback';
  fontFamily: string;
  message: string;
  details?: any;
}

export interface CompatibilityIssue {
  feature: string;
  browserName: string;
  browserVersion: string;
  workaroundUsed?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ErrorLogEntry {
  id: string;
  type: 'font_upload' | 'font_rendering' | 'browser_compatibility';
  timestamp: Date;
  sessionId: string;
  browserFingerprint: string;
  errorData: any;
  context: AnonymizedContext;
  userConsented: boolean;
}

export interface PerformanceMetrics {
  fontLoadTime: number;
  validationTime: number;
  storageTime: number;
  renderingTime: number;
  memoryUsage?: number;
  storageUsage: number;
}

/**
 * Privacy-first error logging service that collects anonymized, non-sensitive error data
 * for debugging and improving the custom font upload feature
 */
export class ErrorLoggingService {
  private compatibilityLayer: IBrowserCompatibilityLayer;
  private sessionId: string;
  private browserFingerprint: string;
  private errorLog: ErrorLogEntry[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private userConsent: boolean = false;
  private maxLogEntries = 100; // Limit memory usage
  private errorFrequency = new Map<string, number>();
  private featureUsage = new Set<string>();

  constructor(compatibilityLayer: IBrowserCompatibilityLayer) {
    this.compatibilityLayer = compatibilityLayer;
    this.sessionId = this.generateSessionId();
    this.browserFingerprint = this.generateBrowserFingerprint();
    
    // Check for existing user consent
    this.loadUserConsent();
  }

  /**
   * Log font upload error with anonymized context
   * @param error Font upload error details
   * @param context Error context information
   */
  logFontUploadError(error: FontUploadError, context: ErrorContext): void {
    if (!this.userConsent) {
      // Only log critical errors without consent
      if (error.type !== 'browser') return;
    }

    const anonymizedContext = this.createAnonymizedContext(context);
    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      type: 'font_upload',
      timestamp: new Date(),
      sessionId: this.sessionId,
      browserFingerprint: this.browserFingerprint,
      errorData: this.sanitizeErrorData(error),
      context: anonymizedContext,
      userConsented: this.userConsent
    };

    this.addLogEntry(logEntry);
    this.updateErrorFrequency(error.type);
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Font Upload Error:', logEntry);
    }
  }

  /**
   * Log font rendering error with anonymized context
   * @param error Font rendering error details
   * @param context Error context information
   */
  logFontRenderingError(error: FontRenderingError, context: ErrorContext): void {
    if (!this.userConsent) return;

    const anonymizedContext = this.createAnonymizedContext(context);
    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      type: 'font_rendering',
      timestamp: new Date(),
      sessionId: this.sessionId,
      browserFingerprint: this.browserFingerprint,
      errorData: this.sanitizeRenderingError(error),
      context: anonymizedContext,
      userConsented: this.userConsent
    };

    this.addLogEntry(logEntry);
    this.updateErrorFrequency(error.type);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('Font Rendering Error:', logEntry);
    }
  }

  /**
   * Log browser compatibility issue
   * @param issue Compatibility issue details
   * @param context Error context information
   */
  logBrowserCompatibilityIssue(issue: CompatibilityIssue, context: ErrorContext): void {
    // Always log compatibility issues as they help improve browser support
    const anonymizedContext = this.createAnonymizedContext(context);
    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      type: 'browser_compatibility',
      timestamp: new Date(),
      sessionId: this.sessionId,
      browserFingerprint: this.browserFingerprint,
      errorData: this.sanitizeCompatibilityIssue(issue),
      context: anonymizedContext,
      userConsented: this.userConsent
    };

    this.addLogEntry(logEntry);
    this.updateErrorFrequency(issue.feature);
    
    if (process.env.NODE_ENV === 'development') {
      console.info('Browser Compatibility Issue:', logEntry);
    }
  }

  /**
   * Log performance metrics for analysis
   * @param metrics Performance measurement data
   */
  logPerformanceMetrics(metrics: PerformanceMetrics): void {
    if (!this.userConsent) return;

    // Only keep recent metrics to limit memory usage
    this.performanceMetrics.push({
      ...metrics,
      // Remove any potentially identifying information
      memoryUsage: undefined // Don't log memory usage as it might be identifying
    });

    // Keep only last 50 metrics
    if (this.performanceMetrics.length > 50) {
      this.performanceMetrics = this.performanceMetrics.slice(-50);
    }
  }

  /**
   * Track feature usage for analytics
   * @param feature Feature name that was used
   */
  trackFeatureUsage(feature: string): void {
    this.featureUsage.add(feature);
  }

  /**
   * Get browser information for error context
   * @returns Browser information object
   */
  getBrowserInfo(): BrowserInfo {
    const capabilities = this.compatibilityLayer.detectCapabilities();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    return {
      name: this.extractBrowserName(userAgent),
      version: this.extractBrowserVersion(userAgent),
      platform: this.extractPlatform(userAgent),
      supportsIndexedDB: capabilities.hasIndexedDB,
      supportsLocalStorage: capabilities.hasLocalStorage,
      supportsFontFace: capabilities.hasFontFaceAPI,
      maxStorageQuota: capabilities.maxStorageQuota
    };
  }

  /**
   * Get anonymized user context
   * @returns Anonymized context information
   */
  getAnonymizedUserContext(): AnonymizedContext {
    return {
      sessionId: this.sessionId,
      browserFingerprint: this.browserFingerprint,
      errorFrequency: this.calculateTotalErrorFrequency(),
      featureUsage: Array.from(this.featureUsage)
    };
  }

  /**
   * Set user consent for error logging
   * @param consent Whether user consents to error logging
   */
  setUserConsent(consent: boolean): void {
    this.userConsent = consent;
    this.saveUserConsent(consent);
    
    if (!consent) {
      // Clear existing logs if consent is withdrawn
      this.clearLogs();
    }
  }

  /**
   * Get current user consent status
   * @returns Current consent status
   */
  getUserConsent(): boolean {
    return this.userConsent;
  }

  /**
   * Get error statistics for debugging
   * @returns Error statistics summary
   */
  getErrorStatistics(): ErrorStatistics {
    const totalErrors = this.errorLog.length;
    const errorsByType = new Map<string, number>();
    const errorsByBrowser = new Map<string, number>();
    
    for (const entry of this.errorLog) {
      // Count by error type
      const errorType = entry.errorData.type || 'unknown';
      errorsByType.set(errorType, (errorsByType.get(errorType) || 0) + 1);
      
      // Count by browser (from fingerprint)
      const browserInfo = this.parseBrowserFromFingerprint(entry.browserFingerprint);
      errorsByBrowser.set(browserInfo, (errorsByBrowser.get(browserInfo) || 0) + 1);
    }
    
    return {
      totalErrors,
      errorsByType: Object.fromEntries(errorsByType),
      errorsByBrowser: Object.fromEntries(errorsByBrowser),
      averagePerformance: this.calculateAveragePerformance(),
      sessionId: this.sessionId,
      consentStatus: this.userConsent
    };
  }

  /**
   * Export anonymized logs for analysis (development only)
   * @returns Anonymized log data
   */
  exportAnonymizedLogs(): ExportedLogData | null {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }
    
    return {
      sessionId: this.sessionId,
      browserFingerprint: this.browserFingerprint,
      logs: this.errorLog.map(entry => ({
        ...entry,
        // Remove any potentially identifying information
        errorData: this.deepSanitize(entry.errorData)
      })),
      performanceMetrics: this.performanceMetrics,
      statistics: this.getErrorStatistics()
    };
  }

  /**
   * Clear all logged data
   */
  clearLogs(): void {
    this.errorLog = [];
    this.performanceMetrics = [];
    this.errorFrequency.clear();
    this.featureUsage.clear();
  }

  /**
   * Generate unique session ID
   * @returns Session ID string
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Generate browser fingerprint for technical identification
   * @returns Browser fingerprint string
   */
  private generateBrowserFingerprint(): string {
    const browserInfo = this.getBrowserInfo();
    const capabilities = this.compatibilityLayer.detectCapabilities();
    
    // Create fingerprint from technical capabilities only
    const fingerprintData = [
      browserInfo.name,
      browserInfo.version.split('.')[0], // Major version only
      browserInfo.platform,
      capabilities.hasIndexedDB ? '1' : '0',
      capabilities.hasLocalStorage ? '1' : '0',
      capabilities.hasFontFaceAPI ? '1' : '0',
      capabilities.hasDragAndDrop ? '1' : '0',
      capabilities.hasCompressionStream ? '1' : '0'
    ].join('|');
    
    return this.simpleHash(fingerprintData);
  }

  /**
   * Create anonymized context from error context
   * @param context Original error context
   * @returns Anonymized context
   */
  private createAnonymizedContext(context: ErrorContext): AnonymizedContext {
    return {
      sessionId: this.sessionId,
      browserFingerprint: this.browserFingerprint,
      errorFrequency: this.calculateTotalErrorFrequency(),
      featureUsage: Array.from(this.featureUsage)
    };
  }

  /**
   * Sanitize error data to remove personal information
   * @param error Original error data
   * @returns Sanitized error data
   */
  private sanitizeErrorData(error: FontUploadError): any {
    return {
      type: error.type,
      message: this.sanitizeMessage(error.message),
      // Remove details that might contain personal information
      hasDetails: !!error.details
    };
  }

  /**
   * Sanitize rendering error data
   * @param error Original rendering error
   * @returns Sanitized error data
   */
  private sanitizeRenderingError(error: FontRenderingError): any {
    return {
      type: error.type,
      fontFamily: this.sanitizeFontFamily(error.fontFamily),
      message: this.sanitizeMessage(error.message),
      hasDetails: !!error.details
    };
  }

  /**
   * Sanitize compatibility issue data
   * @param issue Original compatibility issue
   * @returns Sanitized issue data
   */
  private sanitizeCompatibilityIssue(issue: CompatibilityIssue): any {
    return {
      feature: issue.feature,
      browserName: issue.browserName,
      browserVersion: issue.browserVersion.split('.')[0], // Major version only
      workaroundUsed: issue.workaroundUsed,
      impact: issue.impact
    };
  }

  /**
   * Sanitize message to remove potential personal information
   * @param message Original message
   * @returns Sanitized message
   */
  private sanitizeMessage(message: string): string {
    // Remove file paths, URLs, and other potentially identifying information
    return message
      .replace(/[A-Za-z]:\\[^\\]+/g, '[PATH]') // Windows paths
      .replace(/\/[^\/\s]+/g, '[PATH]') // Unix paths
      .replace(/https?:\/\/[^\s]+/g, '[URL]') // URLs
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // Emails
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]'); // IP addresses
  }

  /**
   * Sanitize font family name
   * @param fontFamily Original font family
   * @returns Sanitized font family
   */
  private sanitizeFontFamily(fontFamily: string): string {
    // Keep only generic font family information
    if (fontFamily.toLowerCase().includes('custom')) {
      return 'Custom Font';
    }
    return 'Font Family';
  }

  /**
   * Add log entry with size management
   * @param entry Log entry to add
   */
  private addLogEntry(entry: ErrorLogEntry): void {
    this.errorLog.push(entry);
    
    // Keep only recent entries to limit memory usage
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog = this.errorLog.slice(-this.maxLogEntries);
    }
  }

  /**
   * Update error frequency tracking
   * @param errorType Type of error that occurred
   */
  private updateErrorFrequency(errorType: string): void {
    this.errorFrequency.set(errorType, (this.errorFrequency.get(errorType) || 0) + 1);
  }

  /**
   * Calculate total error frequency
   * @returns Total number of errors
   */
  private calculateTotalErrorFrequency(): number {
    let total = 0;
    for (const count of this.errorFrequency.values()) {
      total += count;
    }
    return total;
  }

  /**
   * Extract browser name from user agent
   * @param userAgent User agent string
   * @returns Browser name
   */
  private extractBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Extract browser version from user agent
   * @param userAgent User agent string
   * @returns Browser version
   */
  private extractBrowserVersion(userAgent: string): string {
    const patterns = [
      /Chrome\/(\d+\.\d+)/,
      /Firefox\/(\d+\.\d+)/,
      /Version\/(\d+\.\d+).*Safari/,
      /Edg\/(\d+\.\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = userAgent.match(pattern);
      if (match) return match[1];
    }
    
    return 'Unknown';
  }

  /**
   * Extract platform from user agent
   * @param userAgent User agent string
   * @returns Platform name
   */
  private extractPlatform(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Generate log entry ID
   * @returns Unique log entry ID
   */
  private generateLogId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `log_${timestamp}_${random}`;
  }

  /**
   * Simple hash function for generating fingerprints
   * @param str String to hash
   * @returns Hash value
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Load user consent from storage
   */
  private loadUserConsent(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const consent = localStorage.getItem('font_error_logging_consent');
        this.userConsent = consent === 'true';
      }
    } catch {
      // Ignore storage errors
      this.userConsent = false;
    }
  }

  /**
   * Save user consent to storage
   * @param consent Consent status to save
   */
  private saveUserConsent(consent: boolean): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('font_error_logging_consent', consent.toString());
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Calculate average performance metrics
   * @returns Average performance data
   */
  private calculateAveragePerformance(): Partial<PerformanceMetrics> {
    if (this.performanceMetrics.length === 0) {
      return {};
    }
    
    const totals = this.performanceMetrics.reduce((acc, metrics) => ({
      fontLoadTime: acc.fontLoadTime + metrics.fontLoadTime,
      validationTime: acc.validationTime + metrics.validationTime,
      storageTime: acc.storageTime + metrics.storageTime,
      renderingTime: acc.renderingTime + metrics.renderingTime,
      storageUsage: acc.storageUsage + metrics.storageUsage
    }), {
      fontLoadTime: 0,
      validationTime: 0,
      storageTime: 0,
      renderingTime: 0,
      storageUsage: 0
    });
    
    const count = this.performanceMetrics.length;
    return {
      fontLoadTime: totals.fontLoadTime / count,
      validationTime: totals.validationTime / count,
      storageTime: totals.storageTime / count,
      renderingTime: totals.renderingTime / count,
      storageUsage: totals.storageUsage / count
    };
  }

  /**
   * Parse browser information from fingerprint
   * @param fingerprint Browser fingerprint
   * @returns Browser information string
   */
  private parseBrowserFromFingerprint(fingerprint: string): string {
    // This is a simplified approach - in practice, you'd need more sophisticated parsing
    return `Browser_${fingerprint.substring(0, 8)}`;
  }

  /**
   * Deep sanitize object to remove personal information
   * @param obj Object to sanitize
   * @returns Sanitized object
   */
  private deepSanitize(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.deepSanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByBrowser: Record<string, number>;
  averagePerformance: Partial<PerformanceMetrics>;
  sessionId: string;
  consentStatus: boolean;
}

export interface ExportedLogData {
  sessionId: string;
  browserFingerprint: string;
  logs: ErrorLogEntry[];
  performanceMetrics: PerformanceMetrics[];
  statistics: ErrorStatistics;
}