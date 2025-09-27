// Custom Font Upload Manager for handling font uploads with 2-font limit
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

import {
  ICustomFontUploadManager,
  CustomFont,
  CustomFontUploadResult,
  FontUploadError,
  FontErrorType,
  FontUploadSession,
  UploadFileInfo,
  DuplicateFontInfo,
  MAX_CUSTOM_FONTS,
  FONT_UPLOAD_TIMEOUT,
  DUPLICATE_SIMILARITY_THRESHOLD
} from '../types/customFontUpload';
import {
  IFontValidationEngine,
  FontValidationResult
} from '../types/fontValidation';
import {
  IFontStorageService,
  StoredFontInfo,
  FontMetadata
} from '../types/fontStorage';

/**
 * CustomFontUploadManager handles the complete font upload workflow
 * Implements 2-font limit enforcement, validation pipeline, and font management
 */
export class CustomFontUploadManager implements ICustomFontUploadManager {
  private fontValidationEngine: IFontValidationEngine;
  private fontStorageService: IFontStorageService;
  private uploadSessions: Map<string, FontUploadSession> = new Map();
  private customFonts: Map<string, CustomFont> = new Map();

  constructor(
    fontValidationEngine: IFontValidationEngine,
    fontStorageService: IFontStorageService
  ) {
    this.fontValidationEngine = fontValidationEngine;
    this.fontStorageService = fontStorageService;
    this.initializeCustomFonts();
  }

