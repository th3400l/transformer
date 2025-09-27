// Fallback font service for browsers with limited storage capabilities
// Requirements: 8.5, 8.6, 6.7, 6.8

import { 
  IFontStorageService, 
  FontMetadata, 
  StoredFontInfo, 
  StorageUsageInfo,
  FontStorageError 
} from '../types/fontStorage';

/**
 * Session-only font storage service for browsers with limited capabilities
 * Provides temporary font storage that persists only for the current session
 */
export class FallbackFontService implements IFontStorageService {
  private sessionFonts = new Map<string, {
    data: ArrayBuffer;
    metadata: FontMetadata;
    uploadDate: Date;
    lastAccessed: Date;
  }>();
  
  private sessionId: string;
  private maxSessionFonts = 2; // Same limit as persistent storage

  constructor() {
    this.sessionId = this.generateSessionId();
    console.warn('Using fallback font storage - fonts will not persist between sessions');
  }

  /**
   * Store font data in session memory
   * @param fontData Font file data
   * @param metadata Font metadata
   * @returns Storage key for the font
   */
  async storeFont(fontData: ArrayBuffer, metadata: FontMetadata): Promise<string> {
    try {
      // Check session font limit
      if (this.sessionFonts.size >= this.maxSessionFonts) {
        throw new FontStorageError(
          'store', 
          undefined, 
          `Session font limit reached (${this.maxSessionFonts} fonts maximum)`
        );
      }

      // Generate storage key
      const storageKey = this.generateStorageKey(metadata);
      
      // Store in session memory
      this.sessionFonts.set(storageKey, {
        data: fontData,
        metadata,
        uploadDate: new Date(),
        lastAccessed: new Date()
      });

      return storageKey;
    } catch (error) {
      if (error instanceof FontStorageError) {
        throw error;
      }
      throw new FontStorageError('store', undefined, `Failed to store font in session: ${error}`);
    }
  }

  /**
   * Retrieve font data from session memory
   * @param storageKey Storage key for the font
   * @returns Font data or null if not found
   */
  async retrieveFont(storageKey: string): Promise<ArrayBuffer | null> {
    try {
      const fontEntry = this.sessionFonts.get(storageKey);
      if (!fontEntry) {
        return null;
      }

      // Update last accessed time
      fontEntry.lastAccessed = new Date();
      
      return fontEntry.data;
    } catch (error) {
      console.warn(`Failed to retrieve session font ${storageKey}:`, error);
      return null;
    }
  }

  /**
   * Remove font from session memory
   * @param storageKey Storage key for the font
   */
  async removeFont(storageKey: string): Promise<void> {
    try {
      const deleted = this.sessionFonts.delete(storageKey);
      if (!deleted) {
        console.warn(`Font ${storageKey} not found in session storage`);
      }
    } catch (error) {
      throw new FontStorageError('remove', storageKey, `Failed to remove session font: ${error}`);
    }
  }

  /**
   * List all fonts stored in session memory
   * @returns Array of stored font information
   */
  async listStoredFonts(): Promise<StoredFontInfo[]> {
    try {
      const fontList: StoredFontInfo[] = [];
      
      for (const [storageKey, fontEntry] of this.sessionFonts.entries()) {
        fontList.push({
          storageKey,
          metadata: fontEntry.metadata,
          size: fontEntry.data.byteLength,
          uploadDate: fontEntry.uploadDate
        });
      }
      
      return fontList.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
    } catch (error) {
      throw new FontStorageError('list', undefined, `Failed to list session fonts: ${error}`);
    }
  }

  /**
   * Get session storage usage information
   * @returns Storage usage information
   */
  async getStorageUsage(): Promise<StorageUsageInfo> {
    try {
      let totalSize = 0;
      
      for (const fontEntry of this.sessionFonts.values()) {
        totalSize += fontEntry.data.byteLength;
      }
      
      // Estimate available space based on browser memory limits
      const estimatedMaxMemory = 50 * 1024 * 1024; // 50MB conservative estimate
      const availableSpace = Math.max(0, estimatedMaxMemory - totalSize);
      
      return {
        totalSize,
        availableSpace,
        fontCount: this.sessionFonts.size,
        isNearLimit: this.sessionFonts.size >= this.maxSessionFonts - 1
      };
    } catch (error) {
      throw new FontStorageError('usage', undefined, `Failed to get session storage usage: ${error}`);
    }
  }

  /**
   * Clear all fonts from session memory
   */
  async clearAllFonts(): Promise<void> {
    try {
      this.sessionFonts.clear();
    } catch (error) {
      throw new FontStorageError('clear', undefined, `Failed to clear session fonts: ${error}`);
    }
  }

  /**
   * Get session information for debugging
   * @returns Session information
   */
  getSessionInfo(): SessionInfo {
    return {
      sessionId: this.sessionId,
      fontCount: this.sessionFonts.size,
      maxFonts: this.maxSessionFonts,
      isPersistent: false,
      storageType: 'session-memory'
    };
  }

  /**
   * Check if a font exists in session storage
   * @param storageKey Storage key to check
   * @returns True if font exists
   */
  hasFontInSession(storageKey: string): boolean {
    return this.sessionFonts.has(storageKey);
  }

  /**
   * Get font metadata without loading the full font data
   * @param storageKey Storage key for the font
   * @returns Font metadata or null if not found
   */
  async getFontMetadata(storageKey: string): Promise<FontMetadata | null> {
    const fontEntry = this.sessionFonts.get(storageKey);
    return fontEntry ? fontEntry.metadata : null;
  }

  /**
   * Generate a unique storage key for a font
   * @param metadata Font metadata
   * @returns Unique storage key
   */
  private generateStorageKey(metadata: FontMetadata): string {
    const timestamp = Date.now();
    const familyHash = this.simpleHash(metadata.fontFamily);
    return `session_${this.sessionId}_${familyHash}_${timestamp}`;
  }

  /**
   * Generate a unique session ID
   * @returns Session ID string
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}_${random}`;
  }

  /**
   * Simple hash function for generating consistent keys
   * @param str String to hash
   * @returns Hash value
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Session information interface
 */
export interface SessionInfo {
  sessionId: string;
  fontCount: number;
  maxFonts: number;
  isPersistent: boolean;
  storageType: string;
}