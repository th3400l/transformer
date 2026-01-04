// Performance monitoring service following SOLID principles

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'fps';
  timestamp: number;
  context?: Record<string, any>;
}

export interface RenderTimeMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  phase?: 'mount' | 'update' | 'unmount';
  componentName?: string;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
}

export interface MemorySnapshot {
  metrics: MemoryMetrics;
  timestamp: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FrameRateMetrics {
  currentFPS: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  droppedFrames: number;
  timestamp: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  renderTimes: RenderTimeMetrics[];
  memoryUsage: MemoryMetrics;
  memoryHistory: MemorySnapshot[];
  frameRate: FrameRateMetrics | null;
  recommendations: string[];
  timestamp: number;
  summary: {
    avgRenderTime: number;
    slowestRender: RenderTimeMetrics | null;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    performanceScore: number; // 0-100
  };
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
  recordRenderTime(renderMetric: RenderTimeMetrics): void;
  getMetrics(name?: string): PerformanceMetric[];
  getRenderTimes(operation?: string): RenderTimeMetrics[];
  clearMetrics(): void;
}

export interface IMemoryMonitor {
  getCurrentMemoryUsage(): MemoryMetrics;
  getMemoryHistory(): MemorySnapshot[];
  isMemoryUsageHigh(): boolean;
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable';
  takeMemorySnapshot(): MemorySnapshot;
}

export interface IFrameRateMonitor {
  startMonitoring(): void;
  stopMonitoring(): void;
  getCurrentFPS(): number;
  getFrameRateMetrics(): FrameRateMetrics | null;
  isMonitoring(): boolean;
}

export interface IPerformanceAnalyzer {
  analyzeMetrics(metrics: PerformanceMetric[]): OptimizationSuggestion[];
  calculatePerformanceScore(): number;
  generateReport(): PerformanceReport;
}

export interface IPerformanceMonitor extends IMetricsCollector, IMemoryMonitor, IFrameRateMonitor, IPerformanceAnalyzer {
  trackRenderTime(operation: string, duration: number, context?: Partial<RenderTimeMetrics>): void;
  trackAsyncOperation<T>(operation: string, asyncFn: () => Promise<T>): Promise<T>;
  trackSyncOperation<T>(operation: string, syncFn: () => T): T;
}

// Single responsibility principle - each class has one reason to change
class MetricsCollector implements IMetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private renderTimes: RenderTimeMetrics[] = [];
  private readonly maxMetrics = 1000; // Prevent memory leaks
  private readonly maxRenderTimes = 500;

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  recordRenderTime(renderMetric: RenderTimeMetrics): void {
    this.renderTimes.push(renderMetric);
    
    // Keep only recent render times
    if (this.renderTimes.length > this.maxRenderTimes) {
      this.renderTimes = this.renderTimes.slice(-this.maxRenderTimes);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  getRenderTimes(operation?: string): RenderTimeMetrics[] {
    if (operation) {
      return this.renderTimes.filter(rt => rt.operation === operation);
    }
    return [...this.renderTimes];
  }

  clearMetrics(): void {
    this.metrics = [];
    this.renderTimes = [];
  }
}

class MemoryMonitor implements IMemoryMonitor {
  private memorySnapshots: MemorySnapshot[] = [];
  private readonly historyLimit = 100;

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

    return metrics;
  }

  getMemoryHistory(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }

  takeMemorySnapshot(): MemorySnapshot {
    const metrics = this.getCurrentMemoryUsage();
    const trend = this.getMemoryTrend();
    
    const snapshot: MemorySnapshot = {
      metrics,
      timestamp: Date.now(),
      trend
    };

    // Store snapshot
    this.memorySnapshots.push(snapshot);
    if (this.memorySnapshots.length > this.historyLimit) {
      this.memorySnapshots.shift();
    }

    return snapshot;
  }

  isMemoryUsageHigh(): boolean {
    const current = this.getCurrentMemoryUsage();
    return current.percentage > 80; // Consider 80% as high usage
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memorySnapshots.length < 5) {
      return 'stable';
    }

    const recent = this.memorySnapshots.slice(-5);
    const first = recent[0].metrics.percentage;
    const last = recent[recent.length - 1].metrics.percentage;
    const difference = last - first;

    if (difference > 5) return 'increasing';
    if (difference < -5) return 'decreasing';
    return 'stable';
  }

  clearHistory(): void {
    this.memorySnapshots = [];
  }
}