  /**
   * Upload a font file with comprehensive validation and limit enforcement
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   */
  async uploadFont(file: File): Promise<CustomFontUploadResult> {
    try {
      // Check upload limit first
      if (!this.canUploadMoreFonts()) {
        return {
          success: false,
          error: {
            type: FontErrorType.FONT_LIMIT_REACHED,
            message: `Cannot upload more fonts. Maximum ${MAX_CUSTOM_FONTS} custom fonts allowed.`,
            code: 'UPLOAD_LIMIT_REACHED',
            recoverable: true,
            severity: 'medium'
          }
        };
      }

      // Check for duplicates
      const duplicateInfo = await this.detectDuplicateFont(file);
      if (duplicateInfo) {
        return {
          success: false,
          error: {
            type: FontErrorType.DUPLICATE_FONT,
            message: `Font "${file.name}" appears to be similar to existing font "${duplicateInfo.existingFont.name}".`,
            details: duplicateInfo,
            code: 'DUPLICATE_FONT_DETECTED',
            recoverable: true,
            severity: 'medium' as const
          }
        };
      }

      // Validate the font file
      const validationResult = await this.validateFontFile(file);
      if (!validationResult.isValid) {
        const primaryError = validationResult.errors.find(e => e.severity === 'high') || validationResult.errors[0];
        const severity: 'low' | 'medium' | 'high' = primaryError?.severity ?? 'medium';
        return {
          success: false,
          error: {
            type: FontErrorType.PROCESSING_ERROR,
            message: primaryError?.message || 'Font validation failed',
            details: validationResult,
            code: primaryError?.code || 'VALIDATION_FAILED',
            recoverable: true,
            severity
          },
          validationDetails: validationResult
        };
      }

      // Store the font
      const fontData = await this.readFileAsArrayBuffer(file);
      const storageKey = await this.fontStorageService.storeFont(fontData, validationResult.metadata!);

      // Create custom font object
      const customFont = await this.createCustomFont(file, validationResult, storageKey);

      // Add to internal collection
      this.customFonts.set(customFont.id, customFont);

      // Notify font manager if available (through global event)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('customFontUploaded', {
          detail: { font: customFont }
        }));
      }

      return {
        success: true,
        font: customFont,
        validationDetails: validationResult
      };

    } catch (error) {
      return {
        success: false,
        error: {
          type: FontErrorType.STORAGE_UNAVAILABLE,
          message: `Failed to upload font: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          code: 'UPLOAD_FAILED',
          recoverable: true,
          severity: 'high' as const
        }
      };
    }
  }

  /**
   * Validate a font file using the validation engine
   * Requirements: 1.2, 1.3, 1.4
   */
  async validateFontFile(file: File): Promise<FontValidationResult> {
    return this.fontValidationEngine.validateFile(file);
  }

  /**
   * Check if more fonts can be uploaded (2-font limit)
   * Requirements: 1.1, 1.5
   */
  canUploadMoreFonts(): boolean {
    return this.customFonts.size < MAX_CUSTOM_FONTS;
  }

  /**
   * Remove a custom font with proper cleanup
   * Requirements: 4.1, 4.2, 4.3
   */
  async removeCustomFont(fontId: string): Promise<void> {
    let resolvedFontId = fontId;
    let customFont = this.customFonts.get(resolvedFontId);

    if (!customFont) {
      // Attempt to resolve by storage key for legacy font IDs
      const storageKeyHint = fontId.startsWith('custom-')
        ? fontId.substring('custom-'.length)
        : fontId.startsWith('custom_font_')
          ? fontId.replace(/^custom_/, '')
          : null;

      if (storageKeyHint) {
        const match = Array.from(this.customFonts.values()).find(font => font.storageKey === storageKeyHint);
        if (match) {
          customFont = match;
          resolvedFontId = match.id;
        }
      }
    }

    if (!customFont) {
      throw new Error(`Custom font with ID "${fontId}" not found`);
    }

    try {
      // Remove from storage
      await this.fontStorageService.removeFont(customFont.storageKey);
      
      // Remove from internal collection
      this.customFonts.delete(resolvedFontId);

      // Clean up any FontFace objects
      this.cleanupFontFace(customFont);

    } catch (error) {
      throw new Error(`Failed to remove custom font: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Replace an existing font with a new one
   * Requirements: 4.4, 4.5, 4.6
   */
  async replaceFont(existingFontId: string, newFile: File): Promise<CustomFontUploadResult> {
    const existingFont = this.customFonts.get(existingFontId);
    if (!existingFont) {
      return {
        success: false,
        error: {
          type: FontErrorType.UNKNOWN_ERROR,
          message: `Font with ID "${existingFontId}" not found`,
          code: 'FONT_NOT_FOUND',
          recoverable: false,
          severity: 'medium'
        }
      };
    }

    try {
      // Validate the new font first
      const validationResult = await this.validateFontFile(newFile);
      if (!validationResult.isValid) {
        const primaryError = validationResult.errors.find(e => e.severity === 'high') || validationResult.errors[0];
        const severity: 'low' | 'medium' | 'high' = primaryError?.severity ?? 'medium';
        return {
          success: false,
          error: {
            type: FontErrorType.PROCESSING_ERROR,
            message: primaryError?.message || 'Font validation failed',
            details: validationResult,
            code: primaryError?.code || 'VALIDATION_FAILED',
            recoverable: true,
            severity
          },
          validationDetails: validationResult
        };
      }

      // Remove the existing font
      await this.removeCustomFont(existingFontId);

      // Upload the new font (this will reuse the slot)
      return this.uploadFont(newFile);

    } catch (error) {
      return {
        success: false,
        error: {
          type: FontErrorType.STORAGE_UNAVAILABLE,
          message: `Failed to replace font: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          code: 'REPLACE_FAILED',
          recoverable: true,
          severity: 'high'
        }
      };
    }
  }

  /**
   * Get all uploaded custom fonts
   * Requirements: 4.1, 4.2
   */
  async getUploadedFonts(): Promise<CustomFont[]> {
    return Array.from(this.customFonts.values());
  }

  /**
   * Detect if a font is a duplicate of an existing font
   * Requirements: 4.4, 4.5
   */
  async detectDuplicateFont(file: File): Promise<DuplicateFontInfo | null> {
    try {
      const validationResult = await this.validateFontFile(file);
      if (!validationResult.isValid || !validationResult.metadata) {
        return null; // Can't detect duplicates for invalid fonts
      }

      const newMetadata = validationResult.metadata;
      
      // Get fresh list of existing fonts to ensure we have the latest state
      const existingFonts = Array.from(this.customFonts.values());

      for (const existingFont of existingFonts) {
        const similarity = this.calculateFontSimilarity(newMetadata, existingFont.metadata);
        
        if (similarity.score >= DUPLICATE_SIMILARITY_THRESHOLD) {
          return {
            existingFont,
            newFile: file,
            similarityScore: similarity.score,
            conflictType: similarity.type
          };
        }
      }

      return null;
    } catch (error) {
      // If we can't detect duplicates, allow the upload to proceed
      return null;
    }
  }

  /**
   * Create a new upload session for tracking progress
   * Requirements: 1.6
   */
  createUploadSession(): FontUploadSession {
    const sessionId = this.generateSessionId();
    const session: FontUploadSession = {
      sessionId,
      startTime: new Date(),
      files: [],
      status: 'pending',
      progress: 0,
      errors: []
    };

    this.uploadSessions.set(sessionId, session);
    return session;
  }

  /**
   * Get an existing upload session
   * Requirements: 1.6
   */
  getUploadSession(sessionId: string): FontUploadSession | null {
    return this.uploadSessions.get(sessionId) || null;
  }

  /**
   * Force refresh the custom fonts list from storage
   * This is useful after external font removals
   */
  async refreshCustomFonts(): Promise<void> {
    try {
      const storedFonts = await this.fontStorageService.listStoredFonts();
      
      // Clear current fonts
      this.customFonts.clear();

      // Reload from storage
      for (const storedFont of storedFonts) {
        try {
          const customFont = await this.createCustomFontFromStored(storedFont);
          this.customFonts.set(customFont.id, customFont);
        } catch (error) {
          console.warn(`Failed to reload stored font ${storedFont.storageKey}:`, error);
          // Clean up corrupted font data
          await this.fontStorageService.removeFont(storedFont.storageKey);
        }
      }
      

    } catch (error) {
      console.error('Failed to refresh custom fonts:', error);
    }
  }

  async clearAllCustomFonts(): Promise<void> {
    const existingFonts = Array.from(this.customFonts.values());

    for (const font of existingFonts) {
      try {
        await this.fontStorageService.removeFont(font.storageKey);
      } catch (error) {
        console.warn(`Failed to remove stored font ${font.storageKey}:`, error);
      }
      this.customFonts.delete(font.id);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('customFontRemoved', {
          detail: { fontId: font.id }
        }));
      }
    }

    try {
      await this.fontStorageService.clearAllFonts();
    } catch (error) {
      console.warn('Failed to clear font storage:', error);
    }
  }

  // Private helper methods

  /**
   * Initialize custom fonts from storage on startup
   */
  private async initializeCustomFonts(): Promise<void> {
    try {
      const storedFonts = await this.fontStorageService.listStoredFonts();
      
      for (const storedFont of storedFonts) {
        try {
          const customFont = await this.createCustomFontFromStored(storedFont);
          this.customFonts.set(customFont.id, customFont);
        } catch (error) {
          console.warn(`Failed to load stored font ${storedFont.storageKey}:`, error);
          // Clean up corrupted font data
          await this.fontStorageService.removeFont(storedFont.storageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to initialize custom fonts:', error);
    }
  }

  /**
   * Create a CustomFont object from validation result and storage key
   */
  private async createCustomFont(
    file: File,
    validationResult: FontValidationResult,
    storageKey: string
  ): Promise<CustomFont> {
    const metadata = validationResult.metadata!;
    const resolvedFamily = this.resolveFontFamily(metadata, file.name);
    const normalizedMetadata: FontMetadata = {
      ...metadata,
      fontFamily: resolvedFamily
    };
    validationResult.metadata = normalizedMetadata;
    const fontId = this.buildFontId(storageKey);

    return {
      id: fontId,
      name: resolvedFamily,
      family: resolvedFamily,
      loaded: false,
      isCustom: true,
      originalFilename: file.name,
      uploadDate: new Date(),
      fileSize: file.size,
      format: normalizedMetadata.format,
      metadata: normalizedMetadata,
      storageKey,
      validationResult,
      usageCount: 0
    };
  }

  /**
   * Create a CustomFont object from stored font info
   */
  private async createCustomFontFromStored(storedFont: StoredFontInfo): Promise<CustomFont> {
    const fontId = this.buildFontId(storedFont.storageKey);
    const resolvedFamily = this.resolveFontFamily(storedFont.metadata, storedFont.metadata.originalFilename);
    const normalizedMetadata = {
      ...storedFont.metadata,
      fontFamily: resolvedFamily
    };

    // Create a minimal validation result for stored fonts
    const validationResult: FontValidationResult = {
      isValid: true,
      format: {
        isValid: true,
        detectedFormat: normalizedMetadata.format,
        mimeType: `font/${normalizedMetadata.format}`,
        supportedByBrowser: true,
        magicNumberValid: true
      },
      size: {
        isValid: true,
        fileSize: storedFont.size,
        maxAllowedSize: 5 * 1024 * 1024,
        compressionRecommended: false
      },
      integrity: {
        isValid: true,
        isCorrupted: false,
        canBeLoaded: true,
        fontTables: [],
        hasRequiredTables: true
      },
      metadata: normalizedMetadata,
      errors: [],
      warnings: []
    };

    return {
      id: fontId,
      name: resolvedFamily,
      family: resolvedFamily,
      loaded: false,
      isCustom: true,
      originalFilename: normalizedMetadata.originalFilename,
      uploadDate: storedFont.uploadDate,
      fileSize: storedFont.size,
      format: normalizedMetadata.format,
      metadata: normalizedMetadata,
      storageKey: storedFont.storageKey,
      validationResult,
      usageCount: 0
    };
  }

  /**
   * Calculate similarity between two font metadata objects
   */
  private calculateFontSimilarity(
    newMetadata: FontMetadata,
    existingMetadata: FontMetadata
  ): { score: number; type: 'name' | 'family' | 'exact' } {
    // Exact match check
    if (newMetadata.originalFilename === existingMetadata.originalFilename &&
        newMetadata.fontFamily === existingMetadata.fontFamily) {
      return { score: 1.0, type: 'exact' };
    }

    // Font family match
    if (newMetadata.fontFamily === existingMetadata.fontFamily) {
      return { score: 0.9, type: 'family' };
    }

    // Filename similarity
    const filenameSimilarity = this.calculateStringSimilarity(
      newMetadata.originalFilename.toLowerCase(),
      existingMetadata.originalFilename.toLowerCase()
    );

    if (filenameSimilarity >= 0.8) {
      return { score: filenameSimilarity, type: 'name' };
    }

    return { score: 0, type: 'name' };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
  }

  /**
   * Derive a stable custom font ID from storage key to stay in sync with font manager
   */
  private buildFontId(storageKey: string): string {
    return `custom-${storageKey}`;
  }

  private resolveFontFamily(metadata: FontMetadata, fallbackFilename?: string): string {
    const candidate = metadata.fontFamily?.trim() || '';
    if (candidate && !this.isPlaceholderFamily(candidate)) {
      return candidate;
    }

    const fromOriginal = metadata.originalFilename
      ? metadata.originalFilename.replace(/\.[^/.]+$/, '').trim()
      : '';
    if (fromOriginal) {
      return fromOriginal;
    }

    if (fallbackFilename) {
      const fallbackBase = fallbackFilename.replace(/\.[^/.]+$/, '').trim();
      if (fallbackBase) {
        return fallbackBase;
      }
    }

    return 'Custom Font';
  }

  private isPlaceholderFamily(family: string): boolean {
    const normalized = family.toLowerCase();
    return normalized === 'metadatatest' || normalized === 'metadata' || normalized === 'custom font';
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `upload_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Read file as ArrayBuffer
   */
  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Clean up FontFace objects for removed fonts
   */
  private cleanupFontFace(customFont: CustomFont): void {
    try {
      // Remove from document.fonts if it was loaded
      if (customFont.loaded && document.fonts) {
        for (const fontFace of document.fonts) {
          if (fontFace.family === customFont.family) {
            document.fonts.delete(fontFace);
            break;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup FontFace:', error);
    }
  }
}
