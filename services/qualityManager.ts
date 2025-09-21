/**
 * Quality Manager for Adaptive Rendering
 * Manages rendering quality based on device capabilities
 * Requirements: 5.1, 5.2, 6.1, 6.2 - Performance optimization for lower-end devices
 */

export interface DeviceCapabilities {
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isLowEnd: boolean;
}

export interface QualitySettings {
  renderingQuality: number; // 0.5 - 2.0
  textureQuality: number; // 0.5 - 1.0
  enableAntialiasing: boolean;
  enableBlending: boolean;
  maxTextureSize: number;
  enableCanvasPooling: boolean;
  enableProgressiveLoading: boolean;
  maxConcurrentOperations: number;
  enableMemoryOptimizations: boolean;
  compressionLevel: number; // 0.1 - 1.0
}

export interface PerformanceProfile {
  name: string;
  description: string;
  settings: QualitySettings;
  conditions: (capabilities: DeviceCapabilities) => boolean;
}

/**
 * Quality Manager
 * Automatically adjusts rendering quality based on device capabilities
 * Requirements: 5.1, 5.2 - Adaptive quality management
 */
export class QualityManager {
  private currentProfile: PerformanceProfile;
  private capabilities: DeviceCapabilities;
  private profiles: PerformanceProfile[];

  constructor() {
    this.capabilities = this.detectDeviceCapabilities();
    this.profiles = this.createPerformanceProfiles();
    this.currentProfile = this.selectOptimalProfile();
  }

  /**
   * Detect device capabilities
   * Requirements: 5.1, 5.2 - Device capability detection
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    const screenSize = {
      width: window.screen.width,
      height: window.screen.height
    };

    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    // Detect low-end device characteristics
    const deviceMemory = nav.deviceMemory || null;
    const hardwareConcurrency = nav.hardwareConcurrency || null;
    const pixelRatio = window.devicePixelRatio || 1;

    const isLowEnd = this.determineIfLowEnd(deviceMemory, hardwareConcurrency, connection, isMobile);

    return {
      deviceMemory,
      hardwareConcurrency,
      connectionType: connection?.type || null,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      screenSize,
      pixelRatio,
      isMobile,
      isTablet,
      isLowEnd
    };
  }

  /**
   * Determine if device is low-end
   * Requirements: 5.1, 5.2 - Low-end device detection
   */
  private determineIfLowEnd(
    deviceMemory: number | null,
    hardwareConcurrency: number | null,
    connection: any,
    isMobile: boolean
  ): boolean {
    // Memory-based detection
    if (deviceMemory && deviceMemory <= 2) return true;

    // CPU-based detection
    if (hardwareConcurrency && hardwareConcurrency <= 2) return true;

    // Connection-based detection
    if (connection) {
      const slowConnections = ['slow-2g', '2g'];
      if (slowConnections.includes(connection.effectiveType)) return true;
      if (connection.downlink && connection.downlink < 1) return true;
    }

    // Mobile with limited capabilities
    if (isMobile && (!deviceMemory || deviceMemory <= 4) && (!hardwareConcurrency || hardwareConcurrency <= 4)) {
      return true;
    }

    return false;
  }

