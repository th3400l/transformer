// Font Validation Engine for custom font upload system
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

import {
  IFontValidationEngine,
  FontValidationResult,
  FormatValidationResult,
  SizeValidationResult,
  IntegrityValidationResult,
  CharacterSupportResult,
  ValidationError,
  ValidationWarning,
  FONT_MAGIC_NUMBERS,
  SUPPORTED_MIME_TYPES,
  MAX_FONT_FILE_SIZE,
  REQUIRED_FONT_TABLES,
  BASIC_CHARACTER_SETS
} from '../types/fontValidation';
import type { FontMetadata, FontFormat } from '../types/fontStorage';
import { FontMetadataExtractor } from './fontMetadataExtractor';
import { FontCharacterAnalyzer } from './fontCharacterAnalyzer';

/**
 * FontValidationEngine provides comprehensive validation for uploaded font files
 * Implements multi-stage validation pipeline with security checks
 */
export class FontValidationEngine implements IFontValidationEngine {
  private metadataExtractor: FontMetadataExtractor;
  private characterAnalyzer: FontCharacterAnalyzer;

  constructor() {
    this.metadataExtractor = new FontMetadataExtractor();
    this.characterAnalyzer = new FontCharacterAnalyzer();
  }
  
  /**
   * Performs comprehensive validation of a font file
   * @param file - Font file to validate
   * @returns Complete validation result with all checks
   */
  async validateFile(file: File): Promise<FontValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Stage 1: Format validation
      const formatResult = await this.validateFormat(file);
      if (!formatResult.isValid) {
        errors.push({
          type: 'format',
          message: `Invalid font format. Expected TTF, OTF, WOFF, or WOFF2, got ${formatResult.mimeType}`,
          severity: 'high',
          code: 'INVALID_FORMAT'
        });
      }

      // Stage 2: Size validation
      const sizeResult = await this.validateSize(file);
      if (!sizeResult.isValid) {
        errors.push({
          type: 'size',
          message: `Font file too large. Maximum size is ${MAX_FONT_FILE_SIZE / (1024 * 1024)}MB, got ${(sizeResult.fileSize / (1024 * 1024)).toFixed(2)}MB`,
          severity: 'high',
          code: 'FILE_TOO_LARGE'
        });
      }

      if (sizeResult.compressionRecommended) {
        warnings.push({
          type: 'performance',
          message: 'Font file is large and may impact loading performance',
          recommendation: 'Consider using WOFF2 format for better compression'
        });
      }

      // Stage 3: Integrity validation (only if format is valid)
      let integrityResult: IntegrityValidationResult;
      if (formatResult.isValid) {
        integrityResult = await this.validateIntegrity(file);
        if (!integrityResult.isValid) {
          errors.push({
            type: 'integrity',
            message: 'Font file appears to be corrupted or malformed',
            severity: 'high',
            code: 'CORRUPTED_FILE'
          });
        }

        if (!integrityResult.hasRequiredTables) {
          errors.push({
            type: 'integrity',
            message: 'Font file is missing required font tables',
            severity: 'medium',
            code: 'MISSING_TABLES'
          });
        }
      } else {
        integrityResult = {
          isValid: false,
          isCorrupted: true,
          canBeLoaded: false,
          fontTables: [],
          hasRequiredTables: false
        };
      }

      // Stage 4: Metadata extraction (only if integrity is valid)
      let metadata: FontMetadata | undefined;
      if (integrityResult.isValid) {
        try {
          const fontData = await this.readFileAsArrayBuffer(file);
          metadata = await this.metadataExtractor.extractMetadata(file, fontData);
          
          // Security validation of metadata
          if (!this.metadataExtractor.validateMetadataSecurity(metadata)) {
            errors.push({
              type: 'security',
              message: 'Font metadata contains potentially unsafe content',
              severity: 'high',
              code: 'UNSAFE_METADATA'
            });
          }
        } catch (error) {
          warnings.push({
            type: 'compatibility',
            message: 'Could not extract font metadata',
            recommendation: 'Font may still work but with limited information'
          });
        }
      }

