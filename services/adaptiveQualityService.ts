/**
 * Adaptive Quality Service
 * Automatically adjusts rendering quality based on device capabilities and performance
 * Requirements: 5.4, 9.3, 9.4 - Adaptive quality system with user preferences
 */

import { QualityManager, QualitySettings, getQualityManager } from './qualityManager';
import { IPerformanceMonitor, PerformanceReport } from './performanceMonitor';

export type QualityPreset = 'auto' | 'low' | 'medium' | 'high' | 'ultra';

export interface UserQualityPreferences {
  preset: QualityPreset;
  overrides?: Partial<QualitySettings>;
  enableAdaptiveQuality: boolean;
  performanceThresholds?: {
    maxRenderTime?: number;      // ms
    maxMemoryUsage?: number;     // bytes
    minFrameRate?: number;       // fps
  };
}

export interface AdaptiveQualityState {
  currentPreset: QualityPreset;
  effectiveSettings: QualitySettings;
  isAdaptive: boolean;
  performanceBased: boolean;
  degradationLevel: number; // 0-3 (none, low, medium, high)
  lastAdjustment: number;
  adjustmentHistory: QualityAdjustment[];
}

export interface QualityAdjustment {
  timestamp: number;
  reason: 'user' | 'performance' | 'memory' | 'device';
  from: Partial<QualitySettings>;
  to: Partial<QualitySettings>;
  description: string;
}

const DEFAULT_PREFERENCES: UserQualityPreferences = {
  preset: 'auto',
  enableAdaptiveQuality: true,
  performanceThresholds: {
    maxRenderTime: 1000,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    minFrameRate: 30
  }
};

const QUALITY_PRESETS: Record<Exclude<QualityPreset, 'auto'>, Partial<QualitySettings>> = {
  low: {
    renderingQuality: 0.75,
    textureQuality: 0.6,
    enableAntialiasing: false,
    enableBlending: true,
    maxTextureSize: 1024,
    compressionLevel: 0.7
  },
  medium: {
    renderingQuality: 1.0,
    textureQuality: 0.8,
    enableAntialiasing: true,
    enableBlending: true,
    maxTextureSize: 2048,
    compressionLevel: 0.8
  },
  high: {
    renderingQuality: 1.5,
    textureQuality: 1.0,
    enableAntialiasing: true,
    enableBlending: true,
    maxTextureSize: 4096,
    compressionLevel: 0.9
  },
  ultra: {
    renderingQuality: 2.0,
    textureQuality: 1.0,
    enableAntialiasing: true,
    enableBlending: true,
    maxTextureSize: 4096,
    compressionLevel: 1.0
  }
};

/**
 * Adaptive Quality Service
 * Manages quality settings with user preferences and automatic adaptation
 */
export class AdaptiveQualityService {
  private qualityManager: QualityManager;
  private performanceMonitor: IPerformanceMonitor | null = null;
  private preferences: UserQualityPreferences;
  private state: AdaptiveQualityState;
  private adjustmentHistory: QualityAdjustment[] = [];
  private readonly maxHistorySize = 50;
  private monitoringInterval: number | null = null;
  private readonly monitoringIntervalMs = 5000; // Check every 5 seconds

  constructor(
    qualityManager?: QualityManager,
    performanceMonitor?: IPerformanceMonitor
  ) {
    this.qualityManager = qualityManager || getQualityManager();
    this.performanceMonitor = performanceMonitor || null;
    
    // Load preferences from localStorage
    this.preferences = this.loadPreferences();
    
    // Initialize state
    this.state = {
      currentPreset: this.preferences.preset,
      effectiveSettings: this.qualityManager.getCurrentSettings(),
      isAdaptive: this.preferences.enableAdaptiveQuality,
      performanceBased: false,
      degradationLevel: 0,
      lastAdjustment: Date.now(),
      adjustmentHistory: []
    };

    // Apply initial preferences
    this.applyPreferences();
  }

  /**
   * Set performance monitor for adaptive quality
   */
  setPerformanceMonitor(monitor: IPerformanceMonitor): void {
    this.performanceMonitor = monitor;
  }

  /**
   * Load user preferences from localStorage
   */
  private loadPreferences(): UserQualityPreferences {
    try {
      const stored = localStorage.getItem('quality-preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load quality preferences:', error);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save user preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('quality-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save quality preferences:', error);
    }
  }

  /**
   * Get current user preferences
   */
  getUserPreferences(): UserQualityPreferences {
    return { ...this.preferences };
  }

  /**
   * Update user preferences
   */
  setUserPreferences(preferences: Partial<UserQualityPreferences>): void {
    const oldPreferences = { ...this.preferences };
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();

    // Record adjustment
    this.recordAdjustment({
      reason: 'user',
      from: this.state.effectiveSettings,
      to: this.qualityManager.getCurrentSettings(),
      description: `User changed preferences from ${oldPreferences.preset} to ${this.preferences.preset}`
    });

    // Apply new preferences
    this.applyPreferences();
    
    // Update state
    this.state.currentPreset = this.preferences.preset;
    this.state.isAdaptive = this.preferences.enableAdaptiveQuality;
  }

