// Custom font upload types and interfaces
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

import { HandwritingFont } from './fonts';
import { FontValidationResult } from './fontValidation';
import type { FontMetadata, FontFormat } from './fontStorage';

export interface CustomFont extends HandwritingFont {
  isCustom: true;
  originalFilename: string;
  uploadDate: Date;
  fileSize: number;
  format: FontFormat;
  metadata: FontMetadata;
  storageKey: string;
  validationResult: FontValidationResult;
  lastUsed?: Date;
  usageCount: number;
}

export interface CustomFontUploadResult {
  success: boolean;
  font?: CustomFont;
  error?: FontUploadError;
  validationDetails?: FontValidationResult;
}

export interface FontUploadError {
  type: FontErrorType;
  message: string;
  details?: any;
  code?: string;
  recoverable: boolean;
  severity: 'low' | 'medium' | 'high';
}

export enum FontErrorType {
  // Validation errors
  INVALID_FORMAT = 'invalid_format',
  FILE_TOO_LARGE = 'file_too_large',
  FILE_CORRUPTED = 'file_corrupted',
  MISSING_CHARACTERS = 'missing_characters',
  MALFORMED_FONT = 'malformed_font',
  
  // Storage errors
  STORAGE_FULL = 'storage_full',
  STORAGE_UNAVAILABLE = 'storage_unavailable',
  QUOTA_EXCEEDED = 'quota_exceeded',
  
  // Limit errors
  FONT_LIMIT_REACHED = 'font_limit_reached',
  UPLOAD_TIMEOUT = 'upload_timeout',
  
  // Duplicate errors
  DUPLICATE_FONT = 'duplicate_font',
  FONT_ALREADY_EXISTS = 'font_already_exists',
  
  // Browser compatibility errors
  BROWSER_UNSUPPORTED = 'browser_unsupported',
  FEATURE_UNAVAILABLE = 'feature_unavailable',
  FONTFACE_API_UNAVAILABLE = 'fontface_api_unavailable',
  
  // Network and loading errors
  NETWORK_ERROR = 'network_error',
  FONT_LOAD_FAILED = 'font_load_failed',
  RENDERING_FAILED = 'rendering_failed',
  
  // Generic errors
  UNKNOWN_ERROR = 'unknown_error',
  PROCESSING_ERROR = 'processing_error'
}

export interface FontUploadSession {
  sessionId: string;
  startTime: Date;
  files: UploadFileInfo[];
  status: 'pending' | 'uploading' | 'validating' | 'completed' | 'failed';
  progress: number;
  errors: FontUploadError[];
}

export interface UploadFileInfo {
  file: File;
  status: 'pending' | 'uploading' | 'validating' | 'completed' | 'failed';
  progress: number;
  validationResult?: FontValidationResult;
  customFont?: CustomFont;
}

export interface DuplicateFontInfo {
  existingFont: CustomFont;
  newFile: File;
  similarityScore: number;
  conflictType: 'name' | 'family' | 'exact';
}

export interface ICustomFontUploadManager {
  uploadFont(file: File): Promise<CustomFontUploadResult>;
  validateFontFile(file: File): Promise<FontValidationResult>;
  removeCustomFont(fontId: string): Promise<void>;
  getUploadedFonts(): Promise<CustomFont[]>;
  canUploadMoreFonts(): boolean;
  replaceFont(existingFontId: string, newFile: File): Promise<CustomFontUploadResult>;
  detectDuplicateFont(file: File): Promise<DuplicateFontInfo | null>;
  getUploadSession(sessionId: string): FontUploadSession | null;
  createUploadSession(): FontUploadSession;
  refreshCustomFonts(): Promise<void>;
  clearAllCustomFonts(): Promise<void>;
}

// Constants
export const MAX_CUSTOM_FONTS = 2;
export const FONT_UPLOAD_TIMEOUT = 30000; // 30 seconds
export const DUPLICATE_SIMILARITY_THRESHOLD = 0.8; // 80% similarity for duplicate detection

// Error handling and recovery interfaces
export interface ErrorRecoveryAction {
  label: string;
  action: () => Promise<void> | void;
  type: 'retry' | 'alternative' | 'manual' | 'dismiss';
  primary?: boolean;
}

export interface FontErrorContext {
  fileName?: string;
  fileSize?: number;
  fontFamily?: string;
  operation: string;
  timestamp: Date;
  sessionId: string;
  browserInfo?: BrowserInfo;
}

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  supportsIndexedDB: boolean;
  supportsLocalStorage: boolean;
  supportsFontFace: boolean;
  maxStorageQuota?: number;
}

export interface FontErrorClassification {
  type: FontErrorType;
  severity: 'low' | 'medium' | 'high';
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: ErrorRecoveryAction[];
  preventionTips?: string[];
}

export interface ProgressInfo {
  stage: 'uploading' | 'validating' | 'processing' | 'storing' | 'loading' | 'complete';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
}

export interface IFontErrorHandler {
  classifyError(error: Error | FontUploadError, context?: FontErrorContext): FontErrorClassification;
  createUserFriendlyMessage(error: Error | FontUploadError, context?: FontErrorContext): string;
  getRecoveryActions(error: Error | FontUploadError, context?: FontErrorContext): ErrorRecoveryAction[];
  logError(error: Error | FontUploadError, context?: FontErrorContext): void;
  createProgressInfo(stage: ProgressInfo['stage'], progress: number, message?: string): ProgressInfo;
}
