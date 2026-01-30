/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { initializeServiceContainer } from '../services/ServiceConfiguration';
import { SERVICE_TOKENS } from '../types/index';
import { 
  ICanvasRenderer, 
  ITemplateProvider, 
  IImageExportSystem, 
  IPaperTextureManager, 
  IPageSplitter 
} from '../types/core';
import { IFontManager } from '../types/fonts';
import { ICustomFontUploadManager } from '../types/customFontUpload';

/**
 * Interface for all application services
 */
export interface AppServices {
  canvasRenderer: ICanvasRenderer | null;
  templateProvider: ITemplateProvider | null;
  imageExportSystem: IImageExportSystem | null;
  textureManager: IPaperTextureManager | null;
  fontManager: IFontManager | null;
  customFontUploadManager: ICustomFontUploadManager | null;
  pageSplitter: IPageSplitter | null;
}

/**
 * Return type for useAppServices hook including initialization state
 */
export interface AppServicesReturn extends AppServices {
  servicesInitialized: boolean;
  initializationError: string | null;
  serviceContainer: any | null;
}

/**
 * Custom hook for managing application services
 * 
 * Handles service container initialization, service resolution, and error handling.
 * This hook follows the dependency inversion principle by using the service container
 * to resolve dependencies.
 * 
 * @param onServicesInitialized - Optional callback invoked when services are successfully initialized
 * @param onInitializationError - Optional callback invoked when initialization fails
 * @returns Object containing all resolved services and initialization state
 * 
 * @example
 * ```tsx
 * const services = useAppServices(
 *   (container) => {
 *     console.log('Services initialized');
 *   },
 *   (error) => {
 *     console.error('Initialization failed:', error);
 *   }
 * );
 * 
 * if (!services.servicesInitialized) {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (services.initializationError) {
 *   return <ErrorMessage message={services.initializationError} />;
 * }
 * 
 * // Use services
 * const canvas = await services.canvasRenderer.render(config);
 * ```
 */
export const useAppServices = (
  onServicesInitialized?: (container: any) => void,
  onInitializationError?: (error: string) => void
): AppServicesReturn => {
  const [serviceContainer, setServiceContainer] = useState<any>(null);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  const [canvasRenderer, setCanvasRenderer] = useState<ICanvasRenderer | null>(null);
  const [templateProvider, setTemplateProvider] = useState<ITemplateProvider | null>(null);
  const [imageExportSystem, setImageExportSystem] = useState<IImageExportSystem | null>(null);
  const [textureManager, setTextureManager] = useState<IPaperTextureManager | null>(null);
  const [fontManager, setFontManager] = useState<IFontManager | null>(null);
  const [customFontUploadManager, setCustomFontUploadManager] = useState<ICustomFontUploadManager | null>(null);
  const [pageSplitter, setPageSplitter] = useState<IPageSplitter | null>(null);
  
  // Initialize service container
  useEffect(() => {
    try {
      const container = initializeServiceContainer();
      setServiceContainer(container);
      setServicesInitialized(true);
      
      if (onServicesInitialized) {
        onServicesInitialized(container);
      }
    } catch (error) {
      console.error('Failed to initialize service container:', error);
      const errorMessage = 'Failed to initialize services. Please refresh the page.';
      setInitializationError(errorMessage);
      
      if (onInitializationError) {
        onInitializationError(errorMessage);
      }
    }
  }, [onServicesInitialized, onInitializationError]);
  
  // Resolve services from container
  useEffect(() => {
    if (servicesInitialized && serviceContainer) {
      try {
        setCanvasRenderer(serviceContainer.resolve(SERVICE_TOKENS.CANVAS_RENDERER));
        setTemplateProvider(serviceContainer.resolve(SERVICE_TOKENS.TEMPLATE_PROVIDER));
        setImageExportSystem(serviceContainer.resolve(SERVICE_TOKENS.IMAGE_EXPORT_SYSTEM));
        setTextureManager(serviceContainer.resolve(SERVICE_TOKENS.PAPER_TEXTURE_MANAGER));
        setFontManager(serviceContainer.resolve(SERVICE_TOKENS.FONT_MANAGER));
        
        try {
          setCustomFontUploadManager(serviceContainer.resolve(SERVICE_TOKENS.CUSTOM_FONT_UPLOAD_MANAGER));
        } catch (error) {
          console.error('Failed to initialize custom font upload manager:', error);
          setCustomFontUploadManager(null);
        }
        
        setPageSplitter(serviceContainer.resolve(SERVICE_TOKENS.PAGE_SPLITTER));
      } catch (error) {
        console.error('Failed to resolve services:', error);
        const errorMessage = 'Failed to resolve services. Some features may be unavailable.';
        setInitializationError(errorMessage);
        
        if (onInitializationError) {
          onInitializationError(errorMessage);
        }
      }
    }
  }, [servicesInitialized, serviceContainer, onInitializationError]);
  
  return {
    serviceContainer,
    servicesInitialized,
    initializationError,
    canvasRenderer,
    templateProvider,
    imageExportSystem,
    textureManager,
    fontManager,
    customFontUploadManager,
    pageSplitter
  };
};
