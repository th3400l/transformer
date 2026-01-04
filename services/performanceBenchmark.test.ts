/**
 * Performance Benchmark Tests
 * Tests the benchmarking functionality and runs actual performance tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceBenchmark } from './performanceBenchmark';

describe('PerformanceBenchmark', () => {
  let benchmark: PerformanceBenchmark;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
  });

  describe('Load Time Measurement', () => {
    it('should measure initial load time', () => {
      benchmark.startLoadMeasurement();
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      const loadTime = benchmark.completeLoadMeasurement();
      expect(loadTime).toBeGreaterThan(0);
      expect(loadTime).toBeLessThan(100); // Should be quick in test
    });
  });

  describe('Canvas Render Measurement', () => {
    it('should measure canvas render time', async () => {
      const mockRenderFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return document.createElement('canvas');
      };

      const renderTime = await benchmark.measureCanvasRender(mockRenderFn);
      expect(renderTime).toBeGreaterThan(40);
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Template Render Measurement', () => {
    it('should measure template render time', async () => {
      const mockTemplateFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      };

      const renderTime = await benchmark.measureTemplateRender(mockTemplateFn);
      expect(renderTime).toBeGreaterThan(20);
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Memory Usage Measurement', () => {
    it('should measure memory usage', () => {
      const memoryUsage = benchmark.measureMemoryUsage();
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 if memory API not available', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      const memoryUsage = benchmark.measureMemoryUsage();
      expect(memoryUsage).toBe(0);

      // Restore
      if (originalMemory) {
        (performance as any).memory = originalMemory;
      }
    });
  });

  describe('Metrics Collection', () => {
    it('should collect all metrics', async () => {
      benchmark.startLoadMeasurement();
      await new Promise((resolve) => setTimeout(resolve, 10));
      benchmark.completeLoadMeasurement();

      await benchmark.measureCanvasRender(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return document.createElement('canvas');
      });

      await benchmark.measureTemplateRender(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      benchmark.measureMemoryUsage();

      const metrics = benchmark.getMetrics();
      expect(metrics.initialLoadTime).toBeGreaterThan(0);
      expect(metrics.canvasRenderTime).toBeGreaterThan(0);
      expect(metrics.templateRenderTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('should pass validation when all metrics meet targets', () => {
      // Set metrics that pass
      benchmark.startLoadMeasurement();
      benchmark.completeLoadMeasurement();

      const results = benchmark.validate();
      expect(results.passed).toBe(true);
      expect(results.failures).toHaveLength(0);
    });

    it('should fail validation when metrics exceed targets', async () => {
      const slowBenchmark = new PerformanceBenchmark({
        canvasRenderTime: 10,
        initialLoadTime: 10,
        templateRenderTime: 10,
        memoryUsage: 1,
      });

      // Simulate slow operations
      await slowBenchmark.measureCanvasRender(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return document.createElement('canvas');
      });

      const results = slowBenchmark.validate();
      expect(results.passed).toBe(false);
      expect(results.failures.length).toBeGreaterThan(0);
    });

    it('should generate warnings when metrics are close to targets', async () => {
      const benchmark = new PerformanceBenchmark({
        canvasRenderTime: 100,
        initialLoadTime: 100,
        templateRenderTime: 100,
        memoryUsage: 100,
      });

      // Simulate operations at 85% of target (should warn)
      await benchmark.measureCanvasRender(async () => {
        await new Promise((resolve) => setTimeout(resolve, 85));
        return document.createElement('canvas');
      });

      const results = benchmark.validate();
      expect(results.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate a readable report', async () => {
      benchmark.startLoadMeasurement();
      await new Promise((resolve) => setTimeout(resolve, 10));
      benchmark.completeLoadMeasurement();

      await benchmark.measureCanvasRender(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return document.createElement('canvas');
      });

      benchmark.measureMemoryUsage();

      const report = benchmark.generateReport();
      expect(report).toContain('Performance Benchmark Report');
      expect(report).toContain('Canvas Render Time');
      expect(report).toContain('Initial Load Time');
      expect(report).toContain('Memory Usage');
      expect(report).toMatch(/PASSED|FAILED/);
    });
  });

  describe('Reset', () => {
    it('should reset all metrics', async () => {
      benchmark.startLoadMeasurement();
      benchmark.completeLoadMeasurement();
      await benchmark.measureCanvasRender(async () => document.createElement('canvas'));

      benchmark.reset();

      const metrics = benchmark.getMetrics();
      expect(metrics.initialLoadTime).toBe(0);
      expect(metrics.canvasRenderTime).toBe(0);
      expect(metrics.templateRenderTime).toBe(0);
    });
  });
});
