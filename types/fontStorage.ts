// Font storage types and interfaces for custom font upload feature
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 6.7, 6.8

export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2';

export interface FontMetadata {
  originalFilename: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  format: FontFormat;
  characterSets: string[];
  version?: string;
}

export interface StoredFontInfo {
  storageKey: string;
  metadata: FontMetadata;
  size: number;
  uploadDate: Date;
  lastAccessed?: Date;
}

export interface StorageUsageInfo {
  totalSize: number;
  availableSpace: number;
  fontCount: number;
  isNearLimit: boolean;
}

export interface FontStorageSchema {
  fonts: {
    [storageKey: string]: {
      data: ArrayBuffer;
      metadata: FontMetadata;
      uploadDate: Date;
      lastAccessed: Date;
    };
  };
  metadata: {
    version: string;
    totalSize: number;
    fontCount: number;
    lastCleanup: Date;
  };
}

export interface BrowserCapabilities {
  hasIndexedDB: boolean;
  hasLocalStorage: boolean;
  hasFontFaceAPI: boolean;
  hasDragAndDrop: boolean;
  hasCompressionStream: boolean;
  maxStorageQuota: number;
  supportedMimeTypes: string[];
}

export interface IFontStorageService {
  storeFont(fontData: ArrayBuffer, metadata: FontMetadata): Promise<string>;
  retrieveFont(storageKey: string): Promise<ArrayBuffer | null>;
  removeFont(storageKey: string): Promise<void>;
  listStoredFonts(): Promise<StoredFontInfo[]>;
  getStorageUsage(): Promise<StorageUsageInfo>;
  clearAllFonts(): Promise<void>;
}

export interface IBrowserCompatibilityLayer {
  detectCapabilities(): BrowserCapabilities;
  getOptimalStorageMethod(): 'indexeddb' | 'localstorage';
  getSupportedFontFormats(): FontFormat[];
  getMaxFileSize(): number;
  supportsFeature(feature: string): boolean;
  getBrowserOptimizations(): BrowserOptimizations;
  applyFontLoadingWorkarounds(fontData: ArrayBuffer): ArrayBuffer;
  getUploadStrategy(): UploadStrategy;
}

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

export class FontStorageError extends Error {
  constructor(
    public readonly operation: string,
    public readonly storageKey?: string,
    message?: string
  ) {
    super(message || `Font storage operation '${operation}' failed`);
    this.name = 'FontStorageError';
  }
}

export class StorageQuotaExceededError extends FontStorageError {
  constructor(
    public readonly requestedSize: number,
    public readonly availableSize: number
  ) {
    super('store', undefined, `Storage quota exceeded. Requested: ${requestedSize}, Available: ${availableSize}`);
    this.name = 'StorageQuotaExceededError';
  }
}

export class BrowserCompatibilityError extends Error {
  constructor(
    public readonly feature: string,
    message?: string
  ) {
    super(message || `Browser does not support required feature: ${feature}`);
    this.name = 'BrowserCompatibilityError';
  }
}
