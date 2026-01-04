/**
 * Quality Settings Panel Component
 * User interface for quality preferences
 * Requirements: 5.4, 9.3, 9.4 - User preference for quality settings
 */

import React, { useState } from 'react';
import { useAdaptiveQuality } from '../hooks/useAdaptiveQuality';
import { QualityPreset } from '../services/adaptiveQualityService';

interface QualitySettingsPanelProps {
  onClose?: () => void;
  showAdvanced?: boolean;
}

export const QualitySettingsPanel: React.FC<QualitySettingsPanelProps> = ({
  onClose,
  showAdvanced = false
}) => {
  const {
    state,
    preferences,
    currentSettings,
    setPreset,
    setPreferences,
    resetToDefaults,
    availablePresets,
    recommendedPreset,
    adjustmentHistory
  } = useAdaptiveQuality();

  const [showHistory, setShowHistory] = useState(false);

  const handlePresetChange = (preset: QualityPreset) => {
    setPreset(preset);
  };

  const handleAdaptiveToggle = () => {
    setPreferences({
      enableAdaptiveQuality: !preferences.enableAdaptiveQuality
    });
  };

  const getQualityBadgeColor = (preset: QualityPreset): string => {
    switch (preset) {
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-green-100 text-green-800';
      case 'ultra': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDegradationColor = (level: number): string => {
    if (level === 0) return 'text-green-600';
    if (level === 1) return 'text-yellow-600';
    if (level === 2) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Quality Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Preset:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityBadgeColor(state.currentPreset)}`}>
            {state.currentPreset.toUpperCase()}
          </span>
        </div>
        
        {state.performanceBased && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Performance Adjusted:</span>
            <span className={`text-sm font-medium ${getDegradationColor(state.degradationLevel)}`}>
              Level {state.degradationLevel}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Adaptive Quality:</span>
          <span className={`text-sm font-medium ${state.isAdaptive ? 'text-green-600' : 'text-gray-500'}`}>
            {state.isAdaptive ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Preset Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Quality Preset
        </label>
        <div className="space-y-2">
          {availablePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                preferences.preset === preset.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">{preset.label}</span>
                {preset.value === recommendedPreset && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Adaptive Quality Toggle */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Adaptive Quality</h3>
            <p className="text-sm text-gray-600">
              Automatically adjust quality based on device performance
            </p>
          </div>
          <button
            onClick={handleAdaptiveToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.enableAdaptiveQuality ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={preferences.enableAdaptiveQuality}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.enableAdaptiveQuality ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Current Settings</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Rendering Quality:</span>
              <span className="ml-2 font-medium">{currentSettings.renderingQuality.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Texture Quality:</span>
              <span className="ml-2 font-medium">{currentSettings.textureQuality.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Antialiasing:</span>
              <span className="ml-2 font-medium">{currentSettings.enableAntialiasing ? 'On' : 'Off'}</span>
            </div>
            <div>
              <span className="text-gray-600">Max Texture Size:</span>
              <span className="ml-2 font-medium">{currentSettings.maxTextureSize}px</span>
            </div>
            <div>
              <span className="text-gray-600">Canvas Pooling:</span>
              <span className="ml-2 font-medium">{currentSettings.enableCanvasPooling ? 'On' : 'Off'}</span>
            </div>
            <div>
              <span className="text-gray-600">Compression:</span>
              <span className="ml-2 font-medium">{(currentSettings.compressionLevel * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment History */}
      {adjustmentHistory.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <svg
              className={`w-4 h-4 mr-2 transition-transform ${showHistory ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Adjustment History ({adjustmentHistory.length})
          </button>
          
          {showHistory && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {adjustmentHistory.slice().reverse().slice(0, 10).map((adjustment, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      adjustment.reason === 'user' ? 'bg-blue-100 text-blue-800' :
                      adjustment.reason === 'performance' ? 'bg-yellow-100 text-yellow-800' :
                      adjustment.reason === 'memory' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {adjustment.reason}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(adjustment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{adjustment.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Reset to Defaults
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default QualitySettingsPanel;
