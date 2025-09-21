/**
 * Line Alignment Engine
 * Handles text positioning and alignment for lined templates
 * Requirements: 4.1, 4.3, 4.4
 */

import { 
  TemplateMetadata, 
  MarginBounds, 
  AlignedLine, 
  AlignmentResult, 
  ILineAlignmentEngine,
  ITemplateMetadataLoader
} from '../types/lineAlignment';
import { RenderingConfig } from '../types/core';

export class LineAlignmentEngine implements ILineAlignmentEngine {
  private metadataLoader: ITemplateMetadataLoader;

  constructor(metadataLoader: ITemplateMetadataLoader) {
    this.metadataLoader = metadataLoader;
  }

  /**
   * Calculate text baseline position for proper line alignment
   * Requirements: 4.1, 4.3 - Calculate baseline offset based on template line spacing and font metrics
   */
  calculateTextBaseline(template: TemplateMetadata, fontSize: number): number {
    // Base calculation using template's baseline offset
    let baseline = template.baselineOffset;
    
    // Adjust for font size - larger fonts need proportional adjustment
    const fontSizeRatio = fontSize / 16; // 16px as base font size
    baseline = baseline * fontSizeRatio;
    
    // Ensure baseline is within reasonable bounds
    const minBaseline = fontSize * 0.2; // At least 20% of font size
    const maxBaseline = template.lineHeight * 0.8; // At most 80% of line height
    
    return Math.max(minBaseline, Math.min(maxBaseline, baseline));
  }

  /**
   * Get line spacing from template metadata
   * Requirements: 4.1, 4.3 - Get line spacing that matches the template
   */
  getLineSpacing(template: TemplateMetadata): number {
    return template.lineSpacing;
  }

  /**
   * Get margin bounds from template metadata
   * Requirements: 4.1, 4.2 - Respect margin boundaries and align text accordingly
   */
  getMarginBounds(template: TemplateMetadata): MarginBounds {
    return {
      top: template.marginTop,
      bottom: template.marginBottom,
      left: template.marginLeft,
      right: template.marginRight
    };
  }

  /**
   * Calculate line positions for the entire canvas
   * Requirements: 4.3, 4.4 - Maintain consistent line spacing that matches the template
   */
  calculateLinePositions(template: TemplateMetadata, canvasHeight: number): number[] {
    const positions: number[] = [];
    const lineSpacing = this.getLineSpacing(template);
    const marginBounds = this.getMarginBounds(template);
    
    // Start from the top margin plus the baseline offset
    let currentY = marginBounds.top + template.baselineOffset;
    
    // Generate line positions until we reach the bottom margin
    while (currentY + lineSpacing <= canvasHeight - marginBounds.bottom) {
      positions.push(currentY);
      currentY += lineSpacing;
    }
    
    return positions;
  }

  /**
   * Align text to template lines with proper positioning
   * Requirements: 4.1, 4.3, 4.4 - Align text baseline with template lines and maintain consistent spacing
   */
  alignTextToLines(
    text: string, 
    template: TemplateMetadata, 
    config: RenderingConfig
  ): AlignmentResult {
    const lines: AlignedLine[] = [];
    const marginBounds = this.getMarginBounds(template);
    const lineSpacing = this.getLineSpacing(template);
    const fontSize = config.fontSize || 16;
    const baseline = this.calculateTextBaseline(template, fontSize);
    
    // Split text into words for line wrapping
    const words = text.split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) {
      return {
        lines: [],
        totalHeight: 0,
        marginAdjustments: marginBounds
      };
    }
    
    // Calculate available width for text
    const availableWidth = config.canvasWidth - marginBounds.left - marginBounds.right;
    
    // Estimate character width (rough approximation)
    const avgCharWidth = fontSize * 0.6; // Approximate character width
    const maxCharsPerLine = Math.floor(availableWidth / avgCharWidth);
    
