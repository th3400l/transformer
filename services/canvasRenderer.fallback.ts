// Fallback rendering and error recovery for canvas
// Requirements: 2.1, 2.2, 2.3, 2.4, 8.1, 8.3

import { RenderingConfig, RenderingContext, PaperTexture, PaperTemplate } from '../types';

/**
 * Create fallback configuration based on the original error
 * Requirements: 6.5 - Memory management for large text rendering operations
 */
export function createFallbackConfig(config: RenderingConfig, error: Error): RenderingConfig {
  const fallbackConfig = { ...config };
  
  // Reduce canvas size if memory error
  if (error.message.includes('memory') || error.message.includes('Memory')) {
    fallbackConfig.canvasWidth = Math.min(config.canvasWidth, 800);
    fallbackConfig.canvasHeight = Math.min(config.canvasHeight, 600);
  }
  
  // Reduce text length if too large
  if (config.text && config.text.length > 1000) {
    fallbackConfig.text = config.text.substring(0, 1000) + '...';
  }
  
  // Disable advanced features
  fallbackConfig.colorVariationIntensity = 0.1;
  fallbackConfig.baselineJitterRange = 0.1;
  fallbackConfig.slantJitterRange = 0.1;
  
  return fallbackConfig;
}

/**
 * Create emergency texture when all texture loading fails
 * Requirements: 6.5 - Ultimate fallback mechanism
 */
export async function createEmergencyTexture(): Promise<PaperTexture> {
  // Create a simple white canvas as emergency texture
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create emergency texture: no canvas context');
  }
  
  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add subtle texture pattern
  ctx.fillStyle = '#f8f8f8';
  for (let x = 0; x < canvas.width; x += 20) {
    for (let y = 0; y < canvas.height; y += 20) {
      if ((x + y) % 40 === 0) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  
  // Convert canvas to image
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create emergency texture blob'));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        resolve({
          baseImage: img,
          isLoaded: true
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to load emergency texture image'));
      };
      img.src = URL.createObjectURL(blob);
    });
  });
}

/**
 * Render simplified background for fallback mode
 * Requirements: 6.1, 6.2, 6.3, 6.5 - Graceful degradation when canvas operations fail
 */
export async function renderFallbackBackground(
  context: RenderingContext,
  config: RenderingConfig
): Promise<void> {
  const { ctx, paperTexture } = context;
  
  try {
    // Try to render paper texture if available
    if (paperTexture && paperTexture.baseImage) {
      ctx.drawImage(
        paperTexture.baseImage,
        0, 0,
        config.canvasWidth,
        config.canvasHeight
      );
    } else {
      // Fallback to solid color background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
    }
  } catch (error) {
    console.warn('Fallback background rendering failed, using solid color:', error);
    // Ultimate fallback: solid white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
  }
}

/**
 * Setup simplified text rendering for fallback mode
 * Requirements: 6.1, 6.2, 6.3, 6.5 - Graceful degradation when canvas operations fail
 */
export function setupFallbackTextRendering(
  ctx: CanvasRenderingContext2D,
  config: RenderingConfig,
  defaultFont: string,
  defaultFontSize: number
): void {
  try {
    // Use configured font or system font as fallback
    const fontSize = config.fontSize || defaultFontSize;
    const fontFamily = config.fontFamily || defaultFont;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Use simple black color
    ctx.fillStyle = '#000000';
    
    // Use normal blend mode for compatibility
    ctx.globalCompositeOperation = 'source-over';
  } catch (error) {
    console.warn('Fallback text setup failed, using minimal settings:', error);
    // Minimal fallback settings
    ctx.fillStyle = '#000000';
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Render text with minimal variations for fallback mode
 * Requirements: 6.1, 6.2, 6.3, 6.5 - Graceful degradation when canvas operations fail
 */
export async function renderFallbackText(
  context: RenderingContext,
  config: RenderingConfig,
  defaultFontSize: number
): Promise<void> {
  const { ctx } = context;
  
  try {
    const textToRender = config.text || 'Sample text';
    const fontSize = config.fontSize || defaultFontSize;

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    // Simple line splitting without complex measurements
    const lines = textToRender.split('\n');
    const maxLines = Math.floor((config.canvasHeight - 80) / (fontSize * 1.2));
    const linesToRender = lines.slice(0, maxLines);
    
    // Render each line simply
    let currentY = 40;
    const leftMargin = 20;
    const lineSpacing = fontSize * 1.2;

    for (const line of linesToRender) {
      // Simple word wrapping
      const words = line.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth > config.canvasWidth - 40 && currentLine) {
          // Render current line and start new one
          ctx.fillText(currentLine, leftMargin, currentY);
          currentY += lineSpacing;
          currentLine = word;
          
          // Check if we exceed canvas height
          if (currentY > config.canvasHeight - 40) {
            return;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      // Render remaining text
      if (currentLine) {
        ctx.fillText(currentLine, leftMargin, currentY);
        currentY += lineSpacing;
      }
      
      // Check if we exceed canvas height
      if (currentY > config.canvasHeight - 40) {
        break;
      }
    }
  } catch (error) {
    console.warn('Fallback text rendering failed:', error);
    // Ultimate fallback: simple error message
    ctx.fillText('Text rendering error', 20, 40);
  }
}
