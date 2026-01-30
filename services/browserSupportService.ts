// Browser support service for graceful degradation and user communication
// Requirements: 8.5, 8.6, 6.7, 6.8

import { IBrowserCompatibilityLayer, BrowserCapabilities } from '../types/fontStorage';
import { FallbackFontService } from './fallbackFontService';

export interface BrowserSupportInfo {
  isSupported: boolean;
  supportLevel: 'full' | 'partial' | 'minimal' | 'unsupported';
  limitations: BrowserLimitation[];
  recommendations: BrowserRecommendation[];
  fallbackOptions: FallbackOption[];
}

export interface BrowserLimitation {
  feature: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  workaround?: string;
}

export interface BrowserRecommendation {
  type: 'upgrade' | 'alternative' | 'setting' | 'workaround';
  title: string;
  description: string;
  actionUrl?: string;
}

export interface FallbackOption {
  name: string;
  description: string;
  limitations: string[];
  available: boolean;
}

/**
 * Service for managing browser support detection and graceful degradation
 */
export class BrowserSupportService {
  private compatibilityLayer: IBrowserCompatibilityLayer;
  private fallbackService: FallbackFontService | null = null;

  constructor(compatibilityLayer: IBrowserCompatibilityLayer) {
    this.compatibilityLayer = compatibilityLayer;
  }

  /**
   * Analyze browser support for custom font features
   * @returns Comprehensive browser support information
   */
  analyzeBrowserSupport(): BrowserSupportInfo {
    const capabilities = this.compatibilityLayer.detectCapabilities();
    const limitations = this.identifyLimitations(capabilities);
    const supportLevel = this.determineSupportLevel(capabilities, limitations);
    
    return {
      isSupported: supportLevel !== 'unsupported',
      supportLevel,
      limitations,
      recommendations: this.generateRecommendations(capabilities, limitations),
      fallbackOptions: this.identifyFallbackOptions(capabilities)
    };
  }

  /**
   * Get user-friendly browser support message
   * @returns Formatted message for display to users
   */
  getBrowserSupportMessage(): BrowserSupportMessage {
    const supportInfo = this.analyzeBrowserSupport();
    
    switch (supportInfo.supportLevel) {
      case 'full':
        return {
          type: 'success',
          title: 'Full Support Available',
          message: 'Your browser fully supports custom font uploads with all features enabled.',
          showDetails: false
        };
        
      case 'partial':
        return {
          type: 'warning',
          title: 'Partial Support',
          message: 'Custom font uploads are supported with some limitations. Click for details.',
          showDetails: true,
          details: this.formatLimitationsForUser(supportInfo.limitations)
        };
        
      case 'minimal':
        return {
          type: 'info',
          title: 'Basic Support',
          message: 'Custom fonts will work but with reduced functionality. Session-only storage available.',
          showDetails: true,
          details: this.formatFallbackOptionsForUser(supportInfo.fallbackOptions)
        };
        
      case 'unsupported':
        return {
          type: 'error',
          title: 'Limited Browser Support',
          message: 'Your browser has limited support for custom fonts. Consider upgrading for the best experience.',
          showDetails: true,
          details: this.formatRecommendationsForUser(supportInfo.recommendations)
        };
    }
  }

  /**
   * Initialize fallback services based on browser capabilities
   * @returns Initialized fallback service or null if not needed
   */
  initializeFallbackServices(): FallbackFontService | null {
    const capabilities = this.compatibilityLayer.detectCapabilities();
    
    // Use fallback service if persistent storage is not available
    if (!capabilities.hasIndexedDB && !capabilities.hasLocalStorage) {
      if (!this.fallbackService) {
        this.fallbackService = new FallbackFontService();
      }
      return this.fallbackService;
    }
    
    return null;
  }

