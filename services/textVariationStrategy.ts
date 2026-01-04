// Text variation strategy implementations for Gear-1 handwriting system
// Implements realistic handwriting variations following requirements 1.1, 1.2, 1.4, 1.5

import { IVariationStrategy } from '../types';

/**
 * Realistic variation strategy that generates natural handwriting imperfections
 * Implements requirements:
 * - 1.1: Random baseline jitter of +/- 0.5 pixels
 * - 1.2: Random slant jitter of +/- 0.5 degrees rotation
 * - 1.4: Subtle color variations making letters lighter or darker
 * - 1.5: Random micro-tilts for individual letters
 */
export class RealisticVariationStrategy implements IVariationStrategy {
  private noiseOffset: number = Math.random() * 1000;

  /**
   * Generates random jitter within specified range using pseudo-random noise for natural flow
   * @param range - Maximum jitter range (e.g., 0.5 for +/- 0.5 pixels)
   * @returns Random value between -range/2 and +range/2
   */
  generateJitter(range: number): number {
    // Use simple sine-based pseudo-noise for more organic variation
    this.noiseOffset += 0.1;
    const noise = Math.sin(this.noiseOffset) * Math.cos(this.noiseOffset * 0.5);
    return noise * range * 0.8 + (Math.random() - 0.5) * range * 0.4;
  }

  /**
   * Generates subtle color variation for realistic ink appearance
   * @param baseColor - Base ink color (e.g., '#1A1A2E')
   * @param intensity - Variation intensity (0.0 to 1.0)
   * @returns Slightly varied color string
   */
  generateColorVariation(baseColor: string, intensity: number): string {
    // Parse hex color to RGB components
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Generate subtle variations (±8% by default with intensity scaling)
    // Increased variation for more visible texture
    const variation = intensity * 0.08;

    // Use noise for consistent ink flow color changes
    const flowNoise = Math.sin(this.noiseOffset * 0.2);
    const randomVar = (Math.random() - 0.5) * 0.5;
    const totalVar = (flowNoise * 0.7 + randomVar) * variation * 255;

    // Apply variations while keeping values in valid range
    const newR = Math.max(0, Math.min(255, r + totalVar));
    const newG = Math.max(0, Math.min(255, g + totalVar));
    const newB = Math.max(0, Math.min(255, b + totalVar));

    // Convert back to hex
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
  }

  /**
   * Generates random rotation for character tilting
   * @param range - Maximum rotation range in degrees (e.g., 0.5 for +/- 0.5 degrees)
   * @returns Random rotation in radians
   */
  generateRotation(range: number): number {
    // Generate random rotation in degrees, then convert to radians
    // Mix noise and random for natural handwriting slant variations
    const noise = Math.cos(this.noiseOffset * 0.8);
    const degrees = (noise * 0.6 + (Math.random() - 0.5) * 0.8) * range;
    return degrees * (Math.PI / 180);
  }
}

/**
 * Subtle variation strategy with reduced randomness for more consistent appearance
 * Alternative implementation following Open/Closed Principle
 */
export class SubtleVariationStrategy implements IVariationStrategy {
  /**
   * Generates more subtle jitter with reduced range
   */
  generateJitter(range: number): number {
    // Use 60% of the specified range for more subtle effect
    return (Math.random() - 0.5) * range * 0.6;
  }

  /**
   * Generates very subtle color variations
   */
  generateColorVariation(baseColor: string, intensity: number): string {
    // Use the same algorithm but with reduced intensity
    const strategy = new RealisticVariationStrategy();
    return strategy.generateColorVariation(baseColor, intensity * 0.5);
  }

  /**
   * Generates minimal rotation for subtle tilting
   */
  generateRotation(range: number): number {
    // Use 40% of the specified range for minimal tilting
    const degrees = (Math.random() - 0.5) * range * 0.4;
    return degrees * (Math.PI / 180);
  }
}