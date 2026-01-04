// Mobile-specific canvas rendering optimizations
// Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 8.1, 8.3

import { RenderingConfig } from '../types';
import { getQualityManager } from './qualityManager';

/**
 * Apply mobile-specific optimizations to rendering configuration
 * Requirements: 5.1, 5.2 - Mobile-specific optimizations
 */
export function applyMobileOptimizations(config: RenderingConfig, qualityManager: any): RenderingConfig {
  const qualitySettings = qualityManager.getCurrentSettings();
  const canvasConfig = qualityManager.getCanvasConfig(config.canvasWidth, config.canvasHeight);
  
  const colorIntensityScale = 0.9 + (qualitySettings.textureQuality ?? 1) * 0.15;

  return {
    ...config,
    canvasWidth: canvasConfig.width,
    canvasHeight: canvasConfig.height,
    renderingQuality: qualitySettings.renderingQuality,
    textureCache: qualitySettings.enableCanvasPooling,
    colorVariationIntensity: Math.max(0.025, config.colorVariationIntensity * colorIntensityScale),
    baselineJitterRange: config.baselineJitterRange,
    slantJitterRange: config.slantJitterRange,
    microTiltRange: config.microTiltRange,
    distortionLevel: config.distortionLevel
  };
}

/**
 * Record performance metrics for adaptive optimization
 * Requirements: 5.1, 5.2 - Performance monitoring
 */
export function recordPerformanceMetrics(
  startTime: number,
  performanceMetrics: { renderTime: number; memoryUsage: number; frameRate: number }
): void {
  const endTime = performance.now();
  performanceMetrics.renderTime = endTime - startTime;
  
  // Record memory usage if available
  const memory = (performance as any).memory;
  if (memory) {
    performanceMetrics.memoryUsage = memory.usedJSHeapSize;
  }
  
  // Adapt quality based on performance
  const qualityManager = getQualityManager();
  qualityManager.adaptQualityBasedOnPerformance(performanceMetrics);
}

/**
 * Check memory constraints for mobile devices
 * Requirements: 6.1, 6.2, 6.3, 6.5 - Add memory management for large text rendering operations
 */
export function checkMemoryConstraints(config: RenderingConfig): void {
  const canvasPixels = config.canvasWidth * config.canvasHeight;
  const textLength = config.text?.length || 0;
  
  const maxMemory = getMaxAllowedMemory();
  const estimatedMemory = (canvasPixels * 4) + (textLength * 100); // Rough estimate
  
  if (estimatedMemory > maxMemory) {
    throw new Error(`Memory constraint exceeded: ${estimatedMemory} > ${maxMemory}`);
  }
  
  const maxTextLength = getMaxTextLength();
  if (textLength > maxTextLength) {
    throw new Error(`Text length exceeds maximum: ${textLength} > ${maxTextLength}`);
  }
}

/**
 * Get maximum allowed memory based on device capabilities
 */
function getMaxAllowedMemory(): number {
  const isMobile = window.innerWidth < 768;
  const isLowEndDevice = isLowEndDeviceCheck();
  
  if (isMobile && isLowEndDevice) {
    return 50 * 1024 * 1024; // 50MB for low-end mobile
  } else if (isMobile) {
    return 100 * 1024 * 1024; // 100MB for mobile
  } else {
    return 200 * 1024 * 1024; // 200MB for desktop
  }
}

/**
 * Get maximum text length based on device capabilities
 */
function getMaxTextLength(): number {
  const isMobile = window.innerWidth < 768;
  const isLowEndDevice = isLowEndDeviceCheck();
  
  if (isMobile && isLowEndDevice) {
    return 5000; // 5000 characters for low-end mobile
  } else if (isMobile) {
    return 10000; // 10000 characters for mobile
  } else {
    return 50000; // 50000 characters for desktop
  }
}

/**
 * Detect low-end device characteristics
 */
function isLowEndDeviceCheck(): boolean {
  // Check for device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory <= 2) {
    return true;
  }

  // Check for hardware concurrency (CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (hardwareConcurrency && hardwareConcurrency <= 2) {
    return true;
  }

  // Check for connection type (if available)
  const connection = (navigator as any).connection;
  if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
    return true;
  }

  return false;
}

/**
 * Configure touch handling for mobile canvas
 * Requirements: 3.1 - Touch interaction optimization
 */
export function configureTouchHandling(canvas: HTMLCanvasElement): void {
  // Enable touch-friendly interactions
  canvas.style.touchAction = 'pan-y';
  canvas.style.userSelect = 'none';
  canvas.style.webkitUserSelect = 'none';
  
  // Prevent default touch behaviors that might interfere
  canvas.addEventListener('touchstart', (e) => {
    // Allow touch but prevent unwanted behaviors
    if (e.touches.length > 1) {
      e.preventDefault(); // Prevent pinch zoom
    }
  }, { passive: false });
}

/**
 * Get performance adaptations for mobile rendering
 * Requirements: 5.1, 5.2 - Mobile performance adaptations
 */
export function getMobilePerformanceAdaptations(): {
  maxQuality: number;
  enablePooling: boolean;
  reducedEffects: boolean;
} {
  const isMobile = window.innerWidth < 768;
  const isLowEndDevice = isLowEndDeviceCheck();
  
  if (isMobile && isLowEndDevice) {
    return {
      maxQuality: 1.0,
      enablePooling: true,
      reducedEffects: true
    };
  } else if (isMobile) {
    return {
      maxQuality: 1.5,
      enablePooling: true,
      reducedEffects: false
    };
  } else {
    return {
      maxQuality: 3.0,
      enablePooling: false,
      reducedEffects: false
    };
  }
}
