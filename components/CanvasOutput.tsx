/**
 * Canvas Output Component
 * Replaces CSS-based text rendering with canvas-based handwriting simulation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ICanvasRenderer, RenderingConfig, PaperTemplate, VariationRangeConfig } from '../types/core';
import { DEFAULT_RENDERING_CONFIG } from '../types/index';
import { useResponsiveCanvas, useResponsiveCanvasContainer } from '../hooks/useResponsiveCanvas';
import { usePreCalculatedCanvasDimensions } from '../hooks/usePreCalculatedCanvasDimensions';
import { RoseSpinner } from './Spinner';
import { SUPPORT_EMAIL } from './SupportCTA';
import { globalErrorHandler } from '../services/errorHandler';

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

interface PanState {
  pointerId: number | null;
  isDragging: boolean;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  canDrag: boolean;
}

export interface CanvasOutputProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  inkColor: string;
  paperTemplate: PaperTemplate;
  canvasRenderer: ICanvasRenderer;
  className?: string;
  onRenderComplete?: (canvas: HTMLCanvasElement) => void;
  onRenderError?: (error: Error) => void;
  onRenderingStateChange?: (isRendering: boolean) => void;
  preCalculatedDimensions?: {
    width: number;
    height: number;
    scale: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  } | null;
  skipInitialAnimation?: boolean;
  progressiveRenderingThreshold?: number; // Character count threshold for progressive rendering
  distortionProfile?: VariationRangeConfig;
  distortionLevel?: number;
  inkBoldness?: number;
  wordsPerPage?: number;
}

export const CanvasOutput: React.FC<CanvasOutputProps> = ({
  text,
  fontFamily,
  fontSize,
  inkColor,
  paperTemplate,
  canvasRenderer,
  className = '',
  onRenderComplete,
  onRenderError,
  onRenderingStateChange,
  preCalculatedDimensions: propPreCalculatedDimensions = null,
  skipInitialAnimation = true,
  progressiveRenderingThreshold = 500, // Default: use progressive rendering for text > 500 chars
  distortionProfile,
  distortionLevel,
  inkBoldness,
  wordsPerPage
}) => {
  if (!paperTemplate) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Select a template from paper vibe</p>
      </div>
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [supportCopied, setSupportCopied] = useState<boolean>(false);
  const lastRenderConfigRef = useRef<string>('');
  const renderRequestIdRef = useRef<number>(0);
  const [renderProgress, setRenderProgress] = useState<number>(0); // Progress for progressive rendering (0-100)
  const [isProgressiveRendering, setIsProgressiveRendering] = useState<boolean>(false);

  // Notify parent of rendering state changes
  useEffect(() => {
    if (onRenderingStateChange) {
      onRenderingStateChange(isRendering || isProgressiveRendering);
    }
  }, [isRendering, isProgressiveRendering, onRenderingStateChange]);
  const renderAbortRef = useRef<boolean>(false); // Flag to abort progressive rendering
  const panStateRef = useRef<PanState>({
    pointerId: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    currentX: 0,
    currentY: 0,
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    canDrag: false
  });

  // Pre-calculate canvas dimensions before first render (Requirements: 1.1, 1.3, 7.1, 7.2, 7.3, 7.4, 7.5)
  // Use prop dimensions if provided, otherwise calculate them
  const hookPreCalculatedDimensions = usePreCalculatedCanvasDimensions({
    containerRef,
    aspectRatio: 8.5 / 11, // Standard letter paper
    minWidth: 300,
    maxWidth: 1200,
    minHeight: 400,
    maxHeight: 1600,
    padding: 20
  });

  const preCalculatedDimensions = propPreCalculatedDimensions || hookPreCalculatedDimensions;

  // Responsive canvas management (Requirements: 5.1, 5.2, 5.3, 5.4, 5.5)
  const { dimensions, getCanvasConfig, recalculate } = useResponsiveCanvas({
    containerRef,
    aspectRatio: 8.5 / 11, // Standard letter paper
    minWidth: 300,
    maxWidth: 1200,
    minHeight: 400,
    maxHeight: 1600,
    padding: 20
  });

  const { containerStyles, updateContainerStyles } = useResponsiveCanvasContainer();

  const updatePanBounds = useCallback((resetPosition = false) => {
    const viewportNode = canvasViewportRef.current;
    const canvasNode = canvasRef.current;

    if (!viewportNode || !canvasNode) {
      return;
    }

    const viewportRect = viewportNode.getBoundingClientRect();
    const canvasRect = canvasNode.getBoundingClientRect();
    const overflowX = canvasRect.width - viewportRect.width;
    const overflowY = canvasRect.height - viewportRect.height;
    const leeway = 32; // Allow slight overscroll for better UX
    const allowPan = dimensions.isMobile || dimensions.isTablet;
    const canDrag = allowPan && (overflowX > 0 || overflowY > 0);
    const state = panStateRef.current;

    if (resetPosition) {
      state.baseX = 0;
      state.baseY = 0;
      state.currentX = 0;
      state.currentY = 0;
    }

    state.minX = canDrag ? -Math.max(0, overflowX) - leeway : 0;
    state.maxX = canDrag ? leeway : 0;
    state.minY = canDrag ? -Math.max(0, overflowY) - leeway : 0;
    state.maxY = canDrag ? leeway : 0;
    state.canDrag = canDrag;

    state.baseX = clamp(state.baseX, state.minX, state.maxX);
    state.baseY = clamp(state.baseY, state.minY, state.maxY);
    state.currentX = clamp(state.currentX, state.minX, state.maxX);
    state.currentY = clamp(state.currentY, state.minY, state.maxY);

    canvasNode.style.transform = `translate(${state.currentX}px, ${state.currentY}px)`;
    canvasNode.style.willChange = state.canDrag ? 'transform' : 'auto';

    if (state.canDrag) {
      canvasNode.style.cursor = state.isDragging ? 'grabbing' : 'grab';
      viewportNode.setAttribute('data-pan-enabled', 'true');
    } else {
      canvasNode.style.cursor = 'default';
      viewportNode.removeAttribute('data-pan-enabled');
    }
  }, [dimensions.isMobile, dimensions.isTablet]);

  /**
   * Create rendering configuration from props with responsive dimensions
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 - Text variation configuration
   * Requirements: 5.4, 5.5 - Responsive canvas scaling
   */
  const createRenderingConfig = useCallback((textOverride?: string): RenderingConfig => {
    const canvasConfig = getCanvasConfig();

    return {
      ...DEFAULT_RENDERING_CONFIG,
      text: textOverride !== undefined ? textOverride : text,
      paperTemplate,
      canvasWidth: canvasConfig.width,
      canvasHeight: canvasConfig.height,
      baseInkColor: inkColor,
      renderingQuality: canvasConfig.renderingQuality,
      textureCache: canvasConfig.enableCanvasPooling,
      fontFamily,
      fontSize,
      inkBoldness,
      distortionLevel,
      baselineJitterRange: distortionProfile?.baselineJitterRange ?? DEFAULT_RENDERING_CONFIG.baselineJitterRange,
      slantJitterRange: distortionProfile?.slantJitterRange ?? DEFAULT_RENDERING_CONFIG.slantJitterRange,
      colorVariationIntensity: distortionProfile?.colorVariationIntensity ?? DEFAULT_RENDERING_CONFIG.colorVariationIntensity,
      microTiltRange: distortionProfile?.microTiltRange ?? DEFAULT_RENDERING_CONFIG.microTiltRange,
    };
  }, [text, paperTemplate, inkColor, getCanvasConfig, fontFamily, fontSize, inkBoldness, distortionLevel, distortionProfile]);

  /**
   * Progressive rendering for large text
   * Requirements: 1.2, 5.1, 5.2, 5.3, 5.4, 5.5
   * Splits large text into chunks and renders progressively to maintain responsiveness
   */
  /**
   * Progressive rendering for large text
   * Requirements: 1.2, 5.1, 5.2, 5.3, 5.4, 5.5
   * Splits large text into chunks and renders progressively to maintain responsiveness
   */
  const renderProgressively = useCallback(async (fullText: string, config: RenderingConfig): Promise<HTMLCanvasElement> => {
    // Optimization: Render by words to avoid splitting mid-word and to be more natural
    const words = fullText.split(/(\s+)/); // Keep delimiters to preserve formatting

    // Strict time-slicing constants
    const MAX_FRAME_TIME_MS = 5; // Target very low budget per frame to keep input responsive (5ms)
    // We can allow slightly more if we are using requestIdleCallback conceptually, but explicit yielding is safer.

    setIsProgressiveRendering(true);
    setRenderProgress(0);
    renderAbortRef.current = false;

    let currentCanvas: HTMLCanvasElement | null = null;
    let accumulatedText = '';

    // We will render chunks based on time, not count
    let startIndex = 0;

    // Helper to yield to main thread
    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

    while (startIndex < words.length) {
      if (renderAbortRef.current) {
        throw new Error('Progressive rendering aborted');
      }

      const startTime = performance.now();
      let endIndex = startIndex;

      // Greedily consume words until time budget is exceeded
      while (endIndex < words.length) {
        endIndex++;
        // Check time every few words to minimize overhead of performance.now() call
        // e.g., every 5 words check time
        if ((endIndex - startIndex) % 5 === 0) {
          if (performance.now() - startTime >= MAX_FRAME_TIME_MS) {
            break;
          }
        }
      }

      const chunkWords = words.slice(startIndex, endIndex);
      accumulatedText += chunkWords.join('');

      // Update config with new total text
      const chunkConfig = { ...config, text: accumulatedText };

      // Render updated content
      // Note: This relies on canvasRenderer being efficient enough to re-render accumulated text.
      // Ideally, canvasRenderer should support stateful appending, but stateless re-render is safer for correctness.
      currentCanvas = await canvasRenderer.render(chunkConfig);

      // Update progress
      const progress = Math.round((endIndex / words.length) * 100);
      setRenderProgress(Math.min(progress, 100));

      // Update canvas in viewport for visual feedback
      // We do this inside the loop so user sees it growing
      if (canvasViewportRef.current && currentCanvas) {
        const tempCanvas = currentCanvas.cloneNode(true) as HTMLCanvasElement;
        const viewportNode = canvasViewportRef.current;

        // Clear viewport and add temporary canvas
        if (canvasRef.current && canvasRef.current.parentNode) {
          canvasRef.current.parentNode.removeChild(canvasRef.current);
        }

        canvasRef.current = tempCanvas;
        tempCanvas.className = 'w-full h-full object-contain';

        // Set canvas size immediately using pre-calculated or current dimensions
        const dims = preCalculatedDimensions || dimensions;
        if (dims) {
          tempCanvas.style.width = `${dims.width}px`;
          tempCanvas.style.height = `${dims.height}px`;
        }

        // Apply responsive canvas styling
        if (dimensions.isMobile || dimensions.isTablet) {
          tempCanvas.style.maxWidth = '100%';
          tempCanvas.style.height = 'auto';
          tempCanvas.style.touchAction = 'none';
        } else {
          tempCanvas.style.maxWidth = '100%';
        }

        if (skipInitialAnimation) {
          tempCanvas.style.transform = 'translate(0px, 0px)';
          tempCanvas.style.transition = 'none';
          tempCanvas.style.animation = 'none';
        }
        tempCanvas.style.willChange = 'transform';

        viewportNode.innerHTML = '';
        viewportNode.appendChild(tempCanvas);
      }

      startIndex = endIndex;

      // Force yield to main thread to allow browser to handle events (typing, clicks)
      // This is crucial for fixing the "slow browser" issue. 
      await yieldToMain();
    }

    setIsProgressiveRendering(false);
    setRenderProgress(100);

    if (!currentCanvas) {
      throw new Error('Progressive rendering failed to produce canvas');
    }

    return currentCanvas;
  }, [canvasRenderer, dimensions, preCalculatedDimensions, skipInitialAnimation]);

  /**
   * Render canvas with current configuration
   * Requirements: 2.4, 2.5 - Canvas rendering with paper texture integration
   * Requirements: 1.2 - Progressive rendering for large text
   */
  const renderCanvas = useCallback(async () => {
    // Check if tab is hidden to prevent background loop buildup
    if (!canvasRenderer || !containerRef.current || !canvasViewportRef.current || (typeof document !== 'undefined' && document.hidden)) {
      return;
    }

    let configHash = '';
    let config: RenderingConfig | null = null;
    let effectiveText = text;

    // Generate a new request ID to track this specific render attempt
    renderRequestIdRef.current += 1;
    const requestId = renderRequestIdRef.current;

    try {
      // OPTIMIZATION: Truncate text if it exceeds wordsPerPage to avoid performance issues
      if (wordsPerPage && wordsPerPage > 0) {
        const maxWords = Math.floor(wordsPerPage * 1.2);
        let wordCount = 0;
        let charIndex = 0;
        let isWord = false;

        for (let i = 0; i < text.length; i++) {
          if (/\S/.test(text[i])) {
            if (!isWord) {
              isWord = true;
              wordCount++;
            }
          } else {
            isWord = false;
          }

          if (wordCount > maxWords) {
            charIndex = i;
            break;
          }
        }

        if (charIndex > 0) {
          effectiveText = text.substring(0, charIndex);
        }
      }

      const currentConfig = createRenderingConfig(effectiveText);
      config = currentConfig;

      // Create a config hash to avoid unnecessary re-renders
      configHash = JSON.stringify({
        text: currentConfig.text,
        paperTemplate: currentConfig.paperTemplate?.id,
        canvasWidth: currentConfig.canvasWidth,
        canvasHeight: currentConfig.canvasHeight,
        baseInkColor: currentConfig.baseInkColor,
        renderingQuality: currentConfig.renderingQuality,
        fontFamily: currentConfig.fontFamily,
        fontSize: currentConfig.fontSize,
        inkBoldness: currentConfig.inkBoldness,
        distortionLevel: currentConfig.distortionLevel,
        deviceType: `${dimensions.isMobile}-${dimensions.isTablet}-${dimensions.isDesktop}`
      });

      // Strict Check: Skip rendering if configuration matches exactly
      if (configHash === lastRenderConfigRef.current && canvasRef.current) {
        updatePanBounds();
        return;
      }

      // Fuzzy Check: Ignore minor dimension changes (layout thrashing protection)
      if (lastRenderConfigRef.current && canvasRef.current) {
        try {
          const lastConfig = JSON.parse(lastRenderConfigRef.current);
          const isContentSame =
            lastConfig.text === currentConfig.text &&
            lastConfig.paperTemplate === currentConfig.paperTemplate?.id &&
            lastConfig.baseInkColor === currentConfig.baseInkColor &&
            lastConfig.fontFamily === currentConfig.fontFamily &&
            lastConfig.fontSize === currentConfig.fontSize &&
            lastConfig.inkBoldness === currentConfig.inkBoldness &&
            lastConfig.distortionLevel === currentConfig.distortionLevel;

          if (isContentSame) {
            const widthDiff = Math.abs(lastConfig.canvasWidth - currentConfig.canvasWidth);
            const heightDiff = Math.abs(lastConfig.canvasHeight - currentConfig.canvasHeight);

            // Ignore small layout shifts (< 4px) to prevent infinite loops
            if (widthDiff < 4 && heightDiff < 4) {
              updatePanBounds();
              // Update ref to avoid repeated parsing, but don't re-render
              lastRenderConfigRef.current = configHash;
              return;
            }
          }
        } catch (e) {
          // Ignore parse errors, proceed to render
        }
      }

      // Start rendering process (block UI and show spinner)
      setIsRendering(true);
      setRenderError(null);
      renderAbortRef.current = false;

      // Artificial loading delay as requested by user (Actual time + 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Request ID Check: If a new render request started during the wait, abort this one silently
      if (requestId !== renderRequestIdRef.current) {
        return;
      }

      // Re-check visibility after delay
      if (typeof document !== 'undefined' && document.hidden) {
        setIsRendering(false);
        return;
      }

      const textLength = currentConfig.text?.length || 0;
      const useProgressiveRendering = textLength > progressiveRenderingThreshold;

      let newCanvas: HTMLCanvasElement;

      if (useProgressiveRendering && currentConfig.text) {
        // Use progressive rendering for large text
        newCanvas = await renderProgressively(currentConfig.text, currentConfig);
      } else {
        // Render immediately for small text
        newCanvas = await canvasRenderer.render(currentConfig);
      }

      // Final Request ID Check: Ensure we haven't been superseded during rendering
      if (requestId !== renderRequestIdRef.current) {
        return;
      }

      // Remove old canvas if it exists
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }

      // Add new canvas to viewport with responsive styling
      canvasRef.current = newCanvas;
      newCanvas.className = 'w-full h-full object-contain';

      // Set canvas size
      const dims = preCalculatedDimensions || dimensions;
      if (dims) {
        newCanvas.style.width = `${dims.width}px`;
        newCanvas.style.height = `${dims.height}px`;
      }

      // Apply responsive canvas styling
      if (dimensions.isMobile) {
        newCanvas.style.maxWidth = '100%';
        newCanvas.style.height = 'auto';
        newCanvas.style.touchAction = 'none';
      } else if (dimensions.isTablet) {
        newCanvas.style.maxWidth = '100%';
        newCanvas.style.touchAction = 'none';
      } else {
        newCanvas.style.maxWidth = '100%';
      }

      if (skipInitialAnimation) {
        newCanvas.style.transform = 'translate(0px, 0px)';
        newCanvas.style.transition = 'none';
        newCanvas.style.animation = 'none';
      }
      newCanvas.style.willChange = 'transform';

      const viewportNode = canvasViewportRef.current;
      viewportNode.innerHTML = '';
      viewportNode.appendChild(newCanvas);
      panStateRef.current.pointerId = null;
      panStateRef.current.isDragging = false;
      panStateRef.current.baseX = 0;
      panStateRef.current.baseY = 0;
      panStateRef.current.currentX = 0;
      panStateRef.current.currentY = 0;
      updatePanBounds(true);

      // Update last render config
      lastRenderConfigRef.current = configHash;
      setRenderError(null);
      setErrorDetails(null);
      setSupportCopied(false);
      setRenderProgress(0);
      setIsProgressiveRendering(false);

      // Notify parent component
      if (onRenderComplete) {
        onRenderComplete(newCanvas);
      }

    } catch (error) {
      console.error('Canvas rendering failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown rendering error';
      const errorStack = error instanceof Error && error.stack ? error.stack : 'No stack available';
      const errorObject = error instanceof Error ? error : new Error(errorMessage);

      // Update config hash even on error to prevent infinite error loops
      if (configHash) lastRenderConfigRef.current = configHash;

      globalErrorHandler.handleError(errorObject, 'canvas-output-render', 'medium', {
        configHash,
        templateId: config?.paperTemplate?.id,
        fontFamily,
        fontSize,
        inkColor,
        isMobile: dimensions.isMobile,
        isTablet: dimensions.isTablet
      });
      const detailedReport = [
        `Message: ${errorMessage}`,
        `Stack: ${errorStack}`,
        `Render config hash: ${configHash}`,
        `Timestamp: ${new Date().toISOString()}`,
        `Location: ${window.location.href}`
      ].join('\n');
      setRenderError('Your canvas failed to load and we\'re actively working on fixing it.');
      setErrorDetails(detailedReport);
      setRenderProgress(0);
      setIsProgressiveRendering(false);

      if (onRenderError) {
        onRenderError(errorObject);
      }
    } finally {
      // Only reset isRendering if this request is still the active one
      if (renderRequestIdRef.current === requestId) {
        setIsRendering(false);
      }
    }
  }, [
    canvasRenderer,
    createRenderingConfig,
    dimensions,
    preCalculatedDimensions,
    progressiveRenderingThreshold,
    renderProgressively,
    skipInitialAnimation,
    onRenderComplete,
    onRenderError,
    updatePanBounds,
    fontFamily,
    fontSize,
    inkColor,
    wordsPerPage,
    text // explicit dependency on text
  ]);

  /**
   * Handle container resize with responsive recalculation
   * Requirements: 5.5 - Canvas scaling on resize
   */
  const handleResize = useCallback(() => {
    // Recalculate responsive dimensions first
    recalculate();

    // Debounce canvas re-rendering
    const timeoutId = setTimeout(() => {
      renderCanvas();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [renderCanvas, recalculate]);

  // Update container styles when dimensions change (Requirements: 5.1, 5.2, 5.3)
  useEffect(() => {
    updateContainerStyles(dimensions);
  }, [dimensions, updateContainerStyles]);

  // Debounced rendering to avoid too many renders while typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      renderCanvas();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [renderCanvas]);

  // Update pan bounds whenever responsive dimensions update
  useEffect(() => {
    updatePanBounds();
  }, [dimensions, updatePanBounds]);

  // Enable touch-friendly panning for mobile and tablet devices
  useEffect(() => {
    const viewportNode = canvasViewportRef.current;
    const canvasNode = canvasRef.current;

    if (!viewportNode || !canvasNode) {
      return;
    }

    const state = panStateRef.current;

    updatePanBounds();

    const handlePointerDown = (event: PointerEvent) => {
      if (!(dimensions.isMobile || dimensions.isTablet)) {
        return;
      }

      if (!state.canDrag) {
        return;
      }

      state.isDragging = true;
      state.pointerId = event.pointerId;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.baseX = state.currentX;
      state.baseY = state.currentY;
      canvasNode.style.cursor = 'grabbing';

      try {
        viewportNode.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some browsers (e.g., older Safari) may not support pointer capture
      }

      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!state.isDragging || state.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;
      const nextX = clamp(state.baseX + deltaX, state.minX, state.maxX);
      const nextY = clamp(state.baseY + deltaY, state.minY, state.maxY);

      if (nextX === state.currentX && nextY === state.currentY) {
        return;
      }

      state.currentX = nextX;
      state.currentY = nextY;
      canvasNode.style.transform = `translate(${nextX}px, ${nextY}px)`;
      event.preventDefault();
    };

    const endPointerInteraction = (event: PointerEvent) => {
      if (state.pointerId !== event.pointerId) {
        return;
      }

      state.isDragging = false;
      state.pointerId = null;
      state.baseX = state.currentX;
      state.baseY = state.currentY;
      canvasNode.style.cursor = state.canDrag ? 'grab' : 'default';

      if (viewportNode.releasePointerCapture) {
        try {
          viewportNode.releasePointerCapture(event.pointerId);
        } catch (error) {
          // Ignore release errors (pointer might not be captured)
        }
      }
    };

    viewportNode.addEventListener('pointerdown', handlePointerDown, { passive: false });
    viewportNode.addEventListener('pointermove', handlePointerMove, { passive: false });
    viewportNode.addEventListener('pointerup', endPointerInteraction);
    viewportNode.addEventListener('pointercancel', endPointerInteraction);
    viewportNode.addEventListener('pointerleave', endPointerInteraction);
    window.addEventListener('pointerup', endPointerInteraction);
    window.addEventListener('pointercancel', endPointerInteraction);

    return () => {
      viewportNode.removeEventListener('pointerdown', handlePointerDown);
      viewportNode.removeEventListener('pointermove', handlePointerMove);
      viewportNode.removeEventListener('pointerup', endPointerInteraction);
      viewportNode.removeEventListener('pointercancel', endPointerInteraction);
      viewportNode.removeEventListener('pointerleave', endPointerInteraction);
      window.removeEventListener('pointerup', endPointerInteraction);
      window.removeEventListener('pointercancel', endPointerInteraction);
    };
  }, [dimensions.isMobile, dimensions.isTablet, updatePanBounds]);

  // Handle window resize and orientation changes (Requirements: 5.5)
  useEffect(() => {
    const cleanup = handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      cleanup();
    };
  }, [handleResize]);

  // Cleanup canvas on unmount and abort progressive rendering
  useEffect(() => {
    return () => {
      // Abort any ongoing progressive rendering
      renderAbortRef.current = true;

      // Cleanup canvas
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, []);

  const copyToClipboard = async (value: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch (copyError) {
      console.warn('Failed to copy canvas error details:', copyError);
      return false;
    }
  };

  const handleContactSupport = async () => {
    const summary = errorDetails ?? 'Canvas error occurred without additional diagnostic information.';
    const copied = await copyToClipboard(summary);
    if (copied) {
      setSupportCopied(true);
      setTimeout(() => setSupportCopied(false), 2500);
    }

    const emailSubject = encodeURIComponent('Canvas failed to load');
    const emailBody = encodeURIComponent(
      `Hi txttohandwriting team,%0D%0A%0D%0AMy canvas failed to load while using txttohandwriting.org.%0D%0AThe error details have been copied to my clipboard:%0D%0A%0D%0A${summary}%0D%0A%0D%0AAdditional notes:%0D%0A`
    );

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${emailSubject}&body=${emailBody}`;
  };

  const overlayContent = renderError ? (
    <div className="absolute inset-0 flex items-center justify-center px-4">
      <div className={`text-center max-w-md pointer-events-auto ${dimensions.isMobile ? 'p-4' : 'p-6'
        } bg-[var(--surface-color)]/95 rounded-xl shadow-lg`}
      >
        <div className="text-red-500 mb-4">
          <svg className={`mx-auto ${dimensions.isMobile ? 'w-8 h-8' : 'w-12 h-12'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className={`text-[var(--text-color)] font-semibold mb-2 ${dimensions.isMobile ? 'text-sm' : 'text-base'
          }`}>
          Canvas Failed to Load
        </h3>
        <p className={`text-[var(--text-muted)] mb-4 leading-relaxed ${dimensions.isMobile ? 'text-xs' : 'text-sm'
          }`}>
          {renderError}
        </p>
        <div className={`flex flex-col gap-2 ${dimensions.isMobile ? '' : 'sm:flex-row sm:justify-center sm:gap-3'}`}>
          <button
            onClick={renderCanvas}
            className={`rounded-lg font-medium border border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-colors ${dimensions.isMobile ? 'px-3 py-2 text-xs min-h-[40px]' : 'px-4 py-2 text-sm'
              }`}
            style={{ minHeight: dimensions.isMobile ? '40px' : 'auto' }}
          >
            Try Again
          </button>
          <button
            onClick={handleContactSupport}
            className={`rounded-lg font-medium bg-[var(--accent-color)] text-[#1f1a13] hover:bg-[var(--accent-color-hover)] transition-colors ${dimensions.isMobile ? 'px-3 py-2 text-xs min-h-[40px]' : 'px-4 py-2 text-sm'
              }`}
            style={{ minHeight: dimensions.isMobile ? '40px' : 'auto' }}
          >
            Contact Support
          </button>
        </div>
        {supportCopied && (
          <p className={`mt-3 text-[var(--text-muted)] ${dimensions.isMobile ? 'text-[11px]' : 'text-xs'}`}>
            Error details copied to clipboard. Paste them into the email so we can debug faster.
          </p>
        )}
      </div>
    </div>
  ) : isRendering ? (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 min-h-[400px]">
        <RoseSpinner
          size={dimensions.isMobile ? 40 : 56}
          announce={false}
          label="Rendering handwriting"
        />
        <span className={`text-[var(--text-muted)] ${dimensions.isMobile ? 'text-xs' : 'text-sm'
          }`}>
          {isProgressiveRendering && renderProgress > 0
            ? `Rendering handwriting... ${renderProgress}%`
            : 'Rendering handwriting...'}
        </span>

      </div>
    </div>
  ) : null;

  // Canvas container with optional overlay content (spinner or error)
  return (
    <div
      className={`canvas-output ${className}`}
      ref={containerRef}
      style={{
        ...containerStyles,
        minHeight: dimensions.isMobile ? `${dimensions.height}px` : '700px'
      }}
    >
      <div
        ref={canvasViewportRef}
        className="canvas-output__viewport"
        style={{
          width: '100%',
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: dimensions.isMobile || dimensions.isTablet ? 'hidden' : 'visible',
          touchAction: dimensions.isMobile || dimensions.isTablet ? 'none' : 'auto',
          minHeight: '100%'
        }}
      />
      {overlayContent}
    </div>
  );
};

export default CanvasOutput;
