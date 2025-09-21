// Performance monitoring service following SOLID principles

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  context?: Record<string, any>;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  memoryUsage: MemoryMetrics;
  recommendations: string[];
  timestamp: number;
}

export interface OptimizationSuggestion {
  type: 'memory' | 'rendering' | 'network' | 'general';
  priority: 'low' | 'medium' | 'high';
  description: string;
  action: string;
}

// Interface segregation principle - separate concerns
export interface IMetricsCollector {
  recordMetric(metric: PerformanceMetric): void;
  getMetrics(name?: string): PerformanceMetric[];
  clearMetrics(): void;
}

export interface IMemoryMonitor {
  getCurrentMemoryUsage(): MemoryMetrics;
  isMemoryUsageHigh(): boolean;
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable';
}

export interface IPerformanceAnalyzer {
  analyzeMetrics(metrics: PerformanceMetric[]): OptimizationSuggestion[];
  generateReport(): PerformanceReport;
}

export interface IPerformanceMonitor extends IMetricsCollector, IMemoryMonitor, IPerformanceAnalyzer {
  trackRenderTime(operation: string, duration: number): void;
  trackAsyncOperation<T>(operation: string, asyncFn: () => Promise<T>): Promise<T>;
  trackSyncOperation<T>(operation: string, syncFn: () => T): T;
}

// Single responsibility principle - each class has one reason to change
class MetricsCollector implements IMetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Prevent memory leaks

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

class MemoryMonitor implements IMemoryMonitor {
  private memoryHistory: MemoryMetrics[] = [];
  private readonly historyLimit = 50;

  getCurrentMemoryUsage(): MemoryMetrics {
    if (!('memory' in performance)) {
      // Fallback for browsers without memory API
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
        percentage: 0
      };
    }

    const memory = (performance as any).memory;
    const metrics: MemoryMetrics = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };

    // Store for trend analysis
    this.memoryHistory.push(metrics);
    if (this.memoryHistory.length > this.historyLimit) {
      this.memoryHistory.shift();
    }

    return metrics;
  }

  isMemoryUsageHigh(): boolean {
    const current = this.getCurrentMemoryUsage();
    return current.percentage > 80; // Consider 80% as high usage
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 5) {
      return 'stable';
    }

    const recent = this.memoryHistory.slice(-5);
    const first = recent[0].percentage;
    const last = recent[recent.length - 1].percentage;
    const difference = last - first;

    if (difference > 5) return 'increasing';
    if (difference < -5) return 'decreasing';
    return 'stable';
  }
}

class PerformanceAnalyzer implements IPerformanceAnalyzer {
  constructor(
    private metricsCollector: IMetricsCollector,
    private memoryMonitor: IMemoryMonitor
  ) {}

  analyzeMetrics(metrics: PerformanceMetric[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze render times
    const renderMetrics = metrics.filter(m => m.name.includes('render'));
    if (renderMetrics.length > 0) {
      const avgRenderTime = renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length;
      
      if (avgRenderTime > 100) {
        suggestions.push({
          type: 'rendering',
          priority: 'high',
          description: `Average render time is ${avgRenderTime.toFixed(1)}ms, which is above the recommended 100ms`,
          action: 'Consider optimizing canvas operations, reducing text complexity, or implementing progressive rendering'
        });
      }
    }

    // Analyze memory usage
    if (this.memoryMonitor.isMemoryUsageHigh()) {
      suggestions.push({
        type: 'memory',
        priority: 'high',
        description: 'Memory usage is above 80% of available heap',
        action: 'Clear unused image blobs, reduce canvas cache size, or implement memory cleanup'
      });
    }

    const memoryTrend = this.memoryMonitor.getMemoryTrend();
    if (memoryTrend === 'increasing') {
      suggestions.push({
        type: 'memory',
        priority: 'medium',
        description: 'Memory usage is consistently increasing',
        action: 'Check for memory leaks in image generation or canvas operations'
      });
    }

    // Analyze font loading times
    const fontMetrics = metrics.filter(m => m.name.includes('font'));
    if (fontMetrics.length > 0) {
      const slowFontLoads = fontMetrics.filter(m => m.value > 2000);
      if (slowFontLoads.length > 0) {
        suggestions.push({
          type: 'network',
          priority: 'medium',
          description: `${slowFontLoads.length} font loads took longer than 2 seconds`,
          action: 'Consider preloading fonts or using font-display: swap'
        });
      }
    }

    return suggestions;
  }

  generateReport(): PerformanceReport {
    const metrics = this.metricsCollector.getMetrics();
    const memoryUsage = this.memoryMonitor.getCurrentMemoryUsage();
    const recommendations = this.analyzeMetrics(metrics).map(s => s.description);

    return {
      metrics,
      memoryUsage,
      recommendations,
      timestamp: Date.now()
    };
  }
}

// Main performance monitor class following dependency inversion principle
export class PerformanceMonitor implements IPerformanceMonitor {
  constructor(
    private metricsCollector: IMetricsCollector = new MetricsCollector(),
    private memoryMonitor: IMemoryMonitor = new MemoryMonitor(),
    private analyzer: IPerformanceAnalyzer = new PerformanceAnalyzer(metricsCollector, memoryMonitor)
  ) {}

  // Delegate to metrics collector
  recordMetric(metric: PerformanceMetric): void {
    this.metricsCollector.recordMetric(metric);
  }

  getMetrics(name?: string): PerformanceMetric[] {
    return this.metricsCollector.getMetrics(name);
  }

  clearMetrics(): void {
    this.metricsCollector.clearMetrics();
  }

  // Delegate to memory monitor
  getCurrentMemoryUsage(): MemoryMetrics {
    return this.memoryMonitor.getCurrentMemoryUsage();
  }

  isMemoryUsageHigh(): boolean {
    return this.memoryMonitor.isMemoryUsageHigh();
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    return this.memoryMonitor.getMemoryTrend();
  }

  // Delegate to analyzer
  analyzeMetrics(metrics: PerformanceMetric[]): OptimizationSuggestion[] {
    return this.analyzer.analyzeMetrics(metrics);
  }

  generateReport(): PerformanceReport {
    return this.analyzer.generateReport();
  }

  // High-level tracking methods
  trackRenderTime(operation: string, duration: number): void {
    this.recordMetric({
      name: `render-${operation}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: { operation }
    });
  }

  async trackAsyncOperation<T>(operation: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await asyncFn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `async-${operation}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        context: { operation, success: true }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `async-${operation}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        context: { operation, success: false, error: error instanceof Error ? error.message : String(error) }
      });
      
      throw error;
    }
  }

  trackSyncOperation<T>(operation: string, syncFn: () => T): T {
    const startTime = performance.now();
    
    try {
      const result = syncFn();
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `sync-${operation}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        context: { operation, success: true }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `sync-${operation}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        context: { operation, success: false, error: error instanceof Error ? error.message : String(error) }
      });
      
      throw error;
    }
  }
}

// Factory function for easy instantiation
export function createPerformanceMonitor(): IPerformanceMonitor {
  return new PerformanceMonitor();
}

// Global instance for convenience
export const globalPerformanceMonitor = createPerformanceMonitor();