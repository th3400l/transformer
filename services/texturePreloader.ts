/**
 * Texture Preloader Service
 * Implements intelligent texture preloading for optimal performance
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3
 */

import { PaperTemplate, PaperTexture, IPaperTextureManager } from '../types/core';

export interface PreloadStrategy {
  priority: 'critical' | 'high' | 'medium' | 'low';
  templates: string[]; // Template IDs
  timing: 'immediate' | 'idle' | 'interaction';
}

export interface PreloadConfig {
  enablePreloading: boolean;
  enableIdlePreloading: boolean;
  maxConcurrentPreloads: number;
  preloadOnInteraction: boolean;
  strategies: PreloadStrategy[];
}

export interface PreloadStatus {
  templateId: string;
  status: 'pending' | 'loading' | 'loaded' | 'failed';
  priority: string;
  startTime?: number;
  endTime?: number;
  error?: string;
}

/**
 * Texture Preloader
 * Manages intelligent preloading of textures based on priority and device capabilities
 * Requirements: 5.1, 5.2 - Performance optimization through preloading
 */
export class TexturePreloader {
  private textureManager: IPaperTextureManager;
  private config: PreloadConfig;
  private preloadQueue: Map<string, PreloadStrategy> = new Map();
  private preloadStatus: Map<string, PreloadStatus> = new Map();
  private activePreloads: Set<string> = new Set();
  private idleCallbackId: number | null = null;
  private interactionListenersAttached = false;

  constructor(textureManager: IPaperTextureManager, config: Partial<PreloadConfig> = {}) {
    this.textureManager = textureManager;
    this.config = {
      enablePreloading: config.enablePreloading ?? true,
      enableIdlePreloading: config.enableIdlePreloading ?? true,
      maxConcurrentPreloads: config.maxConcurrentPreloads ?? this.getOptimalConcurrency(),
      preloadOnInteraction: config.preloadOnInteraction ?? true,
      strategies: config.strategies ?? this.getDefaultStrategies()
    };

    if (this.config.enablePreloading) {
      this.initialize();
    }
  }

  /**
   * Initialize preloader and start preloading based on strategies
   * Requirements: 6.2 - Proactive resource loading
   */
  private initialize(): void {
    // Process immediate preloads
    this.processImmediatePreloads();

    // Setup idle preloading
    if (this.config.enableIdlePreloading) {
      this.setupIdlePreloading();
    }

    // Setup interaction-based preloading
    if (this.config.preloadOnInteraction) {
      this.setupInteractionPreloading();
    }
  }

  /**
   * Get default preload strategies
   * Requirements: 5.1, 5.2 - Prioritized loading strategy
   */
  private getDefaultStrategies(): PreloadStrategy[] {
    return [
      {
        priority: 'critical',
        templates: ['blank-1'], // Default blank template
        timing: 'immediate'
      },
      {
        priority: 'high',
        templates: ['lined-1', 'blank-2'], // Common templates
        timing: 'idle'
      },
      {
        priority: 'medium',
        templates: ['lined-2', 'blank-3'], // Secondary templates
        timing: 'idle'
      },
      {
        priority: 'low',
        templates: ['lined-3'], // Rarely used templates
        timing: 'interaction'
      }
    ];
  }

  /**
   * Get optimal concurrency based on device capabilities
   * Requirements: 5.1, 5.2 - Device-aware optimization
   */
  private getOptimalConcurrency(): number {
    const isMobile = window.innerWidth < 768;
    const isLowEndDevice = this.isLowEndDevice();
    const isSlowConnection = this.isSlowConnection();

    if (isMobile && (isLowEndDevice || isSlowConnection)) {
      return 1; // Single preload for constrained devices
    } else if (isMobile) {
      return 2; // Limited concurrent preloads for mobile
    } else {
      return 3; // More concurrent preloads for desktop
    }
  }

  /**
   * Process immediate priority preloads
   * Requirements: 6.2 - Critical resource preloading
   */
  private processImmediatePreloads(): void {
    const immediateStrategies = this.config.strategies.filter(s => s.timing === 'immediate');
    
    for (const strategy of immediateStrategies) {
      for (const templateId of strategy.templates) {
        this.queuePreload(templateId, strategy);
      }
    }

    this.processQueue();
  }

  /**
   * Setup idle-time preloading using requestIdleCallback
   * Requirements: 6.2, 6.3 - Non-blocking preloading
   */
  private setupIdlePreloading(): void {
    if (typeof requestIdleCallback === 'undefined') {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.processIdlePreloads(), 2000);
      return;
    }

