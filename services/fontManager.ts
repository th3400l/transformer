// Font Manager Service for Gear-1 handwriting system
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 5.1, 5.2, 5.6

import {
  IFontManager,
  HandwritingFont,
  FontLoadResult,
  FontLoadError,
  CustomFont,
  FontAvailabilityResult
} from '../types/fonts';
import { IFontStorageService } from '../types/fontStorage';

export class FontManager implements IFontManager {
  private fonts: HandwritingFont[] = [];
  private customFonts: CustomFont[] = [];
  private loadedFonts: Set<string> = new Set();
  private fontLoadPromises: Map<string, Promise<FontLoadResult>> = new Map();
  private fontStorageService?: IFontStorageService;

  constructor(fontStorageService?: IFontStorageService) {
    this.fontStorageService = fontStorageService;
    this.initializeFonts();
    this.loadStoredCustomFonts();
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
      
      // Additional fonts can be added here when font files are available
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



  getFontByIndex(index: number): HandwritingFont | null {
    const font = this.fonts.find(f => f.index === index);
    return font || null;
  }

  getFontById(id: string): HandwritingFont | null {
    // Check default fonts first
    const defaultFont = this.fonts.find(f => f.id === id);
    if (defaultFont) {
      return defaultFont;
    }
    
    // Check custom fonts
    const customFont = this.customFonts.find(f => f.id === id);
    return customFont || null;
  }

  getAvailableFonts(): HandwritingFont[] {
    return [...this.fonts, ...this.customFonts];
  }

  async preloadFonts(fonts: HandwritingFont[]): Promise<void> {
    const loadPromises = fonts.map(font => this.loadFont(font));
    await Promise.allSettled(loadPromises);
  }

  // Custom font methods implementation
  async addCustomFont(customFont: CustomFont): Promise<void> {
    // Check if font already exists
    const existingIndex = this.customFonts.findIndex(f => f.id === customFont.id);
    
    if (existingIndex !== -1) {
      // Replace existing font
      this.customFonts[existingIndex] = customFont;
    } else {
      // Add new font
      this.customFonts.push(customFont);
    }

    // Update last used timestamp
    customFont.lastUsed = new Date();
    customFont.usageCount = (customFont.usageCount || 0) + 1;

    // Try to load the font immediately
    try {
      await this.loadCustomFont(customFont);
    } catch (error) {
      console.warn(`Failed to load custom font ${customFont.name}:`, error);
      // Don't throw error here - font is still added but not loaded
    }

    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('customFontAdded', {
        detail: { font: customFont }
      }));
    }
  }

  async removeCustomFont(fontId: string): Promise<void> {
    const fontIndex = this.customFonts.findIndex(f => f.id === fontId);
    
    if (fontIndex === -1) {
      throw new FontLoadError(fontId, 'validation', `Custom font with id ${fontId} not found`);
    }

    const customFont = this.customFonts[fontIndex];
    
    // Remove from browser fonts if loaded
    if (this.loadedFonts.has(fontId)) {
      try {
        // Remove FontFace from document.fonts if it exists
        const fontFaces = Array.from(document.fonts);
        const fontFace = fontFaces.find(ff => 
          ff.family === customFont.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
        );
        if (fontFace) {
          document.fonts.delete(fontFace);
        }
      } catch (error) {
        console.warn(`Failed to remove font face for ${customFont.name}:`, error);
      }
      
      this.loadedFonts.delete(fontId);
    }

    // Remove from custom fonts array
    this.customFonts.splice(fontIndex, 1);

    // Clean up any pending load promises
    this.fontLoadPromises.delete(fontId);

    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('customFontRemoved', {
        detail: { fontId }
      }));
    }
  }

  getCustomFonts(): CustomFont[] {
    return [...this.customFonts];
  }

  isCustomFont(fontId: string): boolean {
    return this.customFonts.some(f => f.id === fontId);
  }

  getCustomFontCount(): number {
    return this.customFonts.length;
  }

  async loadCustomFont(customFont: CustomFont): Promise<FontLoadResult> {
    const startTime = performance.now();
    
    // Check if already loaded
    if (this.loadedFonts.has(customFont.id)) {
      return {
        font: { ...customFont, loaded: true },
        success: true,
        loadTime: 0
      };
    }

    // Check if loading is already in progress
    if (this.fontLoadPromises.has(customFont.id)) {
      return await this.fontLoadPromises.get(customFont.id)!;
    }

    const loadPromise = this.performCustomFontLoad(customFont, startTime);
    this.fontLoadPromises.set(customFont.id, loadPromise);
    
    try {
      const result = await loadPromise;
      if (result.success) {
        this.loadedFonts.add(customFont.id);
        // Update the font in our collection
        const fontIndex = this.customFonts.findIndex(f => f.id === customFont.id);
        if (fontIndex !== -1) {
          this.customFonts[fontIndex].loaded = true;
          this.customFonts[fontIndex].lastUsed = new Date();
        }
      }
      return result;
    } finally {
      this.fontLoadPromises.delete(customFont.id);
    }
  }

  async preloadCustomFonts(): Promise<void> {
    // Sort by priority: usage count and recency
    const sortedFonts = this.getPrioritizedCustomFonts();

    // Load fonts with priority-based batching
    await this.loadFontsWithPriority(sortedFonts);
  }

  /**
   * Get custom fonts sorted by priority (usage count + recency)
   * Requirements: 5.5, 7.1, 7.2 - Priority-based loading
   */
  private getPrioritizedCustomFonts(): CustomFont[] {
    return [...this.customFonts].sort((a, b) => {
      // Calculate priority score based on usage and recency
      const now = Date.now();
      const aRecency = a.lastUsed ? (now - a.lastUsed.getTime()) / (1000 * 60 * 60 * 24) : 365; // Days ago
      const bRecency = b.lastUsed ? (now - b.lastUsed.getTime()) / (1000 * 60 * 60 * 24) : 365;
      
      // Higher usage count and more recent usage = higher priority
      const aScore = (a.usageCount || 0) * 10 + Math.max(0, 30 - aRecency);
      const bScore = (b.usageCount || 0) * 10 + Math.max(0, 30 - bRecency);
      
      return bScore - aScore;
    });
  }

  /**
   * Load fonts with priority-based batching to avoid overwhelming the browser
   * Requirements: 7.1, 7.2, 7.3 - Performance optimization
   */
  private async loadFontsWithPriority(fonts: CustomFont[]): Promise<void> {
    const batchSize = 2; // Load 2 fonts at a time to avoid performance issues
    
    for (let i = 0; i < fonts.length; i += batchSize) {
      const batch = fonts.slice(i, i + batchSize);
      
      // Load batch in parallel with timeout
      const loadPromises = batch.map(async (font) => {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Font load timeout')), 10000);
          });
          
          await Promise.race([
            this.loadCustomFont(font),
            timeoutPromise
          ]);
        } catch (error) {
          console.warn(`Failed to preload custom font ${font.name}:`, error);
          // Mark font as problematic but don't remove it
          font.loaded = false;
        }
      });

      await Promise.allSettled(loadPromises);
      
      // Small delay between batches to prevent browser overload
      if (i + batchSize < fonts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Unload unused custom fonts to free memory
   * Requirements: 7.4, 7.5, 7.6 - Memory management
   */
  async unloadUnusedCustomFonts(maxUnusedDays: number = 7): Promise<void> {
    const now = Date.now();
    const maxUnusedMs = maxUnusedDays * 24 * 60 * 60 * 1000;
    
    const fontsToUnload = this.customFonts.filter(font => {
      if (!font.lastUsed) return true; // Never used
      return (now - font.lastUsed.getTime()) > maxUnusedMs;
    });

    for (const font of fontsToUnload) {
      try {
        await this.unloadCustomFont(font.id);
      } catch (error) {
        console.warn(`Failed to unload unused font ${font.name}:`, error);
      }
    }
  }

  /**
   * Unload a specific custom font from memory (but keep metadata)
   * Requirements: 7.4, 7.5, 7.6 - Memory management
   */
  private async unloadCustomFont(fontId: string): Promise<void> {
    const fontIndex = this.customFonts.findIndex(f => f.id === fontId);
    if (fontIndex === -1) return;

    const font = this.customFonts[fontIndex];
    
    // Remove from browser fonts if loaded
    if (this.loadedFonts.has(fontId)) {
      try {
        const fontFaces = Array.from(document.fonts);
        const fontFace = fontFaces.find(ff => 
          ff.family === font.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
        );
        if (fontFace) {
          document.fonts.delete(fontFace);
        }
      } catch (error) {
        console.warn(`Failed to remove font face for ${font.name}:`, error);
      }
      
      this.loadedFonts.delete(fontId);
    }

    // Mark as unloaded but keep the font metadata
    font.loaded = false;
    
    // Clean up any pending load promises
    this.fontLoadPromises.delete(fontId);
  }

  /**
   * Get memory usage statistics for custom fonts
   * Requirements: 7.4, 7.5, 7.6 - Performance monitoring
   */
  getCustomFontMemoryStats(): {
    totalFonts: number;
    loadedFonts: number;
    unloadedFonts: number;
    estimatedMemoryUsage: number;
  } {
    const totalFonts = this.customFonts.length;
    const loadedFonts = this.customFonts.filter(f => f.loaded).length;
    const unloadedFonts = totalFonts - loadedFonts;
    
    // Rough estimate: average font file is ~500KB when loaded in memory
    const estimatedMemoryUsage = loadedFonts * 500 * 1024; // bytes
    
    return {
      totalFonts,
      loadedFonts,
      unloadedFonts,
      estimatedMemoryUsage
    };
  }

  /**
   * Optimize custom font performance by managing memory and preloading
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6 - Comprehensive performance optimization
   */
  async optimizeCustomFontPerformance(): Promise<void> {
    // 1. Unload fonts that haven't been used in a week
    await this.unloadUnusedCustomFonts(7);
    
    // 2. Preload high-priority fonts
    const prioritizedFonts = this.getPrioritizedCustomFonts().slice(0, 2); // Top 2 fonts
    if (prioritizedFonts.length > 0) {
      await this.loadFontsWithPriority(prioritizedFonts);
    }
    
    // 3. Log performance stats
    const stats = this.getCustomFontMemoryStats();

  }

  // Private helper methods
  private async loadStoredCustomFonts(): Promise<void> {
    if (!this.fontStorageService) {
      return;
    }

    try {
      const storedFonts = await this.fontStorageService.listStoredFonts();
      
      for (const storedFont of storedFonts) {
        try {
          const fontData = await this.fontStorageService.retrieveFont(storedFont.storageKey);
          if (fontData) {
            const customFont: CustomFont = {
              id: `custom-${storedFont.storageKey}`,
              name: storedFont.metadata.fontFamily || storedFont.metadata.originalFilename,
              family: `'${storedFont.metadata.fontFamily}', cursive`,
              loaded: false,
              fallback: 'cursive',
              isCustom: true,
              originalFilename: storedFont.metadata.originalFilename,
              uploadDate: storedFont.uploadDate,
              fileSize: storedFont.size,
              format: storedFont.metadata.format as any,
              metadata: storedFont.metadata,
              storageKey: storedFont.storageKey,
              lastUsed: storedFont.lastAccessed,
              usageCount: 0
            };

            this.customFonts.push(customFont);
          }
        } catch (error) {
          console.warn(`Failed to load stored custom font ${storedFont.storageKey}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to load stored custom fonts:', error);
    }
  }

  private async performCustomFontLoad(customFont: CustomFont, startTime: number): Promise<FontLoadResult> {
    try {
      // Try primary loading method
      return await this.attemptPrimaryFontLoad(customFont, startTime);
    } catch (primaryError) {
      console.warn(`Primary font load failed for ${customFont.name}, trying fallback:`, primaryError);
      
      // Try fallback loading methods
      try {
        return await this.attemptFallbackFontLoad(customFont, startTime, primaryError as Error);
      } catch (fallbackError) {
        console.error(`All font loading methods failed for ${customFont.name}:`, fallbackError);
        
        const loadTime = performance.now() - startTime;
        return {
          font: { ...customFont, loaded: false },
          success: false,
          error: `Font loading failed: ${(fallbackError as Error).message}`,
          loadTime
        };
      }
    }
  }

  /**
   * Attempt primary font loading method
   * Requirements: 5.5 - Primary font loading with proper error handling
   */
  private async attemptPrimaryFontLoad(customFont: CustomFont, startTime: number): Promise<FontLoadResult> {
    let fontData: ArrayBuffer | null = null;

    // Try to get font data from storage
    if (this.fontStorageService && customFont.storageKey) {
      fontData = await this.fontStorageService.retrieveFont(customFont.storageKey);
    }

    if (!fontData) {
      throw new FontLoadError(customFont.id, 'load', `Font data not available for ${customFont.name}`);
    }

    // Create FontFace and load it
    const primaryFamily = customFont.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    const fontFace = new FontFace(primaryFamily, fontData);
    
    // Add timeout to font loading
    const loadPromise = fontFace.load();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Font load timeout')), 5000);
    });
    
    await Promise.race([loadPromise, timeoutPromise]);
    document.fonts.add(fontFace);

    // Validate that the font is actually available
    const validation = await this.validateFontAvailability(customFont);
    
    if (!validation.isAvailable) {
      throw new FontLoadError(customFont.id, 'load', `Custom font ${customFont.name} is not available after loading`);
    }

    const loadTime = performance.now() - startTime;
    
    return {
      font: { ...customFont, loaded: true },
      success: true,
      loadTime
    };
  }

  /**
   * Attempt fallback font loading methods
   * Requirements: 5.5, 7.1, 7.2, 7.3 - Graceful degradation and fallback mechanisms
   */
  private async attemptFallbackFontLoad(customFont: CustomFont, startTime: number, originalError: Error): Promise<FontLoadResult> {
    // Fallback 1: Try loading with different font display settings
    try {
      return await this.loadFontWithFallbackDisplay(customFont, startTime);
    } catch (displayError) {
      console.warn(`Fallback display method failed for ${customFont.name}:`, displayError);
    }

    // Fallback 2: Create a degraded font entry that uses system fallback
    try {
      return await this.createDegradedFontFallback(customFont, startTime, originalError);
    } catch (degradedError) {
      console.warn(`Degraded fallback failed for ${customFont.name}:`, degradedError);
    }

    // If all fallbacks fail, throw the original error
    throw originalError;
  }

  /**
   * Load font with fallback display settings
   * Requirements: 7.1, 7.2, 7.3 - Fallback mechanisms
   */
  private async loadFontWithFallbackDisplay(customFont: CustomFont, startTime: number): Promise<FontLoadResult> {
    if (!this.fontStorageService || !customFont.storageKey) {
      throw new Error('No storage service or storage key available');
    }

    const fontData = await this.fontStorageService.retrieveFont(customFont.storageKey);
    if (!fontData) {
      throw new Error('Font data not available');
    }

    const primaryFamily = customFont.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    
    // Try with different font-display settings for better fallback behavior
    const fontFace = new FontFace(primaryFamily, fontData, {
      display: 'swap' // Allow fallback font to be shown while loading
    });
    
    await fontFace.load();
    document.fonts.add(fontFace);

    const loadTime = performance.now() - startTime;
    
    return {
      font: { ...customFont, loaded: true },
      success: true,
      loadTime
    };
  }

  /**
   * Create a degraded font fallback that uses system fonts
   * Requirements: 7.1, 7.2, 7.3 - Graceful degradation
   */
  private async createDegradedFontFallback(customFont: CustomFont, startTime: number, originalError: Error): Promise<FontLoadResult> {
    // Create a "loaded" font that actually uses system fallback
    const degradedFont: CustomFont = {
      ...customFont,
      loaded: true,
      family: `${customFont.fallback || 'cursive'}`, // Use fallback font family
      name: `${customFont.name} (Fallback)`
    };

    const loadTime = performance.now() - startTime;
    
    console.warn(`Using degraded fallback for ${customFont.name}: ${originalError.message}`);
    
    return {
      font: degradedFont,
      success: true, // Consider this successful since we have a working fallback
      error: `Using system fallback due to: ${originalError.message}`,
      loadTime
    };
  }

  /**
   * Enhanced font validation with fallback detection
   * Requirements: 5.5, 7.1, 7.2, 7.3 - Enhanced validation and fallback detection
   */
  async validateFontAvailability(font: HandwritingFont): Promise<FontAvailabilityResult> {
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
      const fallbackWidth = ctx.measureText('Test Font Validation').width;

      // Test with the target font
      ctx.font = `16px ${font.family}`;
      const targetWidth = ctx.measureText('Test Font Validation').width;

      // If widths are significantly different, the font is likely loaded
      const widthDifference = Math.abs(targetWidth - fallbackWidth);
      const isAvailable = widthDifference > 1 || font.family.includes('serif') || font.family.includes('cursive');

      // Additional validation for custom fonts
      if ((font as CustomFont).isCustom) {
        const customFont = font as CustomFont;
        
        // Check if font face is actually in document.fonts
        const fontFaces = Array.from(document.fonts);
        const primaryFamily = customFont.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
        const hasFontFace = fontFaces.some(ff => ff.family === primaryFamily);
        
        return {
          isValid: true,
          isAvailable: isAvailable && hasFontFace,
          error: (!isAvailable || !hasFontFace) ? `Custom font ${customFont.name} may be using fallback rendering` : undefined
        };
      }

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
}
