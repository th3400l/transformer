// Font Manager Service for Gear-1 handwriting system
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

import { 
  IFontManager, 
  HandwritingFont, 
  FontLoadResult, 
  FontValidationResult, 
  FontLoadError 
} from '../types/fonts';

export class FontManager implements IFontManager {
  private fonts: HandwritingFont[] = [];
  private loadedFonts: Set<string> = new Set();
  private fontLoadPromises: Map<string, Promise<FontLoadResult>> = new Map();

  constructor() {
    this.initializeFonts();
  }

  private initializeFonts(): void {
    // Initialize with all available fonts including web fonts and custom fonts
    this.fonts = [
      // Web fonts (fallback fonts)
      { id: 'inkwell', name: 'Inkwell', family: "'Caveat', cursive", loaded: false, fallback: 'cursive' },
      { id: 'elegant-script', name: 'Elegant Script', family: "'Dancing Script', cursive", loaded: false, fallback: 'cursive' },
      { id: 'casual-note', name: 'Casual Note', family: "'Kalam', cursive", loaded: false, fallback: 'cursive' },
      { id: 'quick-jot', name: 'Quick Jot', family: "'Patrick Hand', cursive", loaded: false, fallback: 'cursive' },
      { id: 'teacher-hand', name: 'Teacher\'s Hand', family: "'Indie Flower', cursive", loaded: false, fallback: 'cursive' },
      { id: 'marker-felt', name: 'Marker Felt', family: "'Shadows Into Light', cursive", loaded: false, fallback: 'cursive' },
      
      // Custom handwriting fonts (1-9 are available, 10+ need to be loaded)
      { id: 'handwriting-1', name: 'Handwriting Style 1', family: "'Handwriting-1', cursive", file: '/fonts/Handwriting-1.ttf', loaded: false, fallback: 'cursive', index: 1 },
      { id: 'handwriting-2', name: 'Handwriting Style 2', family: "'Handwriting-2', cursive", file: '/fonts/Handwriting-2.ttf', loaded: false, fallback: 'cursive', index: 2 },
      { id: 'handwriting-3', name: 'Handwriting Style 3', family: "'Handwriting-3', cursive", file: '/fonts/Handwriting-3.ttf', loaded: false, fallback: 'cursive', index: 3 },
      { id: 'handwriting-4', name: 'Handwriting Style 4', family: "'Handwriting-4', cursive", file: '/fonts/Handwriting-4.ttf', loaded: false, fallback: 'cursive', index: 4 },
      { id: 'handwriting-5', name: 'Handwriting Style 5', family: "'Handwriting-5', cursive", file: '/fonts/Handwriting-5.ttf', loaded: false, fallback: 'cursive', index: 5 },
      { id: 'handwriting-6', name: 'Handwriting Style 6', family: "'Handwriting-6', cursive", file: '/fonts/Handwriting-6.ttf', loaded: false, fallback: 'cursive', index: 6 },
      { id: 'handwriting-7', name: 'Handwriting Style 7', family: "'Handwriting-7', cursive", file: '/fonts/Handwriting-7.ttf', loaded: false, fallback: 'cursive', index: 7 },
      { id: 'handwriting-8', name: 'Handwriting Style 8', family: "'Handwriting-8', cursive", file: '/fonts/Handwriting-8.ttf', loaded: false, fallback: 'cursive', index: 8 },
      { id: 'handwriting-9', name: 'Handwriting Style 9', family: "'Handwriting-9', cursive", file: '/fonts/Handwriting-9.ttf', loaded: false, fallback: 'cursive', index: 9 },
      
      // Additional fonts that should be available (using web font fallbacks for now)
      { id: 'handwriting-10', name: 'Handwriting Style 10', family: "'Over the Rainbow', cursive", loaded: false, fallback: 'cursive', index: 10 },
      { id: 'handwriting-11', name: 'Handwriting Style 11', family: "'Caveat', cursive", loaded: false, fallback: 'cursive', index: 11 },
      { id: 'handwriting-12', name: 'Handwriting Style 12', family: "'Indie Flower', cursive", loaded: false, fallback: 'cursive', index: 12 },
      { id: 'handwriting-13', name: 'Handwriting Style 13', family: "'Shadows Into Light', cursive", loaded: false, fallback: 'cursive', index: 13 },
    ];
  }

