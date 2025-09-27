// Font Character Support Analyzer for custom font upload system
// Requirements: 2.4, 2.5, 2.6

import { CharacterSupportResult, BASIC_CHARACTER_SETS } from '../types/fontValidation';

/**
 * FontCharacterAnalyzer provides comprehensive character support analysis
 * for uploaded font files to ensure compatibility with the rendering engine
 */
export class FontCharacterAnalyzer {
  
  /**
   * Analyzes character support for a font file
   * @param file - Font file to analyze
   * @param fontData - Font data as ArrayBuffer
   * @returns Character support analysis result
   */
  async analyzeCharacterSupport(file: File, fontData: ArrayBuffer): Promise<CharacterSupportResult> {
    try {
      const fontUrl = URL.createObjectURL(new Blob([fontData]));
      
      try {
        // Load font temporarily for testing
        const testFontFace = new FontFace('CharacterTest', `url(${fontUrl})`);
        await testFontFace.load();
        
        // Add to document fonts temporarily
        document.fonts.add(testFontFace);
        
        try {
          return await this.performCharacterAnalysis('CharacterTest');
        } finally {
          document.fonts.delete(testFontFace);
        }
        
      } finally {
        URL.revokeObjectURL(fontUrl);
      }
      
    } catch (error) {
      // Return conservative result if analysis fails
      return this.createFailsafeResult();
    }
  }