  /**
   * Get browser-specific setup instructions
   * @returns Setup instructions for the current browser
   */
  getBrowserSetupInstructions(): BrowserSetupInstructions {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const capabilities = this.compatibilityLayer.detectCapabilities();
    
    if (userAgent.includes('Edg')) {
      return this.getEdgeInstructions(capabilities);
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return this.getSafariInstructions(capabilities);
    } else if (userAgent.includes('Firefox')) {
      return this.getFirefoxInstructions(capabilities);
    } else if (userAgent.includes('Chrome')) {
      return this.getChromeInstructions(capabilities);
    } else {
      return this.getGenericInstructions(capabilities);
    }
  }

  /**
   * Check if graceful degradation is active
   * @returns True if using fallback services
   */
  isUsingFallbackMode(): boolean {
    return this.fallbackService !== null;
  }

  /**
   * Get fallback service instance
   * @returns Fallback service or null if not initialized
   */
  getFallbackService(): FallbackFontService | null {
    return this.fallbackService;
  }

  /**
   * Identify browser limitations
   * @param capabilities Browser capabilities
   * @returns Array of identified limitations
   */
  private identifyLimitations(capabilities: BrowserCapabilities): BrowserLimitation[] {
    const limitations: BrowserLimitation[] = [];
    
    if (!capabilities.hasIndexedDB) {
      limitations.push({
        feature: 'IndexedDB Storage',
        impact: 'medium',
        description: 'Advanced font storage not available. Fonts will use alternative storage or session-only mode.',
        workaround: 'Use LocalStorage fallback or session-only fonts'
      });
    }
    
    if (!capabilities.hasLocalStorage) {
      limitations.push({
        feature: 'Local Storage',
        impact: 'high',
        description: 'Persistent font storage not available. Fonts will only last for the current session.',
        workaround: 'Use session-only font storage'
      });
    }
    
    if (!capabilities.hasDragAndDrop) {
      limitations.push({
        feature: 'Drag and Drop',
        impact: 'low',
        description: 'Drag and drop upload not available. Use file selection button instead.',
        workaround: 'Click "Choose File" button to select fonts'
      });
    }
    
    if (!capabilities.hasFontFaceAPI) {
      limitations.push({
        feature: 'FontFace API',
        impact: 'high',
        description: 'Dynamic font loading not supported. Custom fonts may not work properly.',
        workaround: 'Consider upgrading your browser'
      });
    }
    
    if (!capabilities.hasCompressionStream) {
      limitations.push({
        feature: 'Compression',
        impact: 'low',
        description: 'Font compression not available. Fonts will use more storage space.',
        workaround: 'Use smaller font files when possible'
      });
    }
    
    if (capabilities.maxStorageQuota < 10 * 1024 * 1024) { // Less than 10MB
      limitations.push({
        feature: 'Storage Quota',
        impact: 'medium',
        description: 'Limited storage space available for fonts.',
        workaround: 'Use smaller fonts or remove unused fonts regularly'
      });
    }
    
    return limitations;
  }

  /**
   * Determine overall support level
   * @param capabilities Browser capabilities
   * @param limitations Identified limitations
   * @returns Support level classification
   */
  private determineSupportLevel(
    capabilities: BrowserCapabilities, 
    limitations: BrowserLimitation[]
  ): 'full' | 'partial' | 'minimal' | 'unsupported' {
    const highImpactLimitations = limitations.filter(l => l.impact === 'high');
    const mediumImpactLimitations = limitations.filter(l => l.impact === 'medium');
    
    // Unsupported: No FontFace API or no storage at all
    if (!capabilities.hasFontFaceAPI || (!capabilities.hasIndexedDB && !capabilities.hasLocalStorage)) {
      return 'unsupported';
    }
    
    // Minimal: Has high impact limitations
    if (highImpactLimitations.length > 0) {
      return 'minimal';
    }
    
    // Partial: Has medium impact limitations
    if (mediumImpactLimitations.length > 0) {
      return 'partial';
    }
    
    // Full: No significant limitations
    return 'full';
  }

