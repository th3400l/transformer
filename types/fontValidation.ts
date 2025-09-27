// Font validation types and interfaces for custom font upload system
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

import type { FontFormat, FontMetadata } from './fontStorage';

export interface FormatValidationResult {
  isValid: boolean;
  detectedFormat: FontFormat | null;
  mimeType: string;
  supportedByBrowser: boolean;
  magicNumberValid: boolean;
}

export interface SizeValidationResult {
  isValid: boolean;
  fileSize: number;
  maxAllowedSize: number;
  compressionRecommended: boolean;
}

export interface IntegrityValidationResult {
  isValid: boolean;
  isCorrupted: boolean;
  canBeLoaded: boolean;
  fontTables: string[];
  hasRequiredTables: boolean;
}

export interface CharacterSupportResult {
  basicLatin: boolean;
  extendedLatin: boolean;
  numbers: boolean;
  punctuation: boolean;
  specialCharacters: string[];
  missingGlyphs: string[];
  hasRequiredGlyphs: boolean;
}

export interface ValidationError {
  type: 'format' | 'size' | 'integrity' | 'security' | 'character_support';
  message: string;
  severity: 'low' | 'medium' | 'high';
  code: string;
}

export interface ValidationWarning {
  type: 'performance' | 'compatibility' | 'character_support';
  message: string;
  recommendation: string;
}

export interface FontValidationResult {
  isValid: boolean;
  format: FormatValidationResult;
  size: SizeValidationResult;
  integrity: IntegrityValidationResult;
  metadata?: FontMetadata;
  characterSupport?: CharacterSupportResult;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface IFontValidationEngine {
  validateFile(file: File): Promise<FontValidationResult>;
  validateFormat(file: File): Promise<FormatValidationResult>;
  validateSize(file: File): Promise<SizeValidationResult>;
  validateIntegrity(file: File): Promise<IntegrityValidationResult>;
  extractMetadata(file: File): Promise<FontMetadata>;
  checkCharacterSupport(file: File): Promise<CharacterSupportResult>;
}

// Font format magic numbers for validation
export const FONT_MAGIC_NUMBERS = {
  TTF: [0x00, 0x01, 0x00, 0x00], // TrueType
  OTF: [0x4F, 0x54, 0x54, 0x4F], // OpenType 'OTTO'
  WOFF: [0x77, 0x4F, 0x46, 0x46], // WOFF 'wOFF'
  WOFF2: [0x77, 0x4F, 0x46, 0x32] // WOFF2 'wOF2'
} as const;

// Supported MIME types for font files
export const SUPPORTED_MIME_TYPES = [
  'font/ttf',
  'font/otf', 
  'font/woff',
  'font/woff2',
  'application/font-ttf',
  'application/font-otf',
  'application/font-woff',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/x-font-woff'
] as const;

// Maximum file size (5MB)
export const MAX_FONT_FILE_SIZE = 5 * 1024 * 1024;

// Required font tables for basic functionality
export const REQUIRED_FONT_TABLES = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post'];

// Basic character sets that should be supported
export const BASIC_CHARACTER_SETS = {
  BASIC_LATIN: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  NUMBERS: '0123456789',
  PUNCTUATION: '.,;:!?\'"-()[]{}',
  COMMON_SYMBOLS: ' @#$%&*+=-_/\\|<>~`^'
} as const;
