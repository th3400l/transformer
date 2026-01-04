/**
 * Browser Compatibility Detector
 * Detects browser capabilities and device characteristics for compatibility testing
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  osVersion: string;
  screenSize: {
    width: number;
    height: number;
  };
  pixelRatio: number;
  touchSupport: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface CompatibilityReport {
  browser: BrowserInfo;
  device: DeviceInfo;
  features: {
    canvas2d: boolean;
    webgl: boolean;
    blobApi: boolean;
    promises: boolean;
    es6Modules: boolean;
    cssCustomProperties: boolean;
    touchEvents: boolean;
    pointerEvents: boolean;
    intersectionObserver: boolean;
    resizeObserver: boolean;
  };
  performance: {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
    };
  };
  warnings: string[];
  timestamp: string;
}

export class BrowserCompatibilityDetector {
  detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      name = 'Chrome';
      version = this.extractVersion(ua, 'Chrome/');
      engine = 'Blink';
    } else if (ua.includes('Edg')) {
      name = 'Edge';
      version = this.extractVersion(ua, 'Edg/');
      engine = 'Blink';
    } else if (ua.includes('Firefox')) {
      name = 'Firefox';
      version = this.extractVersion(ua, 'Firefox/');
      engine = 'Gecko';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      version = this.extractVersion(ua, 'Version/');
      engine = 'WebKit';
    }

    return {
      name,
      version,
      engine,
      platform: navigator.platform,
    };
  }

  detectDevice(): DeviceInfo {
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Detect device type
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (width < 768) {
      type = 'mobile';
    } else if (width < 1024 && touchSupport) {
      type = 'tablet';
    }

    // Detect OS
    let os = 'Unknown';
    let osVersion = 'Unknown';
    if (ua.includes('iPhone') || ua.includes('iPad')) {
      os = ua.includes('iPad') ? 'iPadOS' : 'iOS';
      osVersion = this.extractVersion(ua, 'OS ').replace(/_/g, '.');
    } else if (ua.includes('Android')) {
      os = 'Android';
      osVersion = this.extractVersion(ua, 'Android ');
    } else if (ua.includes('Windows')) {
      os = 'Windows';
    } else if (ua.includes('Mac')) {
      os = 'macOS';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    }

    return {
      type,
      os,
      osVersion,
      screenSize: { width, height },
      pixelRatio,
      touchSupport,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  }

  checkFeatureSupport() {
    const features = {
      canvas2d: this.checkCanvas2D(),
      webgl: this.checkWebGL(),
      blobApi: typeof Blob !== 'undefined',
      promises: typeof Promise !== 'undefined',
      es6Modules: 'noModule' in document.createElement('script'),
      cssCustomProperties: this.checkCSSCustomProperties(),
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
    };

    return features;
  }

  getPerformanceInfo() {
    const info: CompatibilityReport['performance'] = {};

    // Memory info (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      info.memory = {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }

    // Network info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      info.connection = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }

    return info;
  }

  generateReport(): CompatibilityReport {
    const browser = this.detectBrowser();
    const device = this.detectDevice();
    const features = this.checkFeatureSupport();
    const performance = this.getPerformanceInfo();
    const warnings: string[] = [];

    // Check for compatibility issues
    if (!features.canvas2d) {
      warnings.push('Canvas 2D API not supported - core functionality will not work');
    }
    if (!features.blobApi) {
      warnings.push('Blob API not supported - image export may not work');
    }
    if (device.pixelRatio > 2 && device.type === 'mobile') {
      warnings.push('High pixel ratio on mobile - may impact performance');
    }
    if (browser.name === 'Safari' && parseFloat(browser.version) < 13) {
      warnings.push('Safari version below 13 - some features may not work');
    }
    if (browser.name === 'Chrome' && parseFloat(browser.version) < 80) {
      warnings.push('Chrome version below 80 - some features may not work');
    }
    if (browser.name === 'Firefox' && parseFloat(browser.version) < 75) {
      warnings.push('Firefox version below 75 - some features may not work');
    }
    if (!features.intersectionObserver) {
      warnings.push('IntersectionObserver not supported - lazy loading may not work');
    }

    return {
      browser,
      device,
      features,
      performance,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }

  private checkCanvas2D(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  private checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      );
    } catch {
      return false;
    }
  }

  private checkCSSCustomProperties(): boolean {
    try {
      return CSS.supports('color', 'var(--test)');
    } catch {
      return false;
    }
  }

  private extractVersion(ua: string, prefix: string): string {
    const index = ua.indexOf(prefix);
    if (index === -1) return 'Unknown';
    const version = ua.substring(index + prefix.length).split(/[\s;]/)[0];
    return version;
  }
}

// Singleton instance
export const compatibilityDetector = new BrowserCompatibilityDetector();
