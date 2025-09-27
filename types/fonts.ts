// Font management types and interfaces for Gear-1 handwriting system
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

import type { FontValidationResult } from './fontValidation';

export interface FontAvailabilityResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
}

// Forward declaration to avoid circular dependency
export interface CustomFont extends HandwritingFont {
  isCustom: true;
  originalFilename: string;
  uploadDate: Date;
  fileSize: number;
  format: string;
  metadata: any;
  storageKey: string;
  validationResult?: any;
  lastUsed?: Date;
  usageCount: number;
}

export interface HandwritingFont {
  id: string;
  name: string;
  family: string;
  file?: string;
  loaded: boolean;
  fallback?: string;
  index?: number;
}

export interface FontLoadResult {
  font: HandwritingFont;
  success: boolean;
  error?: string;
  loadTime: number;
}

export interface IFontManager {
  loadAllFonts(): Promise<FontLoadResult[]>;
  getFontByIndex(index: number): HandwritingFont | null;
  getFontById(id: string): HandwritingFont | null;
  validateFontAvailability(font: HandwritingFont): Promise<FontAvailabilityResult>;
  preloadFonts(fonts: HandwritingFont[]): Promise<void>;
  getAvailableFonts(): HandwritingFont[];
  scanFontFiles(): Promise<string[]>;
  
  // Custom font methods
  addCustomFont(customFont: CustomFont): Promise<void>;
  removeCustomFont(fontId: string): Promise<void>;
  getCustomFonts(): CustomFont[];
  isCustomFont(fontId: string): boolean;
  getCustomFontCount(): number;
  loadCustomFont(customFont: CustomFont): Promise<FontLoadResult>;
  preloadCustomFonts(): Promise<void>;
}

export interface FontError extends Error {
  fontId: string;
  type: 'load' | 'validation' | 'fallback';
}

export class FontLoadError extends Error implements FontError {
  constructor(
    public readonly fontId: string,
    public readonly type: 'load' | 'validation' | 'fallback',
    message: string
  ) {
    super(message);
    this.name = 'FontLoadError';
  }
}
