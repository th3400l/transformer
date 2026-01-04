/**
 * Lazy Texture Loader Service
 * Implements lazy loading for non-critical textures with intersection observer
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3
 */

import { PaperTemplate, PaperTexture, IPaperTextureManager } from '../types/core';

export interface LazyLoadConfig {
  enableLazyLoading: boolean;
  rootMargin: string; // Intersection observer root margin
  threshold: number; // Intersection observer threshold
  loadDelay: number; // Delay before loading (ms)
  enablePlaceholder: boolean;
}

export interface LazyLoadEntry {
  templateId: string;
  element: HTMLElement | null;
  loaded: boolean;
  loading: boolean;
  priority: number;
  observer: IntersectionObserver | null;
}

/**
 * Lazy Texture Loader
 * Loads textures only when needed using Intersection Observer API
 * Requirements: 5.1, 5.2 - Deferred loading for performance
 */
export class LazyTextureLoader {
  private textureManager: IPaperTextureManager;
  private config: LazyLoadConfig;
  private lazyEntries: Map<string, LazyLoadEntry> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private loadQueue: Array<{ templateId: string; priority: number }> = [];
  private isProcessingQueue = false;

  constructor(textureManager: IPaperTextureManager, config: Partial<LazyLoadConfig> = {}) {
    this.textureManager = textureManager;
    this.config = {
      enableLazyLoading: config.enableLazyLoading ?? this.shouldEnableLazyLoading(),
      rootMargin: config.rootMargin ?? '50px',
      threshold: config.threshold ?? 0.01,
      loadDelay: config.loadDelay ?? 100,
      enablePlaceholder: config.enablePlaceholder ?? true
    };

    if (this.config.enableLazyLoading && this.isIntersectionObserverSupported()) {
      this.initializeObserver();
    }
  }

  /**
   * Determine if lazy loading should be enabled
   * Requirements: 5.1, 5.2 - Device-aware lazy loading
   */
  private shouldEnableLazyLoading(): boolean {
    const isMobile = window.innerWidth < 768;
    const isSlowConnection = this.isSlowConnection();
    const isLowEndDevice = this.isLowEndDevice();

    // Enable lazy loading on mobile or constrained devices
    return isMobile || isSlowConnection || isLowEndDevice;
  }

  /**
   * Check if Intersection Observer is supported
   */
  private isIntersectionObserverSupported(): boolean {
    return 'IntersectionObserver' in window;
  }