    this.idleCallbackId = requestIdleCallback(
      () => this.processIdlePreloads(),
      { timeout: 5000 }
    );
  }

  /**
   * Process idle-time preloads
   * Requirements: 6.2, 6.3 - Background preloading
   */
  private processIdlePreloads(): void {
    const idleStrategies = this.config.strategies.filter(s => s.timing === 'idle');
    
    for (const strategy of idleStrategies) {
      for (const templateId of strategy.templates) {
        // Skip if already loaded or loading
        if (this.isPreloaded(templateId) || this.activePreloads.has(templateId)) {
          continue;
        }
        
        this.queuePreload(templateId, strategy);
      }
    }

    this.processQueue();
  }

  /**
   * Setup interaction-based preloading
   * Requirements: 6.2 - User interaction anticipation
   */
  private setupInteractionPreloading(): void {
    if (this.interactionListenersAttached) return;

    // Preload on first user interaction
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousemove'];
    
    const handleInteraction = () => {
      this.processInteractionPreloads();
      
      // Remove listeners after first interaction
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };

    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    this.interactionListenersAttached = true;
  }

  /**
   * Process interaction-triggered preloads
   * Requirements: 6.2 - Anticipatory loading
   */
  private processInteractionPreloads(): void {
    const interactionStrategies = this.config.strategies.filter(s => s.timing === 'interaction');
    
    for (const strategy of interactionStrategies) {
      for (const templateId of strategy.templates) {
        if (!this.isPreloaded(templateId) && !this.activePreloads.has(templateId)) {
          this.queuePreload(templateId, strategy);
        }
      }
    }

    this.processQueue();
  }

  /**
   * Queue a template for preloading
   * Requirements: 5.3, 5.4 - Priority-based queue management
   */
  private queuePreload(templateId: string, strategy: PreloadStrategy): void {
    if (!this.preloadQueue.has(templateId)) {
      this.preloadQueue.set(templateId, strategy);
      this.preloadStatus.set(templateId, {
        templateId,
        status: 'pending',
        priority: strategy.priority
      });
    }
  }

  /**
   * Process the preload queue
   * Requirements: 5.3, 5.4 - Concurrent preload management
   */
  private async processQueue(): Promise<void> {
    // Sort queue by priority
    const sortedQueue = Array.from(this.preloadQueue.entries())
      .sort((a, b) => this.comparePriority(a[1].priority, b[1].priority));

    for (const [templateId, strategy] of sortedQueue) {
      // Check concurrency limit
      if (this.activePreloads.size >= this.config.maxConcurrentPreloads) {
        break;
      }

      // Skip if already loading or loaded
      if (this.activePreloads.has(templateId) || this.isPreloaded(templateId)) {
        this.preloadQueue.delete(templateId);
        continue;
      }

      // Start preload
      this.startPreload(templateId, strategy);
    }
  }

  /**
   * Start preloading a template
   * Requirements: 5.1, 5.2, 5.3 - Asynchronous preloading
   */
  private async startPreload(templateId: string, strategy: PreloadStrategy): Promise<void> {
    this.activePreloads.add(templateId);
    this.preloadQueue.delete(templateId);

    const status = this.preloadStatus.get(templateId);
    if (status) {
      status.status = 'loading';
      status.startTime = Date.now();
    }

    try {
      // Create template object
      const template: PaperTemplate = {
        id: templateId,
        name: templateId,
        filename: this.getTemplateFilename(templateId),
        type: templateId.startsWith('lined') ? 'lined' : 'blank'
      };

      // Load texture through texture manager (will cache automatically)
      await this.textureManager.loadTexture(template);

      // Update status
      if (status) {
        status.status = 'loaded';
        status.endTime = Date.now();
      }

    } catch (error) {
      console.warn(`Failed to preload texture ${templateId}:`, error);
      
      if (status) {
        status.status = 'failed';
        status.endTime = Date.now();
        status.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } finally {
      this.activePreloads.delete(templateId);
      
      // Process next item in queue
      if (this.preloadQueue.size > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Compare priority levels
   */
  private comparePriority(a: string, b: string): number {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a as keyof typeof priorityOrder] - priorityOrder[b as keyof typeof priorityOrder];
  }

  /**
   * Check if template is preloaded
   */
  private isPreloaded(templateId: string): boolean {
    const status = this.preloadStatus.get(templateId);
    return status?.status === 'loaded';
  }

  /**
   * Get template filename from ID
   */
  private getTemplateFilename(templateId: string): string {
    // Map template IDs to filenames
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
   * Manually trigger preload for specific templates
   * Requirements: 6.2 - On-demand preloading
   */
  public preloadTemplates(templateIds: string[], priority: PreloadStrategy['priority'] = 'high'): void {
    const strategy: PreloadStrategy = {
      priority,
      templates: templateIds,
      timing: 'immediate'
    };

    for (const templateId of templateIds) {
      this.queuePreload(templateId, strategy);
    }

    this.processQueue();
  }

  /**
   * Get preload status for all templates
   */
  public getPreloadStatus(): PreloadStatus[] {
    return Array.from(this.preloadStatus.values());
  }

  /**
   * Get preload statistics
   */
  public getStats(): {
    totalPreloaded: number;
    totalFailed: number;
    totalPending: number;
    activePreloads: number;
    averageLoadTime: number;
  } {
    const statuses = Array.from(this.preloadStatus.values());
    const loaded = statuses.filter(s => s.status === 'loaded');
    const failed = statuses.filter(s => s.status === 'failed');
    const pending = statuses.filter(s => s.status === 'pending');

    const loadTimes = loaded
      .filter(s => s.startTime && s.endTime)
      .map(s => s.endTime! - s.startTime!);

    const averageLoadTime = loadTimes.length > 0
      ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      : 0;

    return {
      totalPreloaded: loaded.length,
      totalFailed: failed.length,
      totalPending: pending.length,
      activePreloads: this.activePreloads.size,
      averageLoadTime
    };
  }

  /**
   * Clear preload queue and status
   */
  public clear(): void {
    this.preloadQueue.clear();
    this.preloadStatus.clear();
    this.activePreloads.clear();

    if (this.idleCallbackId !== null) {
      cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }
  }

  /**
   * Dispose of preloader and clean up resources
   */
  public dispose(): void {
    this.clear();
    this.interactionListenersAttached = false;
  }
}
