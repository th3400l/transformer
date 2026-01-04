/**
 * Performance Benchmarking Service
 * Measures and validates application performance metrics
 */

export interface BenchmarkMetrics {
  canvasRenderTime: number;
  initialLoadTime: number;
  templateRenderTime: number;
  memoryUsage: number;
  timestamp: number;
}

export interface BenchmarkResults {
  metrics: BenchmarkMetrics;
  passed: boolean;
  failures: string[];
  warnings: string[];
}

export interface BenchmarkTargets {
  canvasRenderTime: number; // ms
  initialLoadTime: number; // ms
  templateRenderTime: number; // ms
  memoryUsage: number; // MB
}

const DEFAULT_TARGETS: BenchmarkTargets = {
  canvasRenderTime: 500,
  initialLoadTime: 2000,
  templateRenderTime: 300,
  memoryUsage: 100,
};

export class PerformanceBenchmark {
  private targets: BenchmarkTargets;
  private startTime: number = 0;
  private metrics: Partial<BenchmarkMetrics> = {};

  constructor(targets: BenchmarkTargets = DEFAULT_TARGETS) {
    this.targets = targets;
  }

  /**
   * Start measuring initial load time
   */
  startLoadMeasurement(): void {
    this.startTime = performance.now();
  }

  /**
   * Complete initial load measurement
   */
  completeLoadMeasurement(): number {
    const loadTime = performance.now() - this.startTime;
    this.metrics.initialLoadTime = loadTime;
    return loadTime;
  }

  /**
   * Measure canvas render time
   */
  async measureCanvasRender(
    renderFn: () => Promise<HTMLCanvasElement>
  ): Promise<number> {
    const start = performance.now();
    await renderFn();
    const duration = performance.now() - start;
    this.metrics.canvasRenderTime = duration;
    return duration;
  }

  /**
   * Measure template rendering time
   */
  async measureTemplateRender(
    templateLoadFn: () => Promise<void>
  ): Promise<number> {
    const start = performance.now();
    await templateLoadFn();
    const duration = performance.now() - start;
    this.metrics.templateRenderTime = duration;
    return duration;
  }

  /**
   * Measure current memory usage
   */
  measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      this.metrics.memoryUsage = usedMB;
      return usedMB;
    }
    // Fallback if memory API not available
    this.metrics.memoryUsage = 0;
    return 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): BenchmarkMetrics {
    return {
      canvasRenderTime: this.metrics.canvasRenderTime || 0,
      initialLoadTime: this.metrics.initialLoadTime || 0,
      templateRenderTime: this.metrics.templateRenderTime || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate metrics against targets
   */
  validate(): BenchmarkResults {
    const metrics = this.getMetrics();
    const failures: string[] = [];
    const warnings: string[] = [];

    // Validate canvas render time
    if (metrics.canvasRenderTime > this.targets.canvasRenderTime) {
      failures.push(
        `Canvas render time ${metrics.canvasRenderTime.toFixed(0)}ms exceeds target ${this.targets.canvasRenderTime}ms`
      );
    } else if (metrics.canvasRenderTime > this.targets.canvasRenderTime * 0.8) {
      warnings.push(
        `Canvas render time ${metrics.canvasRenderTime.toFixed(0)}ms is close to target ${this.targets.canvasRenderTime}ms`
      );
    }

    // Validate initial load time
    if (metrics.initialLoadTime > this.targets.initialLoadTime) {
      failures.push(
        `Initial load time ${metrics.initialLoadTime.toFixed(0)}ms exceeds target ${this.targets.initialLoadTime}ms`
      );
    } else if (metrics.initialLoadTime > this.targets.initialLoadTime * 0.8) {
      warnings.push(
        `Initial load time ${metrics.initialLoadTime.toFixed(0)}ms is close to target ${this.targets.initialLoadTime}ms`
      );
    }

    // Validate template render time
    if (metrics.templateRenderTime > this.targets.templateRenderTime) {
      failures.push(
        `Template render time ${metrics.templateRenderTime.toFixed(0)}ms exceeds target ${this.targets.templateRenderTime}ms`
      );
    }

    // Validate memory usage
    if (metrics.memoryUsage > this.targets.memoryUsage) {
      failures.push(
        `Memory usage ${metrics.memoryUsage.toFixed(1)}MB exceeds target ${this.targets.memoryUsage}MB`
      );
    } else if (metrics.memoryUsage > this.targets.memoryUsage * 0.8) {
      warnings.push(
        `Memory usage ${metrics.memoryUsage.toFixed(1)}MB is close to target ${this.targets.memoryUsage}MB`
      );
    }

    return {
      metrics,
      passed: failures.length === 0,
      failures,
      warnings,
    };
  }

  /**
   * Generate benchmark report
   */
  generateReport(): string {
    const results = this.validate();
    const lines: string[] = [
      '=== Performance Benchmark Report ===',
      '',
      'Metrics:',
      `  Canvas Render Time: ${results.metrics.canvasRenderTime.toFixed(0)}ms (target: ${this.targets.canvasRenderTime}ms)`,
      `  Initial Load Time: ${results.metrics.initialLoadTime.toFixed(0)}ms (target: ${this.targets.initialLoadTime}ms)`,
      `  Template Render Time: ${results.metrics.templateRenderTime.toFixed(0)}ms (target: ${this.targets.templateRenderTime}ms)`,
      `  Memory Usage: ${results.metrics.memoryUsage.toFixed(1)}MB (target: ${this.targets.memoryUsage}MB)`,
      '',
    ];

    if (results.warnings.length > 0) {
      lines.push('Warnings:');
      results.warnings.forEach((warning) => lines.push(`  ⚠️  ${warning}`));
      lines.push('');
    }

    if (results.failures.length > 0) {
      lines.push('Failures:');
      results.failures.forEach((failure) => lines.push(`  ❌ ${failure}`));
      lines.push('');
    }

    lines.push(`Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {};
    this.startTime = 0;
  }
}

// Export singleton instance
export const performanceBenchmark = new PerformanceBenchmark();
