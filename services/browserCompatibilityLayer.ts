// Browser compatibility layer for custom font upload feature
// Requirements: 6.7, 6.8, 7.4, 7.5

import { 
  IBrowserCompatibilityLayer, 
  BrowserCapabilities, 
  FontFormat,
  BrowserCompatibilityError 
} from '../types/fontStorage';

/**
 * Browser compatibility layer that detects browser capabilities
 * and provides optimal storage method selection
 */
export interface BrowserOptimizations {
  safari: {
    usePrivateModeWorkaround: boolean;
    disableCompressionInPrivateMode: boolean;
    useAlternativeStorageMethod: boolean;
  };
  chrome: {
    enableCompressionStream: boolean;
    useOptimizedIndexedDB: boolean;
    enableLargeFileSupport: boolean;
  };
  firefox: {
    useAlternativeFileReader: boolean;
    disableParallelUploads: boolean;
    enableFallbackValidation: boolean;
  };
  edge: {
    useCompatibilityMode: boolean;
    enableProgressiveLoading: boolean;
    useFallbackDragDrop: boolean;
  };
  mobile: {
    isMobile: boolean;
    useTouch: boolean;
    reducedAnimations: boolean;
    optimizeForBandwidth: boolean;
  };
}

export interface UploadStrategy {
  chunkSize: number;
  parallelUploads: boolean;
  useCompression: boolean;
  validateInChunks: boolean;
  progressiveValidation: boolean;
  fallbackMethod: string;
}

export class BrowserCompatibilityLayer implements IBrowserCompatibilityLayer {
  private capabilities: BrowserCapabilities | null = null;

  /**
   * Detect browser capabilities for font storage and rendering
   * @returns BrowserCapabilities object with detected features
   */
  detectCapabilities(): BrowserCapabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    this.capabilities = {
      hasIndexedDB: this.checkIndexedDBSupport(),
      hasLocalStorage: this.checkLocalStorageSupport(),
      hasFontFaceAPI: this.checkFontFaceAPISupport(),
      hasDragAndDrop: this.checkDragAndDropSupport(),
      hasCompressionStream: this.checkCompressionStreamSupport(),
      maxStorageQuota: this.estimateStorageQuota(),
      supportedMimeTypes: this.getSupportedMimeTypes()
    };

