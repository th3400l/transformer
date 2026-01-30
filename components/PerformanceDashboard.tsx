import React, { useState, useEffect } from 'react';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';
import type { PerformanceReport, RenderTimeMetrics, MemorySnapshot } from '../services/performanceMonitor';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const { getReport, clearMetrics } = usePerformanceMonitoring();
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const updateReport = () => {
      const newReport = getReport();
      setReport(newReport);
    };

    updateReport();

    if (autoRefresh) {
      const interval = setInterval(updateReport, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh, getReport]);

  if (!isOpen || !report) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryColor = (percentage: number): string => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Dashboard</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => clearMetrics()}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear Metrics
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Performance Score */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Overall Performance</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Performance Score</span>
                <span className={`text-3xl font-bold ${getScoreColor(report.summary.performanceScore)}`}>
                  {report.summary.performanceScore.toFixed(0)}/100
                </span>
              </div>
            </div>
          </div>

          {/* Render Performance */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Render Performance</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Average Render Time</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatDuration(report.summary.avgRenderTime)}
                </span>
              </div>
              {report.summary.slowestRender && (
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Slowest Render</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {report.summary.slowestRender.operation}: {formatDuration(report.summary.slowestRender.duration)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Total Renders</span>
                <span className="font-mono text-gray-900 dark:text-white">{report.renderTimes.length}</span>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Memory Usage</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700 dark:text-gray-300">Heap Usage</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {formatBytes(report.memoryUsage.usedJSHeapSize)} / {formatBytes(report.memoryUsage.jsHeapSizeLimit)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getMemoryColor(report.memoryUsage.percentage)}`}
                    style={{ width: `${Math.min(100, report.memoryUsage.percentage)}%` }}
                  />
                </div>
                <div className="text-right text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {report.memoryUsage.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Memory Trend</span>
                <span className="font-mono text-gray-900 dark:text-white capitalize">
                  {report.summary.memoryTrend}
                </span>
              </div>
            </div>
          </div>

          {/* Frame Rate */}
          {report.frameRate && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Frame Rate</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Current FPS</span>
                  <span className={`font-mono font-bold ${getFPSColor(report.frameRate.currentFPS)}`}>
                    {report.frameRate.currentFPS.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Average FPS</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {report.frameRate.averageFPS.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Min / Max FPS</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {report.frameRate.minFPS.toFixed(1)} / {report.frameRate.maxFPS.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Dropped Frames</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {report.frameRate.droppedFrames}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Recommendations</h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <ul className="space-y-2">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start">
                      <span className="mr-2">⚠️</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recent Renders */}
          {report.renderTimes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Recent Renders</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Operation</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Duration</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Phase</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.renderTimes.slice(-20).reverse().map((rt, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="p-2 text-gray-900 dark:text-white font-mono text-xs">
                            {rt.operation}
                          </td>
                          <td className="p-2 text-gray-900 dark:text-white font-mono">
                            {formatDuration(rt.duration)}
                          </td>
                          <td className="p-2 text-gray-700 dark:text-gray-300">
                            {rt.phase || '-'}
                          </td>
                          <td className="p-2 text-gray-700 dark:text-gray-300 text-xs">
                            {new Date(rt.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
