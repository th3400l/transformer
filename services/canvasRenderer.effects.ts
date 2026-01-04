// Text variation and effects rendering for canvas
// Requirements: 2.1, 2.2, 2.3, 2.4, 8.1, 8.3

import { RenderingConfig, RenderingContext, CharacterMetrics, ITextVariationEngine } from '../types';
import { IInkRenderingSystem } from './inkRenderingSystem';
import { computeHandwritingLayoutMetrics } from './layoutMetrics';

/**
 * Set up text rendering properties with enhanced ink rendering
 * Requirements: 1.3 (off-black color), font configuration, 2.4, 2.5 (multiply blend mode), 5.1, 5.2, 5.3, 5.4, 5.5 (realistic ink)
 */
export function setupTextRendering(
  ctx: CanvasRenderingContext2D,
  config: RenderingConfig,
  inkRenderingSystem: IInkRenderingSystem,
  textEngine: ITextVariationEngine,
  defaultFont: string,
  defaultFontSize: number
): void {
  // Set font properties using config or defaults
  const fontSize = config.fontSize || defaultFontSize;
  const fontFamily = config.fontFamily || defaultFont;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  
  // Apply subtle shadow to soften edges and blend with textures
  const level = config.distortionLevel ?? 2;
  if (level === 1) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur = 0.7;
  } else if (level === 2) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.11)';
    ctx.shadowBlur = 0.55;
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 0.4;
  }

  // Determine ink color from config or detect from base color
  const inkColorName = detectInkColorName(config.baseInkColor);
  const inkColor = inkRenderingSystem.getInkColorByName(inkColorName);
  
  if (inkColor) {
    if (typeof (textEngine as any).setBaseInkColor === 'function') {
      (textEngine as any).setBaseInkColor(inkColor.baseColor);
    }
    // Use realistic ink rendering (Requirements: 5.1, 5.2, 5.3, 5.4, 5.5)
    const inkResult = inkRenderingSystem.renderRealisticInk(inkColor, 1.0);
    
    // Apply ink texture effects
    inkRenderingSystem.applyInkTexture(ctx, inkColor);

    ctx.fillStyle = inkResult.color;
    ctx.globalAlpha = inkResult.opacity;
    ctx.globalCompositeOperation = inkResult.blendMode as GlobalCompositeOperation;
  } else {
    if (typeof (textEngine as any).setBaseInkColor === 'function') {
      (textEngine as any).setBaseInkColor(config.baseInkColor);
    }
    // Fallback to original rendering
    ctx.fillStyle = config.baseInkColor;
    ctx.globalCompositeOperation = config.blendMode as GlobalCompositeOperation;
  }
}

/**
 * Render text with character-by-character variations and realistic handwriting effects
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 (text variations), 2.4, 2.5 (multiply blend mode)
 */
export async function renderTextWithVariations(
  context: RenderingContext,
  config: RenderingConfig,
  textEngine: ITextVariationEngine,
  defaultFontSize: number,
  text?: string
): Promise<void> {
  const { ctx } = context;
  
  // Use provided text or default sample text
  const fontSize = config.fontSize || defaultFontSize;
  const layoutMetrics = computeHandwritingLayoutMetrics({
    canvasWidth: config.canvasWidth,
    canvasHeight: config.canvasHeight,
    fontSize,
    baselineJitterRange: config.baselineJitterRange,
    distortionLevel: config.distortionLevel
  });

  const textToRender = text || 'Sample handwritten text with realistic variations';
  
  const lines = splitTextIntoLines(textToRender, layoutMetrics.availableWidth, ctx);
  
  let currentY = layoutMetrics.topMargin;
  const leftMargin = layoutMetrics.sideMargin;

  for (let i = 0; i < lines.length; i++) {
    if (i >= layoutMetrics.linesPerPage) {
      break;
    }
    const line = lines[i];
    await renderLineWithVariations(ctx, line, leftMargin, currentY, config, textEngine, defaultFontSize);
    currentY += layoutMetrics.lineSpacing;
  }

  // Reset shadow to avoid bleeding into other drawing operations
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * Render a single line of text with character-by-character variations
 * Requirements: 1.1, 1.2, 1.4, 1.5 (individual character variations)
 */
async function renderLineWithVariations(
  ctx: CanvasRenderingContext2D,
  line: string,
  startX: number,
  startY: number,
  config: RenderingConfig,
  textEngine: ITextVariationEngine,
  defaultFontSize: number
): Promise<void> {
  let currentX = startX;
  
  // Render each character individually with variations
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    // Skip spaces but advance position
    if (char === ' ') {
      const baseSpace = ctx.measureText(' ').width;
      const variationSeed = Math.sin((i + 1) * 13.37) * 0.5 + 0.5;
      currentX += baseSpace * (0.85 + variationSeed * 0.25);
      continue;
    }
    
    // Calculate character metrics with variations
    const metrics = calculateCharacterMetrics(char, currentX, startY, i, ctx, config, textEngine, defaultFontSize);
    
    // Apply character transformation and render
    applyCharacterTransformation(ctx, metrics);
    
    // Adjustable ink weight: 0..1 where 0.5 is baseline
    const fontSize = config.fontSize || defaultFontSize;
    const b = Math.max(0, Math.min(1, config.inkBoldness ?? 0.5));
    const t = (b - 0.5) * 2; // -1..+1
    if (t > 0.001) {
      // Bolder: multi-pass fills with small, smoothly increasing radius and subtle alpha boost
      const baseScale = fontSize * 0.006; // gentler scaling
      const radius = Math.min(1.6, Math.max(0, baseScale * (0.2 + 2.0 * t)));
      const s = radius / Math.SQRT2;
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * (1 + 0.12 * t);
      ctx.fillText(char, 0, 0);
      ctx.fillText(char, radius, 0);
      ctx.fillText(char, -radius, 0);
      ctx.fillText(char, 0, radius);
      ctx.fillText(char, 0, -radius);
      ctx.fillText(char, s, s);
      ctx.fillText(char, -s, s);
      ctx.fillText(char, s, -s);
      ctx.fillText(char, -s, -s);
    } else if (t < -0.001) {
      // Lighter: reduce alpha slightly based on magnitude
      const lighten = Math.min(1, Math.abs(t));
      const alphaFactor = 1 - 0.45 * Math.pow(lighten, 1.2);
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * alphaFactor;
      ctx.fillText(char, 0, 0);
    } else {
      ctx.fillText(char, 0, 0); // Baseline rendering
    }
    restoreCharacterTransformation(ctx);
    
    // Advance to next character position
    currentX += metrics.width;
  }
}

