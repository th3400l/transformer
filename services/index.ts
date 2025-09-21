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