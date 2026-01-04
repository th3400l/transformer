/**
 * Lighthouse Audit Script
 * Runs Lighthouse performance audit and validates scores
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const TARGET_SCORES = {
  performance: 90,
  accessibility: 90,
  bestPractices: 90,
  seo: 90,
};

async function runLighthouse(url) {
  console.log('🚀 Starting Lighthouse Audit...\n');
  console.log(`URL: ${url}\n`);

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  try {
    // Run Lighthouse
    const runnerResult = await lighthouse(url, options);

    // Extract scores
    const { lhr } = runnerResult;
    const scores = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    };

    // Generate report
    console.log('='.repeat(50));
    console.log('Lighthouse Audit Results');
    console.log('='.repeat(50));
    console.log('');
    console.log('Scores:');
    console.log(`  Performance:     ${scores.performance}/100 (target: ${TARGET_SCORES.performance}) ${scores.performance >= TARGET_SCORES.performance ? '✅' : '❌'}`);
    console.log(`  Accessibility:   ${scores.accessibility}/100 (target: ${TARGET_SCORES.accessibility}) ${scores.accessibility >= TARGET_SCORES.accessibility ? '✅' : '❌'}`);
    console.log(`  Best Practices:  ${scores.bestPractices}/100 (target: ${TARGET_SCORES.bestPractices}) ${scores.bestPractices >= TARGET_SCORES.bestPractices ? '✅' : '❌'}`);
    console.log(`  SEO:             ${scores.seo}/100 (target: ${TARGET_SCORES.seo}) ${scores.seo >= TARGET_SCORES.seo ? '✅' : '❌'}`);
    console.log('');

    // Check if all targets met
    const allPassed = Object.keys(scores).every(
      (key) => scores[key] >= TARGET_SCORES[key]
    );

    // Save HTML report
    const reportPath = path.join(__dirname, '../lighthouse-report.html');
    fs.writeFileSync(reportPath, runnerResult.report);
    console.log(`📄 Full report saved to: ${reportPath}`);
    console.log('');

    // Print key metrics
    const metrics = lhr.audits.metrics.details.items[0];
    console.log('Key Metrics:');
    console.log(`  First Contentful Paint: ${Math.round(metrics.firstContentfulPaint)}ms`);
    console.log(`  Largest Contentful Paint: ${Math.round(metrics.largestContentfulPaint)}ms`);
    console.log(`  Total Blocking Time: ${Math.round(metrics.totalBlockingTime)}ms`);
    console.log(`  Cumulative Layout Shift: ${metrics.cumulativeLayoutShift.toFixed(3)}`);
    console.log(`  Speed Index: ${Math.round(metrics.speedIndex)}ms`);
    console.log('');

    console.log('='.repeat(50));
    console.log(`Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(50));
    console.log('');

    await chrome.kill();

    return allPassed ? 0 : 1;
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error);
    await chrome.kill();
    return 1;
  }
}

// Get URL from command line or use default
const url = process.argv[2] || 'http://localhost:5173';

runLighthouse(url)
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