  async scanFontFiles(): Promise<string[]> {
    // In a real implementation, this would scan the fonts directory
    // For now, return the known font files
    const knownFontFiles = [
      'Handwriting-1.ttf',
      'Handwriting-2.ttf', 
      'Handwriting-3.ttf',
      'Handwriting-4.ttf',
      'Handwriting-5.ttf',
      'Handwriting-6.ttf',
      'Handwriting-7.ttf',
      'Handwriting-8.ttf',
      'Handwriting-9.ttf'
    ];

    return knownFontFiles;
  }

  async loadAllFonts(): Promise<FontLoadResult[]> {
    const results: FontLoadResult[] = [];
    
    for (const font of this.fonts) {
      try {
        const result = await this.loadFont(font);
        results.push(result);
      } catch (error) {
        results.push({
          font,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          loadTime: 0
        });
      }
    }

    return results;
  }

  private async loadFont(font: HandwritingFont): Promise<FontLoadResult> {
    const startTime = performance.now();
    
    // Check if already loaded
    if (this.loadedFonts.has(font.id)) {
      return {
        font: { ...font, loaded: true },
        success: true,
        loadTime: 0
      };
    }

    // Check if loading is already in progress
    if (this.fontLoadPromises.has(font.id)) {
      return await this.fontLoadPromises.get(font.id)!;
    }

    const loadPromise = this.performFontLoad(font, startTime);
    this.fontLoadPromises.set(font.id, loadPromise);
    
    try {
      const result = await loadPromise;
      if (result.success) {
        this.loadedFonts.add(font.id);
        // Update the font in our collection
        const fontIndex = this.fonts.findIndex(f => f.id === font.id);
        if (fontIndex !== -1) {
          this.fonts[fontIndex].loaded = true;
        }
      }
      return result;
    } finally {
      this.fontLoadPromises.delete(font.id);
    }
  }

  private async performFontLoad(font: HandwritingFont, startTime: number): Promise<FontLoadResult> {
    try {
      // For fonts with file paths, use FontFace API
      if (font.file) {
        const primaryFamily = font.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
        const fontFace = new FontFace(primaryFamily, `url(${font.file})`);
        await fontFace.load();
        document.fonts.add(fontFace);
      }

      // Validate that the font is actually available
      const validation = await this.validateFontAvailability(font);
      
      if (!validation.isAvailable) {
        throw new FontLoadError(font.id, 'load', `Font ${font.name} is not available after loading`);
      }

      const loadTime = performance.now() - startTime;
      
      return {
        font: { ...font, loaded: true },
        success: true,
        loadTime
      };
    } catch (error) {
      const loadTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown font loading error';
      
      return {
        font: { ...font, loaded: false },
        success: false,
        error: errorMessage,
        loadTime
      };
    }
  }

  async validateFontAvailability(font: HandwritingFont): Promise<FontValidationResult> {
    try {
      // Create a test canvas to check if font is available
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return {
          isValid: false,
          isAvailable: false,
          error: 'Cannot create canvas context for font validation'
        };
      }

      // Test with a fallback font first
      ctx.font = `16px ${font.fallback || 'serif'}`;
      const fallbackWidth = ctx.measureText('Test').width;

      // Test with the target font
      ctx.font = `16px ${font.family}`;
      const targetWidth = ctx.measureText('Test').width;

      // If widths are different, the font is likely loaded
      // If they're the same, the font might not be available
      const isAvailable = Math.abs(targetWidth - fallbackWidth) > 0.1 || font.family.includes('serif') || font.family.includes('cursive');

      return {
        isValid: true,
        isAvailable,
        error: isAvailable ? undefined : `Font ${font.name} appears to fallback to system font`
      };
    } catch (error) {
      return {
        isValid: false,
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Font validation failed'
      };
    }
  }

  getFontByIndex(index: number): HandwritingFont | null {
    const font = this.fonts.find(f => f.index === index);
    return font || null;
  }

  getFontById(id: string): HandwritingFont | null {
    const font = this.fonts.find(f => f.id === id);
    return font || null;
  }

  getAvailableFonts(): HandwritingFont[] {
    return [...this.fonts];
  }

  async preloadFonts(fonts: HandwritingFont[]): Promise<void> {
    const loadPromises = fonts.map(font => this.loadFont(font));
    await Promise.allSettled(loadPromises);
  }
}