  /**
   * Set quality preset
   */
  setQualityPreset(preset: QualityPreset): void {
    this.setUserPreferences({ preset });
  }

  /**
   * Apply current preferences to quality manager
   */
  private applyPreferences(): void {
    if (this.preferences.preset === 'auto') {
      // Use device-based automatic selection
      this.qualityManager.resetToOptimal();
    } else {
      // Apply user-selected preset
      const presetSettings = QUALITY_PRESETS[this.preferences.preset];
      this.qualityManager.overrideSettings(presetSettings);
      
      // Apply user overrides if any
      if (this.preferences.overrides) {
        this.qualityManager.overrideSettings(this.preferences.overrides);
      }
    }

    this.state.effectiveSettings = this.qualityManager.getCurrentSettings();
  }

  /**
   * Get current quality state
   */
  getState(): AdaptiveQualityState {
    return { ...this.state };
  }

  /**
   * Get current effective quality settings
   */
  getCurrentSettings(): QualitySettings {
    return this.qualityManager.getCurrentSettings();
  }

  /**
   * Start adaptive quality monitoring
   */
  startAdaptiveMonitoring(): void {
    if (!this.preferences.enableAdaptiveQuality) {
      return;
    }

    if (this.monitoringInterval !== null) {
      return; // Already monitoring
    }

    this.monitoringInterval = window.setInterval(() => {
      this.checkAndAdaptQuality();
    }, this.monitoringIntervalMs);
  }

  /**
   * Stop adaptive quality monitoring
   */
  stopAdaptiveMonitoring(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check performance and adapt quality if needed
   */
  private checkAndAdaptQuality(): void {
    if (!this.performanceMonitor || !this.preferences.enableAdaptiveQuality) {
      return;
    }

    const report = this.performanceMonitor.generateReport();
    const thresholds = this.preferences.performanceThresholds || DEFAULT_PREFERENCES.performanceThresholds!;

    let needsAdjustment = false;
    let adjustmentReason = '';

    // Check render time
    if (report.summary.avgRenderTime > thresholds.maxRenderTime!) {
      needsAdjustment = true;
      adjustmentReason = `Render time ${report.summary.avgRenderTime.toFixed(0)}ms exceeds threshold ${thresholds.maxRenderTime}ms`;
    }

    // Check memory usage
    if (report.memoryUsage.usedJSHeapSize > thresholds.maxMemoryUsage!) {
      needsAdjustment = true;
      adjustmentReason = `Memory usage ${(report.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(0)}MB exceeds threshold ${(thresholds.maxMemoryUsage! / 1024 / 1024).toFixed(0)}MB`;
    }

    // Check frame rate
    if (report.frameRate && report.frameRate.averageFPS < thresholds.minFrameRate!) {
      needsAdjustment = true;
      adjustmentReason = `Frame rate ${report.frameRate.averageFPS.toFixed(1)} FPS below threshold ${thresholds.minFrameRate} FPS`;
    }

    if (needsAdjustment) {
      this.adaptQualityBasedOnPerformance(report, adjustmentReason);
    } else if (this.state.degradationLevel > 0) {
      // Performance is good, try to restore quality
      this.tryRestoreQuality(report);
    }
  }

  /**
   * Adapt quality based on performance metrics
   */
  private adaptQualityBasedOnPerformance(report: PerformanceReport, reason: string): void {
    const oldSettings = { ...this.state.effectiveSettings };

    // Use quality manager's adaptation logic
    this.qualityManager.adaptQualityBasedOnPerformance({
      renderTime: report.summary.avgRenderTime,
      memoryUsage: report.memoryUsage.usedJSHeapSize,
      frameRate: report.frameRate?.averageFPS || 60
    });

    const newSettings = this.qualityManager.getCurrentSettings();

    // Update state
    this.state.effectiveSettings = newSettings;
    this.state.performanceBased = true;
    this.state.degradationLevel = Math.min(3, this.state.degradationLevel + 1);
    this.state.lastAdjustment = Date.now();

    // Record adjustment
    this.recordAdjustment({
      reason: 'performance',
      from: oldSettings,
      to: newSettings,
      description: reason
    });
  }

  /**
   * Try to restore quality when performance improves
   */
  private tryRestoreQuality(report: PerformanceReport): void {
    const thresholds = this.preferences.performanceThresholds || DEFAULT_PREFERENCES.performanceThresholds!;
    
    // Check if performance is consistently good
    const renderTimeGood = report.summary.avgRenderTime < thresholds.maxRenderTime! * 0.7;
    const memoryGood = report.memoryUsage.usedJSHeapSize < thresholds.maxMemoryUsage! * 0.7;
    const frameRateGood = !report.frameRate || report.frameRate.averageFPS > thresholds.minFrameRate! * 1.2;

    if (renderTimeGood && memoryGood && frameRateGood) {
      const oldSettings = { ...this.state.effectiveSettings };
      
      // Restore to user preferences
      this.applyPreferences();
      
      const newSettings = this.qualityManager.getCurrentSettings();

      // Update state
      this.state.effectiveSettings = newSettings;
      this.state.performanceBased = false;
      this.state.degradationLevel = 0;
      this.state.lastAdjustment = Date.now();

      // Record adjustment
      this.recordAdjustment({
        reason: 'performance',
        from: oldSettings,
        to: newSettings,
        description: 'Performance improved, restored quality settings'
      });
    }
  }

  /**
   * Handle memory pressure
   */
  handleMemoryPressure(memoryPressure: number): void {
    const oldSettings = { ...this.state.effectiveSettings };
    
    const result = this.qualityManager.degradeQualityForMemoryPressure(memoryPressure);
    
    if (result.degraded) {
      const newSettings = this.qualityManager.getCurrentSettings();
      
      // Update state
      this.state.effectiveSettings = newSettings;
      this.state.performanceBased = true;
      this.state.degradationLevel = Math.min(3, this.state.degradationLevel + 1);
      this.state.lastAdjustment = Date.now();

      // Record adjustment
      this.recordAdjustment({
        reason: 'memory',
        from: oldSettings,
        to: newSettings,
        description: `Memory pressure ${(memoryPressure * 100).toFixed(0)}%: ${result.changes.join(', ')}`
      });
    }
  }

  /**
   * Record quality adjustment
   */
  private recordAdjustment(adjustment: Omit<QualityAdjustment, 'timestamp'>): void {
    const fullAdjustment: QualityAdjustment = {
      timestamp: Date.now(),
      ...adjustment
    };

    this.adjustmentHistory.push(fullAdjustment);
    this.state.adjustmentHistory.push(fullAdjustment);

    // Limit history size
    if (this.adjustmentHistory.length > this.maxHistorySize) {
      this.adjustmentHistory.shift();
    }
    if (this.state.adjustmentHistory.length > this.maxHistorySize) {
      this.state.adjustmentHistory.shift();
    }
  }

  /**
   * Get adjustment history
   */
  getAdjustmentHistory(): QualityAdjustment[] {
    return [...this.adjustmentHistory];
  }

  /**
   * Reset to default preferences
   */
  resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.savePreferences();
    this.applyPreferences();
    
    this.state.currentPreset = 'auto';
    this.state.isAdaptive = true;
    this.state.performanceBased = false;
    this.state.degradationLevel = 0;
    this.state.effectiveSettings = this.qualityManager.getCurrentSettings();

    this.recordAdjustment({
      reason: 'user',
      from: {},
      to: this.state.effectiveSettings,
      description: 'Reset to default preferences'
    });
  }

