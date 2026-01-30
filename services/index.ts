// Main export file for services
// Provides centralized access to dependency injection components

export { ServiceContainer, serviceContainer } from './ServiceContainer';
export { 
  configureServices, 
  initializeServiceContainer, 
  createTestServiceContainer 
} from './ServiceConfiguration';
export { 
  TemplateProvider, 
  PAPER_TEMPLATES,
  type ITemplateProvider,
  type PaperTemplate 
} from './paperTemplateProvider';
export {
  RealisticVariationStrategy,
  SubtleVariationStrategy
} from './textVariationStrategy';
export { TextureLoader } from './textureLoader';
export { TextureCache, type TextureCacheOptions } from './textureCache';
export { TextureProcessor, type TextureProcessorOptions } from './textureProcessor';
export { 
  PaperTextureManager, 
  type PaperTextureManagerOptions 
} from './paperTextureManager';
export { PageSplitter } from './pageSplitter';
export { CanvasExporter } from './canvasExporter';
export { DownloadManager } from './downloadManager';
export { 
  BaseExportSystem, 
  StandardExportSystem, 
  createStandardExportSystem 
} from './imageExportSystem';

// Canvas rendering services
export { 
  ProgressiveCanvasRenderer,
  createProgressiveCanvasRenderer,
  DEFAULT_PROGRESSIVE_CONFIG,
  type ProgressiveRenderConfig,
  type ProgressCallback
} from './progressiveCanvasRenderer';

// Error handling and browser support services
export { FallbackFontService } from './fallbackFontService';
export { BrowserSupportService } from './browserSupportService';
export { ErrorLoggingService } from './errorLoggingService';
export { BrowserCompatibilityLayer } from './browserCompatibilityLayer';

// Font loading optimization - Requirements: 4.2, 4.3, 6.2, 6.3
export { 
  PerformantFontLoader,
  getPerformantFontLoader,
  type FontLoadStrategy,
  type FontLoadOptions,
  type FontLoadResult
} from './performantFontLoader';

// Memory management services
export { 
  MemoryManager,
  getMemoryManager,
  initializeMemoryManager,
  disposeMemoryManager,
  type MemoryStatus,
  type MemoryManagerConfig,
  type IMemoryManager,
  type CleanupResult
} from './memoryManager';
export { 
  CanvasPool,
  getCanvasPool,
  initializeCanvasPool,
  disposeCanvasPool,
  type CanvasPoolConfig,
  type PooledCanvas
} from './canvasPool';
export { 
  QualityManager,
  getQualityManager,
  initializeQualityManager,
  type DeviceCapabilities,
  type QualitySettings,
  type PerformanceProfile
} from './qualityManager';

// Texture optimization services
export {
  TexturePreloader,
  type PreloadStrategy,
  type PreloadConfig,
  type PreloadStatus
} from './texturePreloader';
export {
  LazyTextureLoader,
  type LazyLoadConfig,
  type LazyLoadEntry
} from './lazyTextureLoader';
export {
  ProgressiveTemplateLoader,
  getProgressiveTemplateLoader,
  initializeProgressiveLoader,
  type ProgressiveLoadConfig,
  type LoadPriority,
  type LoadProgress
} from './progressiveTemplateLoader';
export {
  TextureOptimizationManager,
  getTextureOptimizationManager,
  initializeTextureOptimization,
  type TextureOptimizationConfig,
  type OptimizationStats
} from './textureOptimizationManager';

// Mobile touch optimization services
export { 
  MobileTouchOptimizer,
  mobileTouchOptimizer,
  createMobileTouchOptimizer,
  type TouchTarget,
  type TouchFeedbackOptions,
  type TouchOptimizationConfig
} from './mobileTouchOptimizer';

// Adaptive quality services - Requirements: 5.4, 9.3, 9.4
export {
  AdaptiveQualityService,
  getAdaptiveQualityService,
  initializeAdaptiveQualityService,
  type QualityPreset,
  type UserQualityPreferences,
  type AdaptiveQualityState,
  type QualityAdjustment
} from './adaptiveQualityService';

// Error recovery services - Requirements: 5.3, 5.4, 5.5, 10.1, 10.2
export {
  ErrorRecoveryService,
  createErrorRecoveryService,
  type RetryConfig,
  type UserErrorMessage,
  type RecoveryResult
} from './errorRecoveryService';

// Cross-platform compatibility testing - Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2
export {
  BrowserCompatibilityDetector,
  compatibilityDetector,
  type BrowserInfo,
  type DeviceInfo,
  type CompatibilityReport
} from './browserCompatibilityDetector';
export {
  CrossPlatformTester,
  crossPlatformTester,
  type TestResult,
  type TestSuite
} from './crossPlatformTester';

// Performance benchmarking - Requirements: 1.2, 4.4, 5.4, 8.1, 8.3, 9.1, 9.2
export {
  PerformanceBenchmark,
  performanceBenchmark,
  type BenchmarkMetrics,
  type BenchmarkResults,
  type BenchmarkTargets
} from './performanceBenchmark';
