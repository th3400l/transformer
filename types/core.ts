// Core interfaces and types for Gear-1 handwriting system
// Following SOLID principles for maintainable, extensible architecture

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export interface PaperTemplate {
  id: string;
  name: string;
  filename: string;
  type: 'blank' | 'lined';
  preview?: string;
}

export interface TextVariation {
  baselineJitter: number;    // +/- 0.5 pixels vertical position
  slantJitter: number;       // +/- 0.5 degrees rotation
  colorVariation: string;    // Slightly varied ink color
  microTilt: number;         // Additional micro rotation
}

export interface RenderingConfig {
  // Canvas dimensions
  canvasWidth: number;
  canvasHeight: number;
  
  // Text content and paper template
  text?: string;
  paperTemplate?: PaperTemplate;
  
  // Font properties
  fontFamily?: string;          // Font family to use
  fontSize?: number;            // Font size in pixels
  
  // Text variations (Requirements 1.1, 1.2, 1.3, 1.4, 1.5)
  baselineJitterRange: number;  // 0.5
  slantJitterRange: number;     // 0.5 degrees
  colorVariationIntensity: number; // 0.05
  microTiltRange: number;       // 0.3 degrees
  
  // Ink properties (Requirements 1.3, 1.4)
  baseInkColor: string;         // '#1A1A2E'
  blendMode: string;           // 'multiply'
  distortionLevel?: number;    // Optional paper distortion dial position
  
  // Page settings (Requirements 3.1, 3.2, 3.3)
  maxPagesPerGeneration: number; // 10
  wordsPerPage: number;         // ~200-300
  
  // Performance (Requirement 6.1)
  textureCache: boolean;        // true
  renderingQuality: number;     // 1.0-2.0 for retina
}

export interface CharacterMetrics {
  char: string;
  x: number;
  y: number;
  width: number;
  variation: TextVariation;
}

export interface PaperTexture {
  baseImage: HTMLImageElement;
  linesImage?: HTMLImageElement;
  isLoaded: boolean;
}

export interface ExportOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  maxPages?: number;
  shouldDownload?: boolean;
}

export interface ExportResult {
  images: Blob[];
  totalPages: number;
  success: boolean;
  error?: string;
  exportResults?: CanvasExportResult[];
  downloadResults?: DownloadResult[];
  limitedByMaxPages?: boolean;
  fallbackUsed?: boolean;
  partialRecovery?: boolean;
}

export interface TextureLoadResult {
  success: boolean;
  texture?: PaperTexture;
  error?: string;
}

export interface ProcessingOptions {
  scale?: number;
  quality?: number;
  filters?: string[];
}

export interface RenderingContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  paperTexture: PaperTexture;
  textMetrics: TextMetrics;
}

// ============================================================================
// CORE INTERFACES (Following Interface Segregation Principle)
// ============================================================================

// Template Management Interfaces (Requirements 2.1, 2.2, 2.3)
export interface ITemplateProvider {
  getAvailableTemplates(): Promise<PaperTemplate[]>;
  getTemplate(id: string): Promise<PaperTemplate | null>;
  getTemplateWithFallback?(id: string): Promise<PaperTemplate>;
  validateTemplate?(template: PaperTemplate): Promise<boolean>;
}

// Text Variation Interfaces (Requirements 1.1, 1.2, 1.3, 1.4, 1.5)
export interface IVariationStrategy {
  generateJitter(range: number): number;
  generateColorVariation(baseColor: string, intensity: number): string;
  generateRotation(range: number): number;
}

export interface VariationRangeConfig {
  baselineJitterRange?: number;
  slantJitterRange?: number;
  colorVariationIntensity?: number;
  microTiltRange?: number;
}

export interface ITextVariationEngine {
  generateVariation(char: string, position: number): TextVariation;
  setVariationIntensity(intensity: number): void;
  generateBatchVariations?(text: string): TextVariation[];
  getBaseInkColor?(): string;
  setBaseInkColor?(color: string): void;
  getVariationIntensity?(): number;
  configureRanges?(config: VariationRangeConfig): void;
}

// Paper Texture Management Interfaces (Requirements 2.1, 2.2, 2.3)
export interface ITextureLoader {
  loadImage(url: string): Promise<HTMLImageElement>;
  isFormatSupported(url: string): boolean;
  getSupportedFormats(): string[];
}