  /**
   * Get available quality presets
   */
  getAvailablePresets(): Array<{ value: QualityPreset; label: string; description: string }> {
    return [
      {
        value: 'auto',
        label: 'Auto',
        description: 'Automatically adjust based on device capabilities'
      },
      {
        value: 'low',
        label: 'Low',
        description: 'Optimized for performance on low-end devices'
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Balanced quality and performance'
      },
      {
        value: 'high',
        label: 'High',
        description: 'High quality for capable devices'
      },
      {
        value: 'ultra',
        label: 'Ultra',
        description: 'Maximum quality for high-end devices'
      }
    ];
  }

  /**
   * Get quality recommendation based on device
   */
  getRecommendedPreset(): QualityPreset {
    const capabilities = this.qualityManager.getDeviceCapabilities();
    
    if (capabilities.isLowEnd) {
      return 'low';
    }
    
    if (capabilities.isMobile) {
      return 'medium';
    }
    
    if (capabilities.isTablet) {
      return 'high';
    }
    
    // Desktop
    if (capabilities.deviceMemory && capabilities.deviceMemory >= 8) {
      return 'ultra';
    }
    
    return 'high';
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopAdaptiveMonitoring();
    this.adjustmentHistory = [];
  }
}

// Global instance
let globalAdaptiveQualityService: AdaptiveQualityService | null = null;

/**
 * Get or create global adaptive quality service
 */
export function getAdaptiveQualityService(): AdaptiveQualityService {
  if (!globalAdaptiveQualityService) {
    globalAdaptiveQualityService = new AdaptiveQualityService();
  }
  return globalAdaptiveQualityService;
}

/**
 * Initialize adaptive quality service
 */
export function initializeAdaptiveQualityService(
  qualityManager?: QualityManager,
  performanceMonitor?: IPerformanceMonitor
): AdaptiveQualityService {
  globalAdaptiveQualityService = new AdaptiveQualityService(qualityManager, performanceMonitor);
  return globalAdaptiveQualityService;
}
