// Utility functions for canvas rendering
// Requirements: 2.1, 2.2, 2.3, 2.4, 8.1, 8.3

import { RenderingConfig, RenderingContext, PaperTemplate, PaperTexture, IPaperTextureManager } from '../types';

/**
 * Get default paper template when none is specified
 */
export function getDefaultPaperTemplate(): PaperTemplate {
  return {
    id: 'blank-1',
    name: 'Default Blank',
    filename: 'blank-1.jpeg',
    type: 'blank'
  };
}

/**
 * Load texture with retry mechanism
 * Requirements: 6.5 - Add retry mechanisms for network-related template loading failures
 */
export async function loadTextureWithRetry(
  textureManager: IPaperTextureManager,
  paperTemplate: PaperTemplate,
  maxRetries: number = 2
): Promise<PaperTexture> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await textureManager.loadTexture(paperTemplate);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Texture load attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Texture loading failed after retries');
}

/**
 * Render paper background with proper scaling and texture integration
 * Requirements: 2.4, 2.5, 2.7 (paper texture rendering and scaling)
 */
export async function renderPaperBackground(
  context: RenderingContext,
  config: RenderingConfig
): Promise<void> {
  const { ctx, paperTexture } = context;

  if (!paperTexture.isLoaded || !paperTexture.baseImage) {
    // Fallback to white background if texture not available
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    return;
  }

  // Calculate scaling to fit canvas while maintaining aspect ratio
  const baseWidth = paperTexture.baseImage.naturalWidth || paperTexture.baseImage.width;
  const baseHeight = paperTexture.baseImage.naturalHeight || paperTexture.baseImage.height;
  const scaleX = config.canvasWidth / baseWidth;
  const scaleY = config.canvasHeight / baseHeight;
  const scale = Math.max(scaleX, scaleY); // Cover the entire canvas

  // Calculate centered position
  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;
  const offsetX = (config.canvasWidth - scaledWidth) / 2;
  const offsetY = (config.canvasHeight - scaledHeight) / 2;

  // Render base paper texture (background always uses source-over)
  ctx.drawImage(
    paperTexture.baseImage,
    offsetX,
    offsetY,
    scaledWidth,
    scaledHeight
  );

  // Render lines overlay if available (for lined paper templates)
  if (paperTexture.linesImage) {
    const linesWidth = paperTexture.linesImage.naturalWidth || paperTexture.linesImage.width;
    const linesHeight = paperTexture.linesImage.naturalHeight || paperTexture.linesImage.height;
    const linesScale = Math.max(config.canvasWidth / linesWidth, config.canvasHeight / linesHeight);
    const linesDrawWidth = linesWidth * linesScale;
    const linesDrawHeight = linesHeight * linesScale;
    const linesOffsetX = (config.canvasWidth - linesDrawWidth) / 2;
    const linesOffsetY = (config.canvasHeight - linesDrawHeight) / 2;
    ctx.drawImage(
      paperTexture.linesImage,
      linesOffsetX,
      linesOffsetY,
      linesDrawWidth,
      linesDrawHeight
    );
  }
}

/**
 * Apply low quality paper degradation effects
 */
