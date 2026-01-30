// Ink Rendering System for realistic handwriting appearance
// Implements realistic blue and red ink rendering with texture variations
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

import { CanvasRenderError } from '../types/errors';

/**
 * Ink color profile with realistic properties
 */
export interface InkColor {
  name: string;
  baseColor: string;
  variations: string[];
  opacity: number;
  texture: InkTexture;
}

/**
 * Ink texture properties for realistic rendering
 */
export interface InkTexture {
  pattern: string;
  roughness: number;
  absorption: number;
  bleedEffect: number;
}

/**
 * Result of ink rendering operation
 */
export interface InkRenderResult {
  color: string;
  opacity: number;
  blendMode: string;
  textureApplied: boolean;
}

/**
 * Interface for ink rendering system
 */
export interface IInkRenderingSystem {
  renderRealisticInk(color: InkColor, intensity: number): InkRenderResult;
  applyInkTexture(ctx: CanvasRenderingContext2D, color: InkColor): void;
  generateInkVariations(baseColor: string): InkVariation[];
  validateInkColor(color: InkColor): boolean;
  getInkColorByName(name: string): InkColor | null;
  createCustomInkColor(name: string, baseColor: string): InkColor;
}

/**
 * Individual ink variation for character rendering
 */
export interface InkVariation {
  color: string;
  opacity: number;
  saturation: number;
  brightness: number;
}

