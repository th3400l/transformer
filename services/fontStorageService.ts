// Font storage service with IndexedDB and LocalStorage support
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

import { 
  IFontStorageService, 
  FontMetadata, 
  StoredFontInfo, 
  StorageUsageInfo,
  FontStorageError,
  StorageQuotaExceededError,
  IBrowserCompatibilityLayer
} from '../types/fontStorage';

/**
 * Font storage service that provides persistent storage for custom fonts
 * Uses IndexedDB as primary storage with LocalStorage fallback
 */
export class FontStorageService implements IFontStorageService {
  private static readonly DB_NAME = 'FontStorage';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'fonts';
  private static readonly METADATA_STORE = 'metadata';
  private static readonly LOCALSTORAGE_PREFIX = 'font_storage_';
  private static readonly MAX_LOCALSTORAGE_SIZE = 2 * 1024 * 1024; // 2MB limit for LocalStorage

  private db: IDBDatabase | null = null;
  private compatibilityLayer: IBrowserCompatibilityLayer;

  constructor(compatibilityLayer: IBrowserCompatibilityLayer) {
    this.compatibilityLayer = compatibilityLayer;
  }

  /**
   * Store a font in browser storage
   * @param fontData Font file data as ArrayBuffer
   * @param metadata Font metadata
   * @returns Storage key for the stored font
   */
  async storeFont(fontData: ArrayBuffer, metadata: FontMetadata): Promise<string> {
    const storageKey = this.generateStorageKey(metadata);
    const storageMethod = this.compatibilityLayer.getOptimalStorageMethod();

    try {
      if (storageMethod === 'indexeddb') {
        await this.storeFontIndexedDB(storageKey, fontData, metadata);
      } else {
        await this.storeFontLocalStorage(storageKey, fontData, metadata);
      }
      
      return storageKey;
    } catch (error) {
      throw new FontStorageError('store', storageKey, `Failed to store font: ${error}`);
    }
  }

  /**
   * Retrieve a font from browser storage
   * @param storageKey Storage key for the font
   * @returns Font data as ArrayBuffer or null if not found
   */
  async retrieveFont(storageKey: string): Promise<ArrayBuffer | null> {
    const storageMethod = this.compatibilityLayer.getOptimalStorageMethod();

    try {
      if (storageMethod === 'indexeddb') {
        return await this.retrieveFontIndexedDB(storageKey);
      } else {
        return await this.retrieveFontLocalStorage(storageKey);
      }
    } catch (error) {
      throw new FontStorageError('retrieve', storageKey, `Failed to retrieve font: ${error}`);
    }
  }

  /**
   * Remove a font from browser storage
   * @param storageKey Storage key for the font to remove
   */
  async removeFont(storageKey: string): Promise<void> {
    const storageMethod = this.compatibilityLayer.getOptimalStorageMethod();

    try {
      if (storageMethod === 'indexeddb') {
        await this.removeFontIndexedDB(storageKey);
      } else {
        await this.removeFontLocalStorage(storageKey);
      }
    } catch (error) {
      throw new FontStorageError('remove', storageKey, `Failed to remove font: ${error}`);
    }
  }

  /**
   * List all stored fonts
   * @returns Array of stored font information
   */
  async listStoredFonts(): Promise<StoredFontInfo[]> {
    const storageMethod = this.compatibilityLayer.getOptimalStorageMethod();

    try {
      if (storageMethod === 'indexeddb') {
        return await this.listFontsIndexedDB();
      } else {
        return await this.listFontsLocalStorage();
      }
    } catch (error) {
      throw new FontStorageError('list', undefined, `Failed to list fonts: ${error}`);
    }
  }

  /**
   * Get storage usage information
   * @returns Storage usage statistics
   */
  async getStorageUsage(): Promise<StorageUsageInfo> {
    const fonts = await this.listStoredFonts();
    const totalSize = fonts.reduce((sum, font) => sum + font.size, 0);
    const capabilities = this.compatibilityLayer.detectCapabilities();
    const availableSpace = capabilities.maxStorageQuota - totalSize;

    return {
      totalSize,
      availableSpace: Math.max(0, availableSpace),
      fontCount: fonts.length,
      isNearLimit: totalSize > capabilities.maxStorageQuota * 0.8 // 80% threshold
    };
  }

  /**
   * Clear all stored fonts
   */
  async clearAllFonts(): Promise<void> {
    const storageMethod = this.compatibilityLayer.getOptimalStorageMethod();

    try {
      if (storageMethod === 'indexeddb') {
        await this.clearFontsIndexedDB();
      } else {
        await this.clearFontsLocalStorage();
      }
    } catch (error) {
      throw new FontStorageError('clear', undefined, `Failed to clear fonts: ${error}`);
    }
  }

  // IndexedDB Implementation