class FrameRateMonitor implements IFrameRateMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private droppedFrames = 0;
  private monitoring = false;
  private animationFrameId: number | null = null;
  private readonly historyLimit = 60; // Keep last 60 FPS samples
  private readonly targetFPS = 60;

  startMonitoring(): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.fpsHistory = [];
    this.droppedFrames = 0;
    
    this.measureFrame();
  }

  stopMonitoring(): void {
    this.monitoring = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private measureFrame = (): void => {
    if (!this.monitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.fpsHistory.push(fps);
      
      // Track dropped frames (below 55 FPS is considered dropped)
      if (fps < 55) {
        this.droppedFrames++;
      }
      
      // Keep history limited
      if (this.fpsHistory.length > this.historyLimit) {
        this.fpsHistory.shift();
      }
    }
    
    this.frameCount++;
    this.lastFrameTime = currentTime;
    
    this.animationFrameId = requestAnimationFrame(this.measureFrame);
  };

  getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory[this.fpsHistory.length - 1];
  }

  getFrameRateMetrics(): FrameRateMetrics | null {
    if (this.fpsHistory.length === 0) return null;

    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    const avg = sum / this.fpsHistory.length;
    const min = Math.min(...this.fpsHistory);
    const max = Math.max(...this.fpsHistory);

    return {
      currentFPS: this.getCurrentFPS(),
      averageFPS: avg,
      minFPS: min,
      maxFPS: max,
      droppedFrames: this.droppedFrames,
      timestamp: Date.now()
    };
  }

  isMonitoring(): boolean {
    return this.monitoring;
  }
}

class PerformanceAnalyzer implements IPerformanceAnalyzer {
  constructor(
    private metricsCollector: IMetricsCollector,
    private memoryMonitor: IMemoryMonitor,
    private frameRateMonitor: IFrameRateMonitor
  ) {}

