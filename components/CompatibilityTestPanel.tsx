import React, { useState } from 'react';
import { compatibilityDetector, type CompatibilityReport } from '../services/browserCompatibilityDetector';
import { crossPlatformTester, type TestSuite } from '../services/crossPlatformTester';

export const CompatibilityTestPanel: React.FC = () => {
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [testResults, setTestResults] = useState<TestSuite[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'tests'>('info');

  const generateReport = () => {
    const newReport = compatibilityDetector.generateReport();
    setReport(newReport);
  };

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await crossPlatformTester.runAllTests();
      setTestResults(results);
      setActiveTab('tests');
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const content = JSON.stringify(report, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compatibility-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTestResults = () => {
    if (!testResults) return;
    
    const content = crossPlatformTester.generateReport();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Compatibility Testing
        </h3>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1 rounded text-sm ${
              activeTab === 'info'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Device Info
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1 rounded text-sm ${
              activeTab === 'tests'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Test Results
          </button>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'info' && report && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Browser</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{report.browser.name} {report.browser.version}</p>
                <p>Engine: {report.browser.engine}</p>
                <p>Platform: {report.browser.platform}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Device</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Type: {report.device.type}</p>
                <p>OS: {report.device.os} {report.device.osVersion}</p>
                <p>Screen: {report.device.screenSize.width}x{report.device.screenSize.height}</p>
                <p>Pixel Ratio: {report.device.pixelRatio}</p>
                <p>Touch: {report.device.touchSupport ? 'Yes' : 'No'}</p>
                <p>Orientation: {report.device.orientation}</p>
              </div>
            </div>

            {report.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Warnings</h4>
                <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                  {report.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={downloadReport}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download Report
            </button>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-4">
            {!testResults ? (
              <button
                onClick={runTests}
                disabled={isRunning}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </button>
            ) : (
              <>
                {testResults.map((suite, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {suite.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {suite.passed} passed, {suite.failed} failed ({suite.duration.toFixed(0)}ms)
                    </p>
                    <div className="space-y-1">
                      {suite.tests.map((test, j) => (
                        <div key={j} className="text-sm">
                          <span className={test.passed ? 'text-green-600' : 'text-red-600'}>
                            {test.passed ? '✓' : '✗'}
                          </span>
                          <span className="ml-2 text-gray-700 dark:text-gray-300">
                            {test.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={runTests}
                    disabled={isRunning}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Re-run Tests
                  </button>
                  <button
                    onClick={downloadTestResults}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Download
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
