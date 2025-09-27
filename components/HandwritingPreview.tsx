import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IPaperTextureManager, PaperTemplate, PaperTexture } from '../types/core';
import { preloadTemplateImage } from '../services/paperTemplateUtils';
import { globalErrorHandler } from '../services/errorHandler';
import { 
  responsiveCanvasManager, 
  CanvasScalingConfig,
  CanvasRenderingMetrics
} from '../services/responsiveCanvasManager';
import { 
  canvasFallbackSystem,
  FallbackRenderingOptions 
} from '../services/canvasFallbackSystem';
import { RoseSpinner } from './Spinner';
import { computeHandwritingLayoutMetrics } from '../services/layoutMetrics';
import { SUPPORT_EMAIL } from './SupportCTA';

interface DistortionProfileProps {
  baselineJitterRange: number;
  slantJitterRange: number;
  colorVariationIntensity: number;
  microTiltRange: number;
}

interface CanvasMessageConfig {
  message: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  position: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
}

interface HandwritingPreviewProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  inkColor: string;
  resolvedInkColor: string;
  paperTemplate: PaperTemplate | null;
  textureManager: IPaperTextureManager | null;
  isTemplateLoading?: boolean;
  distortionProfile: DistortionProfileProps;
  distortionLevel: number;
  className?: string;
  refreshToken?: number;
}

