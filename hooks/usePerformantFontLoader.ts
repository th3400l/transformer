/**
 * Hook for performant font loading
 * Implements font preloading and lazy loading strategies
 * Requirements: 4.2, 4.3, 6.2, 6.3
 */

import { useEffect, useRef, useState } from 'react';
import { getPerformantFontLoader, FontLoadResult } from '../services/performantFontLoader';

export interface UsePerformantFontLoaderReturn {
  isReady: boolean;
  criticalFontsLoaded: boolean;
  highPriorityFontsLoaded: boolean;
  loadFont: (fontId: string) => Promise<FontLoadResult>;
  isFontLoaded: (fontId: string) => boolean;
  metrics: {
    totalFonts: number;
    loadedFonts: number;
    preloadedFonts: number;
    pendingLoads: number;
  };
}

/**
 * Custom hook for performant font loading
 * 
 * Automatically preloads critical and high-priority fonts on mount,
 * and provides methods for lazy loading other fonts on demand.
 * 
 * @returns Object with font loading state and methods
 * 
 * @example
 * ```tsx
 * const { isReady, loadFont, isFontLoaded } = usePerformantFontLoader();
 * 
 * // Wait for critical fonts before rendering
 * if (!isReady) {
 *   return <LoadingSpinner />;
 * }
 * 
 * // Lazy load a font when user selects it
 * const handleFontChange = async (fontId: string) => {
 *   if (!isFontLoaded(fontId)) {
 *     await loadFont(fontId);
 *   }
 *   setSelectedFont(fontId);
 * };
 * ```
 */
export function usePerformantFontLoader(): UsePerformantFontLoaderReturn {
  const [isReady, setIsReady] = useState(false);
  const [criticalFontsLoaded, setCriticalFontsLoaded] = useState(false);
  const [highPriorityFontsLoaded, setHighPriorityFontsLoaded] = useState(false);
  const [metrics, setMetrics] = useState({
    totalFonts: 0,
    loadedFonts: 0,
    preloadedFonts: 0,
    pendingLoads: 0
  });
  
  const fontLoaderRef = useRef(getPerformantFontLoader());
  const initializationStartedRef = useRef(false);

  // Initialize font loading on mount
  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initializationStartedRef.current) {
      return;
    }
    initializationStartedRef.current = true;

    const initializeFonts = async () => {
      const fontLoader = fontLoaderRef.current;

      try {
        // Step 1: Preload critical fonts (inkwell/Caveat - default font)
        const criticalResults = await fontLoader.preloadCriticalFonts();
        
        setCriticalFontsLoaded(true);
        setIsReady(true); // App can start rendering with critical fonts
        
        // Update metrics
        setMetrics(fontLoader.getMetrics());

        // Step 2: Preload high-priority fonts in the background (handwriting-1)
        // Use setTimeout to defer this to avoid blocking
        setTimeout(async () => {
          try {
            const highPriorityResults = await fontLoader.preloadHighPriorityFonts();
            
            setHighPriorityFontsLoaded(true);
            
            // Update metrics
            setMetrics(fontLoader.getMetrics());
          } catch (error) {
            console.warn('Failed to preload high-priority fonts:', error);
            // Don't block the app if high-priority fonts fail
            setHighPriorityFontsLoaded(true);
          }
        }, 100);

      } catch (error) {
        console.error('Failed to preload critical fonts:', error);
        // Even if preloading fails, mark as ready to not block the app
        // Fonts will fall back to system fonts
        setIsReady(true);
        setCriticalFontsLoaded(true);
      }
    };

    initializeFonts();
  }, []);

  // Lazy load a font on demand
  const loadFont = async (fontId: string): Promise<FontLoadResult> => {
    const fontLoader = fontLoaderRef.current;
    
    try {
      const result = await fontLoader.lazyLoadFont(fontId, {
        timeout: 3000,
        display: 'swap'
      });
      
      // Update metrics after loading
      setMetrics(fontLoader.getMetrics());
      
      return result;
    } catch (error) {
      console.error(`Failed to load font ${fontId}:`, error);
      return {
        fontId,
        success: false,
        loadTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Check if a font is loaded
  const isFontLoaded = (fontId: string): boolean => {
    return fontLoaderRef.current.isFontLoaded(fontId);
  };

  return {
    isReady,
    criticalFontsLoaded,
    highPriorityFontsLoaded,
    loadFont,
    isFontLoaded,
    metrics
  };
}
