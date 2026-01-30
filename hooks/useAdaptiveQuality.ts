/**
 * React hook for adaptive quality management
 * Requirements: 5.4, 9.3, 9.4 - User interface for quality preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AdaptiveQualityService,
  getAdaptiveQualityService,
  QualityPreset,
  UserQualityPreferences,
  AdaptiveQualityState,
  QualityAdjustment
} from '../services/adaptiveQualityService';
import { QualitySettings } from '../services/qualityManager';
import { IPerformanceMonitor } from '../services/performanceMonitor';

export interface UseAdaptiveQualityOptions {
  performanceMonitor?: IPerformanceMonitor;
  autoStart?: boolean;
}

export interface UseAdaptiveQualityReturn {
  // Current state
  state: AdaptiveQualityState;
  preferences: UserQualityPreferences;
  currentSettings: QualitySettings;
  
  // Actions
  setPreset: (preset: QualityPreset) => void;
  setPreferences: (preferences: Partial<UserQualityPreferences>) => void;
  resetToDefaults: () => void;
  
  // Monitoring
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
  
  // Information
  availablePresets: Array<{ value: QualityPreset; label: string; description: string }>;
  recommendedPreset: QualityPreset;
  adjustmentHistory: QualityAdjustment[];
  
  // Service access
  service: AdaptiveQualityService;
}

/**
 * Hook for managing adaptive quality settings
 */
export function useAdaptiveQuality(
  options: UseAdaptiveQualityOptions = {}
): UseAdaptiveQualityReturn {
  const { performanceMonitor, autoStart = false } = options;
  
  // Get or create service instance
  const serviceRef = useRef<AdaptiveQualityService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current = getAdaptiveQualityService();
    if (performanceMonitor) {
      serviceRef.current.setPerformanceMonitor(performanceMonitor);
    }
  }
  
  const service = serviceRef.current;
  
  // State
  const [state, setState] = useState<AdaptiveQualityState>(service.getState());
  const [preferences, setPreferencesState] = useState<UserQualityPreferences>(
    service.getUserPreferences()
  );
  const [currentSettings, setCurrentSettings] = useState<QualitySettings>(
    service.getCurrentSettings()
  );
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [adjustmentHistory, setAdjustmentHistory] = useState<QualityAdjustment[]>(
    service.getAdjustmentHistory()
  );
  
  // Update interval for state synchronization
  const updateIntervalRef = useRef<number | null>(null);
  
  // Sync state from service
  const syncState = useCallback(() => {
    setState(service.getState());
    setPreferencesState(service.getUserPreferences());
    setCurrentSettings(service.getCurrentSettings());
    setAdjustmentHistory(service.getAdjustmentHistory());
  }, [service]);
  
  // Set quality preset
  const setPreset = useCallback((preset: QualityPreset) => {
    service.setQualityPreset(preset);
    syncState();
  }, [service, syncState]);
  
  // Set preferences
  const setPreferences = useCallback((prefs: Partial<UserQualityPreferences>) => {
    service.setUserPreferences(prefs);
    syncState();
  }, [service, syncState]);
  
  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    service.resetToDefaults();
    syncState();
  }, [service, syncState]);
  
  // Start monitoring
  const startMonitoring = useCallback(() => {
    service.startAdaptiveMonitoring();
    setIsMonitoring(true);
  }, [service]);
  
  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    service.stopAdaptiveMonitoring();
    setIsMonitoring(false);
  }, [service]);
  
  // Get available presets
  const availablePresets = service.getAvailablePresets();
  
  // Get recommended preset
  const recommendedPreset = service.getRecommendedPreset();
  
  // Auto-start monitoring if requested
  useEffect(() => {
    if (autoStart && preferences.enableAdaptiveQuality) {
      startMonitoring();
    }
    
    return () => {
      if (autoStart) {
        stopMonitoring();
      }
    };
  }, [autoStart, preferences.enableAdaptiveQuality, startMonitoring, stopMonitoring]);
  
  // Set up state synchronization interval
  useEffect(() => {
    // Update state every 2 seconds when monitoring
    if (isMonitoring) {
      updateIntervalRef.current = window.setInterval(() => {
        syncState();
      }, 2000);
    }
    
    return () => {
      if (updateIntervalRef.current !== null) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [isMonitoring, syncState]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current !== null) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);
  
  return {
    state,
    preferences,
    currentSettings,
    setPreset,
    setPreferences,
    resetToDefaults,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    availablePresets,
    recommendedPreset,
    adjustmentHistory,
    service
  };
}

/**
 * Hook for simple quality preset selection
 */
export function useQualityPreset(initialPreset: QualityPreset = 'auto') {
  const { setPreset, preferences, availablePresets, recommendedPreset } = useAdaptiveQuality();
  
  const [currentPreset, setCurrentPreset] = useState<QualityPreset>(
    preferences.preset || initialPreset
  );
  
  const changePreset = useCallback((preset: QualityPreset) => {
    setPreset(preset);
    setCurrentPreset(preset);
  }, [setPreset]);
  
  return {
    currentPreset,
    setPreset: changePreset,
    availablePresets,
    recommendedPreset
  };
}