      // Stage 5: Character support analysis (only if integrity is valid)
      let characterSupport: CharacterSupportResult | undefined;
      if (integrityResult.isValid) {
        try {
          const fontData = await this.readFileAsArrayBuffer(file);
          characterSupport = await this.characterAnalyzer.analyzeCharacterSupport(file, fontData);
          
          // Validate handwriting compatibility
          const compatibility = this.characterAnalyzer.validateHandwritingCompatibility(characterSupport);
          if (!compatibility.isCompatible) {
            compatibility.issues.forEach(issue => {
              warnings.push({
                type: 'character_support',
                message: issue,
                recommendation: compatibility.recommendations.join('; ')
              });
            });
          }
          
          if (!characterSupport.hasRequiredGlyphs) {
            warnings.push({
              type: 'character_support',
              message: 'Font may not support all required characters for handwriting',
              recommendation: 'Verify that the font displays correctly with your text'
            });
          }
        } catch (error) {
          warnings.push({
            type: 'character_support',
            message: 'Could not analyze character support',
            recommendation: 'Test the font with your intended text'
          });
        }
      }

      // Overall validation result
      const isValid = errors.length === 0 || errors.every(e => e.severity !== 'high');

      return {
        isValid,
        format: formatResult,
        size: sizeResult,
        integrity: integrityResult,
        metadata,
        characterSupport,
        errors,
        warnings
      };

    } catch (error) {
      errors.push({
        type: 'integrity',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        code: 'VALIDATION_ERROR'
      });

      return {
        isValid: false,
        format: { isValid: false, detectedFormat: null, mimeType: file.type, supportedByBrowser: false, magicNumberValid: false },
        size: { isValid: false, fileSize: file.size, maxAllowedSize: MAX_FONT_FILE_SIZE, compressionRecommended: false },
        integrity: { isValid: false, isCorrupted: true, canBeLoaded: false, fontTables: [], hasRequiredTables: false },
        errors,
        warnings
      };
    }
  }

  /**
   * Validates font file format using MIME type and magic number verification
   * @param file - Font file to validate
   * @returns Format validation result
   */
  async validateFormat(file: File): Promise<FormatValidationResult> {
    try {
      const mimeType = file.type;
      const supportedByBrowser = SUPPORTED_MIME_TYPES.includes(mimeType as any);

      // Read first 4 bytes for magic number validation
      const buffer = await this.readFileBytes(file, 0, 4);
      const magicBytes = new Uint8Array(buffer);
      
      let detectedFormat: FontFormat | null = null;
      let magicNumberValid = false;

      // Check magic numbers
      if (this.compareBytes(magicBytes, FONT_MAGIC_NUMBERS.WOFF2)) {
        detectedFormat = 'woff2';
        magicNumberValid = true;
      } else if (this.compareBytes(magicBytes, FONT_MAGIC_NUMBERS.WOFF)) {
        detectedFormat = 'woff';
        magicNumberValid = true;
      } else if (this.compareBytes(magicBytes, FONT_MAGIC_NUMBERS.OTF)) {
        detectedFormat = 'otf';
        magicNumberValid = true;
      } else if (this.compareBytes(magicBytes, FONT_MAGIC_NUMBERS.TTF)) {
        detectedFormat = 'ttf';
        magicNumberValid = true;
      }

      // Fallback to file extension if magic number doesn't match
      if (!detectedFormat) {
        const extension = file.name.toLowerCase().split('.').pop();
        if (extension && ['ttf', 'otf', 'woff', 'woff2'].includes(extension)) {
          detectedFormat = extension as FontFormat;
        }
      }

      const isValid = magicNumberValid && supportedByBrowser && detectedFormat !== null;

      return {
        isValid,
        detectedFormat,
        mimeType,
        supportedByBrowser,
        magicNumberValid
      };

    } catch (error) {
      return {
        isValid: false,
        detectedFormat: null,
        mimeType: file.type,
        supportedByBrowser: false,
        magicNumberValid: false
      };
    }
  }

  /**
   * Validates font file size and provides compression recommendations
   * @param file - Font file to validate
   * @returns Size validation result
   */
  async validateSize(file: File): Promise<SizeValidationResult> {
    const fileSize = file.size;
    const isValid = fileSize <= MAX_FONT_FILE_SIZE;
    const compressionRecommended = fileSize > (2 * 1024 * 1024); // Recommend compression for files > 2MB

    return {
      isValid,
      fileSize,
      maxAllowedSize: MAX_FONT_FILE_SIZE,
      compressionRecommended
    };
  }

  /**
   * Validates font file integrity and checks for required font tables
   * @param file - Font file to validate
   * @returns Integrity validation result
   */
  async validateIntegrity(file: File): Promise<IntegrityValidationResult> {
    try {
      // Create a temporary FontFace to test if the font can be loaded
      const fontData = await this.readFileAsArrayBuffer(file);
      const fontUrl = URL.createObjectURL(new Blob([fontData]));
      
      let canBeLoaded = false;
      let fontTables: string[] = [];
      let hasRequiredTables = false;

      try {
        // Test font loading
        const testFontFace = new FontFace('TestFont', `url(${fontUrl})`);
        await testFontFace.load();
        canBeLoaded = true;

        // Extract font tables (basic implementation)
        fontTables = await this.extractFontTables(fontData);
        hasRequiredTables = REQUIRED_FONT_TABLES.every(table => 
          fontTables.includes(table)
        );

      } catch (loadError) {
        canBeLoaded = false;
      } finally {
        URL.revokeObjectURL(fontUrl);
      }

      const isValid = canBeLoaded && !this.isCorrupted(fontData);

      return {
        isValid,
        isCorrupted: !isValid,
        canBeLoaded,
        fontTables,
        hasRequiredTables
      };

    } catch (error) {
      return {
        isValid: false,
        isCorrupted: true,
        canBeLoaded: false,
        fontTables: [],
        hasRequiredTables: false
      };
    }
  }

  /**
   * Extracts font metadata safely from the font file
   * @param file - Font file to extract metadata from
   * @returns Sanitized font metadata
   */
  async extractMetadata(file: File): Promise<FontMetadata> {
    const fontData = await this.readFileAsArrayBuffer(file);
    return this.metadataExtractor.extractMetadata(file, fontData);
  }

  /**
   * Checks character support for basic Latin, numbers, and punctuation
   * @param file - Font file to analyze
   * @returns Character support analysis result
   */
  async checkCharacterSupport(file: File): Promise<CharacterSupportResult> {
    const fontData = await this.readFileAsArrayBuffer(file);
    return this.characterAnalyzer.analyzeCharacterSupport(file, fontData);
  }

  // Private helper methods

  private async readFileBytes(file: File, start: number, length: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(start, start + length));
    });
  }

  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private compareBytes(actual: Uint8Array, expected: readonly number[]): boolean {
    if (actual.length < expected.length) return false;
    return expected.every((byte, index) => actual[index] === byte);
  }

  private isCorrupted(fontData: ArrayBuffer): boolean {
    // Basic corruption check - ensure minimum size and valid structure
    if (fontData.byteLength < 12) return true;
    
    const view = new DataView(fontData);
    try {
      // Try to read basic font header
      view.getUint32(0); // Should not throw for valid font
      return false;
    } catch {
      return true;
    }
  }

  private async extractFontTables(fontData: ArrayBuffer): Promise<string[]> {
    // Basic font table extraction (simplified implementation)
    const tables: string[] = [];
    
    try {
      const view = new DataView(fontData);
      
      // Skip to table directory (offset 12 for TTF/OTF)
      let offset = 12;
      const numTables = view.getUint16(4);
      
      for (let i = 0; i < numTables && offset + 16 <= fontData.byteLength; i++) {
        // Read table tag (4 bytes)
        const tag = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );
        tables.push(tag);
        offset += 16; // Move to next table entry
      }
    } catch (error) {
      // Return empty array if extraction fails
    }
    
    return tables;
  }


}
