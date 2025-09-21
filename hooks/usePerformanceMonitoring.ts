import { useEffect, useRef, useCallback } from 'react';
import { globalPerformanceMonitor, PerformanceReport, OptimizationSuggestion } from '../services/performanceMonitor';

export interface UsePerformanceMonitoringOptions {
  enableAutoReporting?: boolean;
  reportInterval?: number;
  memoryThreshold?: number;
  onHighMemoryUsage?: (usage: number) => void;
  onPerformanceIssue?: (suggestions: OptimizationSuggestion[]) => void;
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    enableAutoReporting = false,
    reportInterval = 30000, // 30 seconds
    memoryThreshold = 80,
    onHighMemoryUsage,
    onPerformanceIssue
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportRef = useRef<PerformanceReport | null>(null);

  // Track component render performance
  const trackRender = useCallback((componentName: string, renderTime: number) => {
    globalPerformanceMonitor.trackRenderTime(componentName, renderTime);
  }, []);

  // Track async operations
  const trackAsync = useCallback(async <T>(
    operationName: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    return globalPerformanceMonitor.trackAsyncOperation(operationName, asyncFn);
  }, []);

  // Track synchronous operations
  const trackSync = useCallback(<T>(
    operationName: string,
    syncFn: () => T
  ): T => {
    return globalPerformanceMonitor.trackSyncOperation(operationName, syncFn);
  }, []);

  // Get current performance report
  const getReport = useCallback((): PerformanceReport => {
    return globalPerformanceMonitor.generateReport();
  }, []);

  // Check for performance issues
  const checkPerformance = useCallback(() => {
    const report = getReport();
    const suggestions = globalPerformanceMonitor.analyzeMetrics(report.metrics);
    
    // Check memory usage
    if (report.memoryUsage.percentage > memoryThreshold && onHighMemoryUsage) {
      onHighMemoryUsage(report.memoryUsage.percentage);
    }

    // Check for performance issues
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
    if (highPrioritySuggestions.length > 0 && onPerformanceIssue) {
      onPerformanceIssue(highPrioritySuggestions);
    }

    lastReportRef.current = report;
    return report;
  }, [memoryThreshold, onHighMemoryUsage, onPerformanceIssue, getReport]);

  // Clear all metrics
  const clearMetrics = useCallback(() => {
    globalPerformanceMonitor.clearMetrics();
  }, []);

  // Setup auto-reporting
  useEffect(() => {
    if (enableAutoReporting) {
      intervalRef.current = setInterval(() => {
        checkPerformance();
      }, reportInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [enableAutoReporting, reportInterval, checkPerformance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    trackRender,
    trackAsync,
    trackSync,
    getReport,
    checkPerformance,
    clearMetrics,
    lastReport: lastReportRef.current
  };
}

// Hook for tracking component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    globalPerformanceMonitor.trackRenderTime(componentName, renderTime);
  });

  return {
    startRenderTracking: () => {
      renderStartRef.current = performance.now();
    },
    endRenderTracking: () => {
      const renderTime = performance.now() - renderStartRef.current;
      globalPerformanceMonitor.trackRenderTime(componentName, renderTime);
      return renderTime;
    }
  };
}