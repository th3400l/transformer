/**
 * Performant Font Loader Service
 * Implements font preloading, lazy loading, and performance optimization
 * Requirements: 4.2, 4.3, 6.2, 6.3
 */

export interface FontLoadStrategy {
  id: string;
  priority: 'critical' | 'high' | 'low';
  preload: boolean;
  lazyLoad: boolean;
}

export interface FontLoadOptions {
  timeout?: number;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export interface FontLoadResult {
  fontId: string;
  success: boolean;
  loadTime: number;
  error?: string;
}

/**
 * Performant Font Loader
 * Manages font loading with preloading for critical fonts and lazy loading for non-critical fonts
 */
export class PerformantFontLoader {
  private loadedFonts: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<FontLoadResult>> = new Map();
  private fontStrategies: Map<string, FontLoadStrategy> = new Map();
  private preloadedFonts: Set<string> = new Set();

  constructor() {
    this.initializeFontStrategies();
  }

  /**
   * Initialize font loading strategies
   * Critical fonts: Default font (inkwell/Caveat) - preload
   * High priority: Handwriting-1 (most commonly used) - preload
   * Low priority: All other fonts - lazy load
   */
  private initializeFontStrategies(): void {
    // Critical fonts - preload immediately
    this.fontStrategies.set('inkwell', {
      id: 'inkwell',
      priority: 'critical',
      preload: true,
      lazyLoad: false
    });

    // High priority fonts - preload after critical
    this.fontStrategies.set('handwriting-1', {
      id: 'handwriting-1',
      priority: 'high',
      preload: true,
      lazyLoad: false
    });

    // All other handwriting fonts - lazy load
    for (let i = 2; i <= 9; i++) {
      this.fontStrategies.set(`handwriting-${i}`, {
        id: `handwriting-${i}`,
        priority: 'low',
        preload: false,
        lazyLoad: true
      });
    }

    // Web fonts - lazy load
    const webFonts = [
      'elegant-script',
      'casual-note',
      'quick-jot',
      'teacher-hand',
      'marker-felt'
    ];

    webFonts.forEach(fontId => {
      this.fontStrategies.set(fontId, {
        id: fontId,
        priority: 'low',
        preload: false,
        lazyLoad: true
      });
    });
  }

  /**
   * Preload critical fonts
   * Should be called early in the application lifecycle
   */
  async preloadCriticalFonts(): Promise<FontLoadResult[]> {
    const criticalFonts = Array.from(this.fontStrategies.values())
      .filter(strategy => strategy.priority === 'critical' && strategy.preload);

    const results = await Promise.all(
      criticalFonts.map(strategy => this.preloadFont(strategy.id))
    );

    return results;
  }

  /**
   * Preload high priority fonts
   * Should be called after critical fonts are loaded
   */
  async preloadHighPriorityFonts(): Promise<FontLoadResult[]> {
    const highPriorityFonts = Array.from(this.fontStrategies.values())
      .filter(strategy => strategy.priority === 'high' && strategy.preload);

    const results = await Promise.all(
      highPriorityFonts.map(strategy => this.preloadFont(strategy.id))
    );

    return results;
  }

  /**
   * Preload a specific font
   */
  private async preloadFont(fontId: string): Promise<FontLoadResult> {
    const startTime = performance.now();

    // Check if already preloaded
    if (this.preloadedFonts.has(fontId)) {
      return {
        fontId,
        success: true,
        loadTime: 0
      };
    }

    // Check if loading is in progress
    if (this.loadingPromises.has(fontId)) {
      return await this.loadingPromises.get(fontId)!;
    }

    const loadPromise = this.performFontPreload(fontId, startTime);
    this.loadingPromises.set(fontId, loadPromise);

    try {
      const result = await loadPromise;
      if (result.success) {
        this.preloadedFonts.add(fontId);
        this.loadedFonts.add(fontId);
      }
      return result;
    } finally {
      this.loadingPromises.delete(fontId);
    }
  }

