// Font management types and interfaces for Gear-1 handwriting system
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

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

export interface FontValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
}

export interface IFontManager {
  loadAllFonts(): Promise<FontLoadResult[]>;
  getFontByIndex(index: number): HandwritingFont | null;
  getFontById(id: string): HandwritingFont | null;
  validateFontAvailability(font: HandwritingFont): Promise<FontValidationResult>;
  preloadFonts(fonts: HandwritingFont[]): Promise<void>;
  getAvailableFonts(): HandwritingFont[];
  scanFontFiles(): Promise<string[]>;
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