  /**
   * Generate browser-specific recommendations
   * @param capabilities Browser capabilities
   * @param limitations Identified limitations
   * @returns Array of recommendations
   */
  private generateRecommendations(
    capabilities: BrowserCapabilities, 
    limitations: BrowserLimitation[]
  ): BrowserRecommendation[] {
    const recommendations: BrowserRecommendation[] = [];
    
    if (!capabilities.hasFontFaceAPI) {
      recommendations.push({
        type: 'upgrade',
        title: 'Upgrade Your Browser',
        description: 'Your browser version is outdated. Please upgrade to the latest version for full font support.',
        actionUrl: this.getBrowserUpgradeUrl()
      });
    }
    
    if (!capabilities.hasIndexedDB && capabilities.hasLocalStorage) {
      recommendations.push({
        type: 'setting',
        title: 'Enable Advanced Storage',
        description: 'Check your browser settings to ensure IndexedDB is enabled for better font storage.',
      });
    }
    
    if (!capabilities.hasDragAndDrop) {
      recommendations.push({
        type: 'workaround',
        title: 'Use File Selection',
        description: 'Since drag-and-drop is not available, use the "Choose File" button to upload fonts.',
      });
    }
    
    if (capabilities.maxStorageQuota < 5 * 1024 * 1024) {
      recommendations.push({
        type: 'workaround',
        title: 'Optimize Font Files',
        description: 'Use compressed font formats (WOFF2) and smaller file sizes due to storage limitations.',
      });
    }
    
    return recommendations;
  }

  /**
   * Identify available fallback options
   * @param capabilities Browser capabilities
   * @returns Array of fallback options
   */
  private identifyFallbackOptions(capabilities: BrowserCapabilities): FallbackOption[] {
    const options: FallbackOption[] = [];
    
    // Session-only storage
    options.push({
      name: 'Session-Only Fonts',
      description: 'Upload fonts that last only for the current browser session',
      limitations: ['Fonts are lost when you close the browser', 'Limited to 2 fonts per session'],
      available: capabilities.hasFontFaceAPI
    });
    
    // LocalStorage fallback
    if (capabilities.hasLocalStorage) {
      options.push({
        name: 'Basic Persistent Storage',
        description: 'Store fonts using browser local storage with size limitations',
        limitations: ['Smaller storage capacity', 'No compression support', 'May be slower'],
        available: true
      });
    }
    
    // File input fallback
    if (!capabilities.hasDragAndDrop) {
      options.push({
        name: 'File Selection Upload',
        description: 'Upload fonts using traditional file selection dialog',
        limitations: ['No drag-and-drop support', 'One file at a time'],
        available: true
      });
    }
    
    return options;
  }

  /**
   * Format limitations for user display
   * @param limitations Array of limitations
   * @returns Formatted string for display
   */
  private formatLimitationsForUser(limitations: BrowserLimitation[]): string {
    return limitations
      .map(l => `• ${l.description}${l.workaround ? ` (${l.workaround})` : ''}`)
      .join('\n');
  }

  /**
   * Format fallback options for user display
   * @param options Array of fallback options
   * @returns Formatted string for display
   */
  private formatFallbackOptionsForUser(options: FallbackOption[]): string {
    return options
      .filter(o => o.available)
      .map(o => `• ${o.name}: ${o.description}`)
      .join('\n');
  }

  /**
   * Format recommendations for user display
   * @param recommendations Array of recommendations
   * @returns Formatted string for display
   */
  private formatRecommendationsForUser(recommendations: BrowserRecommendation[]): string {
    return recommendations
      .map(r => `• ${r.title}: ${r.description}`)
      .join('\n');
  }

  /**
   * Get Safari-specific setup instructions
   * @param capabilities Browser capabilities
   * @returns Safari setup instructions
   */
  private getSafariInstructions(capabilities: BrowserCapabilities): BrowserSetupInstructions {
    return {
      browserName: 'Safari',
      instructions: [
        'Ensure you are using Safari 14 or later for best compatibility',
        'If in Private Browsing mode, fonts will only be available for the current session',
        'For persistent font storage, use regular browsing mode',
        'Some features may be limited in Private Browsing mode'
      ],
      troubleshooting: [
        'If fonts are not loading, try disabling content blockers temporarily',
        'Clear Safari cache if you experience font loading issues',
        'Ensure JavaScript is enabled in Safari preferences'
      ]
    };
  }

