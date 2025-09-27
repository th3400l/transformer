// Main export file for Gear-1 handwriting system types and constants
// Provides centralized access for commonly used interfaces

// Core types and interfaces
export * from './core';

// Error classes and utilities
export * from './errors';

// Line alignment types and interfaces
export * from './lineAlignment';

// Default rendering configuration (Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 6.1)
export const DEFAULT_RENDERING_CONFIG = {
  // Canvas dimensions
  canvasWidth: 800,
  canvasHeight: 1000,
  
  // Text variations
  baselineJitterRange: 0.5,      // +/- 0.5 pixels (Requirement 1.1)
  slantJitterRange: 0.5,         // +/- 0.5 degrees (Requirement 1.2)
  colorVariationIntensity: 0.05, // Subtle color variation (Requirement 1.4)
  microTiltRange: 0.3,           // Micro-tilts (Requirement 1.5)
  
  // Ink properties
  baseInkColor: '#1A1A2E',       // Off-black color (Requirement 1.3)
  blendMode: 'multiply',         // Paper integration (Requirement 2.4)
  
  // Page settings
  maxPagesPerGeneration: 10,     // Page limit (Requirement 3.2)
  wordsPerPage: 250,             // Approximate words per page
  
  // Performance
  textureCache: true,            // Client-side caching (Requirement 6.1)
  renderingQuality: 1.0          // Standard quality
} as const;

// Service tokens for dependency injection
export const SERVICE_TOKENS = {
  TEXT_VARIATION_ENGINE: 'ITextVariationEngine',
  PAPER_TEXTURE_MANAGER: 'IPaperTextureManager',
  CANVAS_RENDERER: 'ICanvasRenderer',
  IMAGE_EXPORT_SYSTEM: 'IImageExportSystem',
  TEMPLATE_PROVIDER: 'ITemplateProvider',
  TEXTURE_LOADER: 'ITextureLoader',
  TEXTURE_CACHE: 'ITextureCache',
  TEXTURE_PROCESSOR: 'ITextureProcessor',
  PAGE_SPLITTER: 'IPageSplitter',
  CANVAS_EXPORTER: 'ICanvasExporter',
  DOWNLOAD_MANAGER: 'IDownloadManager',
  BULK_DOWNLOAD_MANAGER: 'IBulkDownloadManager',
  VARIATION_STRATEGY: 'IVariationStrategy',
  FONT_MANAGER: 'IFontManager',
  FONT_STORAGE_SERVICE: 'IFontStorageService',
  BROWSER_COMPATIBILITY_LAYER: 'IBrowserCompatibilityLayer',
  FONT_VALIDATION_ENGINE: 'IFontValidationEngine',
  CUSTOM_FONT_UPLOAD_MANAGER: 'ICustomFontUploadManager',
  FONT_ERROR_HANDLER: 'IFontErrorHandler',
  FONT_PROGRESS_TRACKER: 'IFontProgressTracker',
  FONT_ERROR_NOTIFICATION_SERVICE: 'IFontErrorNotificationService'
} as const;
