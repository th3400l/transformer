# txttohandwriting.org

A free, client-side handwriting generator that converts typed text into realistic handwritten text on customizable paper templates.

## Features

- **Realistic Handwriting Generation** - Natural variations including baseline jitter, slant, color variation, and micro-tilts
- **Multiple Paper Templates** - Blank, lined, and dotted paper with authentic textures
- **Custom Font Upload** - Upload your own handwriting fonts (2 personal slots)
- **Ink Customization** - Multiple colors (black, blue, red, green) with adjustable boldness
- **Multi-Page Support** - Generate up to 6 pages total, 2 pages per generation
- **Export Options** - PNG images, PDF compilation, bulk downloads with quality settings
- **Real-Time Preview** - Instant visual feedback as you type
- **Responsive Design** - Optimized for mobile, tablet, and desktop devices

## Performance Optimizations

This application has been extensively optimized for performance across all devices:

### Canvas Rendering
- **Instant Rendering** - Pre-calculated canvas dimensions eliminate expansion animations
- **Progressive Rendering** - Large text is rendered in chunks for smooth UI
- **Canvas Pooling** - Efficient reuse of canvas elements to reduce memory usage
- **Texture Caching** - Smart caching of paper textures with automatic cleanup

### Code Architecture
- **SOLID Principles** - Clean, maintainable code following best practices
- **Modular Design** - All files under 400 lines for easy navigation
- **Service Layer Pattern** - Dependency injection for testable, extensible code
- **Custom Hooks** - Reusable React hooks for state, services, and effects

### Memory Management
- **Automatic Cleanup** - Periodic cleanup of unused resources
- **Memory Monitoring** - Real-time tracking of memory usage
- **Graceful Degradation** - Automatic quality reduction under memory pressure
- **Texture Optimization** - Progressive loading and lazy loading of non-critical assets

### Cross-Platform Support
- **Mobile Optimized** - Touch-friendly UI with 44px minimum touch targets
- **Tablet Adaptive** - Layout adapts to tablet screen sizes and orientations
- **Desktop Enhanced** - Full feature set with optimized performance
- **Browser Compatible** - Works on Chrome, Firefox, Safari, and Edge

### SEO & Performance
- **Lighthouse Score > 90** - Optimized for Core Web Vitals
- **Code Splitting** - Lazy loading of routes and heavy components
- **Font Optimization** - Preloading critical fonts with font-display: swap
- **Structured Data** - Schema.org markup for better search visibility

## Tech Stack

- **Framework**: React 19.1.0 with TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0 with esbuild
- **Styling**: Tailwind CSS 3.4.17
- **Testing**: Vitest 3.2.4 with Testing Library
- **Canvas**: HTML5 Canvas API with html-to-image

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/txttohandwriting.git
cd txttohandwriting

# Install dependencies
npm install
# or
bun install
```

### Development

```bash
# Start development server
npm run dev
# or
bun run dev

# Open http://localhost:5173
```

### Build

```bash
# Build for production
npm run build
# or
bun run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests
npm test
# or
bun test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Project Structure

```
/
├── components/          # React components (UI layer)
│   ├── app/            # App-level components
│   └── *.tsx           # Feature components
├── services/           # Business logic & system services
│   ├── canvas*.ts      # Canvas rendering system
│   ├── font*.ts        # Font management
│   └── *Manager.ts     # Service managers
├── hooks/              # React custom hooks
│   ├── useApp*.ts      # App-level hooks
│   └── use*.ts         # Feature hooks
├── types/              # TypeScript type definitions
├── app/                # App configuration & constants
├── public/             # Static assets
│   ├── fonts/          # Handwriting fonts
│   └── template/       # Paper templates
└── docs/               # Documentation
```

## Key Hooks

### usePreCalculatedCanvasDimensions
Pre-calculates canvas dimensions before first render to eliminate expansion animations.

```typescript
const dimensions = usePreCalculatedCanvasDimensions({
  containerRef,
  aspectRatio: 8.5 / 11,
  minWidth: 300,
  maxWidth: 1200
});
```

### useAppState
Centralized state management for the entire application.

```typescript
const [state, setters, refs] = useAppState();
```

### useAppServices
Service initialization and dependency injection.

```typescript
const services = useAppServices(
  (container) => console.log('Services initialized'),
  (error) => console.error('Initialization failed:', error)
);
```

### useAppEffects
Side effects and lifecycle management.

```typescript
useAppEffects(state, setters, refs, services);
```

### useAdaptiveQuality
Automatic quality adjustment based on device capabilities and performance.

```typescript
const { state, setQualityPreset, startMonitoring } = useAdaptiveQuality();
```

### usePerformanceMonitoring
Real-time performance tracking and metrics.

```typescript
const { report, isMonitoring, startMonitoring } = usePerformanceMonitoring();
```

## Key Services

### ProgressiveCanvasRenderer
Renders large text in chunks for smooth UI.

```typescript
const renderer = new ProgressiveCanvasRenderer(textEngine, textureManager);
const canvas = await renderer.renderProgressive(config, onProgress);
```

### MemoryManager
Coordinates memory management across all services.

```typescript
const memoryManager = getMemoryManager();
const status = memoryManager.checkMemoryStatus();
await memoryManager.performCleanup();
```

### AdaptiveQualityService
Manages quality settings with user preferences and automatic adaptation.

```typescript
const qualityService = getAdaptiveQualityService();
qualityService.setQualityPreset('high');
qualityService.startAdaptiveMonitoring();
```

### ErrorRecoveryService
Handles errors with retry logic and fallback strategies.

```typescript
const errorRecovery = getErrorRecoveryService();
const result = await errorRecovery.executeWithRecovery(
  async () => await riskyOperation(),
  { maxRetries: 3, fallbackValue: defaultValue }
);
```

## Performance Benchmarks

Run performance benchmarks to measure optimization effectiveness:

```bash
# Run all benchmarks
npm run benchmark
# or
bun run benchmark

# Run Lighthouse audit
npm run lighthouse
```

### Target Metrics
- Canvas render time: < 500ms
- Initial load time: < 2s
- Lighthouse score: > 90
- Memory usage: < 100MB
- All files: < 400 lines

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Required features: Canvas 2D API, Blob API, Promises, ES6 modules, CSS custom properties

## Privacy & Philosophy

- **100% Client-Side** - No data transmitted to servers
- **No Tracking** - No analytics, no cookies, no data collection
- **Free Forever** - No subscriptions, no paywalls
- **Open Source** - Free for personal and commercial use

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache-2.0 License - See LICENSE file for details

## Acknowledgments

Built with ❤️ for students, creators, and anyone who needs authentic handwritten text.