  /**
   * Initialize Intersection Observer
   * Requirements: 6.2, 6.3 - Viewport-based loading
   */
  private initializeObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );
  }

  /**
   * Handle intersection observer callback
   * Requirements: 6.2 - Viewport-triggered loading
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const templateId = entry.target.getAttribute('data-template-id');
        if (templateId) {
          this.triggerLoad(templateId);
        }
      }
    }
  }

  /**
   * Register an element for lazy loading
   * Requirements: 6.2 - Element-based lazy loading
   */
  public registerElement(
    element: HTMLElement,
    templateId: string,
    priority: number = 1
  ): void {
    if (!this.config.enableLazyLoading || !this.intersectionObserver) {
      // If lazy loading disabled, load immediately
      this.loadImmediately(templateId);
      return;
    }

    // Set data attribute for identification
    element.setAttribute('data-template-id', templateId);

    // Create lazy entry
    const entry: LazyLoadEntry = {
      templateId,
      element,
      loaded: false,
      loading: false,
      priority,
      observer: this.intersectionObserver
    };

    this.lazyEntries.set(templateId, entry);

    // Start observing
    this.intersectionObserver.observe(element);

    // Apply placeholder if enabled
    if (this.config.enablePlaceholder) {
      this.applyPlaceholder(element);
    }
  }

  /**
   * Unregister an element from lazy loading
   */
  public unregisterElement(templateId: string): void {
    const entry = this.lazyEntries.get(templateId);
    if (entry && entry.element && entry.observer) {
      entry.observer.unobserve(entry.element);
      this.lazyEntries.delete(templateId);
    }
  }

  /**
   * Trigger load for a template
   * Requirements: 5.3, 5.4 - Priority-based loading
   */
  private triggerLoad(templateId: string): void {
    const entry = this.lazyEntries.get(templateId);
    if (!entry || entry.loaded || entry.loading) {
      return;
    }

    // Add to load queue with priority
    this.loadQueue.push({ templateId, priority: entry.priority });
    
    // Sort queue by priority (higher priority first)
    this.loadQueue.sort((a, b) => b.priority - a.priority);

    // Process queue
    this.processLoadQueue();
  }

  /**
   * Process the load queue
   * Requirements: 5.3, 5.4 - Sequential priority loading
   */
  private async processLoadQueue(): Promise<void> {
    if (this.isProcessingQueue || this.loadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.loadQueue.length > 0) {
      const item = this.loadQueue.shift();
      if (!item) break;

      const entry = this.lazyEntries.get(item.templateId);
      if (!entry || entry.loaded || entry.loading) {
        continue;
      }

      // Mark as loading
      entry.loading = true;

      try {
        // Add delay to avoid blocking
        if (this.config.loadDelay > 0) {
          await this.delay(this.config.loadDelay);
        }

        // Load texture
        await this.loadTexture(item.templateId);

        // Mark as loaded
        entry.loaded = true;
        entry.loading = false;

        // Remove placeholder
        if (entry.element) {
          this.removePlaceholder(entry.element);
        }

        // Unobserve element
        if (entry.element && entry.observer) {
          entry.observer.unobserve(entry.element);
        }

      } catch (error) {
        console.warn(`Lazy load failed for ${item.templateId}:`, error);
        entry.loading = false;
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Load texture through texture manager
   * Requirements: 5.1, 5.2 - Actual texture loading
   */
  private async loadTexture(templateId: string): Promise<PaperTexture> {
    const template: PaperTemplate = {
      id: templateId,
      name: templateId,
      filename: this.getTemplateFilename(templateId),
      type: templateId.startsWith('lined') ? 'lined' : 'blank'
    };

    return await this.textureManager.loadTexture(template);
  }

  /**
   * Load texture immediately (fallback when lazy loading disabled)
   */
  private async loadImmediately(templateId: string): Promise<void> {
    try {
      await this.loadTexture(templateId);
    } catch (error) {
      console.warn(`Immediate load failed for ${templateId}:`, error);
    }
  }

  /**
   * Apply placeholder to element
   * Requirements: 6.3 - Visual feedback during loading
   */
  private applyPlaceholder(element: HTMLElement): void {
    element.style.backgroundColor = '#f0f0f0';
    element.style.backgroundImage = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
    element.style.backgroundSize = '200% 100%';
    element.style.animation = 'shimmer 1.5s infinite';
    element.setAttribute('data-lazy-placeholder', 'true');
  }

  /**
   * Remove placeholder from element
   */
  private removePlaceholder(element: HTMLElement): void {
    if (element.getAttribute('data-lazy-placeholder') === 'true') {
      element.style.backgroundColor = '';
      element.style.backgroundImage = '';
      element.style.backgroundSize = '';
      element.style.animation = '';
      element.removeAttribute('data-lazy-placeholder');
    }
  }

  /**
   * Get template filename from ID
   */
  private getTemplateFilename(templateId: string): string {
    const filenameMap: Record<string, string> = {
      'blank-1': 'blank-1.jpeg',
      'blank-2': 'blank-2.avif',
      'blank-3': 'blank-3.jpg',
      'lined-1': 'lined-1.avif',
      'lined-2': 'lined-2.avif',
      'lined-3': 'lined-3.jpg'
    };

    return filenameMap[templateId] || `${templateId}.jpeg`;
  }

  /**
   * Detect low-end device
   */
  private isLowEndDevice(): boolean {
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory <= 2) return true;

    const hardwareConcurrency = navigator.hardwareConcurrency;
    if (hardwareConcurrency && hardwareConcurrency <= 2) return true;

    return false;
  }

  /**
   * Detect slow connection
   */
  private isSlowConnection(): boolean {
    const connection = (navigator as any).connection;
    if (!connection) return false;

    const slowTypes = ['slow-2g', '2g', '3g'];
    return slowTypes.includes(connection.effectiveType) || connection.downlink < 1.5;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Manually trigger load for specific template
   * Requirements: 6.2 - Manual load trigger
   */
  public loadTemplate(templateId: string): void {
    this.triggerLoad(templateId);
  }

  /**
   * Check if template is loaded
   */
  public isLoaded(templateId: string): boolean {
    const entry = this.lazyEntries.get(templateId);
    return entry?.loaded ?? false;
  }

  /**
   * Check if template is loading
   */
  public isLoading(templateId: string): boolean {
    const entry = this.lazyEntries.get(templateId);
    return entry?.loading ?? false;
  }

  /**
   * Get lazy loading statistics
   */
  public getStats(): {
    totalRegistered: number;
    totalLoaded: number;
    totalLoading: number;
    queueSize: number;
  } {
    const entries = Array.from(this.lazyEntries.values());
    
    return {
      totalRegistered: entries.length,
      totalLoaded: entries.filter(e => e.loaded).length,
      totalLoading: entries.filter(e => e.loading).length,
      queueSize: this.loadQueue.length
    };
  }

  /**
   * Clear all lazy entries
   */
  public clear(): void {
    // Unobserve all elements
    this.lazyEntries.forEach((entry) => {
      if (entry.element && entry.observer) {
        entry.observer.unobserve(entry.element);
      }
    });

    this.lazyEntries.clear();
    this.loadQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Dispose of lazy loader and clean up resources
   */
  public dispose(): void {
    this.clear();

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }
}
