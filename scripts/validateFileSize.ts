/**
 * File Size Validator
 * Validates that all source files are under the 400 line limit
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileSizeReport {
  file: string;
  lines: number;
  passed: boolean;
}

const MAX_LINES = 400;
const DIRECTORIES_TO_CHECK = ['components', 'services', 'hooks', 'types', 'app'];
const EXTENSIONS = ['.ts', '.tsx'];

function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (EXTENSIONS.some((ext) => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function validateFileSizes(): {
  reports: FileSizeReport[];
  passed: boolean;
  failures: FileSizeReport[];
} {
  const reports: FileSizeReport[] = [];
  const failures: FileSizeReport[] = [];

  DIRECTORIES_TO_CHECK.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const files = getAllFiles(dir);

      files.forEach((file) => {
        const lines = countLines(file);
        const passed = lines <= MAX_LINES;
        const report: FileSizeReport = {
          file,
          lines,
          passed,
        };

        reports.push(report);
        if (!passed) {
          failures.push(report);
        }
      });
    }
  });

  return {
    reports,
    passed: failures.length === 0,
    failures,
  };
}

function generateReport(): string {
  const result = validateFileSizes();
  const lines: string[] = [
    '=== File Size Validation Report ===',
    '',
    `Total files checked: ${result.reports.length}`,
    `Files over ${MAX_LINES} lines: ${result.failures.length}`,
    '',
  ];

  if (result.failures.length > 0) {
    lines.push('Files exceeding line limit:');
    result.failures
      .sort((a, b) => b.lines - a.lines)
      .forEach((report) => {
        lines.push(`  ❌ ${report.file}: ${report.lines} lines (${report.lines - MAX_LINES} over limit)`);
      });
    lines.push('');
  }

  // Show top 10 largest files
  const largest = [...result.reports]
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10);

  lines.push('Top 10 largest files:');
  largest.forEach((report, index) => {
    const status = report.passed ? '✅' : '❌';
    lines.push(`  ${status} ${index + 1}. ${report.file}: ${report.lines} lines`);
  });
  lines.push('');

  lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  lines.push('');

  return lines.join('\n');
}

// Run validation
console.log(generateReport());

// Exit with error code if validation failed
const result = validateFileSizes();
process.exit(result.passed ? 0 : 1);