  /**
   * Initialize IndexedDB connection
   */
  private async initIndexedDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(FontStorageService.DB_NAME, FontStorageService.DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create fonts store
        if (!db.objectStoreNames.contains(FontStorageService.STORE_NAME)) {
          const fontStore = db.createObjectStore(FontStorageService.STORE_NAME, { keyPath: 'storageKey' });
          fontStore.createIndex('uploadDate', 'uploadDate', { unique: false });
          fontStore.createIndex('fontFamily', 'metadata.fontFamily', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(FontStorageService.METADATA_STORE)) {
          db.createObjectStore(FontStorageService.METADATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store font using IndexedDB
   */
  private async storeFontIndexedDB(storageKey: string, fontData: ArrayBuffer, metadata: FontMetadata): Promise<void> {
    const db = await this.initIndexedDB();
    
    // Check storage quota
    const usage = await this.getStorageUsage();
    const maxSize = this.compatibilityLayer.getMaxFileSize();
    
    if (fontData.byteLength > maxSize) {
      throw new StorageQuotaExceededError(fontData.byteLength, maxSize);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FontStorageService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(FontStorageService.STORE_NAME);

      const fontRecord = {
        storageKey,
        data: fontData,
        metadata,
        uploadDate: new Date(),
        lastAccessed: new Date(),
        size: fontData.byteLength
      };

      const request = store.put(fontRecord);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store font in IndexedDB'));
    });
  }

  /**
   * Retrieve font using IndexedDB
   */
  private async retrieveFontIndexedDB(storageKey: string): Promise<ArrayBuffer | null> {
    const db = await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FontStorageService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(FontStorageService.STORE_NAME);

      const request = store.get(storageKey);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Update last accessed time
          result.lastAccessed = new Date();
          store.put(result);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to retrieve font from IndexedDB'));
    });
  }

  /**
   * Remove font using IndexedDB
   */
  private async removeFontIndexedDB(storageKey: string): Promise<void> {
    const db = await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FontStorageService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(FontStorageService.STORE_NAME);

      const request = store.delete(storageKey);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove font from IndexedDB'));
    });
  }

  /**
   * List fonts using IndexedDB
   */
  private async listFontsIndexedDB(): Promise<StoredFontInfo[]> {
    const db = await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FontStorageService.STORE_NAME], 'readonly');
      const store = transaction.objectStore(FontStorageService.STORE_NAME);

      const request = store.getAll();
      
      request.onsuccess = () => {
        const fonts = request.result.map(record => ({
          storageKey: record.storageKey,
          metadata: record.metadata,
          size: record.size,
          uploadDate: record.uploadDate
        }));
        resolve(fonts);
      };
      
      request.onerror = () => reject(new Error('Failed to list fonts from IndexedDB'));
    });
  }

  /**
   * Clear all fonts using IndexedDB
   */
  private async clearFontsIndexedDB(): Promise<void> {
    const db = await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FontStorageService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(FontStorageService.STORE_NAME);

      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear fonts from IndexedDB'));
    });
  }

  // LocalStorage Implementation

  /**
   * Store font using LocalStorage
   */
  private async storeFontLocalStorage(storageKey: string, fontData: ArrayBuffer, metadata: FontMetadata): Promise<void> {
    // Check size limit for LocalStorage
    if (fontData.byteLength > FontStorageService.MAX_LOCALSTORAGE_SIZE) {
      throw new StorageQuotaExceededError(fontData.byteLength, FontStorageService.MAX_LOCALSTORAGE_SIZE);
    }

    try {
      // Convert ArrayBuffer to base64 for storage
      const base64Data = this.arrayBufferToBase64(fontData);
      
      const fontRecord = {
        storageKey,
        data: base64Data,
        metadata,
        uploadDate: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        size: fontData.byteLength
      };

      const key = FontStorageService.LOCALSTORAGE_PREFIX + storageKey;
      localStorage.setItem(key, JSON.stringify(fontRecord));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageQuotaExceededError(fontData.byteLength, 0);
      }
      throw error;
    }
  }

  /**
   * Retrieve font using LocalStorage
   */
  private async retrieveFontLocalStorage(storageKey: string): Promise<ArrayBuffer | null> {
    try {
      const key = FontStorageService.LOCALSTORAGE_PREFIX + storageKey;
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }

      const fontRecord = JSON.parse(data);
      
      // Update last accessed time
      fontRecord.lastAccessed = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(fontRecord));

      // Convert base64 back to ArrayBuffer
      return this.base64ToArrayBuffer(fontRecord.data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove font using LocalStorage
   */
  private async removeFontLocalStorage(storageKey: string): Promise<void> {
    const key = FontStorageService.LOCALSTORAGE_PREFIX + storageKey;
    localStorage.removeItem(key);
  }

  /**
   * List fonts using LocalStorage
   */
  private async listFontsLocalStorage(): Promise<StoredFontInfo[]> {
    const fonts: StoredFontInfo[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(FontStorageService.LOCALSTORAGE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const fontRecord = JSON.parse(data);
            fonts.push({
              storageKey: fontRecord.storageKey,
              metadata: fontRecord.metadata,
              size: fontRecord.size,
              uploadDate: new Date(fontRecord.uploadDate)
            });
          }
        } catch (error) {
          // Skip corrupted entries
          console.warn(`Corrupted font storage entry: ${key}`);
        }
      }
    }
    
    return fonts;
  }

  /**
   * Clear all fonts using LocalStorage
   */
  private async clearFontsLocalStorage(): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(FontStorageService.LOCALSTORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Utility Methods

  /**
   * Generate a unique storage key for a font
   */
  private generateStorageKey(metadata: FontMetadata): string {
    const timestamp = Date.now();
    const hash = this.simpleHash(metadata.originalFilename + metadata.fontFamily);
    return `font_${hash}_${timestamp}`;
  }

  /**
   * Simple hash function for generating storage keys
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

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}