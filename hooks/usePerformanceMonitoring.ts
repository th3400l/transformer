import { useEffect, useRef, useCallback, useState } from 'react';
import { globalPerformanceMonitor, PerformanceReport, OptimizationSuggestion, FrameRateMetrics, MemorySnapshot } from '../services/performanceMonitor';

export interface UsePerformanceMonitoringOptions {
  enableAutoReporting?: boolean;
  reportInterval?: number;
  memoryThreshold?: number;
  enableFrameRateMonitoring?: boolean;
  enableMemorySnapshots?: boolean;
  memorySnapshotInterval?: number;
  onHighMemoryUsage?: (usage: number) => void;
  onPerformanceIssue?: (suggestions: OptimizationSuggestion[]) => void;
  onLowFrameRate?: (fps: number) => void;
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    enableAutoReporting = false,
    reportInterval = 30000, // 30 seconds
    memoryThreshold = 80,
    enableFrameRateMonitoring = false,
    enableMemorySnapshots = false,
    memorySnapshotInterval = 5000, // 5 seconds
    onHighMemoryUsage,
    onPerformanceIssue,
    onLowFrameRate
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const memorySnapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportRef = useRef<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Track component render performance
  const trackRender = useCallback((componentName: string, renderTime: number, phase?: 'mount' | 'update' | 'unmount') => {
    globalPerformanceMonitor.trackRenderTime(componentName, renderTime, { componentName, phase });
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

  // Get frame rate metrics
  const getFrameRate = useCallback((): FrameRateMetrics | null => {
    return globalPerformanceMonitor.getFrameRateMetrics();
  }, []);

  // Get memory history
  const getMemoryHistory = useCallback((): MemorySnapshot[] => {
    return globalPerformanceMonitor.getMemoryHistory();
  }, []);

  // Start frame rate monitoring
  const startFPSMonitoring = useCallback(() => {
    globalPerformanceMonitor.startMonitoring();
    setIsMonitoring(true);
  }, []);

  // Stop frame rate monitoring
  const stopFPSMonitoring = useCallback(() => {
    globalPerformanceMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  // Take memory snapshot
  const takeMemorySnapshot = useCallback((): MemorySnapshot => {
    return globalPerformanceMonitor.takeMemorySnapshot();
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

    // Check frame rate
    if (report.frameRate && report.frameRate.averageFPS < 30 && onLowFrameRate) {
      onLowFrameRate(report.frameRate.averageFPS);
    }

    lastReportRef.current = report;
    return report;
  }, [memoryThreshold, onHighMemoryUsage, onPerformanceIssue, onLowFrameRate, getReport]);

  // Clear all metrics
  const clearMetrics = useCallback(() => {
    globalPerformanceMonitor.clearMetrics();
  }, []);

  // Get performance score
  const getPerformanceScore = useCallback((): number => {
    return globalPerformanceMonitor.calculatePerformanceScore();
  }, []);

  // Setup frame rate monitoring
  useEffect(() => {
    if (enableFrameRateMonitoring) {
      startFPSMonitoring();
      return () => {
        stopFPSMonitoring();
      };
    }
  }, [enableFrameRateMonitoring, startFPSMonitoring, stopFPSMonitoring]);

  // Setup memory snapshots
  useEffect(() => {
    if (enableMemorySnapshots) {
      memorySnapshotIntervalRef.current = setInterval(() => {
        takeMemorySnapshot();
      }, memorySnapshotInterval);

      return () => {
        if (memorySnapshotIntervalRef.current) {
          clearInterval(memorySnapshotIntervalRef.current);
        }
      };
    }
  }, [enableMemorySnapshots, memorySnapshotInterval, takeMemorySnapshot]);

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
      if (memorySnapshotIntervalRef.current) {
        clearInterval(memorySnapshotIntervalRef.current);
      }
      if (isMonitoring) {
        stopFPSMonitoring();
      }
    };
  }, [isMonitoring, stopFPSMonitoring]);

  return {
    trackRender,
    trackAsync,
    trackSync,
    getReport,
    getFrameRate,
    getMemoryHistory,
    checkPerformance,
    clearMetrics,
    getPerformanceScore,
    startFPSMonitoring,
    stopFPSMonitoring,
    takeMemorySnapshot,
    isMonitoring,
    lastReport: lastReportRef.current
  };
}

// Hook for tracking component render performance
export function useRenderPerformance(componentName: string, trackPhases = false) {
  const renderStartRef = useRef<number>(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    const phase = !mountedRef.current ? 'mount' : 'update';
    
    if (trackPhases) {
      globalPerformanceMonitor.trackRenderTime(componentName, renderTime, { componentName, phase });
    } else {
      globalPerformanceMonitor.trackRenderTime(componentName, renderTime, { componentName });
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
    }
  });

  useEffect(() => {
    return () => {
      if (trackPhases) {
        globalPerformanceMonitor.trackRenderTime(componentName, 0, { componentName, phase: 'unmount' });
      }
    };
  }, [componentName, trackPhases]);

  return {
    startRenderTracking: () => {
      renderStartRef.current = performance.now();
    },
    endRenderTracking: (phase?: 'mount' | 'update' | 'unmount') => {
      const renderTime = performance.now() - renderStartRef.current;
      globalPerformanceMonitor.trackRenderTime(componentName, renderTime, { componentName, phase });
      return renderTime;
    }
  };
}