  /**
   * Performs detailed character analysis using canvas rendering
   */
  private async performCharacterAnalysis(fontFamily: string): Promise<CharacterSupportResult> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Cannot create canvas context for character analysis');
    }

    // Set up canvas for testing
    canvas.width = 200;
    canvas.height = 50;
    ctx.font = `16px ${fontFamily}`;
    ctx.textBaseline = 'top';

    // Test basic character sets
    const basicLatin = await this.testCharacterSet(ctx, BASIC_CHARACTER_SETS.BASIC_LATIN, fontFamily);
    const numbers = await this.testCharacterSet(ctx, BASIC_CHARACTER_SETS.NUMBERS, fontFamily);
    const punctuation = await this.testCharacterSet(ctx, BASIC_CHARACTER_SETS.PUNCTUATION, fontFamily);
    
    // Test extended Latin characters
    const extendedLatin = await this.testExtendedLatin(ctx, fontFamily);
    
    // Find missing glyphs
    const missingGlyphs = await this.findMissingGlyphs(ctx, fontFamily);
    
    // Detect special characters
    const specialCharacters = await this.detectSpecialCharacters(ctx, fontFamily);
    
    const hasRequiredGlyphs = basicLatin && numbers && punctuation;

    return {
      basicLatin,
      extendedLatin,
      numbers,
      punctuation,
      specialCharacters,
      missingGlyphs,
      hasRequiredGlyphs
    };
  }

  /**
   * Tests if a character set is supported by the font
   */
  private async testCharacterSet(
    ctx: CanvasRenderingContext2D,
    characters: string,
    fontFamily: string
  ): Promise<boolean> {
    try {
      // Test with fallback font first
      ctx.font = '16px serif';
      const fallbackWidths = this.measureCharacters(ctx, characters);
      
      // Test with target font
      ctx.font = `16px ${fontFamily}`;
      const targetWidths = this.measureCharacters(ctx, characters);
      
      // Compare widths - if different, font likely supports the characters
      let supportedCount = 0;
      for (let i = 0; i < characters.length; i++) {
        if (Math.abs(targetWidths[i] - fallbackWidths[i]) > 0.1) {
          supportedCount++;
        }
      }
      
      // Consider supported if at least 80% of characters render differently
      return supportedCount >= characters.length * 0.8;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Tests extended Latin character support
   */
  private async testExtendedLatin(ctx: CanvasRenderingContext2D, fontFamily: string): Promise<boolean> {
    const extendedLatinChars = 'àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ';
    return this.testCharacterSet(ctx, extendedLatinChars, fontFamily);
  }

  /**
   * Finds characters that are missing or not properly supported
   */
  private async findMissingGlyphs(ctx: CanvasRenderingContext2D, fontFamily: string): Promise<string[]> {
    const missingGlyphs: string[] = [];
    const testChars = BASIC_CHARACTER_SETS.BASIC_LATIN + BASIC_CHARACTER_SETS.NUMBERS + BASIC_CHARACTER_SETS.PUNCTUATION;
    
    try {
      // Test with fallback font
      ctx.font = '16px serif';
      const fallbackWidths = this.measureCharacters(ctx, testChars);
      
      // Test with target font
      ctx.font = `16px ${fontFamily}`;
      const targetWidths = this.measureCharacters(ctx, testChars);
      
      // Find characters that render the same (likely missing)
      for (let i = 0; i < testChars.length; i++) {
        if (Math.abs(targetWidths[i] - fallbackWidths[i]) < 0.1) {
          missingGlyphs.push(testChars[i]);
        }
      }
      
    } catch (error) {
      // Return empty array if analysis fails
    }
    
    return missingGlyphs.slice(0, 10); // Limit to first 10 missing glyphs
  }

  /**
   * Detects special characters supported by the font
   */
  private async detectSpecialCharacters(ctx: CanvasRenderingContext2D, fontFamily: string): Promise<string[]> {
    const specialChars = '\u00A9\u00AE\u2122\u20AC\u00A3\u00A5\u00A7\u00B6\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u201C\u201D\u2018\u2019\u2013\u2014';
    const supportedSpecial: string[] = [];
    
    try {
      // Test each special character
      ctx.font = '16px serif';
      const fallbackWidths = this.measureCharacters(ctx, specialChars);
      
      ctx.font = `16px ${fontFamily}`;
      const targetWidths = this.measureCharacters(ctx, specialChars);
      
      for (let i = 0; i < specialChars.length; i++) {
        if (Math.abs(targetWidths[i] - fallbackWidths[i]) > 0.1) {
          supportedSpecial.push(specialChars[i]);
        }
      }
      
    } catch (error) {
      // Return empty array if analysis fails
    }
    
    return supportedSpecial;
  }

  /**
   * Measures the width of each character in a string
   */
  private measureCharacters(ctx: CanvasRenderingContext2D, characters: string): number[] {
    const widths: number[] = [];
    
    for (let i = 0; i < characters.length; i++) {
      try {
        const metrics = ctx.measureText(characters[i]);
        widths.push(metrics.width);
      } catch (error) {
        widths.push(0);
      }
    }
    
    return widths;
  }

  /**
   * Creates a failsafe result when analysis cannot be performed
   */
  private createFailsafeResult(): CharacterSupportResult {
    return {
      basicLatin: false,
      extendedLatin: false,
      numbers: false,
      punctuation: false,
      specialCharacters: [],
      missingGlyphs: [],
      hasRequiredGlyphs: false
    };
  }

  /**
   * Validates character support for handwriting rendering compatibility
   */
  validateHandwritingCompatibility(result: CharacterSupportResult): {
    isCompatible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!result.basicLatin) {
      issues.push('Font does not support basic Latin characters');
      recommendations.push('Ensure the font includes A-Z and a-z characters');
    }

    if (!result.numbers) {
      issues.push('Font does not support numeric characters');
      recommendations.push('Verify the font includes digits 0-9');
    }

    if (!result.punctuation) {
      issues.push('Font has limited punctuation support');
      recommendations.push('Check that common punctuation marks render correctly');
    }

    if (result.missingGlyphs.length > 5) {
      issues.push(`Font is missing ${result.missingGlyphs.length} common characters`);
      recommendations.push('Consider using a more complete font file');
    }

    const isCompatible = result.hasRequiredGlyphs && issues.length === 0;

    return {
      isCompatible,
      issues,
      recommendations
    };
  }
}
