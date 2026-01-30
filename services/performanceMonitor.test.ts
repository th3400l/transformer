import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor, createPerformanceMonitor } from './performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = createPerformanceMonitor() as PerformanceMonitor;
    monitor.clearMetrics();
  });

  describe('Render Time Tracking', () => {
    it('should track render times', () => {
      monitor.trackRenderTime('test-component', 50);
      monitor.trackRenderTime('test-component', 75);

      const renderTimes = monitor.getRenderTimes('test-component');
      expect(renderTimes).toHaveLength(2);
      expect(renderTimes[0].duration).toBe(50);
      expect(renderTimes[1].duration).toBe(75);
    });

    it('should track render times with context', () => {
      monitor.trackRenderTime('test-component', 50, {
        componentName: 'TestComponent',
        phase: 'mount'
      });

      const renderTimes = monitor.getRenderTimes('test-component');
      expect(renderTimes[0].componentName).toBe('TestComponent');
      expect(renderTimes[0].phase).toBe('mount');
    });

    it('should calculate average render time', () => {
      monitor.trackRenderTime('test', 50);
      monitor.trackRenderTime('test', 100);
      monitor.trackRenderTime('test', 150);

      const report = monitor.generateReport();
      expect(report.summary.avgRenderTime).toBe(100);
    });

    it('should identify slowest render', () => {
      monitor.trackRenderTime('fast', 50);
      monitor.trackRenderTime('slow', 500);
      monitor.trackRenderTime('medium', 100);

      const report = monitor.generateReport();
      expect(report.summary.slowestRender?.operation).toBe('slow');
      expect(report.summary.slowestRender?.duration).toBe(500);
    });
  });

  describe('Memory Monitoring', () => {
    it('should get current memory usage', () => {
      const memory = monitor.getCurrentMemoryUsage();
      expect(memory).toHaveProperty('usedJSHeapSize');
      expect(memory).toHaveProperty('totalJSHeapSize');
      expect(memory).toHaveProperty('jsHeapSizeLimit');
      expect(memory).toHaveProperty('percentage');
    });

    it('should take memory snapshots', () => {
      const snapshot1 = monitor.takeMemorySnapshot();
      const snapshot2 = monitor.takeMemorySnapshot();

      expect(snapshot1).toHaveProperty('metrics');
      expect(snapshot1).toHaveProperty('timestamp');
      expect(snapshot1).toHaveProperty('trend');

      const history = monitor.getMemoryHistory();
      expect(history).toHaveLength(2);
    });

    it('should detect memory trend', () => {
      // Take multiple snapshots
      for (let i = 0; i < 5; i++) {
        monitor.takeMemorySnapshot();
      }

      const trend = monitor.getMemoryTrend();
      expect(['increasing', 'decreasing', 'stable']).toContain(trend);
    });
  });

  describe('Frame Rate Monitoring', () => {
    it('should start and stop monitoring', () => {
      expect(monitor.isMonitoring()).toBe(false);

      monitor.startMonitoring();
      expect(monitor.isMonitoring()).toBe(true);

      monitor.stopMonitoring();
      expect(monitor.isMonitoring()).toBe(false);
    });

    it('should track frame rate metrics', async () => {
      monitor.startMonitoring();

      // Wait for a few frames
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = monitor.getFrameRateMetrics();
      
      if (metrics) {
        expect(metrics).toHaveProperty('currentFPS');
        expect(metrics).toHaveProperty('averageFPS');
        expect(metrics).toHaveProperty('minFPS');
        expect(metrics).toHaveProperty('maxFPS');
        expect(metrics).toHaveProperty('droppedFrames');
      }

      monitor.stopMonitoring();
    });
  });

  describe('Performance Analysis', () => {
    it('should calculate performance score', () => {
      // Add some good metrics
      monitor.trackRenderTime('fast-render', 30);
      monitor.trackRenderTime('fast-render', 40);

      const score = monitor.calculatePerformanceScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should generate performance report', () => {
      monitor.trackRenderTime('test', 50);
      monitor.takeMemorySnapshot();

      const report = monitor.generateReport();

      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('renderTimes');
      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('memoryHistory');
      expect(report).toHaveProperty('frameRate');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('avgRenderTime');
      expect(report.summary).toHaveProperty('slowestRender');
      expect(report.summary).toHaveProperty('memoryTrend');
      expect(report.summary).toHaveProperty('performanceScore');
    });

    it('should provide recommendations for slow renders', () => {
      // Add slow render times
      for (let i = 0; i < 5; i++) {
        monitor.trackRenderTime('slow-operation', 600);
      }

      const report = monitor.generateReport();
      const suggestions = monitor.analyzeMetrics(report.metrics);

      const renderingSuggestions = suggestions.filter(s => s.type === 'rendering');
      expect(renderingSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Async Operation Tracking', () => {
    it('should track successful async operations', async () => {
      const result = await monitor.trackAsyncOperation('test-async', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'success';
      });

      expect(result).toBe('success');

      const metrics = monitor.getMetrics('async-test-async');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].context?.success).toBe(true);
    });

    it('should track failed async operations', async () => {
      await expect(
        monitor.trackAsyncOperation('test-async-fail', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      const metrics = monitor.getMetrics('async-test-async-fail');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].context?.success).toBe(false);
    });
  });

  describe('Sync Operation Tracking', () => {
    it('should track successful sync operations', () => {
      const result = monitor.trackSyncOperation('test-sync', () => {
        return 42;
      });

      expect(result).toBe(42);

      const metrics = monitor.getMetrics('sync-test-sync');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].context?.success).toBe(true);
    });

    it('should track failed sync operations', () => {
      expect(() => {
        monitor.trackSyncOperation('test-sync-fail', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');

      const metrics = monitor.getMetrics('sync-test-sync-fail');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].context?.success).toBe(false);
    });
  });

  describe('Metrics Management', () => {
    it('should clear all metrics', () => {
      monitor.trackRenderTime('test', 50);
      monitor.takeMemorySnapshot();

      expect(monitor.getRenderTimes()).toHaveLength(1);
      expect(monitor.getMemoryHistory()).toHaveLength(1);

      monitor.clearMetrics();

      expect(monitor.getRenderTimes()).toHaveLength(0);
      expect(monitor.getMemoryHistory()).toHaveLength(0);
    });

    it('should limit stored metrics to prevent memory leaks', () => {
      // Add more than the limit
      for (let i = 0; i < 1500; i++) {
        monitor.trackRenderTime('test', i);
      }

      const renderTimes = monitor.getRenderTimes();
      expect(renderTimes.length).toBeLessThanOrEqual(500);
    });
  });
});