  analyzeMetrics(metrics: PerformanceMetric[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze render times
    const renderTimes = this.metricsCollector.getRenderTimes();
    if (renderTimes.length > 0) {
      const avgRenderTime = renderTimes.reduce((sum, rt) => sum + rt.duration, 0) / renderTimes.length;
      
      if (avgRenderTime > 100) {
        suggestions.push({
          type: 'rendering',
          priority: 'high',
          description: `Average render time is ${avgRenderTime.toFixed(1)}ms, which is above the recommended 100ms`,
          action: 'Consider optimizing canvas operations, reducing text complexity, or implementing progressive rendering'
        });
      }

      // Find slow renders
      const slowRenders = renderTimes.filter(rt => rt.duration > 500);
      if (slowRenders.length > 0) {
        suggestions.push({
          type: 'rendering',
          priority: 'high',
          description: `${slowRenders.length} render operations took longer than 500ms`,
          action: 'Investigate slow operations: ' + slowRenders.slice(0, 3).map(r => r.operation).join(', ')
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

    // Analyze frame rate
    const frameMetrics = this.frameRateMonitor.getFrameRateMetrics();
    if (frameMetrics && frameMetrics.averageFPS < 50) {
      suggestions.push({
        type: 'rendering',
        priority: 'high',
        description: `Average FPS is ${frameMetrics.averageFPS.toFixed(1)}, which is below the target 60 FPS`,
        action: 'Reduce animation complexity or optimize rendering pipeline'
      });
    }

    if (frameMetrics && frameMetrics.droppedFrames > 10) {
      suggestions.push({
        type: 'rendering',
        priority: 'medium',
        description: `${frameMetrics.droppedFrames} frames dropped during monitoring`,
        action: 'Check for long-running synchronous operations blocking the main thread'
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

  calculatePerformanceScore(): number {
    let score = 100;
    const renderTimes = this.metricsCollector.getRenderTimes();
    const memoryUsage = this.memoryMonitor.getCurrentMemoryUsage();
    const frameMetrics = this.frameRateMonitor.getFrameRateMetrics();

    // Deduct points for slow renders
    if (renderTimes.length > 0) {
      const avgRenderTime = renderTimes.reduce((sum, rt) => sum + rt.duration, 0) / renderTimes.length;
      if (avgRenderTime > 100) score -= 20;
      else if (avgRenderTime > 50) score -= 10;
    }

    // Deduct points for high memory usage
    if (memoryUsage.percentage > 80) score -= 30;
    else if (memoryUsage.percentage > 60) score -= 15;

    // Deduct points for low FPS
    if (frameMetrics) {
      if (frameMetrics.averageFPS < 30) score -= 30;
      else if (frameMetrics.averageFPS < 50) score -= 15;
      
      if (frameMetrics.droppedFrames > 20) score -= 10;
    }

    return Math.max(0, score);
  }

  generateReport(): PerformanceReport {
    const metrics = this.metricsCollector.getMetrics();
    const renderTimes = this.metricsCollector.getRenderTimes();
    const memoryUsage = this.memoryMonitor.getCurrentMemoryUsage();
    const memoryHistory = this.memoryMonitor.getMemoryHistory();
    const frameRate = this.frameRateMonitor.getFrameRateMetrics();
    const recommendations = this.analyzeMetrics(metrics).map(s => s.description);

    // Calculate summary
    const avgRenderTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, rt) => sum + rt.duration, 0) / renderTimes.length
      : 0;
    
    const slowestRender = renderTimes.length > 0
      ? renderTimes.reduce((slowest, current) => 
          current.duration > slowest.duration ? current : slowest
        )
      : null;

    return {
      metrics,
      renderTimes,
      memoryUsage,
      memoryHistory,
      frameRate,
      recommendations,
      timestamp: Date.now(),
      summary: {
        avgRenderTime,
        slowestRender,
        memoryTrend: this.memoryMonitor.getMemoryTrend(),
        performanceScore: this.calculatePerformanceScore()
      }
    };
  }
}

// Main performance monitor class following dependency inversion principle
export class PerformanceMonitor implements IPerformanceMonitor {
  constructor(
    private metricsCollector: IMetricsCollector = new MetricsCollector(),
    private memoryMonitor: IMemoryMonitor = new MemoryMonitor(),
    private frameRateMonitor: IFrameRateMonitor = new FrameRateMonitor(),
    private analyzer: IPerformanceAnalyzer = new PerformanceAnalyzer(metricsCollector, memoryMonitor, frameRateMonitor)
  ) {}

  // Delegate to metrics collector
  recordMetric(metric: PerformanceMetric): void {
    this.metricsCollector.recordMetric(metric);
  }

  recordRenderTime(renderMetric: RenderTimeMetrics): void {
    this.metricsCollector.recordRenderTime(renderMetric);
  }

  getMetrics(name?: string): PerformanceMetric[] {
    return this.metricsCollector.getMetrics(name);
  }

  getRenderTimes(operation?: string): RenderTimeMetrics[] {
    return this.metricsCollector.getRenderTimes(operation);
  }

  clearMetrics(): void {
    this.metricsCollector.clearMetrics();
    (this.memoryMonitor as MemoryMonitor).clearHistory();
  }

  // Delegate to memory monitor
  getCurrentMemoryUsage(): MemoryMetrics {
    return this.memoryMonitor.getCurrentMemoryUsage();
  }

  getMemoryHistory(): MemorySnapshot[] {
    return this.memoryMonitor.getMemoryHistory();
  }

  isMemoryUsageHigh(): boolean {
    return this.memoryMonitor.isMemoryUsageHigh();
  }

  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    return this.memoryMonitor.getMemoryTrend();
  }

  takeMemorySnapshot(): MemorySnapshot {
    return this.memoryMonitor.takeMemorySnapshot();
  }

  // Delegate to frame rate monitor
  startMonitoring(): void {
    this.frameRateMonitor.startMonitoring();
  }

  stopMonitoring(): void {
    this.frameRateMonitor.stopMonitoring();
  }

  getCurrentFPS(): number {
    return this.frameRateMonitor.getCurrentFPS();
  }

  getFrameRateMetrics(): FrameRateMetrics | null {
    return this.frameRateMonitor.getFrameRateMetrics();
  }

  isMonitoring(): boolean {
    return this.frameRateMonitor.isMonitoring();
  }

  // Delegate to analyzer
  analyzeMetrics(metrics: PerformanceMetric[]): OptimizationSuggestion[] {
    return this.analyzer.analyzeMetrics(metrics);
  }

  calculatePerformanceScore(): number {
    return this.analyzer.calculatePerformanceScore();
  }

  generateReport(): PerformanceReport {
    return this.analyzer.generateReport();
  }

  // High-level tracking methods
  trackRenderTime(operation: string, duration: number, context?: Partial<RenderTimeMetrics>): void {
    const renderMetric: RenderTimeMetrics = {
      operation,
      duration,
      timestamp: Date.now(),
      ...context
    };
    
    this.recordRenderTime(renderMetric);
    
    // Also record as general metric for backward compatibility
    this.recordMetric({
      name: `render-${operation}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      context: { operation, ...context }
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