const HandwritingPreview: React.FC<HandwritingPreviewProps> = ({
  text,
  fontFamily,
  fontSize,
  inkColor,
  resolvedInkColor,
  paperTemplate,
  textureManager,
  distortionProfile,
  distortionLevel,
  isTemplateLoading = false,
  className = '',
  refreshToken
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderErrorDetails, setRenderErrorDetails] = useState<string | null>(null);
  const [supportCopied, setSupportCopied] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textureCacheRef = useRef<Record<string, PaperTexture>>({});
  const [, setCanvasMetrics] = useState<CanvasRenderingMetrics | null>(null);
  const refreshTokenInitializedRef = useRef(false);
  
  // Template selection state detection
  const [showTemplateMessage, setShowTemplateMessage] = useState(false);
  const templateMessageConfig: CanvasMessageConfig = {
    message: 'Pick a paper vibe to see your handwriting here.',
    fontSize: 20,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#6c625d',
    position: {
      horizontal: 'center',
      vertical: 'center'
    }
  };

  const USER_FRIENDLY_CANVAS_ERROR = 'Your canvas failed to load and we\'re actively working on fixing it.';

  const composeErrorDetails = (message: string, error?: unknown): string => {
    const timestamp = new Date().toISOString();
    const location = typeof window !== 'undefined' ? window.location.href : 'unknown environment';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown user agent';
    const lines = [
      `Message: ${message}`,
      `Timestamp: ${timestamp}`,
      `URL: ${location}`,
      `User Agent: ${userAgent}`,
      `Selected template: ${paperTemplate?.id ?? 'none'}`,
      `Font family: ${fontFamily}`,
      `Font size: ${fontSize}`,
      `Ink color: ${inkColor}`,
      `Realism level: ${distortionLevel}`
    ];

    if (error instanceof Error) {
      lines.push(`Error message: ${error.message}`);
      if (error.stack) {
        lines.push(`Stack trace: ${error.stack}`);
      }
    } else if (typeof error !== 'undefined') {
      lines.push(`Error details: ${String(error)}`);
    }

    return lines.join('\n');
  };

  const updateRenderErrorState = (message: string, error?: unknown): void => {
    setRenderError(message);
    setRenderErrorDetails(composeErrorDetails(message, error));
    setSupportCopied(false);
  };

  useEffect(() => {
    if (!paperTemplate) {
      textureCacheRef.current = {};
      return;
    }
    const cache = textureCacheRef.current;
    Object.keys(cache).forEach(key => {
      if (key !== paperTemplate.id) {
        delete cache[key];
      }
    });
  }, [paperTemplate?.id]);

  // Template selection state detection effect
  useEffect(() => {
    const hasTemplate = paperTemplate !== null && paperTemplate !== undefined;
    setShowTemplateMessage(!hasTemplate);
  }, [paperTemplate]);

  // Debug logging removed for production

  const getCssColor = (variable: string, fallback: string): string => {
    if (typeof window === 'undefined') {
      return fallback;
    }
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
    return value ? value.trim() : fallback;
  };

  // Initialize responsive canvas on mount
  useEffect(() => {
    initializeResponsiveCanvas();
    
    return () => {
      setTimeout(() => {
        cleanupCanvas();
      }, 100); // 100ms delay
    };
  }, []);

  // Debounced rendering to avoid too many renders while typing
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      renderPreview();
    }, 300); // 300ms debounce

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [text, fontFamily, fontSize, inkColor, resolvedInkColor, paperTemplate, distortionProfile, distortionLevel]);

  useEffect(() => {
    if (refreshToken === undefined) {
      return;
    }
    if (!refreshTokenInitializedRef.current) {
      refreshTokenInitializedRef.current = true;
      return;
    }
    renderPreview();
  }, [refreshToken]);

  /**
   * Initialize responsive canvas system with fallback support
   * Requirements: 8.1, 8.2, 8.4 - Canvas initialization, resizing, and fallback handling
   */
  const initializeResponsiveCanvas = useCallback(() => {
    if (!canvasHostRef.current || !containerRef.current) {
      return;
    }

    try {
      // Validate canvas support first
      const canvasSupported = canvasFallbackSystem.validateCanvasSupport();
      
      if (!canvasSupported) {
        console.warn('Canvas not supported, using fallback mode');
        const supportError = new Error('Canvas support validation failed; switching to fallback mode');
        globalErrorHandler.handleError(supportError, 'handwriting-preview-compatibility', 'medium');
        updateRenderErrorState(USER_FRIENDLY_CANVAS_ERROR, supportError);
      }

      // Canvas scaling configuration for preview
      const scalingConfig: CanvasScalingConfig = {
        maintainAspectRatio: true,
        fillContainer: true,
        scalingFactor: 1.0,
        maxWidth: 1200,
        maxHeight: 800,
        minWidth: 300,
        minHeight: 200
      };

      // Create responsive canvas if it doesn't exist
      if (!canvasRef.current) {
        // Clear any existing canvas nodes in the host first
        if (canvasHostRef.current) {
          Array.from(canvasHostRef.current.childNodes).forEach(node => {
            if (node instanceof HTMLCanvasElement) {
              canvasHostRef.current?.removeChild(node);
            }
          });
        }

        // Try responsive canvas manager first
        let canvas: HTMLCanvasElement;
        try {
          if (!canvasHostRef.current) {
            throw new Error('Canvas host unavailable');
          }
          canvas = responsiveCanvasManager.initializeCanvas(canvasHostRef.current, scalingConfig);
          canvasRef.current = canvas;
        } catch (error) {
          console.warn('Responsive canvas failed, creating simple canvas:', error);
          // Fallback to simple canvas creation
          canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = 400;
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.display = 'block';
          canvas.style.border = '1px solid #e5e7eb';
          canvas.style.borderRadius = '8px';
          canvas.style.backgroundColor = '#ffffff';
          
          // Draw initial content
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Canvas Ready - Simple Mode', canvas.width / 2, canvas.height / 2);
          }
          
          canvasHostRef.current?.appendChild(canvas);
          canvasRef.current = canvas;
        }
        
        // Get initial metrics
        if (canvas) {
          const metrics = responsiveCanvasManager.getCanvasMetrics(canvas);
          setCanvasMetrics(metrics);
          
          // Setup resize observer for automatic resizing
          if (!resizeObserverRef.current) {
            resizeObserverRef.current = responsiveCanvasManager.setupResizeObserver(
              canvas,
              containerRef.current,
              scalingConfig
            );
          }
        }
        
        // Trigger initial render
        setTimeout(() => {
          renderPreview();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to initialize responsive canvas:', error);
      
      // Attempt recovery with fallback system
      recoverFromCanvasError(error as Error);
    }
  }, []);

  /**
   * Recover from canvas errors using fallback system
   * Requirements: 8.4 - Error recovery for canvas rendering problems
   */
  const recoverFromCanvasError = useCallback(async (error: Error) => {
    if (!canvasHostRef.current && !containerRef.current) return;

    try {
      const recoveryResult = await canvasFallbackSystem.recoverFromCanvasError(
        error,
        canvasHostRef.current ?? containerRef.current
      );

      if (recoveryResult.success && recoveryResult.canvas) {
        canvasRef.current = recoveryResult.canvas;
        if (canvasHostRef.current && !canvasHostRef.current.contains(recoveryResult.canvas)) {
          canvasHostRef.current.appendChild(recoveryResult.canvas);
        }
        const fallbackError = new Error(`Fallback mode active (${recoveryResult.recoveryMethod})`);
        globalErrorHandler.handleError(fallbackError, 'handwriting-preview-recovery', 'medium');
        updateRenderErrorState(
          USER_FRIENDLY_CANVAS_ERROR,
          fallbackError
        );
        
        // Apply fallback rendering
        const fallbackOptions: FallbackRenderingOptions = {
          useBasicRendering: true,
          disableAdvancedFeatures: true,
          reduceQuality: true,
          simplifyContent: true
        };
        
        canvasFallbackSystem.applyFallbackRendering(recoveryResult.canvas, fallbackOptions);
      } else {
        const recoveryFailure = new Error('Canvas recovery failed - please refresh the page');
        globalErrorHandler.handleError(recoveryFailure, 'handwriting-preview-recovery-failed', 'medium');
        updateRenderErrorState(
          USER_FRIENDLY_CANVAS_ERROR,
          recoveryFailure
        );
      }
    } catch (recoveryError) {
      console.error('Canvas recovery failed:', recoveryError);
      const errorObject = recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError));
      globalErrorHandler.handleError(errorObject, 'handwriting-preview-recovery-exception', 'medium');
      updateRenderErrorState(USER_FRIENDLY_CANVAS_ERROR, errorObject);
    }
  }, []);

  /**
   * Cleanup canvas resources
   */
  const cleanupCanvas = useCallback(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    
    if (canvasHostRef.current && canvasRef.current && canvasHostRef.current.contains(canvasRef.current)) {
      canvasHostRef.current.removeChild(canvasRef.current);
    }

    // Clear the canvas reference
    canvasRef.current = null;
  }, []);

  const renderPreview = async () => {
    if (!canvasHostRef.current) {
      return;
    }

    if (!canvasRef.current) {
      const existingCanvas = canvasHostRef.current.querySelector('canvas');
      if (existingCanvas instanceof HTMLCanvasElement) {
        canvasRef.current = existingCanvas;
      } else {
        initializeResponsiveCanvas();
        return;
      }
    }

    if (!canvasRef.current) {
      return;
    }

    // Always render fallback if services aren't available
    setIsRendering(true);
    setRenderError(null);
    setRenderErrorDetails(null);
    setSupportCopied(false);

    try {
      if (!canvasRef.current) {
        throw new Error('Canvas not available');
      }

      const metrics = responsiveCanvasManager.getCanvasMetrics(canvasRef.current);
      if (!metrics) {
        throw new Error('Failed to get canvas metrics');
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No canvas context available');
      }

      await renderAuthenticPreview(ctx, metrics);
    } catch (error) {
      console.error('Handwriting preview rendering failed:', error);
      const errorObject = error instanceof Error ? error : new Error(String(error));
      globalErrorHandler.handleError(errorObject, 'handwriting-preview-render', 'medium', {
        templateId: paperTemplate?.id,
        fontFamily,
        fontSize,
        inkColor,
        distortionLevel
      });
      updateRenderErrorState(USER_FRIENDLY_CANVAS_ERROR, errorObject);
      renderFallbackPreview();
    } finally {
      setIsRendering(false);
    }
  };

  const renderAuthenticPreview = async (
    ctx: CanvasRenderingContext2D,
    metrics: ReturnType<typeof responsiveCanvasManager.getCanvasMetrics>
  ) => {
    if (!metrics || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (paperTemplate) {
      const texture = await getPaperTexture(paperTemplate);
      if (texture?.baseImage) {
        drawPaperTexture(ctx, canvas.width, canvas.height, texture);
      } else {
        drawFlatPaper(ctx, canvas.width, canvas.height, paperTemplate);
      }
    } else {
      drawFlatPaper(ctx, canvas.width, canvas.height, paperTemplate);
    }

    // Show template selection message if no template is selected
    if (showTemplateMessage) {
      renderCanvasMessage(ctx, templateMessageConfig);
      ctx.restore();
      return;
    }

    ctx.globalCompositeOperation = 'multiply';

    const responsiveFontSize = Math.max(12, Math.min(fontSize, canvas.width * 0.04));
    ctx.font = `${responsiveFontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const layout = computeHandwritingLayoutMetrics({
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      fontSize: responsiveFontSize,
      baselineJitterRange: distortionProfile.baselineJitterRange,
      distortionLevel
    });

    const wrappedLines = wrapText(
      ctx,
      text || 'Start typing to see your handwriting preview...',
      canvas.width - layout.sideMargin * 2
    );

    renderHandwrittenLines(ctx, wrappedLines, layout, responsiveFontSize);

    const realismLevel = distortionLevel ?? 2;
    const darkAlpha = realismLevel === 1 ? 0.05 : realismLevel === 2 ? 0.035 : 0.025;
    const overlayAlpha = realismLevel === 1 ? 0.02 : 0.015;
    const highlightAlpha = realismLevel === 1 ? 0.03 : realismLevel === 2 ? 0.022 : 0.016;

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = darkAlpha;
    ctx.fillStyle = 'rgba(86, 78, 70, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = overlayAlpha;
    ctx.fillStyle = 'rgba(218, 204, 184, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = highlightAlpha;
    ctx.fillStyle = 'rgba(254, 250, 240, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.restore();
  };

  const getPaperTexture = async (template: PaperTemplate): Promise<PaperTexture | null> => {
    const cacheKey = template.id;
    if (textureCacheRef.current[cacheKey]) {
      return textureCacheRef.current[cacheKey];
    }

    let texture: PaperTexture | null = null;

    try {
      const baseImage = await preloadTemplateImage(template.filename, false);
      texture = {
        baseImage,
        isLoaded: true
      } as PaperTexture;
    } catch (error) {
      console.warn('Failed to load paper texture for preview:', error);
      texture = null;
    }

    if (texture) {
      textureCacheRef.current[cacheKey] = texture;
    }

    return texture;
  };

  const drawPaperTexture = (
    ctx: CanvasRenderingContext2D,
    targetWidth: number,
    targetHeight: number,
    texture: PaperTexture
  ) => {
    const baseImage = texture.baseImage;
    const sourceWidth = baseImage.naturalWidth || baseImage.width;
    const sourceHeight = baseImage.naturalHeight || baseImage.height;
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = (targetWidth - drawWidth) / 2;
    const offsetY = (targetHeight - drawHeight) / 2;

    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(baseImage, offsetX, offsetY, drawWidth, drawHeight);

    if (texture.linesImage) {
      const linesWidth = texture.linesImage.naturalWidth || texture.linesImage.width;
      const linesHeight = texture.linesImage.naturalHeight || texture.linesImage.height;
      const linesScale = Math.max(targetWidth / linesWidth, targetHeight / linesHeight);
      const linesDrawWidth = linesWidth * linesScale;
      const linesDrawHeight = linesHeight * linesScale;
      const linesOffsetX = (targetWidth - linesDrawWidth) / 2;
      const linesOffsetY = (targetHeight - linesDrawHeight) / 2;
      ctx.drawImage(texture.linesImage, linesOffsetX, linesOffsetY, linesDrawWidth, linesDrawHeight);
    }

    ctx.globalCompositeOperation = 'multiply';
  };

  const drawFlatPaper = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    template: PaperTemplate | null
  ) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = getCssColor('--paper-bg', '#f7f0d4');
    ctx.fillRect(0, 0, width, height);

    if (template?.type === 'lined') {
      ctx.strokeStyle = getCssColor('--paper-line-color', '#d6c6a8');
      ctx.lineWidth = 1;
      const spacing = Math.max(26, height * 0.06);
      for (let y = 40; y < height - 20; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(24, y);
        ctx.lineTo(width - 24, y);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'multiply';
  };

  const renderHandwrittenLines = (
    ctx: CanvasRenderingContext2D,
    lines: string[],
    layout: ReturnType<typeof computeHandwritingLayoutMetrics>,
    fontSizePx: number
  ) => {
    let currentY = layout.topMargin;
    const maxY = canvasRef.current ? canvasRef.current.height - layout.bottomMargin : 0;

    lines.forEach((line, lineIndex) => {
      if (currentY > maxY) {
        return;
      }

      renderHandwrittenLine(ctx, line, lineIndex, currentY, layout, fontSizePx);
      currentY += layout.lineSpacing;
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  };

  const renderHandwrittenLine = (
    ctx: CanvasRenderingContext2D,
    line: string,
    lineIndex: number,
    baselineY: number,
    layout: ReturnType<typeof computeHandwritingLayoutMetrics>,
    fontSizePx: number
  ) => {
    let currentX = layout.sideMargin;
    const spaceWidth = ctx.measureText(' ').width * 0.9;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const seed = generateSeed(lineIndex, i, char);

      if (char === ' ') {
        currentX += spaceWidth * (0.9 + random(seed + 6) * 0.2);
        continue;
      }

      const jitterX = (random(seed) - 0.5) * distortionProfile.baselineJitterRange * fontSizePx * 0.5;
      const jitterY = (random(seed + 1) - 0.5) * distortionProfile.baselineJitterRange * fontSizePx * 0.45;
      const slant = (random(seed + 2) - 0.5) * distortionProfile.slantJitterRange * 0.08;
      const microTilt = (random(seed + 3) - 0.5) * distortionProfile.microTiltRange * 0.12;
      const colorDrift = (random(seed + 4) - 0.5) * distortionProfile.colorVariationIntensity * 0.6;

      ctx.save();
      ctx.globalAlpha = 0.86 + (random(seed + 8) - 0.5) * 0.12;
      ctx.translate(currentX + jitterX, baselineY + jitterY);
      ctx.rotate(slant + microTilt);
      ctx.fillStyle = shiftInkTone(resolvedInkColor, colorDrift);
      ctx.fillText(char, 0, 0);
      ctx.restore();

      const glyphWidth = ctx.measureText(char).width;
      const advance = glyphWidth * (1 + (random(seed + 5) - 0.5) * distortionProfile.microTiltRange * 0.25);
      currentX += Math.max(glyphWidth * 0.85, advance);
    }
  };

  const generateSeed = (lineIndex: number, charIndex: number, char: string) => {
    const charCode = char.charCodeAt(0) || 0;
    return (lineIndex + 1) * 131 + (charIndex + 1) * 379 + charCode * 17;
  };

  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const shiftInkTone = (hex: string, delta: number) => {
    const { r, g, b } = hexToRgb(hex);
    const factor = 1 + delta;
    const adjusted = {
      r: clampColorChannel(r * factor),
      g: clampColorChannel(g * factor * (0.98 + random(factor) * 0.04)),
      b: clampColorChannel(b * (1 + delta * 0.85))
    };
    return rgbToHex(adjusted.r, adjusted.g, adjusted.b);
  };

  const hexToRgb = (hex: string) => {
    let normalized = hex.replace('#', '');
    if (normalized.length === 3) {
      normalized = normalized.split('').map(ch => ch + ch).join('');
    }
    const value = parseInt(normalized, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
  };

  const clampColorChannel = (value: number) => {
    return Math.max(0, Math.min(255, Math.round(value)));
  };

  const renderFallbackPreview = () => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Get current canvas dimensions (responsive)
    const canvasWidth = Math.max(canvas.width / (window.devicePixelRatio || 1), 300);
    const canvasHeight = Math.max(canvas.height / (window.devicePixelRatio || 1), 200);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paper background
    ctx.fillStyle = getCssColor('--paper-bg', '#f7f0d4');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lined paper if needed
    if (paperTemplate?.type === 'lined') {
      ctx.strokeStyle = getCssColor('--paper-line-color', '#d6c6a8');
      ctx.lineWidth = 1;
      const lineSpacing = Math.max(25, canvasHeight * 0.06); // Responsive line spacing
      for (let y = 40; y < canvas.height - 20; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.stroke();
      }
    }

    // Show template selection message if no template is selected
    if (showTemplateMessage) {
      renderCanvasMessage(ctx, templateMessageConfig);
      return;
    }

    // Show message if services aren't available
    // Draw text with basic styling
    ctx.fillStyle = resolvedInkColor;
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.88;
    if (distortionLevel === 1) {
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 1.3;
      if (ctx.filter !== undefined) {
        ctx.filter = 'saturate(1.06) contrast(1.05)';
      }
    } else if (distortionLevel === 2) {
      ctx.shadowColor = 'rgba(0,0,0,0.09)';
      ctx.shadowBlur = 1.0;
      if (ctx.filter !== undefined) {
        ctx.filter = 'saturate(1.03) contrast(1.02)';
      }
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.06)';
      ctx.shadowBlur = 0.7;
      if (ctx.filter !== undefined) {
        ctx.filter = 'contrast(0.95) saturate(0.9)';
      }
    }
    
    const responsiveFontSize = Math.max(12, Math.min(fontSize, canvasWidth * 0.04));
    ctx.font = `${responsiveFontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Split text into lines and draw with responsive sizing
    const metrics = computeHandwritingLayoutMetrics({
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      fontSize: responsiveFontSize,
      baselineJitterRange: distortionProfile.baselineJitterRange,
      distortionLevel
    });

    const maxWidth = Math.max(160, canvas.width - metrics.sideMargin * 2);
    const lineHeight = metrics.lineSpacing;
    const lines = wrapText(ctx, text || 'Start typing to see your handwriting preview...', maxWidth);

    let y = metrics.topMargin;
    for (const line of lines) {
      if (y > canvas.height - metrics.bottomMargin) break;
      ctx.fillText(line, metrics.sideMargin, y);
      y += lineHeight;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    if (ctx.filter !== undefined) {
      ctx.filter = 'none';
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = getCssColor('--paper-bg', '#f7f0d4');
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.filter = 'none';
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  };

  const copyErrorDetailsToClipboard = async (details: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(details);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = details;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch (error) {
      console.warn('Failed to copy preview error details:', error);
      return false;
    }
  };

  const handleContactSupport = async () => {
    const summary = renderErrorDetails ?? 'Handwriting preview error occurred.';
    const copied = await copyErrorDetailsToClipboard(summary);
    if (copied) {
      setSupportCopied(true);
      setTimeout(() => setSupportCopied(false), 2500);
    }

    const emailSubject = encodeURIComponent('Handwriting preview failed to load');
    const emailBody = encodeURIComponent(
      `Hi txttohandwriting team,%0D%0A%0D%0AMy handwriting preview failed to load.%0D%0AThe error report has been copied to my clipboard:%0D%0A%0D%0A${summary}%0D%0A%0D%0AAdditional notes:%0D%0A`
    );

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${emailSubject}&body=${emailBody}`;
  };

  const renderCanvasMessage = (ctx: CanvasRenderingContext2D, config: CanvasMessageConfig) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    ctx.save();
    
    const resolvedColor = getCssColor('--text-muted', config.color);

    // Set font and styling
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.fillStyle = resolvedColor;
    
    // Calculate responsive font size based on canvas dimensions
    const responsiveFontSize = Math.max(14, Math.min(config.fontSize, canvasWidth * 0.03));
    
    // Set up text styling
    ctx.save();
    ctx.font = `${responsiveFontSize}px ${config.fontFamily}`;
    ctx.fillStyle = resolvedColor;
    ctx.textAlign = config.position.horizontal;
    ctx.textBaseline = config.position.vertical === 'center' ? 'middle' : config.position.vertical;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.7;
    
    // Calculate position based on configuration
    let x: number;
    let y: number;
    
    switch (config.position.horizontal) {
      case 'left':
        x = canvasWidth * 0.1;
        break;
      case 'right':
        x = canvasWidth * 0.9;
        break;
      case 'center':
      default:
        x = canvasWidth / 2;
        break;
    }
    
    switch (config.position.vertical) {
      case 'top':
        y = canvasHeight * 0.1;
        break;
      case 'bottom':
        y = canvasHeight * 0.9;
        break;
      case 'center':
      default:
        y = canvasHeight / 2;
        break;
    }
    
    // Add subtle shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Render the message
    ctx.fillText(config.message, x, y);
    
    ctx.restore();
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const lines: string[] = [];
    const paragraphs = (text || '').split(/\r?\n/);

    for (let index = 0; index < paragraphs.length; index++) {
      const paragraph = paragraphs[index];

      if (paragraph.trim().length === 0) {
        lines.push('');
        continue;
      }

      const words = paragraph.split(/\s+/).filter(Boolean);
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full group ${className}`}
      style={{ 
        minHeight: '460px',
        maxHeight: '80vh',
        border: '1px solid var(--panel-border)',
        borderRadius: '12px',
        backgroundColor: 'var(--paper-bg)',
        backgroundImage: paperTemplate?.type === 'lined'
          ? 'linear-gradient(var(--paper-line-color) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '100% 48px',
        overflow: 'hidden'
      }}
    >
      <div className="w-full h-full" style={{ position: 'relative' }}>
        <div
          ref={canvasHostRef}
          className="w-full h-full"
          style={{ minHeight: '400px', height: '100%' }}
        />
      </div>

      {(isRendering || isTemplateLoading) && (
        <div className="absolute inset-0 bg-[var(--overlay-color)] flex items-center justify-center rounded-lg z-10">
          <div className="flex items-center gap-3 text-[var(--overlay-message-color)]">
            <RoseSpinner size={32} announce={false} label={isTemplateLoading ? 'Loading template' : 'Rendering preview'} />
            <span className="text-sm">{isTemplateLoading ? 'Loading template...' : 'Rendering preview...'}</span>
          </div>
        </div>
      )}

      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center px-4 z-20">
          <div className="w-full max-w-md rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)]/95 shadow-lg p-5 text-center">
            <div className="mx-auto mb-3 text-red-400">
              <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--text-color)] mb-2">Canvas Failed to Load</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
              {renderError}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3 mb-1">
              <button
                type="button"
                onClick={renderPreview}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-colors"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleContactSupport}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-[#1f1a13] transition-colors"
                style={{ backgroundColor: 'var(--accent-color)' }}
              >
                Contact Support
              </button>
            </div>
            {supportCopied && (
              <p className="text-xs text-[var(--text-muted)]">
                Error details copied. Paste them into the email so we can troubleshoot faster.
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Debug info for canvas metrics (development only) - Show on hover */}
    </div>
  );
};

export default HandwritingPreview;
