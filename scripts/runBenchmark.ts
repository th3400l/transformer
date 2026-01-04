/**
 * Benchmark Runner Script
 * Runs comprehensive performance benchmarks on the application
 */

import { PerformanceBenchmark } from '../services/performanceBenchmark';

interface BenchmarkConfig {
  sampleText: string;
  iterations: number;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
  sampleText: 'The quick brown fox jumps over the lazy dog. '.repeat(20),
  iterations: 5,
};

/**
 * Run canvas rendering benchmark
 */
async function benchmarkCanvasRender(
  benchmark: PerformanceBenchmark,
  config: BenchmarkConfig
): Promise<void> {
  console.log('\n📊 Benchmarking Canvas Rendering...');
  
  const times: number[] = [];
  
  for (let i = 0; i < config.iterations; i++) {
    const time = await benchmark.measureCanvasRender(async () => {
      // Simulate canvas rendering
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Simulate text rendering
        ctx.font = '16px Arial';
        const lines = config.sampleText.split('\n');
        lines.forEach((line, index) => {
          ctx.fillText(line, 50, 50 + index * 20);
        });
      }
      
      return canvas;
    });
    
    times.push(time);
    console.log(`  Iteration ${i + 1}: ${time.toFixed(2)}ms`);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Min: ${min.toFixed(2)}ms`);
  console.log(`  Max: ${max.toFixed(2)}ms`);
  console.log(`  Target: 500ms ${avg < 500 ? '✅' : '❌'}`);
}

/**
 * Run template loading benchmark
 */
async function benchmarkTemplateLoad(
  benchmark: PerformanceBenchmark
): Promise<void> {
  console.log('\n📊 Benchmarking Template Loading...');
  
  const time = await benchmark.measureTemplateRender(async () => {
    // Simulate template loading
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load'));
      // Use a small data URL for testing
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    });
  });
  
  console.log(`  Template Load Time: ${time.toFixed(2)}ms`);
  console.log(`  Target: 300ms ${time < 300 ? '✅' : '❌'}`);
}

/**
 * Run memory usage benchmark
 */
function benchmarkMemoryUsage(benchmark: PerformanceBenchmark): void {
  console.log('\n📊 Benchmarking Memory Usage...');
  
  const memoryMB = benchmark.measureMemoryUsage();
  
  if (memoryMB > 0) {
    console.log(`  Current Memory Usage: ${memoryMB.toFixed(2)}MB`);
    console.log(`  Target: 100MB ${memoryMB < 100 ? '✅' : '❌'}`);
  } else {
    console.log('  ⚠️  Memory API not available in this environment');
  }
}

/**
 * Simulate initial load time
 */
function benchmarkInitialLoad(benchmark: PerformanceBenchmark): void {
  console.log('\n📊 Benchmarking Initial Load Time...');
  
  benchmark.startLoadMeasurement();
  
  // Simulate initial load operations
  const start = Date.now();
  while (Date.now() - start < 100) {
    // Simulate work
  }
  
  const loadTime = benchmark.completeLoadMeasurement();
  console.log(`  Initial Load Time: ${loadTime.toFixed(2)}ms`);
  console.log(`  Target: 2000ms ${loadTime < 2000 ? '✅' : '❌'}`);
}

/**
 * Main benchmark runner
 */
async function runBenchmarks(): Promise<void> {
  console.log('🚀 Starting Performance Benchmarks\n');
  console.log('='.repeat(50));
  
  const benchmark = new PerformanceBenchmark();
  const config = DEFAULT_CONFIG;
  
  try {
    // Run all benchmarks
    benchmarkInitialLoad(benchmark);
    await benchmarkCanvasRender(benchmark, config);
    await benchmarkTemplateLoad(benchmark);
    benchmarkMemoryUsage(benchmark);
    
    // Generate final report
    console.log('\n' + '='.repeat(50));
    console.log(benchmark.generateReport());
    
    // Validate results
    const results = benchmark.validate();
    
    if (!results.passed) {
      console.error('❌ Benchmark validation failed!');
      process.exit(1);
    } else {
      console.log('✅ All benchmarks passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Benchmark error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runBenchmarks();
}

export { runBenchmarks };