  /**
   * Create performance profiles for different device types
   * Requirements: 5.1, 5.2 - Device-specific optimization profiles
   */
  private createPerformanceProfiles(): PerformanceProfile[] {
    return [
      {
        name: 'low-end-mobile',
        description: 'Optimized for low-end mobile devices',
        settings: {
          renderingQuality: 0.75,
          textureQuality: 0.6,
          enableAntialiasing: false,
          enableBlending: true, // Keep blending for quality
          maxTextureSize: 1024,
          enableCanvasPooling: true,
          enableProgressiveLoading: true,
          maxConcurrentOperations: 1,
          enableMemoryOptimizations: true,
          compressionLevel: 0.7
        },
        conditions: (cap) => cap.isLowEnd && cap.isMobile
      },
      {
        name: 'mobile',
        description: 'Optimized for mobile devices',
        settings: {
          renderingQuality: 1.0,
          textureQuality: 0.8,
          enableAntialiasing: true,
          enableBlending: true,
          maxTextureSize: 2048,
          enableCanvasPooling: true,
          enableProgressiveLoading: true,
          maxConcurrentOperations: 2,
          enableMemoryOptimizations: true,
          compressionLevel: 0.8
        },
        conditions: (cap) => !cap.isLowEnd && cap.isMobile
      },
      {
        name: 'tablet',
        description: 'Optimized for tablet devices',
        settings: {
          renderingQuality: 1.2,
          textureQuality: 0.9,
          enableAntialiasing: true,
          enableBlending: true,
          maxTextureSize: 2048,
          enableCanvasPooling: true,
          enableProgressiveLoading: false,
          maxConcurrentOperations: 3,
          enableMemoryOptimizations: false,
          compressionLevel: 0.9
        },
        conditions: (cap) => cap.isTablet
      },
      {
        name: 'desktop-low',
        description: 'Optimized for low-end desktop',
        settings: {
          renderingQuality: 1.0,
          textureQuality: 0.9,
          enableAntialiasing: true,
          enableBlending: true,
          maxTextureSize: 4096,
          enableCanvasPooling: false,
          enableProgressiveLoading: false,
          maxConcurrentOperations: 4,
          enableMemoryOptimizations: false,
          compressionLevel: 0.9
        },
        conditions: (cap) => !cap.isMobile && !cap.isTablet && cap.isLowEnd
      },
      {
        name: 'desktop-high',
        description: 'High quality for capable desktop',
        settings: {
          renderingQuality: 1.5,
          textureQuality: 1.0,
          enableAntialiasing: true,
          enableBlending: true,
          maxTextureSize: 4096,
          enableCanvasPooling: false,
          enableProgressiveLoading: false,
          maxConcurrentOperations: 6,
          enableMemoryOptimizations: false,
          compressionLevel: 1.0
        },
        conditions: (cap) => !cap.isMobile && !cap.isTablet && !cap.isLowEnd
      }
    ];
  }

  /**
   * Select optimal performance profile
   * Requirements: 5.1, 5.2 - Automatic profile selection
   */
  private selectOptimalProfile(): PerformanceProfile {
    for (const profile of this.profiles) {
      if (profile.conditions(this.capabilities)) {
        return profile;
      }
    }

    // Fallback to most conservative profile
    return this.profiles.find(p => p.name === 'low-end-mobile') || this.profiles[0];
  }

  /**
   * Get current quality settings
   */
  getCurrentSettings(): QualitySettings {
    return { ...this.currentProfile.settings };
  }