export function applyLowQualityPaperDegradation(context: RenderingContext): void {
  const { canvas, ctx } = context;

  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = Math.ceil(canvas.width / 2);
  grainCanvas.height = Math.ceil(canvas.height / 2);
  const grainCtx = grainCanvas.getContext('2d');
  if (grainCtx) {
    const imageData = grainCtx.createImageData(grainCanvas.width, grainCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.floor(Math.random() * 60);
      imageData.data[i] = 110 + noise;
      imageData.data[i + 1] = 105 + noise;
      imageData.data[i + 2] = 95 + noise;
      imageData.data[i + 3] = 60 + Math.random() * 90;
    }
    grainCtx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.18;
    ctx.drawImage(grainCanvas, 0, 0, grainCanvas.width, grainCanvas.height, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  const streakCanvas = document.createElement('canvas');
  streakCanvas.width = canvas.width;
  streakCanvas.height = canvas.height;
  const streakCtx = streakCanvas.getContext('2d');
  if (streakCtx) {
    const bandWidth = Math.max(12, Math.floor(canvas.width / 18));
    streakCtx.fillStyle = '#000000';
    streakCtx.globalAlpha = 0.08;
    for (let x = 0; x < canvas.width; x += bandWidth * 2) {
      streakCtx.fillRect(x, 0, bandWidth, canvas.height);
    }

    streakCtx.globalAlpha = 0.05;
    streakCtx.fillStyle = '#d4c5a4';
    streakCtx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.16;
    ctx.drawImage(streakCanvas, 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = 'rgba(214, 196, 166, 1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = 'rgba(58, 50, 42, 1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = 'rgba(252, 246, 232, 1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/**
 * Apply medium texture softening effects
 */
export function applyMediumTextureSoftening(context: RenderingContext): void {
  const { canvas, ctx } = context;

  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = Math.ceil(canvas.width / 3);
  grainCanvas.height = Math.ceil(canvas.height / 3);
  const grainCtx = grainCanvas.getContext('2d');
  if (grainCtx) {
    const imageData = grainCtx.createImageData(grainCanvas.width, grainCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const n = Math.floor(Math.random() * 40);
      imageData.data[i] = 128 + n;
      imageData.data[i + 1] = 128 + n;
      imageData.data[i + 2] = 128 + n;
      imageData.data[i + 3] = 30 + Math.random() * 40;
    }
    grainCtx.putImageData(imageData, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.14;
    ctx.drawImage(grainCanvas, 0, 0, grainCanvas.width, grainCanvas.height, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = 'rgba(236, 226, 210, 1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = 'rgba(250, 244, 230, 1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
}

/**
 * Apply ultra realism effects for highest levels of analog simulation
 */
export function applyUltraRealismEffects(context: RenderingContext, intensity: 1 | 2): void {
  const { canvas, ctx } = context;

  // High intensity grain / analog noise
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = Math.ceil(canvas.width / 1.5);
  grainCanvas.height = Math.ceil(canvas.height / 1.5);
  const grainCtx = grainCanvas.getContext('2d');
  if (grainCtx) {
    const imageData = grainCtx.createImageData(grainCanvas.width, grainCanvas.height);
    const noiseRange = intensity === 1 ? 110 : 85;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.floor(Math.random() * noiseRange);
      imageData.data[i] = 100 + noise;
      imageData.data[i + 1] = 95 + noise;
      imageData.data[i + 2] = 85 + noise;
      imageData.data[i + 3] = intensity === 1 ? 100 + Math.random() * 110 : 80 + Math.random() * 90;
    }
    grainCtx.putImageData(imageData, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = intensity === 1 ? 0.42 : 0.28;
    ctx.drawImage(grainCanvas, 0, 0, grainCanvas.width, grainCanvas.height, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (intensity === 1) {
      // Deeper "dirt" layer for Level 1
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#4a4030';
      ctx.drawImage(grainCanvas, 0, 0, grainCanvas.width, grainCanvas.height, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  // Add subtle analog softening / bleeding for Level 1
  if (intensity === 1) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.filter = 'blur(0.8px) brightness(1.04) contrast(0.96)';
    ctx.drawImage(canvas, 1, 1);
    ctx.restore();
  }
}

/**
 * Apply global tone down effects
 */
export function applyGlobalToneDown(context: RenderingContext, config: RenderingConfig): void {
  const { canvas, ctx } = context;
  const level = config.distortionLevel ?? 5; // Default to lowest (5)

  let multiplyAlpha = 0.025;
  let overlayAlpha = 0.015;
  let highlightAlpha = 0.016;

  switch (level) {
    case 1:
      multiplyAlpha = 0.12;
      overlayAlpha = 0.06;
      highlightAlpha = 0.055;
      break;
    case 2:
      multiplyAlpha = 0.075;
      overlayAlpha = 0.04;
      highlightAlpha = 0.045;
      break;
    case 3:
      multiplyAlpha = 0.05;
      overlayAlpha = 0.02;
      highlightAlpha = 0.03;
      break;
    case 4:
      multiplyAlpha = 0.035;
      overlayAlpha = 0.015;
      highlightAlpha = 0.022;
      break;
    case 5:
    default:
      multiplyAlpha = 0.025;
      overlayAlpha = 0.01;
      highlightAlpha = 0.016;
      break;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = multiplyAlpha;
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

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

/**
 * Get maximum supported canvas size
 */
export function getMaxCanvasSize(): { width: number; height: number } {
  // Test maximum canvas size supported by browser
  const testCanvas = document.createElement('canvas');
  const maxSize = 16384; // Common browser limit

  try {
    testCanvas.width = maxSize;
    testCanvas.height = maxSize;
    const ctx = testCanvas.getContext('2d');

    if (ctx) {
      return { width: maxSize, height: maxSize };
    }
  } catch {
    // Fallback to smaller size
  }

  return { width: 8192, height: 8192 };
}

/**
 * Get supported blend modes
 */
export function getSupportedBlendModes(): string[] {
  return [
    'source-over',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion'
  ];
}
