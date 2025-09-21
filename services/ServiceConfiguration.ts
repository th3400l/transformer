// Service configuration for Gear-1 handwriting system
// Sets up all dependency injection registrations
// Requirements: 6.1, 6.2, 6.3

import { ServiceContainer } from './ServiceContainer';
import { SERVICE_TOKENS } from '../types/index';
import { 
  ITextureLoader, 
  ITextureCache, 
  ITextureProcessor, 
  IPaperTextureManager, 
  ITextVariationEngine, 
  IVariationStrategy,
  IPageSplitter,
  ICanvasExporter,
  IDownloadManager
} from '../types/core';
import { IFontManager } from '../types/fonts';
import { TemplateProvider } from './paperTemplateProvider';
import { RealisticVariationStrategy } from './textVariationStrategy';
import { TextVariationEngine } from './textVariationEngine';
import { TextureLoader } from './textureLoader';
import { TextureCache } from './textureCache';
import { TextureProcessor } from './textureProcessor';
import { PaperTextureManager } from './paperTextureManager';
import { CanvasRenderer } from './canvasRenderer';
import { PageSplitter } from './pageSplitter';
import { CanvasExporter } from './canvasExporter';
import { DownloadManager } from './downloadManager';
import { BulkDownloadManager } from './bulkDownloadManager';
import { StandardExportSystem } from './imageExportSystem';
import { FontManager } from './fontManager';

/**
 * Configure all services in the dependency injection container
 * This function registers all the service factories needed for the Gear-1 system
 * 
 * @param container - The service container to configure
 */
export function configureServices(container: ServiceContainer): void {
  // Font Management Services
  container.register(SERVICE_TOKENS.FONT_MANAGER, () => {
    return new FontManager();
  });

  // Text Variation Services
  container.register(SERVICE_TOKENS.VARIATION_STRATEGY, () => {
    return new RealisticVariationStrategy();
  });

  container.register(SERVICE_TOKENS.TEXT_VARIATION_ENGINE, () => {
    const strategy = container.resolve<IVariationStrategy>(SERVICE_TOKENS.VARIATION_STRATEGY);
    return new TextVariationEngine(strategy);
  });

  // Paper Texture Services
  container.register(SERVICE_TOKENS.TEXTURE_LOADER, () => {
    return new TextureLoader();
  });

  container.register(SERVICE_TOKENS.TEXTURE_CACHE, () => {
    return new TextureCache();
  });

  container.register(SERVICE_TOKENS.TEXTURE_PROCESSOR, () => {
    return new TextureProcessor();
  });

  container.register(SERVICE_TOKENS.PAPER_TEXTURE_MANAGER, () => {
    const loader = container.resolve<ITextureLoader>(SERVICE_TOKENS.TEXTURE_LOADER);
    const cache = container.resolve<ITextureCache>(SERVICE_TOKENS.TEXTURE_CACHE);
    const processor = container.resolve<ITextureProcessor>(SERVICE_TOKENS.TEXTURE_PROCESSOR);
    return new PaperTextureManager(loader, cache, processor);
  });

  // Template Provider Services with enhanced error handling
  container.register(SERVICE_TOKENS.TEMPLATE_PROVIDER, () => {
    return new TemplateProvider(undefined, {
      enableFallback: true,
      fallbackTemplateId: 'blank-1',
      enableValidation: true,
      retryAttempts: 3,
      retryDelay: 1000
    });
  });

  // Canvas Rendering Services
  container.register(SERVICE_TOKENS.CANVAS_RENDERER, () => {
    const textEngine = container.resolve<ITextVariationEngine>(SERVICE_TOKENS.TEXT_VARIATION_ENGINE);
    const textureManager = container.resolve<IPaperTextureManager>(SERVICE_TOKENS.PAPER_TEXTURE_MANAGER);
    return new CanvasRenderer(textEngine, textureManager);
  });

  // Export System Services
  container.register(SERVICE_TOKENS.PAGE_SPLITTER, () => {
    return new PageSplitter();
  });

  container.register(SERVICE_TOKENS.CANVAS_EXPORTER, () => {
    return new CanvasExporter();
  });

  container.register(SERVICE_TOKENS.DOWNLOAD_MANAGER, () => {
    return new DownloadManager();
  });

  // Register BulkDownloadManager as a separate service
  container.register(SERVICE_TOKENS.BULK_DOWNLOAD_MANAGER, () => {
    return new BulkDownloadManager();
  });

  container.register(SERVICE_TOKENS.IMAGE_EXPORT_SYSTEM, () => {
    const pageSplitter = container.resolve<IPageSplitter>(SERVICE_TOKENS.PAGE_SPLITTER);
    const canvasExporter = container.resolve<ICanvasExporter>(SERVICE_TOKENS.CANVAS_EXPORTER);
    const downloadManager = container.resolve<IDownloadManager>(SERVICE_TOKENS.DOWNLOAD_MANAGER);
    return new StandardExportSystem(pageSplitter, canvasExporter, downloadManager);
  });
}

/**
 * Initialize the application's dependency injection container
 * This is the main entry point for setting up all services
 * 
 * @returns Configured service container ready for use
 */
export function initializeServiceContainer(): ServiceContainer {
  const container = new ServiceContainer();
  configureServices(container);
  return container;
}

/**
 * Service configuration for testing
 * Provides a clean container for unit tests
 * 
 * @returns New service container for testing
 */
export function createTestServiceContainer(): ServiceContainer {
  return new ServiceContainer();
}