  /**
   * Get current profile information
   */
  getCurrentProfile(): { name: string; description: string } {
    return {
      name: this.currentProfile.name,
      description: this.currentProfile.description
    };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Override quality settings temporarily
   * Requirements: 5.1, 5.2 - Manual quality override
   */
  overrideSettings(overrides: Partial<QualitySettings>): void {
    this.currentProfile = {
      ...this.currentProfile,
      settings: {
        ...this.currentProfile.settings,
        ...overrides
      }
    };
  }

  /**
   * Reset to optimal profile
   */
  resetToOptimal(): void {
    this.currentProfile = this.selectOptimalProfile();
  }

  /**
   * Reset to default settings (alias for resetToOptimal)
   */
  resetToDefaults(): void {
    this.resetToOptimal();
  }

  /**
   * Enable adaptive quality management
   */
  enableAdaptiveQuality(): void {
    // This method enables adaptive quality - already enabled by default
    console.log('Adaptive quality management enabled');
  }

  /**
   * Force specific profile
   */
  forceProfile(profileName: string): boolean {
    const profile = this.profiles.find(p => p.name === profileName);
    if (profile) {
      this.currentProfile = profile;
      return true;
    }
    return false;
  }

  /**
   * Get available profiles
   */
  getAvailableProfiles(): Array<{ name: string; description: string }> {
    return this.profiles.map(p => ({
      name: p.name,
      description: p.description
    }));
  }

  /**
   * Adapt quality based on performance metrics
   * Requirements: 5.1, 5.2 - Dynamic quality adaptation
   */
  adaptQualityBasedOnPerformance(metrics: {
    renderTime: number;
    memoryUsage: number;
    frameRate: number;
  }): void {
    const settings = this.currentProfile.settings;
    
    // If rendering is too slow, reduce quality
    if (metrics.renderTime > 1000) { // More than 1 second
      settings.renderingQuality = Math.max(0.5, settings.renderingQuality * 0.9);
      settings.textureQuality = Math.max(0.5, settings.textureQuality * 0.9);
    }

    // If memory usage is high, enable optimizations
    if (metrics.memoryUsage > 100 * 1024 * 1024) { // More than 100MB
      settings.enableMemoryOptimizations = true;
      settings.enableCanvasPooling = true;
      settings.maxTextureSize = Math.min(settings.maxTextureSize, 2048);
    }

    // If frame rate is low, disable expensive features
    if (metrics.frameRate < 30) {
      settings.enableAntialiasing = false;
      settings.renderingQuality = Math.max(0.5, settings.renderingQuality * 0.8);
    }
  }

  /**
   * Get recommended canvas configuration
   * Requirements: 5.1, 5.2 - Canvas optimization recommendations
   */
  getCanvasConfig(requestedWidth: number, requestedHeight: number): {
    width: number;
    height: number;
    pixelRatio: number;
    imageSmoothingEnabled: boolean;
    imageSmoothingQuality: ImageSmoothingQuality;
  } {
    const settings = this.currentProfile.settings;
    
    // Limit canvas size based on device capabilities
    const maxSize = Math.sqrt(settings.maxTextureSize * settings.maxTextureSize);
    const scale = Math.min(1, maxSize / Math.max(requestedWidth, requestedHeight));
    
    const width = Math.floor(requestedWidth * scale);
    const height = Math.floor(requestedHeight * scale);
    
    // Adjust pixel ratio based on quality settings
    const pixelRatio = Math.min(
      this.capabilities.pixelRatio,
      settings.renderingQuality
    );

    return {
      width,
      height,
      pixelRatio,
      imageSmoothingEnabled: settings.enableAntialiasing,
      imageSmoothingQuality: this.getImageSmoothingQuality(settings)
    };
  }

  /**
   * Get image smoothing quality based on settings
   */
  private getImageSmoothingQuality(settings: QualitySettings): ImageSmoothingQuality {
    if (settings.renderingQuality >= 1.5) return 'high';
    if (settings.renderingQuality >= 1.0) return 'medium';
    return 'low';
  }

  /**
   * Get texture loading configuration
   * Requirements: 5.1, 5.2 - Texture loading optimization
   */
  getTextureConfig(): {
    enableProgressiveLoading: boolean;
    maxConcurrentLoads: number;
    compressionLevel: number;
    maxTextureSize: number;
  } {
    const settings = this.currentProfile.settings;
    
    return {
      enableProgressiveLoading: settings.enableProgressiveLoading,
      maxConcurrentLoads: settings.maxConcurrentOperations,
      compressionLevel: settings.compressionLevel,
      maxTextureSize: settings.maxTextureSize
    };
  }

  /**
   * Check if feature should be enabled based on current profile
   */
  shouldEnableFeature(feature: keyof QualitySettings): boolean {
    const value = this.currentProfile.settings[feature];
    return typeof value === 'boolean' ? value : true;
  }

  /**
   * Get memory optimization recommendations
   * Requirements: 5.1, 5.2 - Memory management recommendations
   */
  getMemoryOptimizations(): {
    enableCanvasPooling: boolean;
    maxPoolSize: number;
    enableTextureCompression: boolean;
    enableGarbageCollection: boolean;
    memoryThreshold: number;
  } {
    const settings = this.currentProfile.settings;
    
    return {
      enableCanvasPooling: settings.enableCanvasPooling,
      maxPoolSize: this.capabilities.isMobile ? 4 : 8,
      enableTextureCompression: settings.enableMemoryOptimizations,
      enableGarbageCollection: settings.enableMemoryOptimizations,
      memoryThreshold: this.capabilities.isMobile ? 50 * 1024 * 1024 : 100 * 1024 * 1024
    };
  }

  /**
   * Update capabilities (call when device state changes)
   */
  updateCapabilities(): void {
    this.capabilities = this.detectDeviceCapabilities();
    this.currentProfile = this.selectOptimalProfile();
  }
}

// Global quality manager instance
let globalQualityManager: QualityManager | null = null;

/**
 * Get or create global quality manager instance
 */
export function getQualityManager(): QualityManager {
  if (!globalQualityManager) {
    globalQualityManager = new QualityManager();
  }
  return globalQualityManager;
}

/**
 * Initialize quality manager
 */
export function initializeQualityManager(): QualityManager {
  globalQualityManager = new QualityManager();
  return globalQualityManager;
}