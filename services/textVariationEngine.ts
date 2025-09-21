// Main TextVariationEngine implementation for Gear-1 handwriting system
// Implements ITextVariationEngine interface with strategy pattern dependency injection
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

import { ITextVariationEngine, IVariationStrategy, TextVariation, VariationRangeConfig } from '../types';

// Default configuration constants (Requirements 1.1, 1.2, 1.3, 1.4, 1.5)
const DEFAULT_CONFIG = {
  baselineJitterRange: 0.5,      // +/- 0.5 pixels (Requirement 1.1)
  slantJitterRange: 0.5,         // +/- 0.5 degrees (Requirement 1.2)
  colorVariationIntensity: 0.05, // Subtle color variation (Requirement 1.4)
  microTiltRange: 0.3,           // Micro-tilts (Requirement 1.5)
  baseInkColor: '#1A1A2E'        // Off-black color (Requirement 1.3)
} as const;

/**
 * Main text variation engine that coordinates character variation generation
 * Uses strategy pattern for different variation algorithms (Dependency Inversion Principle)
 * 
 * Requirements implemented:
 * - 1.1: Random baseline jitter of +/- 0.5 pixels
 * - 1.2: Random slant jitter of +/- 0.5 degrees rotation  
 * - 1.3: Off-black color (#1A1A2E) instead of pure black
 * - 1.4: Subtle color variations making letters lighter or darker
 * - 1.5: Random micro-tilts for individual letters
 */
export class TextVariationEngine implements ITextVariationEngine {
  private strategy: IVariationStrategy;
  private intensityMultiplier: number = 1.0;
  private baseInkColor: string = DEFAULT_CONFIG.baseInkColor;
  
  // Configuration ranges from DEFAULT_CONFIG
  private baselineJitterRange: number = DEFAULT_CONFIG.baselineJitterRange;
  private slantJitterRange: number = DEFAULT_CONFIG.slantJitterRange;
  private colorVariationIntensity: number = DEFAULT_CONFIG.colorVariationIntensity;
  private microTiltRange: number = DEFAULT_CONFIG.microTiltRange;

  /**
   * Creates a new TextVariationEngine with injected strategy
   * @param strategy - Variation strategy implementation (dependency injection)
   * @param baseInkColor - Base ink color (optional, defaults to off-black #1A1A2E)
   */
  constructor(strategy: IVariationStrategy, baseInkColor?: string) {
    this.strategy = strategy;
    if (baseInkColor) {
      this.baseInkColor = baseInkColor;
    }
  }

  /**
   * Generates realistic variation for a character at a specific position
   * Implements all handwriting variation requirements
   * 
   * @param char - Character to generate variation for
   * @param position - Character position in text (for position-based variations)
   * @returns TextVariation object with all variation parameters
   */
  generateVariation(char: string, position: number): TextVariation {
    // Generate baseline jitter (Requirement 1.1: +/- 0.5 pixels)
    const baselineJitter = this.strategy.generateJitter(
      this.baselineJitterRange * this.intensityMultiplier
    );

    // Generate slant jitter (Requirement 1.2: +/- 0.5 degrees rotation)
    const slantJitter = this.strategy.generateRotation(
      this.slantJitterRange * this.intensityMultiplier
    );

    // Generate color variation (Requirement 1.4: subtle color variations)
    const colorVariation = this.strategy.generateColorVariation(
      this.baseInkColor, // Requirement 1.3: off-black color
      this.colorVariationIntensity * this.intensityMultiplier
    );

    // Generate micro-tilt (Requirement 1.5: random micro-tilts)
    const microTilt = this.strategy.generateRotation(
      this.microTiltRange * this.intensityMultiplier
    );

    return {
      baselineJitter,
      slantJitter,
      colorVariation,
      microTilt
    };
  }

  /**
   * Sets the variation intensity multiplier
   * Allows dynamic adjustment of variation strength
   * 
   * @param intensity - Intensity multiplier (0.0 = no variation, 1.0 = normal, >1.0 = exaggerated)
   */
  setVariationIntensity(intensity: number): void {
    // Handle NaN and invalid values
    if (!Number.isFinite(intensity)) {
      this.intensityMultiplier = 1.0; // Default to normal intensity
      return;
    }
    
    // Clamp intensity to reasonable range (0.0 to 3.0)
    this.intensityMultiplier = Math.max(0.0, Math.min(3.0, intensity));
  }

  /**
   * Gets the current variation intensity
   * @returns Current intensity multiplier
   */
  getVariationIntensity(): number {
    return this.intensityMultiplier;
  }

  /**
   * Sets a new variation strategy (allows runtime strategy switching)
   * @param strategy - New variation strategy to use
   */
  setStrategy(strategy: IVariationStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Gets the current variation strategy
   * @returns Current variation strategy instance
   */
  getStrategy(): IVariationStrategy {
    return this.strategy;
  }

  /**
   * Sets the base ink color for variations
   * @param color - New base ink color (hex format)
   */
  setBaseInkColor(color: string): void {
    this.baseInkColor = color;
  }

  /**
   * Gets the current base ink color
   * @returns Current base ink color
   */
  getBaseInkColor(): string {
    return this.baseInkColor;
  }

  configureRanges(config: VariationRangeConfig): void {
    if (config.baselineJitterRange !== undefined) {
      this.baselineJitterRange = this.clampRange(config.baselineJitterRange, 0, 2.5, DEFAULT_CONFIG.baselineJitterRange);
    }
    if (config.slantJitterRange !== undefined) {
      this.slantJitterRange = this.clampRange(config.slantJitterRange, 0, 2.5, DEFAULT_CONFIG.slantJitterRange);
    }
    if (config.microTiltRange !== undefined) {
      this.microTiltRange = this.clampRange(config.microTiltRange, 0, 2.5, DEFAULT_CONFIG.microTiltRange);
    }
    if (config.colorVariationIntensity !== undefined) {
      this.colorVariationIntensity = this.clampRange(config.colorVariationIntensity, 0, 3, DEFAULT_CONFIG.colorVariationIntensity);
    }
  }

  /**
   * Generates a batch of variations for multiple characters
   * Useful for pre-computing variations for performance
   * 
   * @param text - Text to generate variations for
   * @returns Array of TextVariation objects, one per character
   */
  generateBatchVariations(text: string): TextVariation[] {
    const variations: TextVariation[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      // Skip whitespace characters (no variation needed)
      if (char.trim() === '') {
        variations.push({
          baselineJitter: 0,
          slantJitter: 0,
          colorVariation: this.baseInkColor,
          microTilt: 0
        });
      } else {
        variations.push(this.generateVariation(char, i));
      }
    }
    
    return variations;
  }

  private clampRange(value: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, value));
  }
}