  /**
   * Perform font preload using link rel="preload"
   */
  private async performFontPreload(fontId: string, startTime: number): Promise<FontLoadResult> {
    try {
      const fontUrl = this.getFontUrl(fontId);
      
      if (!fontUrl) {
        return {
          fontId,
          success: false,
          loadTime: performance.now() - startTime,
          error: 'Font URL not found'
        };
      }

      // Create preload link if it doesn't exist
      const existingPreload = document.querySelector(`link[href="${fontUrl}"]`);
      if (!existingPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'font';
        preloadLink.type = 'font/ttf';
        preloadLink.href = fontUrl;
        preloadLink.crossOrigin = 'anonymous';
        document.head.appendChild(preloadLink);
      }

      // Wait for font to be available
      await this.waitForFontLoad(fontId, { timeout: 5000, display: 'swap' });

      const loadTime = performance.now() - startTime;
      return {
        fontId,
        success: true,
        loadTime
      };
    } catch (error) {
      const loadTime = performance.now() - startTime;
      return {
        fontId,
        success: false,
        loadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Lazy load a font when needed
   */
  async lazyLoadFont(fontId: string, options?: FontLoadOptions): Promise<FontLoadResult> {
    const startTime = performance.now();

    // Check if already loaded
    if (this.loadedFonts.has(fontId)) {
      return {
        fontId,
        success: true,
        loadTime: 0
      };
    }

    // Check if loading is in progress
    if (this.loadingPromises.has(fontId)) {
      return await this.loadingPromises.get(fontId)!;
    }

    const loadPromise = this.performLazyLoad(fontId, startTime, options);
    this.loadingPromises.set(fontId, loadPromise);

    try {
      const result = await loadPromise;
      if (result.success) {
        this.loadedFonts.add(fontId);
      }
      return result;
    } finally {
      this.loadingPromises.delete(fontId);
    }
  }

  /**
   * Perform lazy font load
   */
  private async performLazyLoad(
    fontId: string,
    startTime: number,
    options?: FontLoadOptions
  ): Promise<FontLoadResult> {
    try {
      const fontUrl = this.getFontUrl(fontId);
      const fontFamily = this.getFontFamily(fontId);

      if (!fontUrl || !fontFamily) {
        return {
          fontId,
          success: false,
          loadTime: performance.now() - startTime,
          error: 'Font configuration not found'
        };
      }

      // Use FontFace API for lazy loading
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`, {
        display: options?.display || 'swap'
      });

      // Load with timeout
      const timeout = options?.timeout || 3000;
      const loadPromise = fontFace.load();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Font load timeout')), timeout);
      });

      await Promise.race([loadPromise, timeoutPromise]);
      (document.fonts as any).add(fontFace);

      const loadTime = performance.now() - startTime;
      return {
        fontId,
        success: true,
        loadTime
      };
    } catch (error) {
      const loadTime = performance.now() - startTime;
      return {
        fontId,
        success: false,
        loadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Wait for font to be loaded and available
   */
  private async waitForFontLoad(fontId: string, options?: FontLoadOptions): Promise<void> {
    const fontFamily = this.getFontFamily(fontId);
    if (!fontFamily) {
      throw new Error(`Font family not found for ${fontId}`);
    }

    const timeout = options?.timeout || 3000;
    const startTime = Date.now();

    // Check if font is already loaded
    if (document.fonts.check(`16px ${fontFamily}`)) {
      return;
    }

    // Wait for font to load
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (document.fonts.check(`16px ${fontFamily}`)) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Font load timeout'));
        }
      }, 50);
    });
  }

  /**
   * Get font URL for a given font ID
   */
  private getFontUrl(fontId: string): string | null {
    // Handwriting fonts
    if (fontId.startsWith('handwriting-')) {
      const fontNumber = fontId.split('-')[1];
      return `/fonts/Handwriting-${fontNumber}.ttf`;
    }

    // Web fonts are loaded via Google Fonts link tag, no URL needed
    return null;
  }

  /**
   * Get font family for a given font ID
   */
  private getFontFamily(fontId: string): string | null {
    const fontFamilyMap: Record<string, string> = {
      'inkwell': 'Caveat',
      'elegant-script': 'Dancing Script',
      'casual-note': 'Kalam',
      'quick-jot': 'Patrick Hand',
      'teacher-hand': 'Indie Flower',
      'marker-felt': 'Shadows Into Light',
      'handwriting-1': 'Handwriting-1',
      'handwriting-2': 'Handwriting-2',
      'handwriting-3': 'Handwriting-3',
      'handwriting-4': 'Handwriting-4',
      'handwriting-5': 'Handwriting-5',
      'handwriting-6': 'Handwriting-6',
      'handwriting-7': 'Handwriting-7',
      'handwriting-8': 'Handwriting-8',
      'handwriting-9': 'Handwriting-9'
    };

    return fontFamilyMap[fontId] || null;
  }

  /**
   * Check if a font is loaded
   */
  isFontLoaded(fontId: string): boolean {
    return this.loadedFonts.has(fontId);
  }

  /**
   * Get font loading strategy
   */
  getFontStrategy(fontId: string): FontLoadStrategy | undefined {
    return this.fontStrategies.get(fontId);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    totalFonts: number;
    loadedFonts: number;
    preloadedFonts: number;
    pendingLoads: number;
  } {
    return {
      totalFonts: this.fontStrategies.size,
      loadedFonts: this.loadedFonts.size,
      preloadedFonts: this.preloadedFonts.size,
      pendingLoads: this.loadingPromises.size
    };
  }
}

// Singleton instance
let performantFontLoaderInstance: PerformantFontLoader | null = null;

/**
 * Get the singleton instance of PerformantFontLoader
 */
export function getPerformantFontLoader(): PerformantFontLoader {
  if (!performantFontLoaderInstance) {
    performantFontLoaderInstance = new PerformantFontLoader();
  }
  return performantFontLoaderInstance;
}