    // Group words into lines
    const textLines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          textLines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, break it
          textLines.push(word);
        }
      }
    }
    
    if (currentLine) {
      textLines.push(currentLine);
    }
    
    // Position each line
    let currentY = marginBounds.top + baseline;
    
    for (let i = 0; i < textLines.length; i++) {
      const lineText = textLines[i];
      
      // Check if we have space for this line
      if (currentY + lineSpacing > config.canvasHeight - marginBounds.bottom) {
        break; // No more space
      }
      
      lines.push({
        text: lineText,
        x: marginBounds.left,
        y: currentY,
        baseline: baseline
      });
      
      currentY += lineSpacing;
    }
    
    const totalHeight = lines.length > 0 ? 
      (lines[lines.length - 1].y - lines[0].y + lineSpacing) : 0;
    
    return {
      lines,
      totalHeight,
      marginAdjustments: marginBounds
    };
  }

  /**
   * Get template metadata for a given template ID
   * Helper method to load template metadata
   */
  async getTemplateMetadata(templateId: string): Promise<TemplateMetadata> {
    return await this.metadataLoader.loadMetadata(templateId);
  }

  /**
   * Check if a template supports line alignment
   * Requirements: 4.1 - Only lined templates support line alignment
   */
  async supportsLineAlignment(templateId: string): Promise<boolean> {
    try {
      const metadata = await this.getTemplateMetadata(templateId);
      return metadata.type === 'lined';
    } catch (error) {
      console.warn(`Failed to check line alignment support for ${templateId}:`, error);
      return false;
    }
  }

  /**
   * Calculate optimal font size for template
   * Requirements: 4.3, 4.4 - Ensure proper vertical positioning relative to line guides
   */
  calculateOptimalFontSize(template: TemplateMetadata, desiredFontSize: number): number {
    const lineHeight = template.lineHeight;
    
    // Ensure font size doesn't exceed 80% of line height for readability
    const maxFontSize = lineHeight * 0.8;
    
    // Ensure font size is at least 10px for readability
    const minFontSize = 10;
    
    return Math.max(minFontSize, Math.min(maxFontSize, desiredFontSize));
  }

  /**
   * Validate alignment configuration
   * Requirements: 4.1, 4.2 - Validate template configuration and alignment parameters
   */
  validateAlignmentConfig(template: TemplateMetadata, config: RenderingConfig): boolean {
    // Check required template fields
    if (!template.lineSpacing || template.lineSpacing <= 0) {
      console.warn('Invalid line spacing in template');
      return false;
    }
    
    if (!template.baselineOffset || template.baselineOffset < 0) {
      console.warn('Invalid baseline offset in template');
      return false;
    }
    
    // Check canvas dimensions
    if (!config.canvasWidth || !config.canvasHeight) {
      console.warn('Invalid canvas dimensions in config');
      return false;
    }
    
    // Check margins don't exceed canvas size
    const totalHorizontalMargin = template.marginLeft + template.marginRight;
    const totalVerticalMargin = template.marginTop + template.marginBottom;
    
    if (totalHorizontalMargin >= config.canvasWidth) {
      console.warn('Horizontal margins exceed canvas width');
      return false;
    }
    
    if (totalVerticalMargin >= config.canvasHeight) {
      console.warn('Vertical margins exceed canvas height');
      return false;
    }
    
    return true;
  }

  /**
   * Get alignment statistics for debugging
   * Provides information about line positioning and spacing
   */
  getAlignmentStats(template: TemplateMetadata, config: RenderingConfig): {
    lineCount: number;
    lineSpacing: number;
    availableWidth: number;
    availableHeight: number;
    baseline: number;
  } {
    const marginBounds = this.getMarginBounds(template);
    const lineSpacing = this.getLineSpacing(template);
    const fontSize = config.fontSize || 16;
    const baseline = this.calculateTextBaseline(template, fontSize);
    
    const availableWidth = config.canvasWidth - marginBounds.left - marginBounds.right;
    const availableHeight = config.canvasHeight - marginBounds.top - marginBounds.bottom;
    const lineCount = Math.floor(availableHeight / lineSpacing);
    
    return {
      lineCount,
      lineSpacing,
      availableWidth,
      availableHeight,
      baseline
    };
  }
}