/**
 * Calculate character metrics for positioning
 * Requirements: 1.1, 1.2 (positioning with jitter)
 */
function calculateCharacterMetrics(
  char: string,
  x: number,
  y: number,
  position: number,
  ctx: CanvasRenderingContext2D,
  config: RenderingConfig,
  textEngine: ITextVariationEngine,
  defaultFontSize: number
): CharacterMetrics {
  // Generate variation for this character
  const variation = textEngine.generateVariation(char, position);
  
  // Measure character width
  const metrics = ctx.measureText(char);
  const baseWidth = metrics.width;

  const fontSize = config.fontSize || defaultFontSize;
  const baselineRange = Math.max(config.baselineJitterRange || 0.5, 0.2);
  const jitterScaleX = fontSize * baselineRange * 0.42;
  const jitterScaleY = fontSize * baselineRange * 0.36;
  const microShift = variation.microTilt * fontSize * 0.55;
  const jitterX = variation.baselineJitter * jitterScaleX + microShift * 0.4;
  const jitterY = variation.baselineJitter * jitterScaleY + microShift * 0.25;

  const widthGrowth = 1 + Math.min(0.08, Math.abs(variation.microTilt) * 0.9);
  const baselineInfluence = 1 + Math.min(0.04, Math.abs(variation.baselineJitter) * 0.12);
  const width = Math.max(fontSize * 0.22, baseWidth * widthGrowth * baselineInfluence);
  
  return {
    char,
    x: x + jitterX,
    y: y + jitterY,
    width,
    variation
  };
}

/**
 * Apply character transformation based on variation with enhanced ink rendering
 * Requirements: 1.2 (slant jitter), 1.5 (micro-tilts), 1.4 (color variations), 5.5 (ink variations)
 */
function applyCharacterTransformation(ctx: CanvasRenderingContext2D, metrics: CharacterMetrics): void {
  // Save current transformation state (preserves blend mode)
  ctx.save();
  
  // Move to character position
  ctx.translate(metrics.x, metrics.y);
  
  // Apply slant jitter (Requirement 1.2: +/- 0.5 degrees)
  ctx.rotate(metrics.variation.slantJitter);
  
  // Apply micro-tilt (Requirement 1.5: random micro-tilts)
  ctx.rotate(metrics.variation.microTilt);
  
  // Apply enhanced ink color variation (Requirements: 1.4, 5.5)
  applyInkColorVariation(ctx, metrics.variation.colorVariation);
  
  // Note: globalCompositeOperation (blend mode) is preserved by save/restore
}

/**
 * Restore character transformation
 */
function restoreCharacterTransformation(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}

/**
 * Apply ink color variation to character
 * Requirements: 5.5 - Subtle opacity and saturation variations
 */
function applyInkColorVariation(ctx: CanvasRenderingContext2D, colorVariation: string): void {
  // Color variation is already applied through the variation system
  // This function can be extended for additional ink effects
  if (colorVariation) {
    ctx.fillStyle = colorVariation;
  }
}

/**
 * Detect ink color name from base color
 * Requirements: 5.2, 5.3 - Map colors to realistic ink profiles
 */
function detectInkColorName(baseColor: string): string {
  if (!baseColor) return 'black';
  
  const color = baseColor.toLowerCase();
  
  // Explicit check for app constants
  if (color === '#2a2620') return 'black';
  if (color === '#2f4a92') return 'blue';
  if (color === '#b13535') return 'red';
  if (color === '#2f6a52') return 'green';
  
  // Black and near-black colors
  if (color === '#000000' || color === '#000' || color === 'black') {
    return 'black';
  }
  if (color.match(/#[0-3][0-3][0-3][0-3][0-3][0-3]/)) {
    return 'black';
  }
  
  // Blue colors
  if (color.match(/#[0-5][0-9a-f][0-9a-f][0-9a-f][6-9a-f][0-9a-f]/) || 
      color.match(/#[0-5][0-9a-f][0-5][0-9a-f][6-9a-f][0-9a-f]/) ||
      color === 'blue' || color.includes('blue')) {
    return 'blue';
  }
  
  // Red colors
  if (color.match(/#[6-9a-f][0-9a-f][0-5][0-9a-f][0-5][0-9a-f]/) ||
      color === 'red' || color.includes('red')) {
    return 'red';
  }
  
  // Green colors
  if (color.match(/#[0-5][0-9a-f][6-9a-f][0-9a-f][0-5][0-9a-f]/) ||
      color === 'green' || color.includes('green')) {
    return 'green';
  }
  
  // Default to black for unknown colors
  return 'black';
}

/**
 * Split text into lines that fit within the specified width
 */
function splitTextIntoLines(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
  const lines: string[] = [];
  const paragraphs = (text || '').split(/\r?\n/);

  for (const paragraph of paragraphs) {
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
}
