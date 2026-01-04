/**
 * Cross-Platform Testing Utilities
 * Automated tests for cross-platform compatibility
 */

import { compatibilityDetector, type CompatibilityReport } from './browserCompatibilityDetector';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

export class CrossPlatformTester {
  private results: TestSuite[] = [];

  async runAllTests(): Promise<TestSuite[]> {
    this.results = [];
    
    await this.runCanvasTests();
    await this.runTouchTests();
    await this.runResponsiveTests();
    await this.runPerformanceTests();
    await this.runFeatureTests();
    
    return this.results;
  }

  async runCanvasTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Canvas Rendering Tests',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const start = performance.now();

    // Test 1: Canvas creation
    suite.tests.push(await this.testCanvasCreation());

    // Test 2: Canvas rendering
    suite.tests.push(await this.testCanvasRendering());

    // Test 3: Canvas export
    suite.tests.push(await this.testCanvasExport());

    suite.duration = performance.now() - start;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    this.results.push(suite);
    return suite;
  }

  async runTouchTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Touch Interaction Tests',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const start = performance.now();

    // Test 1: Touch support detection
    suite.tests.push(await this.testTouchSupport());

    // Test 2: Touch target sizes
    suite.tests.push(await this.testTouchTargetSizes());

    // Test 3: Pointer events
    suite.tests.push(await this.testPointerEvents());

    suite.duration = performance.now() - start;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    this.results.push(suite);
    return suite;
  }

  async runResponsiveTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Responsive Layout Tests',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const start = performance.now();

    // Test 1: Viewport detection
    suite.tests.push(await this.testViewportDetection());

    // Test 2: Layout adaptation
    suite.tests.push(await this.testLayoutAdaptation());

    // Test 3: Orientation handling
    suite.tests.push(await this.testOrientationHandling());

    suite.duration = performance.now() - start;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    this.results.push(suite);
    return suite;
  }

  async runPerformanceTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Performance Tests',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const start = performance.now();

    // Test 1: Render performance
    suite.tests.push(await this.testRenderPerformance());

    // Test 2: Memory usage
    suite.tests.push(await this.testMemoryUsage());

    suite.duration = performance.now() - start;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    this.results.push(suite);
    return suite;
  }

  async runFeatureTests(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Feature Support Tests',
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0,
    };

    const start = performance.now();

    // Test 1: Required APIs
    suite.tests.push(await this.testRequiredAPIs());

    // Test 2: CSS features
    suite.tests.push(await this.testCSSFeatures());

    suite.duration = performance.now() - start;
    suite.passed = suite.tests.filter(t => t.passed).length;
    suite.failed = suite.tests.filter(t => !t.passed).length;

    this.results.push(suite);
    return suite;
  }

  // Individual test implementations
  private async testCanvasCreation(): Promise<TestResult> {
    const start = performance.now();
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const passed = ctx !== null;
      return {
        name: 'Canvas 2D Context Creation',
        passed,
        message: passed ? 'Canvas 2D context created successfully' : 'Failed to create canvas 2D context',
        duration: performance.now() - start,
      };
    } catch (error) {
      return {
        name: 'Canvas 2D Context Creation',
        passed: false,
        message: `Error: ${error}`,
        duration: performance.now() - start,
      };
    }
  }

  private async testCanvasRendering(): Promise<TestResult> {
    const start = performance.now();
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return {
          name: 'Canvas Rendering',
          passed: false,
          message: 'No canvas context available',
          duration: performance.now() - start,
        };
      }

      // Test basic rendering
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 100, 100);
      ctx.font = '16px Arial';
      ctx.fillText('Test', 10, 50);

      const passed = true;
      return {
        name: 'Canvas Rendering',
        passed,
        message: 'Canvas rendering operations completed successfully',
        duration: performance.now() - start,
      };
    } catch (error) {
      return {
        name: 'Canvas Rendering',
        passed: false,
        message: `Error: ${error}`,
        duration: performance.now() - start,
      };
    }
  }

  private async testCanvasExport(): Promise<TestResult> {
    const start = performance.now();
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return {
          name: 'Canvas Export',
          passed: false,
          message: 'No canvas context available',
          duration: performance.now() - start,
        };
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 100, 100);

      // Test toBlob
      const blobSupported = await new Promise<boolean>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob !== null);
        });
      });

      return {
        name: 'Canvas Export',
        passed: blobSupported,
        message: blobSupported ? 'Canvas export to Blob works' : 'Canvas export to Blob failed',
        duration: performance.now() - start,
      };
    } catch (error) {
      return {
        name: 'Canvas Export',
        passed: false,
        message: `Error: ${error}`,
        duration: performance.now() - start,
      };
    }
  }

  private async testTouchSupport(): Promise<TestResult> {
    const start = performance.now();
    const device = compatibilityDetector.detectDevice();
    const hasTouchSupport = device.touchSupport;
    
    return {
      name: 'Touch Support Detection',
      passed: true, // Always pass, just report status
      message: hasTouchSupport 
        ? `Touch support detected (${device.type} device)` 
        : `No touch support (${device.type} device)`,
      duration: performance.now() - start,
    };
  }

  private async testTouchTargetSizes(): Promise<TestResult> {
    const start = performance.now();
    try {
      // Check for buttons and interactive elements
      const buttons = document.querySelectorAll('button, a, input, select, textarea');
      const tooSmall: string[] = [];
      const minSize = 44; // 44px minimum touch target

      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        if (rect.width < minSize || rect.height < minSize) {
          tooSmall.push(`${button.tagName} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
        }
      });

      const passed = tooSmall.length === 0;
      return {
        name: 'Touch Target Sizes',
        passed,
        message: passed 
          ? `All ${buttons.length} interactive elements meet minimum size (44px)` 
          : `${tooSmall.length} elements below 44px: ${tooSmall.slice(0, 3).join(', ')}`,
        duration: performance.now() - start,
      };
    } catch (error) {
      return {
        name: 'Touch Target Sizes',
        passed: false,
        message: `Error: ${error}`,
        duration: performance.now() - start,
      };
    }
  }

  private async testPointerEvents(): Promise<TestResult> {
    const start = performance.now();
    const hasPointerEvents = 'onpointerdown' in window;
    const hasTouchEvents = 'ontouchstart' in window;
    
    return {
      name: 'Pointer Events Support',
      passed: hasPointerEvents || hasTouchEvents,
      message: hasPointerEvents 
        ? 'Pointer Events API supported' 
        : hasTouchEvents 
          ? 'Touch Events supported (fallback)' 
          : 'No pointer or touch events support',
      duration: performance.now() - start,
    };
  }

  private async testViewportDetection(): Promise<TestResult> {
    const start = performance.now();
    const device = compatibilityDetector.detectDevice();
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      name: 'Viewport Detection',
      passed: true,
      message: `Detected ${device.type} device (${width}x${height}px, ${device.orientation})`,
      duration: performance.now() - start,
    };
  }

  private async testLayoutAdaptation(): Promise<TestResult> {
    const start = performance.now();
    try {
      // Check if viewport meta tag exists
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      const hasViewport = viewportMeta !== null;
      
      // Check if responsive CSS is working
      const testDiv = document.createElement('div');
      testDiv.style.width = '100vw';
      document.body.appendChild(testDiv);
      const vwWorks = testDiv.offsetWidth === window.innerWidth;
      document.body.removeChild(testDiv);

      const passed = hasViewport && vwWorks;
      return {
        name: 'Layout Adaptation',
        passed,
        message: passed 
          ? 'Responsive layout working correctly' 
          : `Issues: ${!hasViewport ? 'No viewport meta' : ''} ${!vwWorks ? 'vw units not working' : ''}`,
        duration: performance.now() - start,
      };
    } catch (error) {
      return {
        name: 'Layout Adaptation',
        passed: false,
        message: `Error: ${error}`,
        duration: performance.now() - start,
      };
    }
  }

  private async testOrientationHandling(): Promise<TestResult> {
    const start = performance.now();
    const hasOrientationAPI = 'orientation' in window || 'onorientationchange' in window;
    const device = compatibilityDetector.detectDevice();
    
    return {
      name: 'Orientation Handling',
      passed: true,
      message: hasOrientationAPI 
        ? `Orientation API available (current: ${device.orientation})` 
        : 'Using resize events for orientation detection',
      duration: performance.now() - start,
    };
  }

  private async testRenderPerformance(): Promise<TestResult> {
    const start = performance.now();
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return {
          name: 'Render Performance',
          passed: false,
          message: 'No canvas context available',
          duration: performance.now() - start,
        };
      }

      // Measure rendering time
      const renderStart = performance.now();
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgb(${i * 2}, 0, 0)`;
        ctx.fillRect(i * 8, 0, 8, 600);
      }
      const renderTime = performance.now() - renderStart;

      const passed = renderTime < 100; // Should complete in under 100ms
      return {
        name: 'Render Performance',
        passed,
        message: `Rendering 100 operations took ${renderTime.toFixed(2)}ms ${passed ? '(good)' : '(slow)'}`,
        duration: performance.now() - start,
      };
    } catch (error) {
      return {
        name: 'Render Performance',
        passed: false,
        message: `Error: ${error}`,
        duration: performance.now() - start,
      };
    }
  }

  private async testMemoryUsage(): Promise<TestResult> {
    const start = performance.now();
    const perf = compatibilityDetector.getPerformanceInfo();
    
    if (perf.memory) {
      const usedMB = perf.memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = perf.memory.jsHeapSizeLimit / 1024 / 1024;
      const percentage = (usedMB / limitMB) * 100;
      
      return {
        name: 'Memory Usage',
        passed: percentage < 80,
        message: `Using ${usedMB.toFixed(1)}MB of ${limitMB.toFixed(1)}MB (${percentage.toFixed(1)}%)`,
        duration: performance.now() - start,
      };
    }
    
    return {
      name: 'Memory Usage',
      passed: true,
      message: 'Memory API not available (browser limitation)',
      duration: performance.now() - start,
    };
  }

  private async testRequiredAPIs(): Promise<TestResult> {
    const start = performance.now();
    const features = compatibilityDetector.checkFeatureSupport();
    const required = ['canvas2d', 'blobApi', 'promises', 'es6Modules'];
    const missing = required.filter(key => !features[key as keyof typeof features]);
    
    return {
      name: 'Required APIs',
      passed: missing.length === 0,
      message: missing.length === 0 
        ? 'All required APIs supported' 
        : `Missing: ${missing.join(', ')}`,
      duration: performance.now() - start,
    };
  }

  private async testCSSFeatures(): Promise<TestResult> {
    const start = performance.now();
    const features = compatibilityDetector.checkFeatureSupport();
    
    return {
      name: 'CSS Features',
      passed: features.cssCustomProperties,
      message: features.cssCustomProperties 
        ? 'CSS Custom Properties supported' 
        : 'CSS Custom Properties not supported',
      duration: performance.now() - start,
    };
  }

  generateReport(): string {
    let report = '# Cross-Platform Compatibility Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);

    report += `## Summary\n`;
    report += `- Total Tests: ${totalTests}\n`;
    report += `- Passed: ${totalPassed}\n`;
    report += `- Failed: ${totalFailed}\n`;
    report += `- Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n\n`;

    this.results.forEach(suite => {
      report += `## ${suite.name}\n`;
      report += `Duration: ${suite.duration.toFixed(2)}ms\n\n`;
      
      suite.tests.forEach(test => {
        const status = test.passed ? '✓' : '✗';
        report += `${status} **${test.name}** (${test.duration.toFixed(2)}ms)\n`;
        report += `  ${test.message}\n\n`;
      });
    });

    return report;
  }
}

export const crossPlatformTester = new CrossPlatformTester();