export interface ITextureCache {
  get(key: string): PaperTexture | null;
  set(key: string, texture: PaperTexture): void;
  clear(): void;
  remove(key: string): boolean;
  getStats(): any;
  has?(key: string): boolean;
  keys?(): string[];
  size?(): number;
}

export interface ITextureProcessor {
  processTexture(texture: PaperTexture, options: ProcessingOptions): PaperTexture;
  scaleTexture(texture: PaperTexture, width: number, height: number): PaperTexture;
  getOptimalSize(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number): { width: number; height: number };
  needsProcessing(texture: PaperTexture, options: ProcessingOptions): boolean;
  getProcessingStats(): any;
  dispose(): void;
}

export interface IPaperTextureManager {
  loadTexture(template: PaperTemplate): Promise<PaperTexture>;
  getCachedTexture(templateId: string): PaperTexture | null;
}

// Canvas Rendering Interfaces (Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.5)
export interface ICanvasRenderer {
  render(config: RenderingConfig): Promise<HTMLCanvasElement>;
  setTextEngine(engine: ITextVariationEngine): void;
  setTextureManager(manager: IPaperTextureManager): void;
}

export interface IBlendModeController {
  applyBlendMode(ctx: CanvasRenderingContext2D, mode: string): void;
  compositeTextures(base: HTMLCanvasElement, overlay: HTMLCanvasElement): HTMLCanvasElement;
}

// Export System Interfaces (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
export interface PageSplitOptions {
  wordsPerPage?: number;
  maxPages?: number;
}

export interface PageSplitResult {
  pages: string[];
  totalPages: number;
  wordsPerPage: number;
  maxPagesReached: boolean;
  truncated: boolean;
  remainingWords?: number;
}

export interface IPageSplitter {
  splitTextIntoPages(text: string, options?: PageSplitOptions): PageSplitResult;
  estimatePageCount(text: string, wordsPerPage?: number): number;
}

export interface CanvasExportResult {
  blob: Blob | null;
  format: 'png' | 'jpeg' | 'webp';
  size: number;
  width: number;
  height: number;
  success: boolean;
  error?: string;
}

export interface ICanvasExporter {
  canvasToBlob(canvas: HTMLCanvasElement, options?: ExportOptions): Promise<CanvasExportResult>;
  batchCanvasToBlob(canvases: HTMLCanvasElement[], options?: ExportOptions): Promise<CanvasExportResult[]>;
  isFormatSupported(format: string): boolean;
  getOptimalFormat(preferredFormat?: string): string;
}

export interface DownloadOptions {
  timeout?: number;
  retries?: number;
}

export interface DownloadResult {
  success: boolean;
  filename: string;
  size: number;
  error?: string;
}

export interface IDownloadManager {
  downloadSingle(blob: Blob, filename: string, options?: DownloadOptions): Promise<DownloadResult>;
  downloadMultiple(blobs: Blob[], baseFilename: string, options?: DownloadOptions): Promise<DownloadResult[]>;
  downloadAsZip(blobs: Blob[], filenames: string[], zipFilename: string): Promise<DownloadResult>;
  isDownloadSupported(): boolean;
  getDownloadMethod(): 'anchor' | 'window' | 'unsupported';
}

export interface IImageExportSystem {
  exportSinglePage(canvas: HTMLCanvasElement, options: ExportOptions): Promise<Blob>;
  exportMultiplePages(canvases: HTMLCanvasElement[], options: ExportOptions): Promise<ExportResult>;
}

// Dependency Injection Interface (Requirement 6.1)
export interface IServiceContainer {
  register<T>(token: string, factory: () => T): void;
  resolve<T>(token: string): T;
}

// ============================================================================
// SYSTEM MONITORING TYPES (used by SystemIntegrationManager)
// ============================================================================

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
  cacheHitRate: number;
  errorRate: number;
  averageExportTime: number;
}

export interface SystemHealth {
  status: 'initializing' | 'ready' | 'healthy' | 'degraded' | 'error' | 'disposed';
  componentsReady: boolean;
  memoryPressure: boolean;
  performanceGood: boolean;
  lastHealthCheck: number;
}

export interface OptimizationSettings {
  enableCanvasPooling: boolean;
  enableTextureCache: boolean;
  adaptiveQuality: boolean;
  memoryManagement: boolean;
  performanceMonitoring: boolean;
  errorRecovery: boolean;
}
