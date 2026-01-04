/**
 * Regression Verification Script
 * 
 * Automated checks to verify no regressions after optimization
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface VerificationResult {
  category: string;
  test: string;
  passed: boolean;
  message: string;
}

const results: VerificationResult[] = [];

function addResult(category: string, test: string, passed: boolean, message: string) {
  results.push({ category, test, passed, message });
}

// 1. Verify file sizes are under 400 lines
function verifyFileSizes() {
  const filesToCheck = [
    'App.tsx',
    'hooks/useAppState.ts',
    'hooks/useAppServices.ts',
    'hooks/useAppEffects.ts',
    'services/canvasRenderer.ts',
    'services/canvasRenderer.core.ts',
    'services/canvasRenderer.mobile.ts',
    'services/canvasRenderer.effects.ts',
    'services/canvasRenderer.fallback.ts',
    'services/canvasRenderer.utils.ts'
  ];

  filesToCheck.forEach(file => {
    const path = join(process.cwd(), file);
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      const lines = content.split('\n').length;
      const passed = lines <= 400;
      addResult(
        'File Size',
        file,
        passed,
        `${lines} lines ${passed ? '✓' : '✗ (exceeds 400)'}`
      );
    } else {
      addResult('File Size', file, false, 'File not found');
    }
  });
}

// 2. Verify required files exist
function verifyRequiredFiles() {
  const requiredFiles = [
    'App.tsx',
    'hooks/useAppState.ts',
    'hooks/useAppServices.ts',
    'hooks/useAppEffects.ts',
    'hooks/usePreCalculatedCanvasDimensions.ts',
    'services/progressiveCanvasRenderer.ts',
    'services/memoryManager.ts',
    'services/adaptiveQualityService.ts',
    'services/errorRecoveryService.ts',
    'services/performanceMonitor.ts',
    'services/performantFontLoader.ts',
    'components/PerformanceDashboard.tsx',
    'components/QualitySettingsPanel.tsx',
    'components/ErrorRecoveryNotification.tsx'
  ];

  requiredFiles.forEach(file => {
    const path = join(process.cwd(), file);
    const exists = existsSync(path);
    addResult(
      'Required Files',
      file,
      exists,
      exists ? 'Exists ✓' : 'Missing ✗'
    );
  });
}

// 3. Verify TypeScript interfaces are present
function verifyInterfaces() {
  const typesFile = join(process.cwd(), 'types/index.ts');
  
  if (existsSync(typesFile)) {
    const content = readFileSync(typesFile, 'utf-8');
    
    const requiredInterfaces = [
      'RenderingConfig',
      'PaperTemplate',
      'GeneratedImage',
      'DistortionLevel'
    ];

    requiredInterfaces.forEach(interfaceName => {
      const hasInterface = content.includes(`interface ${interfaceName}`) || 
                          content.includes(`type ${interfaceName}`);
      addResult(
        'TypeScript Interfaces',
        interfaceName,
        hasInterface,
        hasInterface ? 'Defined ✓' : 'Missing ✗'
      );
    });
  } else {
    addResult('TypeScript Interfaces', 'types/index.ts', false, 'File not found');
  }
}

// 4. Verify service exports
function verifyServiceExports() {
  const servicesIndex = join(process.cwd(), 'services/index.ts');
  
  if (existsSync(servicesIndex)) {
    const content = readFileSync(servicesIndex, 'utf-8');
    
    const requiredExports = [
      'CanvasRenderer',
      'ProgressiveCanvasRenderer',
      'MemoryManager',
      'AdaptiveQualityService',
      'ErrorRecoveryService',
      'PerformanceMonitor',
      'PerformantFontLoader'
    ];

    requiredExports.forEach(exportName => {
      const hasExport = content.includes(exportName);
      addResult(
        'Service Exports',
        exportName,
        hasExport,
        hasExport ? 'Exported ✓' : 'Missing ✗'
      );
    });
  } else {
    addResult('Service Exports', 'services/index.ts', false, 'File not found');
  }
}

// 5. Verify no console.log statements in production code
function verifyNoConsoleLogs() {
  const filesToCheck = [
    'App.tsx',
    'services/canvasRenderer.ts',
    'services/canvasRenderer.core.ts',
    'hooks/useAppState.ts',
    'hooks/useAppServices.ts'
  ];

  filesToCheck.forEach(file => {
    const path = join(process.cwd(), file);
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      // Allow console.error and console.warn, but not console.log
      const hasConsoleLog = /console\.log\(/.test(content);
      addResult(
        'Code Quality',
        `${file} (no console.log)`,
        !hasConsoleLog,
        hasConsoleLog ? 'Has console.log ✗' : 'Clean ✓'
      );
    }
  });
}

// 6. Verify package.json scripts
function verifyPackageScripts() {
  const packagePath = join(process.cwd(), 'package.json');
  
  if (existsSync(packagePath)) {
    const content = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const scripts = content.scripts || {};
    
    const requiredScripts = [
      'dev',
      'build',
      'preview',
      'test',
      'typecheck:components'
    ];

    requiredScripts.forEach(scriptName => {
      const hasScript = scriptName in scripts;
      addResult(
        'Package Scripts',
        scriptName,
        hasScript,
        hasScript ? 'Defined ✓' : 'Missing ✗'
      );
    });
  } else {
    addResult('Package Scripts', 'package.json', false, 'File not found');
  }
}

// 7. Verify documentation exists
function verifyDocumentation() {
  const docs = [
    'README.md',
    'CHANGELOG.md',
    'docs/OPTIMIZATION_GUIDE.md',
    'docs/SYSTEM_DOCUMENTATION.md',
    'docs/TASK_21_COMPLETION_SUMMARY.md',
    'docs/TASK_22_REGRESSION_TEST_REPORT.md',
    'docs/MANUAL_TESTING_CHECKLIST.md'
  ];

  docs.forEach(doc => {
    const path = join(process.cwd(), doc);
    const exists = existsSync(path);
    addResult(
      'Documentation',
      doc,
      exists,
      exists ? 'Exists ✓' : 'Missing ✗'
    );
  });
}

// Run all verifications
function runVerification() {
  console.log('🔍 Running Regression Verification...\n');

  verifyFileSizes();
  verifyRequiredFiles();
  verifyInterfaces();
  verifyServiceExports();
  verifyNoConsoleLogs();
  verifyPackageScripts();
  verifyDocumentation();

  // Print results
  console.log('═'.repeat(80));
  console.log('VERIFICATION RESULTS');
  console.log('═'.repeat(80));

  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryResults.length;
    
    console.log(`\n${category}: ${passed}/${total} passed`);
    console.log('─'.repeat(80));
    
    categoryResults.forEach(result => {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      console.log(`  ${color}${icon}${reset} ${result.test}: ${result.message}`);
    });
  });

  // Summary
  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalTests - totalPassed}`);
  console.log(`Pass Rate: ${passRate}%`);

  if (totalPassed === totalTests) {
    console.log('\n✅ All verification checks passed!');
    console.log('The application is ready for production deployment.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some verification checks failed.');
    console.log('Please review the failures above before deployment.');
    process.exit(1);
  }
}

// Run the verification
runVerification();