/**
 * Realistic ink rendering system implementation
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export class InkRenderingSystem implements IInkRenderingSystem {
  private readonly inkProfiles: Map<string, InkColor> = new Map();
  private readonly fallbackColor: string = '#1A1A2E';
  private textureCache: Map<string, ImageData> = new Map();

  constructor() {
    this.initializeInkProfiles();
  }

  /**
   * Initialize predefined ink color profiles
   * Requirements: 5.2, 5.3 - Realistic blue and red ink rendering
   */
  private initializeInkProfiles(): void {
    // Blue ink profile (Requirements: 5.2)
    this.inkProfiles.set('blue', {
      name: 'blue',
      baseColor: '#2F4A92', // Warm navy
      variations: [
        '#2F4A92',
        '#3554A0',
        '#27417D',
        '#3B5CAE',
        '#2C4689'
      ],
      opacity: 0.82,
      texture: {
        pattern: 'subtle-grain',
        roughness: 0.28,
        absorption: 0.22,
        bleedEffect: 0.14
      }
    });

    // Red ink profile (Requirements: 5.3)
    this.inkProfiles.set('red', {
      name: 'red',
      baseColor: '#B13535', // Rich crimson
      variations: [
        '#B13535',
        '#C24141',
        '#A32F30',
        '#D35151',
        '#993030'
      ],
      opacity: 0.84,
      texture: {
        pattern: 'fine-grain',
        roughness: 0.27,
        absorption: 0.2,
        bleedEffect: 0.12
      }
    });

    // Black ink profile (enhanced from existing)
    this.inkProfiles.set('black', {
      name: 'black',
      baseColor: '#2A2620', // Deep earthy black
      variations: [
        '#2A2620',
        '#352F27',
        '#1F1C17',
        '#3A342B',
        '#27221D'
      ],
      opacity: 0.92,
      texture: {
        pattern: 'smooth',
        roughness: 0.18,
        absorption: 0.12,
        bleedEffect: 0.08
      }
    });

    // Green ink profile
    this.inkProfiles.set('green', {
      name: 'green',
      baseColor: '#2F6A52', // Forest green
      variations: [
        '#2F6A52',
        '#357F61',
        '#2A5C48',
        '#3A7458',
        '#276147'
      ],
      opacity: 0.83,
      texture: {
        pattern: 'medium-grain',
        roughness: 0.3,
        absorption: 0.22,
        bleedEffect: 0.14
      }
    });
  }

  /**
   * Render realistic ink with proper opacity and color variations
   * Requirements: 5.1, 5.4, 5.5 - Realistic ink appearance with variations
   */
  renderRealisticInk(color: InkColor, intensity: number = 1.0): InkRenderResult {
    try {
      // Validate input
      if (!this.validateInkColor(color)) {
        throw new CanvasRenderError('Invalid ink color: ' + color.name);
      }

      // Select variation based on intensity
      const variationIndex = Math.floor(intensity * color.variations.length) % color.variations.length;
      const selectedColor = color.variations[variationIndex];

      // Apply texture-based opacity adjustment
      const textureOpacity = this.calculateTextureOpacity(color.texture, intensity);
      const finalOpacity = color.opacity * textureOpacity;

      // Determine blend mode based on ink properties
      const blendMode = this.getOptimalBlendMode(color);

      return {
        color: selectedColor,
        opacity: finalOpacity,
        blendMode,
        textureApplied: true
      };
    } catch (error) {
      console.warn('Ink rendering failed, using fallback:', error);
      return this.getFallbackInkResult();
    }
  }

  /**
   * Apply ink texture effects to canvas context
   * Requirements: 5.1, 5.4 - Ink texture system with authentic appearance
   */
  applyInkTexture(ctx: CanvasRenderingContext2D, color: InkColor): void {
    try {
      // Save current context state
      ctx.save();

      // Apply texture-based rendering properties
      this.applyTextureProperties(ctx, color.texture);

      // Apply subtle opacity variations for realistic ink behavior
      this.applyOpacityVariations(ctx, color);

      // Apply color saturation adjustments
      this.applySaturationAdjustments(ctx, color);

      ctx.restore();

    } catch (error) {
      console.warn('Advanced texture application failed, using fallback:', error);
      this.applyFallbackTexture(ctx, color);
    }
  }

  /**
   * Apply fallback texture when advanced rendering fails
   * Requirements: 5.1 - Fallback rendering for solid colors
   */
  private applyFallbackTexture(ctx: CanvasRenderingContext2D, color: InkColor): void {
    try {
      // Restore context to clean state
      ctx.restore();
      ctx.save();
      
      // Apply basic opacity
      ctx.globalAlpha = color.opacity;
      
      // Apply basic blend mode
      ctx.globalCompositeOperation = 'source-over';
      
      // Clear any filters
      if (ctx.filter !== undefined) {
        ctx.filter = 'none';
      }
      
      // Clear shadows
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
    } catch (fallbackError) {
      console.warn('Fallback texture application also failed:', fallbackError);
      // Ultimate fallback - just set opacity
      ctx.globalAlpha = Math.max(0.8, color.opacity);
    }
    ctx.restore();
  }

  /**
   * Generate ink variations for character-by-character rendering
   * Requirements: 5.5 - Subtle opacity and saturation variations
   */
  generateInkVariations(baseColor: string): InkVariation[] {
    const variations: InkVariation[] = [];
    const numVariations = 5;

    for (let i = 0; i < numVariations; i++) {
      const variation = this.createInkVariation(baseColor, i / numVariations);
      variations.push(variation);
    }

    return variations;
  }

  /**
   * Create individual ink variation
   * Requirements: 5.5 - Simulate real ink behavior with variations
   */
  private createInkVariation(baseColor: string, seed: number): InkVariation {
    // Parse base color
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) {
      return {
        color: baseColor,
        opacity: 0.9,
        saturation: 1.0,
        brightness: 1.0
      };
    }

    // Generate subtle variations
    const opacityVariation = 0.9 + (Math.sin(seed * Math.PI * 2) * 0.1); // ±10% opacity
    const saturationVariation = 1.0 + (Math.sin(seed * Math.PI * 3) * 0.05); // ±5% saturation
    const brightnessVariation = 1.0 + (Math.sin(seed * Math.PI * 4) * 0.03); // ±3% brightness

    // Apply variations to color
    const variedColor = this.applyColorVariations(rgb, saturationVariation, brightnessVariation);

    return {
      color: this.rgbToHex(variedColor),
      opacity: Math.max(0.7, Math.min(1.0, opacityVariation)),
      saturation: Math.max(0.9, Math.min(1.1, saturationVariation)),
      brightness: Math.max(0.95, Math.min(1.05, brightnessVariation))
    };
  }

  /**
   * Validate ink color configuration
   */
  validateInkColor(color: InkColor): boolean {
    if (!color || !color.name || !color.baseColor) {
      return false;
    }

    if (!color.baseColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      return false;
    }

    if (color.opacity < 0 || color.opacity > 1) {
      return false;
    }

    if (!color.variations || color.variations.length === 0) {
      return false;
    }

    return color.variations.every(variation => 
      variation.match(/^#[0-9A-Fa-f]{6}$/)
    );
  }

  /**
   * Get ink color by name
   */
  getInkColorByName(name: string): InkColor | null {
    return this.inkProfiles.get(name.toLowerCase()) || null;
  }

  /**
   * Create custom ink color
   */
  createCustomInkColor(name: string, baseColor: string): InkColor {
    const variations = this.generateColorVariations(baseColor);
    
    return {
      name,
      baseColor,
      variations,
      opacity: 0.9,
      texture: {
        pattern: 'medium-grain',
        roughness: 0.25,
        absorption: 0.15,
        bleedEffect: 0.1
      }
    };
  }

  /**
   * Calculate texture-based opacity
   */
  private calculateTextureOpacity(texture: InkTexture, intensity: number): number {
    const baseOpacity = 1.0;
    const roughnessEffect = texture.roughness * 0.1; // Roughness reduces opacity slightly
    const absorptionEffect = texture.absorption * 0.05; // Absorption affects opacity
    
    return Math.max(0.7, baseOpacity - roughnessEffect - absorptionEffect + (intensity * 0.1));
  }

  /**
   * Get optimal blend mode for ink type with fallback support
   * Requirements: 5.1, 5.4 - Authentic blending modes with fallback rendering
   */
  private getOptimalBlendMode(color: InkColor): string {
    try {
      // Test if advanced blend modes are supported
      if (this.supportsAdvancedBlending()) {
        return this.getAdvancedBlendMode(color);
      } else {
        return this.getBasicBlendMode(color);
      }
    } catch (error) {
      console.warn('Blend mode detection failed, using fallback:', error);
      return 'source-over';
    }
  }

  /**
   * Get advanced blend mode for supported browsers
   */
  private getAdvancedBlendMode(color: InkColor): string {
    switch (color.name) {
      case 'blue':
        return 'multiply'; // Best for blue ink on paper
      case 'red':
        return 'multiply'; // Authentic red ink appearance
      case 'black':
        return 'multiply'; // Traditional black ink
      case 'green':
        return 'multiply'; // Natural green ink
      default:
        return 'multiply';
    }
  }

  /**
   * Get basic blend mode for compatibility
   */
  private getBasicBlendMode(color: InkColor): string {
    // Use source-over for maximum compatibility
    return 'source-over';
  }

  /**
   * Test if browser supports advanced blending modes
   */
  private supportsAdvancedBlending(): boolean {
    try {
      // Create test canvas to check blend mode support
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const testCtx = testCanvas.getContext('2d');
      
      if (!testCtx) return false;
      
      // Test multiply blend mode
      testCtx.globalCompositeOperation = 'multiply';
      return testCtx.globalCompositeOperation === 'multiply';
    } catch (error) {
      return false;
    }
  }

  /**
   * Apply texture properties to canvas context with enhanced patterns
   * Requirements: 5.1, 5.4 - Authentic ink texture patterns and blending modes
   */
  private applyTextureProperties(ctx: CanvasRenderingContext2D, texture: InkTexture): void {
    // Apply texture pattern-specific effects
    this.applyTexturePattern(ctx, texture.pattern, texture.roughness);

    // Apply roughness through slight alpha variations
    if (texture.roughness > 0) {
      const alphaVariation = 1.0 - (texture.roughness * 0.1);
      ctx.globalAlpha *= Math.max(0.7, alphaVariation);
    }

    // Apply absorption effects through composite operation adjustments
    if (texture.absorption > 0) {
      // Subtle shadow effect for absorption
      ctx.shadowBlur = Math.min(texture.absorption * 2, 3);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;
    }

    // Apply bleed effect for realistic ink spreading
    if (texture.bleedEffect > 0) {
      this.applyBleedEffect(ctx, texture.bleedEffect);
    }
  }

  /**
   * Apply specific texture patterns for authentic ink appearance
   * Requirements: 5.1, 5.4 - Texture patterns for authentic appearance
   */
  private applyTexturePattern(ctx: CanvasRenderingContext2D, pattern: string, intensity: number): void {
    try {
      switch (pattern) {
        case 'subtle-grain':
          this.applySubtleGrainPattern(ctx, intensity);
          break;
        case 'fine-grain':
          this.applyFineGrainPattern(ctx, intensity);
          break;
        case 'medium-grain':
          this.applyMediumGrainPattern(ctx, intensity);
          break;
        case 'smooth':
          this.applySmoothPattern(ctx, intensity);
          break;
        default:
          // Fallback to medium grain
          this.applyMediumGrainPattern(ctx, intensity * 0.5);
      }
    } catch (error) {
      console.warn('Texture pattern application failed, using fallback:', error);
      // Fallback to basic alpha adjustment
      ctx.globalAlpha *= 0.95;
    }
  }

  /**
   * Apply subtle grain pattern for blue ink
   */
  private applySubtleGrainPattern(ctx: CanvasRenderingContext2D, intensity: number): void {
    // Create subtle texture through micro-variations in alpha
    const variation = (Math.random() - 0.5) * intensity * 0.05;
    ctx.globalAlpha *= (1.0 + variation);
    
    // Add slight blur for softness
    if (ctx.filter !== undefined) {
      ctx.filter = `blur(${intensity * 0.1}px)`;
    }
  }

  /**
   * Apply fine grain pattern for red ink
   */
  private applyFineGrainPattern(ctx: CanvasRenderingContext2D, intensity: number): void {
    // Fine grain creates sharper texture
    const variation = (Math.random() - 0.5) * intensity * 0.08;
    ctx.globalAlpha *= Math.max(0.8, 1.0 + variation);
    
    // Slight contrast adjustment
    if (ctx.filter !== undefined) {
      const contrast = 1.0 + (intensity * 0.05);
      ctx.filter = `contrast(${contrast})`;
    }
  }

  /**
   * Apply medium grain pattern for green ink
   */
  private applyMediumGrainPattern(ctx: CanvasRenderingContext2D, intensity: number): void {
    // Medium grain balances smoothness and texture
    const variation = (Math.random() - 0.5) * intensity * 0.06;
    ctx.globalAlpha *= Math.max(0.75, 1.0 + variation);
    
    // Balanced filter effects
    if (ctx.filter !== undefined) {
      const saturation = 1.0 + (intensity * 0.03);
      ctx.filter = `saturate(${saturation})`;
    }
  }

  /**
   * Apply smooth pattern for black ink
   */
  private applySmoothPattern(ctx: CanvasRenderingContext2D, intensity: number): void {
    // Smooth pattern minimizes texture for clean appearance
    const variation = (Math.random() - 0.5) * intensity * 0.02;
    ctx.globalAlpha *= Math.max(0.85, 1.0 + variation);
    
    // Minimal filtering for smoothness
    if (ctx.filter !== undefined) {
      ctx.filter = `blur(${intensity * 0.05}px)`;
    }
  }

  /**
   * Apply bleed effect for realistic ink spreading
   * Requirements: 5.4 - Authentic ink appearance with bleed effects
   */
  private applyBleedEffect(ctx: CanvasRenderingContext2D, bleedIntensity: number): void {
    if (bleedIntensity > 0 && bleedIntensity <= 1) {
      // Create subtle bleed through shadow effects
      const currentShadowBlur = ctx.shadowBlur || 0;
      ctx.shadowBlur = Math.max(currentShadowBlur, bleedIntensity * 1.5);
      
      // Adjust shadow opacity for bleed effect
      const shadowAlpha = Math.min(0.15, bleedIntensity * 0.2);
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
    }
  }

  /**
   * Apply opacity variations for realistic ink behavior
   */
  private applyOpacityVariations(ctx: CanvasRenderingContext2D, color: InkColor): void {
    // Create subtle opacity variations based on texture properties
    const variation = (Math.random() - 0.5) * color.texture.roughness * 0.1;
    const newAlpha = Math.max(0.7, Math.min(1.0, ctx.globalAlpha + variation));
    ctx.globalAlpha = newAlpha;
  }

  /**
   * Apply saturation adjustments
   */
  private applySaturationAdjustments(ctx: CanvasRenderingContext2D, color: InkColor): void {
    // Apply subtle saturation variations through filter if supported
    if (ctx.filter !== undefined) {
      const saturationVariation = 1.0 + ((Math.random() - 0.5) * 0.1);
      ctx.filter = `saturate(${saturationVariation})`;
    }
  }

  /**
   * Generate color variations from base color
   */
  private generateColorVariations(baseColor: string): string[] {
    const variations: string[] = [baseColor];
    const rgb = this.hexToRgb(baseColor);
    
    if (!rgb) {
      return variations;
    }

    // Generate 4 additional variations
    for (let i = 1; i <= 4; i++) {
      const factor = (i - 2) * 0.1; // -0.1, 0, 0.1, 0.2
      const variedRgb = {
        r: Math.max(0, Math.min(255, rgb.r + (rgb.r * factor))),
        g: Math.max(0, Math.min(255, rgb.g + (rgb.g * factor))),
        b: Math.max(0, Math.min(255, rgb.b + (rgb.b * factor)))
      };
      variations.push(this.rgbToHex(variedRgb));
    }

    return variations;
  }

  /**
   * Apply color variations to RGB values
   */
  private applyColorVariations(
    rgb: { r: number; g: number; b: number }, 
    saturation: number, 
    brightness: number
  ): { r: number; g: number; b: number } {
    // Convert to HSL for easier manipulation
    const hsl = this.rgbToHsl(rgb);
    
    // Apply variations
    hsl.s = Math.max(0, Math.min(1, hsl.s * saturation));
    hsl.l = Math.max(0, Math.min(1, hsl.l * brightness));
    
    // Convert back to RGB
    return this.hslToRgb(hsl);
  }

  /**
   * Get fallback ink result when rendering fails
   */
  private getFallbackInkResult(): InkRenderResult {
    return {
      color: this.fallbackColor,
      opacity: 0.9,
      blendMode: 'source-over',
      textureApplied: false
    };
  }

  /**
   * Utility: Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Utility: Convert RGB to hex
   */
  private rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * Utility: Convert RGB to HSL
   */
  private rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h, s, l };
  }

  /**
   * Utility: Convert HSL to RGB
   */
  private hslToRgb(hsl: { h: number; s: number; l: number }): { r: number; g: number; b: number } {
    const { h, s, l } = hsl;
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.textureCache.clear();
    this.inkProfiles.clear();
  }
}

/**
 * Factory function to create ink rendering system
 */
export function createInkRenderingSystem(): IInkRenderingSystem {
  return new InkRenderingSystem();
}
