/**
 * Enhanced Canvas Renderer with Line Alignment Support
 * Extends the base canvas renderer to support line alignment for lined templates
 * Requirements: 4.1, 4.3, 4.4 - Modify canvas renderer to use line alignment data
 */

import { 
  ICanvasRenderer, 
  ITextVariationEngine, 
  IPaperTextureManager,
  RenderingConfig,
  PaperTemplate
} from '../types/core';
import { 
  ILineAlignmentEngine,
  TemplateMetadata,
  AlignmentResult
} from '../types/lineAlignment';
import { CanvasRenderer } from './canvasRenderer';

export interface IEnhancedCanvasRenderer extends ICanvasRenderer {
  setLineAlignmentEngine(engine: ILineAlignmentEngine): void;
  renderWithLineAlignment(config: RenderingConfig, template: TemplateMetadata): Promise<HTMLCanvasElement>;
}

/**
 * Enhanced Canvas Renderer that supports line alignment for lined templates
 * Requirements: 4.1, 4.3, 4.4 - Use line alignment data for text positioning
 */
export class EnhancedCanvasRenderer extends CanvasRenderer implements IEnhancedCanvasRenderer {
  private lineAlignmentEngine?: ILineAlignmentEngine;

  constructor(textEngine: ITextVariationEngine, textureManager: IPaperTextureManager) {
    super(textEngine, textureManager);
  }

  /**
   * Set the line alignment engine
   * Requirements: 4.1 - Integration with line alignment system
   */
  setLineAlignmentEngine(engine: ILineAlignmentEngine): void {
    this.lineAlignmentEngine = engine;
  }

  /**
   * Enhanced render method that uses line alignment for lined templates
   * Requirements: 4.1, 4.3, 4.4 - Calculate proper baseline offset and align text precisely
   */
  async render(config: RenderingConfig): Promise<HTMLCanvasElement> {
    // Check if we have a lined template and line alignment engine
    if (this.shouldUseLineAlignment(config)) {
      try {
        const templateMetadata = await this.getTemplateMetadata(config.paperTemplate!);
        return await this.renderWithLineAlignment(config, templateMetadata);
      } catch (error) {
        console.warn('Line alignment failed, falling back to standard rendering:', error);
        // Fall back to standard rendering
        return await super.render(config);
      }
    }

    // Use standard rendering for blank templates or when line alignment is not available
    return await super.render(config);
  }