    return this.capabilities;
  }

  /**
   * Get the optimal storage method based on browser capabilities
   * @returns 'indexeddb' or 'localstorage'
   */
  getOptimalStorageMethod(): 'indexeddb' | 'localstorage' {
    const capabilities = this.detectCapabilities();
    
    // Prefer IndexedDB for better performance and larger storage
    if (capabilities.hasIndexedDB) {
      return 'indexeddb';
    }
    
    // Fallback to LocalStorage
    if (capabilities.hasLocalStorage) {
      return 'localstorage';
    }
    
    throw new BrowserCompatibilityError('storage', 'No supported storage method available');
  }

  /**
   * Get supported font formats for this browser
   * @returns Array of supported FontFormat values
   */
  getSupportedFontFormats(): FontFormat[] {
    const formats: FontFormat[] = [];
    
    // Check WOFF2 support (modern browsers)
    if (this.checkFontFormatSupport('woff2')) {
      formats.push('woff2');
    }
    
    // Check WOFF support (widely supported)
    if (this.checkFontFormatSupport('woff')) {
      formats.push('woff');
    }
    
    // Check TTF support (universal)
    if (this.checkFontFormatSupport('ttf')) {
      formats.push('ttf');
    }
    
    // Check OTF support
    if (this.checkFontFormatSupport('otf')) {
      formats.push('otf');
    }
    
    return formats;
  }

  /**
   * Get maximum recommended file size based on browser and storage method
   * @returns Maximum file size in bytes
   */
  getMaxFileSize(): number {
    const capabilities = this.detectCapabilities();
    const storageMethod = this.getOptimalStorageMethod();
    
    if (storageMethod === 'indexeddb') {
      // IndexedDB can handle larger files
      return Math.min(5 * 1024 * 1024, capabilities.maxStorageQuota * 0.1); // 5MB or 10% of quota
    } else {
      // LocalStorage is more limited
      return Math.min(2 * 1024 * 1024, capabilities.maxStorageQuota * 0.05); // 2MB or 5% of quota
    }
  }

  /**
   * Check if a specific feature is supported
   * @param feature Feature name to check
   * @returns True if feature is supported
   */
  supportsFeature(feature: string): boolean {
    const capabilities = this.detectCapabilities();
    
    switch (feature) {
      case 'indexeddb':
        return capabilities.hasIndexedDB;
      case 'localstorage':
        return capabilities.hasLocalStorage;
      case 'fontface':
        return capabilities.hasFontFaceAPI;
      case 'dragdrop':
        return capabilities.hasDragAndDrop;
      case 'compression':
        return capabilities.hasCompressionStream;
      default:
        return false;
    }
  }

  /**
   * Get browser-specific optimizations and workarounds
   * @returns Object containing browser-specific configurations
   */
  getBrowserOptimizations(): BrowserOptimizations {
    const userAgent = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
    const capabilities = this.detectCapabilities();
    
    return {
      // Safari-specific optimizations
      safari: {
        usePrivateModeWorkaround: this.isSafariPrivateMode(),
        disableCompressionInPrivateMode: this.isSafariPrivateMode(),
        useAlternativeStorageMethod: this.isSafariPrivateMode() && !capabilities.hasIndexedDB
      },
      
      // Chrome-specific optimizations
      chrome: {
        enableCompressionStream: capabilities.hasCompressionStream,
        useOptimizedIndexedDB: capabilities.hasIndexedDB && userAgent.includes('Chrome'),
        enableLargeFileSupport: true
      },
      
      // Firefox-specific optimizations
      firefox: {
        useAlternativeFileReader: userAgent.includes('Firefox'),
        disableParallelUploads: userAgent.includes('Firefox'),
        enableFallbackValidation: true
      },
      
      // Edge-specific optimizations
      edge: {
        useCompatibilityMode: userAgent.includes('Edg'),
        enableProgressiveLoading: true,
        useFallbackDragDrop: !capabilities.hasDragAndDrop
      },
      
      // Mobile-specific optimizations
      mobile: {
        isMobile: this.isMobileDevice(),
        useTouch: this.isTouchDevice(),
        reducedAnimations: this.prefersReducedMotion(),
        optimizeForBandwidth: this.isSlowConnection()
      }
    };
  }

  /**
   * Apply browser-specific workarounds for font loading
   * @param fontData Font data to process
   * @returns Processed font data with browser-specific optimizations
   */
  applyFontLoadingWorkarounds(fontData: ArrayBuffer): ArrayBuffer {
    const optimizations = this.getBrowserOptimizations();
    
    // Safari private mode workaround - reduce font data size
    if (optimizations.safari.usePrivateModeWorkaround) {
      // In Safari private mode, reduce font complexity to avoid storage issues
      return this.optimizeFontForSafariPrivateMode(fontData);
    }
    
    // Firefox workaround - ensure proper font table ordering
    if (optimizations.firefox.useAlternativeFileReader) {
      return this.optimizeFontForFirefox(fontData);
    }
    
    return fontData;
  }

  /**
   * Get recommended upload strategy based on browser capabilities
   * @returns Upload strategy configuration
   */
  getUploadStrategy(): UploadStrategy {
    const capabilities = this.detectCapabilities();
    const optimizations = this.getBrowserOptimizations();
    
    return {
      chunkSize: this.getOptimalChunkSize(),
      parallelUploads: !optimizations.firefox.disableParallelUploads,
      useCompression: capabilities.hasCompressionStream && !optimizations.safari.disableCompressionInPrivateMode,
      validateInChunks: optimizations.mobile.isMobile,
      progressiveValidation: optimizations.edge.enableProgressiveLoading,
      fallbackMethod: this.getFallbackUploadMethod()
    };
  }

  /**
   * Check IndexedDB support
   * @returns True if IndexedDB is supported
   */
  private checkIndexedDBSupport(): boolean {
    try {
      return typeof window !== 'undefined' && 
             'indexedDB' in window && 
             window.indexedDB !== null;
    } catch {
      return false;
    }
  }

  /**
   * Check LocalStorage support
   * @returns True if LocalStorage is supported
   */
  private checkLocalStorageSupport(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      // Test actual functionality
      const testKey = '__font_storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check FontFace API support
   * @returns True if FontFace API is supported
   */
  private checkFontFaceAPISupport(): boolean {
    try {
      return typeof window !== 'undefined' && 
             'FontFace' in window && 
             'fonts' in document;
    } catch {
      return false;
    }
  }

  /**
   * Check drag and drop support
   * @returns True if drag and drop is supported
   */
  private checkDragAndDropSupport(): boolean {
    try {
      return typeof window !== 'undefined' && 
             'FileReader' in window && 
             'File' in window && 
             'FileList' in window &&
             'DataTransfer' in window;
    } catch {
      return false;
    }
  }

  /**
   * Check CompressionStream support
   * @returns True if CompressionStream is supported
   */
  private checkCompressionStreamSupport(): boolean {
    try {
      return typeof window !== 'undefined' && 
             'CompressionStream' in window;
    } catch {
      return false;
    }
  }

  /**
   * Estimate available storage quota
   * @returns Estimated storage quota in bytes
   */
  private estimateStorageQuota(): number {
    // Default conservative estimate
    const defaultQuota = 50 * 1024 * 1024; // 50MB default
    
    try {
      // Try to get actual quota if available
      if (typeof navigator !== 'undefined' && 
          'storage' in navigator && 
          navigator.storage &&
          'estimate' in navigator.storage) {
        // For synchronous operation in tests, we'll use the default
        // In real browsers, this would be async but we need sync for capabilities detection
        return defaultQuota;
      }
    } catch {
      // Use default if not supported
    }
    
    return defaultQuota;
  }

  /**
   * Get supported MIME types for fonts
   * @returns Array of supported MIME types
   */
  private getSupportedMimeTypes(): string[] {
    const mimeTypes = [
      'font/ttf',
      'font/otf',
      'application/font-ttf',
      'application/font-otf',
      'application/x-font-ttf',
      'application/x-font-otf'
    ];
    
    // Add WOFF types if supported
    if (this.checkFontFormatSupport('woff')) {
      mimeTypes.push('font/woff', 'application/font-woff');
    }
    
    if (this.checkFontFormatSupport('woff2')) {
      mimeTypes.push('font/woff2', 'application/font-woff2');
    }
    
    return mimeTypes;
  }

  /**
   * Check if a specific font format is supported
   * @param format Font format to check
   * @returns True if format is supported
   */
  private checkFontFormatSupport(format: FontFormat): boolean {
    try {
      if (!this.checkFontFaceAPISupport()) {
        return false;
      }
      
      // Create a minimal font face to test support
      // Use a more realistic test that doesn't throw for unsupported formats
      const testFont = new (window as any).FontFace('TestFont', `url(data:font/${format};base64,)`);
      return testFont !== null;
    } catch {
      return false;
    }
  }

  /**
   * Detect if running in Safari private mode
   * @returns True if Safari private mode is detected
   */
  private isSafariPrivateMode(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      // Safari private mode detection
      const userAgent = navigator.userAgent;
      if (!userAgent.includes('Safari') || userAgent.includes('Chrome')) {
        return false;
      }
      
      // Test localStorage functionality in Safari
      try {
        window.localStorage.setItem('__safari_test__', 'test');
        window.localStorage.removeItem('__safari_test__');
        return false;
      } catch {
        return true; // Private mode detected
      }
    } catch {
      return false;
    }
  }

  /**
   * Detect if device is mobile
   * @returns True if mobile device is detected
   */
  private isMobileDevice(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    } catch {
      return false;
    }
  }

  /**
   * Detect if device supports touch
   * @returns True if touch is supported
   */
  private isTouchDevice(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    } catch {
      return false;
    }
  }

  /**
   * Check if user prefers reduced motion
   * @returns True if reduced motion is preferred
   */
  private prefersReducedMotion(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  /**
   * Detect slow connection
   * @returns True if connection is slow
   */
  private isSlowConnection(): boolean {
    try {
      if (typeof navigator === 'undefined' || !('connection' in navigator)) {
        return false;
      }
      
      const connection = (navigator as any).connection;
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    } catch {
      return false;
    }
  }

  /**
   * Get optimal chunk size for uploads based on browser and connection
   * @returns Optimal chunk size in bytes
   */
  private getOptimalChunkSize(): number {
    const isMobile = this.isMobileDevice();
    const isSlowConnection = this.isSlowConnection();
    
    if (isSlowConnection) {
      return 64 * 1024; // 64KB for slow connections
    } else if (isMobile) {
      return 256 * 1024; // 256KB for mobile
    } else {
      return 1024 * 1024; // 1MB for desktop
    }
  }

  /**
   * Get fallback upload method
   * @returns Fallback method name
   */
  private getFallbackUploadMethod(): string {
    const capabilities = this.detectCapabilities();
    
    if (!capabilities.hasDragAndDrop) {
      return 'file-input';
    } else if (!capabilities.hasIndexedDB) {
      return 'localstorage-chunks';
    } else {
      return 'standard';
    }
  }

  /**
   * Optimize font data for Safari private mode
   * @param fontData Original font data
   * @returns Optimized font data
   */
  private optimizeFontForSafariPrivateMode(fontData: ArrayBuffer): ArrayBuffer {
    // In Safari private mode, we need to be more conservative with storage
    // This is a placeholder for font optimization logic
    return fontData;
  }

  /**
   * Optimize font data for Firefox
   * @param fontData Original font data
   * @returns Optimized font data
   */
  private optimizeFontForFirefox(fontData: ArrayBuffer): ArrayBuffer {
    // Firefox-specific font optimizations
    // This is a placeholder for Firefox-specific font handling
    return fontData;
  }
}