  /**
   * Get Firefox-specific setup instructions
   * @param capabilities Browser capabilities
   * @returns Firefox setup instructions
   */
  private getFirefoxInstructions(capabilities: BrowserCapabilities): BrowserSetupInstructions {
    return {
      browserName: 'Firefox',
      instructions: [
        'Firefox 60 or later is recommended for full font support',
        'Ensure IndexedDB is enabled in about:config (dom.indexedDB.enabled)',
        'Font uploads may be processed sequentially for better stability',
        'All font formats (TTF, OTF, WOFF, WOFF2) are supported'
      ],
      troubleshooting: [
        'If storage issues occur, check available disk space',
        'Disable strict privacy settings temporarily if fonts fail to load',
        'Clear Firefox storage data if experiencing persistent issues'
      ]
    };
  }

  /**
   * Get Chrome-specific setup instructions
   * @param capabilities Browser capabilities
   * @returns Chrome setup instructions
   */
  private getChromeInstructions(capabilities: BrowserCapabilities): BrowserSetupInstructions {
    return {
      browserName: 'Chrome',
      instructions: [
        'Chrome provides full support for all custom font features',
        'Font compression is available for optimal storage efficiency',
        'Drag-and-drop upload is fully supported',
        'Large font files (up to 5MB) are supported'
      ],
      troubleshooting: [
        'If storage quota is exceeded, clear browser data or remove unused fonts',
        'Disable extensions temporarily if experiencing upload issues',
        'Check Chrome storage settings if fonts are not persisting'
      ]
    };
  }

  /**
   * Get Edge-specific setup instructions
   * @param capabilities Browser capabilities
   * @returns Edge setup instructions
   */
  private getEdgeInstructions(capabilities: BrowserCapabilities): BrowserSetupInstructions {
    return {
      browserName: 'Microsoft Edge',
      instructions: [
        'Edge (Chromium-based) provides excellent font support',
        'All modern font features are available',
        'Progressive loading is enabled for better performance',
        'Compatibility mode may be used for older Edge versions'
      ],
      troubleshooting: [
        'Ensure you are using the new Chromium-based Edge',
        'Check Edge storage permissions if fonts are not saving',
        'Clear Edge cache if experiencing font rendering issues'
      ]
    };
  }

  /**
   * Get generic setup instructions
   * @param capabilities Browser capabilities
   * @returns Generic setup instructions
   */
  private getGenericInstructions(capabilities: BrowserCapabilities): BrowserSetupInstructions {
    return {
      browserName: 'Your Browser',
      instructions: [
        'Ensure your browser is up to date for best compatibility',
        'JavaScript must be enabled for font upload functionality',
        'Local storage should be enabled for font persistence',
        'Some features may vary depending on your browser'
      ],
      troubleshooting: [
        'Try using a modern browser like Chrome, Firefox, Safari, or Edge',
        'Clear browser cache and cookies if experiencing issues',
        'Disable browser extensions that might interfere with uploads',
        'Check browser console for specific error messages'
      ]
    };
  }

  /**
   * Get browser upgrade URL based on user agent
   * @returns URL for browser upgrade
   */
  private getBrowserUpgradeUrl(): string {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'https://support.apple.com/safari';
    } else if (userAgent.includes('Firefox')) {
      return 'https://www.mozilla.org/firefox/';
    } else if (userAgent.includes('Chrome')) {
      return 'https://www.google.com/chrome/';
    } else if (userAgent.includes('Edg')) {
      return 'https://www.microsoft.com/edge';
    } else {
      return 'https://browsehappy.com/';
    }
  }
}

export interface BrowserSupportMessage {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  showDetails: boolean;
  details?: string;
}

export interface BrowserSetupInstructions {
  browserName: string;
  instructions: string[];
  troubleshooting: string[];
}