  /**
   * Render with line alignment for lined templates
   * Requirements: 4.1, 4.3, 4.4 - Align text baseline with template lines and maintain consistent spacing
   */
  async renderWithLineAlignment(config: RenderingConfig, template: TemplateMetadata): Promise<HTMLCanvasElement> {
    if (!this.lineAlignmentEngine) {
      throw new Error('Line alignment engine not set');
    }

    // Validate alignment configuration
    if (!this.lineAlignmentEngine.validateAlignmentConfig(template, config)) {
      throw new Error('Invalid alignment configuration');
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Load and render paper texture
    if (config.paperTemplate) {
      await this.renderPaperTexture(ctx, config);
    }

    // Set up text rendering properties
    this.setupTextRendering(ctx, config, template);

    // Get aligned text layout
    const textToRender = config.text || 'Sample handwritten text with realistic variations';
    const alignmentResult = this.lineAlignmentEngine.alignTextToLines(textToRender, template, config);

    // Render each aligned line
    await this.renderAlignedLines(ctx, alignmentResult, config, template);

    return canvas;
  }

  /**
   * Setup text rendering properties for line-aligned text
   * Requirements: 4.3, 4.4 - Ensure proper vertical positioning relative to line guides
   */
  private setupTextRendering(ctx: CanvasRenderingContext2D, config: RenderingConfig, template: TemplateMetadata): void {
    const fontSize = this.lineAlignmentEngine!.calculateOptimalFontSize(template, config.fontSize || 16);
    
    ctx.font = `${fontSize}px ${config.fontFamily || 'Arial'}`;
    ctx.fillStyle = config.baseInkColor || '#1A1A2E';
    ctx.textBaseline = 'alphabetic'; // Use alphabetic baseline for precise positioning
    ctx.textAlign = 'left';
    
    // Apply blend mode for realistic ink effect
    ctx.globalCompositeOperation = config.blendMode || 'multiply';
  }

  /**
   * Render aligned lines of text
   * Requirements: 4.1, 4.3, 4.4 - Render text with precise line alignment
   */
  private async renderAlignedLines(
    ctx: CanvasRenderingContext2D, 
    alignmentResult: AlignmentResult, 
    config: RenderingConfig,
    template: TemplateMetadata
  ): Promise<void> {
    for (const alignedLine of alignmentResult.lines) {
      await this.renderAlignedLine(ctx, alignedLine, config, template);
    }
  }

  /**
   * Render a single aligned line with character variations
   * Requirements: 4.1, 4.3, 4.4 - Maintain line alignment while applying character variations
   */
  private async renderAlignedLine(
    ctx: CanvasRenderingContext2D,
    alignedLine: any,
    config: RenderingConfig,
    template: TemplateMetadata
  ): Promise<void> {
    let currentX = alignedLine.x;
    const baseY = alignedLine.y;

    // Render each character with variations while maintaining line alignment
    for (let i = 0; i < alignedLine.text.length; i++) {
      const char = alignedLine.text[i];
      
      // Skip spaces but advance position
      if (char === ' ') {
        currentX += ctx.measureText(' ').width;
        continue;
      }

      // Generate character variation
      const variation = this.textEngine.generateVariation(char, i);
      
      // Calculate character position with line alignment
      const charX = currentX + variation.baselineJitter;
      const charY = baseY + (variation.baselineJitter * 0.5); // Reduced vertical jitter to maintain line alignment
      
      // Apply character transformations
      ctx.save();
      ctx.translate(charX, charY);
      ctx.rotate(variation.slantJitter * Math.PI / 180);
      ctx.rotate(variation.microTilt * Math.PI / 180);
      
      // Apply color variation
      ctx.fillStyle = variation.colorVariation;
      
      // Render character
      ctx.fillText(char, 0, 0);
      
      ctx.restore();
      
      // Advance to next character position
      currentX += ctx.measureText(char).width;
    }
  }

  /**
   * Render paper texture background
   * Requirements: 4.1 - Render template background before text
   */
  private async renderPaperTexture(ctx: CanvasRenderingContext2D, config: RenderingConfig): Promise<void> {
    try {
      const texture = await this.textureManager.loadTexture(config.paperTemplate!);
      if (texture && texture.isLoaded) {
        ctx.drawImage(texture.baseImage, 0, 0, config.canvasWidth, config.canvasHeight);
      }
    } catch (error) {
      console.warn('Failed to load paper texture:', error);
      // Continue without texture
    }
  }

  /**
   * Check if line alignment should be used
   * Requirements: 4.1 - Only use line alignment for lined templates
   */
  private shouldUseLineAlignment(config: RenderingConfig): boolean {
    return !!(
      this.lineAlignmentEngine &&
      config.paperTemplate &&
      config.paperTemplate.type === 'lined'
    );
  }

  /**
   * Get template metadata from paper template
   * Requirements: 4.1 - Load template metadata for line alignment
   */
  private async getTemplateMetadata(template: PaperTemplate): Promise<TemplateMetadata> {
    if (!this.lineAlignmentEngine) {
      throw new Error('Line alignment engine not set');
    }
    
    return await this.lineAlignmentEngine.getTemplateMetadata(template.id);
  }

  /**
   * Get alignment statistics for debugging
   * Provides information about the current alignment configuration
   */
  async getAlignmentStats(config: RenderingConfig): Promise<any> {
    if (!this.shouldUseLineAlignment(config) || !this.lineAlignmentEngine) {
      return null;
    }

    try {
      const template = await this.getTemplateMetadata(config.paperTemplate!);
      return this.lineAlignmentEngine.getAlignmentStats(template, config);
    } catch (error) {
      console.warn('Failed to get alignment stats:', error);
      return null;
    }
  }

  /**
   * Check if line alignment is supported for a template
   * Requirements: 4.1 - Validate line alignment support
   */
  async supportsLineAlignment(templateId: string): Promise<boolean> {
    if (!this.lineAlignmentEngine) {
      return false;
    }
    
    return await this.lineAlignmentEngine.supportsLineAlignment(templateId);
  }
}