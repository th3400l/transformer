/**
 * Tests for Adaptive Quality Service
 * Requirements: 5.4, 9.3, 9.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveQualityService } from './adaptiveQualityService';
import { QualityManager } from './qualityManager';
import { PerformanceMonitor } from './performanceMonitor';

describe('AdaptiveQualityService', () => {
  let service: AdaptiveQualityService;
  let qualityManager: QualityManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    qualityManager = new QualityManager();
    performanceMonitor = new PerformanceMonitor();
    service = new AdaptiveQualityService(qualityManager, performanceMonitor);
  });

  describe('Initialization', () => {
    it('should initialize with default preferences', () => {
      const preferences = service.getUserPreferences();
      expect(preferences.preset).toBe('auto');
      expect(preferences.enableAdaptiveQuality).toBe(true);
    });

    it('should load preferences from localStorage', () => {
      localStorage.setItem('quality-preferences', JSON.stringify({
        preset: 'high',
        enableAdaptiveQuality: false
      }));

      const newService = new AdaptiveQualityService(qualityManager, performanceMonitor);
      const preferences = newService.getUserPreferences();
      
      expect(preferences.preset).toBe('high');
      expect(preferences.enableAdaptiveQuality).toBe(false);
    });

    it('should initialize state correctly', () => {
      const state = service.getState();
      expect(state.currentPreset).toBe('auto');
      expect(state.isAdaptive).toBe(true);
      expect(state.degradationLevel).toBe(0);
      expect(state.performanceBased).toBe(false);
    });
  });

  describe('Quality Presets', () => {
    it('should set quality preset', () => {
      service.setQualityPreset('high');
      
      const preferences = service.getUserPreferences();
      expect(preferences.preset).toBe('high');
      
      const state = service.getState();
      expect(state.currentPreset).toBe('high');
    });

    it('should apply preset settings to quality manager', () => {
      service.setQualityPreset('low');
      
      const settings = service.getCurrentSettings();
      expect(settings.renderingQuality).toBe(0.75);
      expect(settings.textureQuality).toBe(0.6);
      expect(settings.enableAntialiasing).toBe(false);
    });

    it('should get available presets', () => {
      const presets = service.getAvailablePresets();
      expect(presets).toHaveLength(5);
      expect(presets.map(p => p.value)).toEqual(['auto', 'low', 'medium', 'high', 'ultra']);
    });

    it('should get recommended preset based on device', () => {
      const recommended = service.getRecommendedPreset();
      expect(['auto', 'low', 'medium', 'high', 'ultra']).toContain(recommended);
    });
  });

  describe('User Preferences', () => {
    it('should update user preferences', () => {
      service.setUserPreferences({
        preset: 'medium',
        enableAdaptiveQuality: false
      });

      const preferences = service.getUserPreferences();
      expect(preferences.preset).toBe('medium');
      expect(preferences.enableAdaptiveQuality).toBe(false);
    });

    it('should save preferences to localStorage', () => {
      service.setUserPreferences({
        preset: 'high'
      });

      const stored = localStorage.getItem('quality-preferences');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.preset).toBe('high');
    });

    it('should record adjustment when preferences change', () => {
      service.setUserPreferences({
        preset: 'low'
      });

      const history = service.getAdjustmentHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].reason).toBe('user');
    });
  });

  describe('Adaptive Quality', () => {
    it('should start and stop monitoring', () => {
      service.startAdaptiveMonitoring();
      // Monitoring should be active (tested via side effects)
      
      service.stopAdaptiveMonitoring();
      // Monitoring should be stopped
    });

    it('should handle memory pressure', () => {
      const initialSettings = service.getCurrentSettings();
      
      // Simulate high memory pressure
      service.handleMemoryPressure(0.85);
      
      const newSettings = service.getCurrentSettings();
      const state = service.getState();
      
      // Quality should be degraded
      expect(state.degradationLevel).toBeGreaterThan(0);
      expect(state.performanceBased).toBe(true);
    });

    it('should record adjustments for memory pressure', () => {
      service.handleMemoryPressure(0.9);
      
      const history = service.getAdjustmentHistory();
      const memoryAdjustments = history.filter(a => a.reason === 'memory');
      
      expect(memoryAdjustments.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should get current state', () => {
      const state = service.getState();
      
      expect(state).toHaveProperty('currentPreset');
      expect(state).toHaveProperty('effectiveSettings');
      expect(state).toHaveProperty('isAdaptive');
      expect(state).toHaveProperty('performanceBased');
      expect(state).toHaveProperty('degradationLevel');
    });

    it('should get current settings', () => {
      const settings = service.getCurrentSettings();
      
      expect(settings).toHaveProperty('renderingQuality');
      expect(settings).toHaveProperty('textureQuality');
      expect(settings).toHaveProperty('enableAntialiasing');
      expect(settings).toHaveProperty('maxTextureSize');
    });

    it('should track adjustment history', () => {
      service.setQualityPreset('low');
      service.setQualityPreset('high');
      service.handleMemoryPressure(0.8);
      
      const history = service.getAdjustmentHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Reset and Cleanup', () => {
    it('should reset to defaults', () => {
      service.setQualityPreset('ultra');
      service.setUserPreferences({ enableAdaptiveQuality: false });
      
      service.resetToDefaults();
      
      const preferences = service.getUserPreferences();
      expect(preferences.preset).toBe('auto');
      expect(preferences.enableAdaptiveQuality).toBe(true);
    });

    it('should dispose properly', () => {
      service.startAdaptiveMonitoring();
      service.dispose();
      
      // Should stop monitoring and clear history
      const history = service.getAdjustmentHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Performance Thresholds', () => {
    it('should use default thresholds', () => {
      const preferences = service.getUserPreferences();
      expect(preferences.performanceThresholds).toBeDefined();
      expect(preferences.performanceThresholds?.maxRenderTime).toBe(1000);
      expect(preferences.performanceThresholds?.maxMemoryUsage).toBe(100 * 1024 * 1024);
      expect(preferences.performanceThresholds?.minFrameRate).toBe(30);
    });

    it('should allow custom thresholds', () => {
      service.setUserPreferences({
        performanceThresholds: {
          maxRenderTime: 500,
          maxMemoryUsage: 50 * 1024 * 1024,
          minFrameRate: 60
        }
      });

      const preferences = service.getUserPreferences();
      expect(preferences.performanceThresholds?.maxRenderTime).toBe(500);
      expect(preferences.performanceThresholds?.maxMemoryUsage).toBe(50 * 1024 * 1024);
      expect(preferences.performanceThresholds?.minFrameRate).toBe(60);
    });
  });
});
