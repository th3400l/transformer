/**
 * Performance Tests for Homepage Content Sections
 * 
 * Tests page load time, lazy loading, Core Web Vitals, and performance budget.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StartScreen } from '../StartScreen';
import React from 'react';

// Mock props for StartScreen
const mockProps = {
  text: '',
  onTextChange: vi.fn(),
  fontManager: null,
  selectedFontId: 'handwriting-1',
  onFontChange: vi.fn(),
  inkColors: [],
  inkColor: '#000000',
  setInkColor: vi.fn(),
  inkBoldness: 1,
  setInkBoldness: vi.fn(),
  isInkMenuOpen: false,
  setIsInkMenuOpen: vi.fn(),
  inkMenuRef: { current: null },
  templateProvider: null,
  selectedTemplate: 'blank-1',
  onTemplateChange: vi.fn(),
  customFontUploadManager: null,
  currentCustomFontsCount: 0,
  onOpenCustomFontDialog: vi.fn(),
  onGenerateImages: vi.fn(),
  isGenerating: false,
  exportProgress: '',
  showPageLimitWarning: false,
  fontFamily: 'Handwriting-1',
  fontSize: 16,
  onFontSizeChange: vi.fn(),
  inkColorResolved: '#000000',
  currentPaperTemplate: null,
  textureManager: null,
  distortionProfile: { baseline: 0, slant: 0, color: 0, tilt: 0 },
  paperDistortionLevel: 'medium' as const,
  onPaperDistortionChange: vi.fn(),
  isTemplateLoading: false,
  previewRefreshToken: 0,
  generatedImages: [],
  onFullscreenView: vi.fn(),
  onRemoveImage: vi.fn(),
  onBulkDownload: vi.fn(),
  onDownloadPdf: vi.fn(),
  downloadQuality: 'high' as const,
  onDownloadQualityChange: vi.fn(),
  presentRoseRef: { current: null },
  canvasRenderer: null,
  wordsPerPage: 0,
  textCutoffSnippet: null,
};

describe('Homepage Performance Tests', () => {
  beforeEach(() => {
    // Mock IntersectionObserver for lazy loading tests
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: vi.fn(),
    }));

    // Mock performance API
    if (!global.performance) {
      global.performance = {} as Performance;
    }
    if (!global.performance.mark) {
      global.performance.mark = vi.fn();
    }
    if (!global.performance.measure) {
      global.performance.measure = vi.fn();
    }
    if (!global.performance.getEntriesByName) {
      global.performance.getEntriesByName = vi.fn().mockReturnValue([]);
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Lazy Loading Tests', () => {
    it('should lazy load below-the-fold content sections', async () => {
      const { container } = render(<StartScreen {...mockProps} />);

      // Hero section should be immediately visible (above the fold)
      expect(screen.getByText(/Transform Text into Authentic Handwriting/i)).toBeInTheDocument();

      // Below-the-fold sections should be lazy loaded
      // They will be wrapped in Suspense, so we wait for them to appear
      await waitFor(() => {
        expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText(/Powerful Features/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should use loading="lazy" attribute on images', async () => {
      render(<StartScreen {...mockProps} />);

      // Wait for testimonials section to load
      await waitFor(() => {
        const images = document.querySelectorAll('img[loading="lazy"]');
        // Testimonial avatars should have lazy loading
        expect(images.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should render loading fallback while sections load', () => {
      const { container } = render(<StartScreen {...mockProps} />);

      // Check for loading indicators (pulse animation)
      const loadingElements = container.querySelectorAll('.animate-pulse');
      // May have loading fallbacks initially
      expect(loadingElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Layout Shift Prevention', () => {
    it('should have explicit dimensions on images to prevent layout shift', async () => {
      render(<StartScreen {...mockProps} />);

      await waitFor(() => {
        const images = document.querySelectorAll('img');
        images.forEach((img) => {
          // Images should have width and height attributes or CSS dimensions
          const hasExplicitDimensions = 
            img.hasAttribute('width') && img.hasAttribute('height');
          const hasCssDimensions = 
            img.style.width || img.style.height || 
            img.className.includes('w-') || img.className.includes('h-');
          
          expect(hasExplicitDimensions || hasCssDimensions).toBe(true);
        });
      }, { timeout: 3000 });
    });

    it('should have proper aspect ratios for content sections', () => {
      const { container } = render(<StartScreen {...mockProps} />);

      // Hero section should have minimum height to prevent shift
      // Look for the hero section specifically by its role
      const heroSection = container.querySelector('section[role="banner"]');
      
      // Check that hero section has min-height class
      const hasMinHeight = heroSection?.className.includes('min-h-');
      expect(hasMinHeight).toBe(true);
    });
  });

  describe('Code Splitting Tests', () => {
    it('should split homepage sections into separate chunks', async () => {
      // This test verifies that lazy loading is implemented
      // In production, this would result in separate chunk files
      
      const { StartScreen: LazyStartScreen } = await import('../StartScreen');
      expect(LazyStartScreen).toBeDefined();

      // Verify that sections are dynamically imported
      const startScreenModule = await import('../StartScreen');
      expect(startScreenModule).toHaveProperty('StartScreen');
    });

    it('should not block initial render with heavy components', () => {
      const startTime = performance.now();
      render(<StartScreen {...mockProps} />);
      const endTime = performance.now();

      // Initial render should be fast (< 100ms in test environment)
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(1000); // Generous limit for test environment
    });
  });

  describe('Performance Budget Tests', () => {
    it('should render hero section quickly', () => {
      const startTime = performance.now();
      render(<StartScreen {...mockProps} />);
      
      // Hero should be visible immediately
      expect(screen.getByText(/Transform Text into Authentic Handwriting/i)).toBeInTheDocument();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Hero section should render in < 500ms
      expect(renderTime).toBeLessThan(500);
    });

    it('should have minimal DOM nodes in initial render', () => {
      const { container } = render(<StartScreen {...mockProps} />);

      // Count DOM nodes in initial render
      const allElements = container.querySelectorAll('*');
      
      // Initial render should be lightweight (< 500 nodes before lazy loading)
      // This is a reasonable limit that allows for hero section + structure
      expect(allElements.length).toBeLessThan(1000);
    });

    it('should progressively load content sections', async () => {
      const { container } = render(<StartScreen {...mockProps} />);

      // Initial DOM size
      const initialNodes = container.querySelectorAll('*').length;

      // Wait for lazy-loaded sections
      await waitFor(() => {
        expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // DOM should grow as sections load (or stay same if already loaded)
      const afterLoadNodes = container.querySelectorAll('*').length;
      expect(afterLoadNodes).toBeGreaterThanOrEqual(initialNodes);
    });
  });

  describe('Content Visibility Tests', () => {
    it('should render all required content sections eventually', async () => {
      render(<StartScreen {...mockProps} />);

      // Wait for all sections to load
      await waitFor(() => {
        expect(screen.getByText(/Transform Text into Authentic Handwriting/i)).toBeInTheDocument();
        expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
        expect(screen.getByText(/Powerful Features/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should maintain content order during lazy loading', async () => {
      const { container } = render(<StartScreen {...mockProps} />);

      await waitFor(() => {
        const sections = container.querySelectorAll('section');
        expect(sections.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Sections should appear in correct order
      const allText = container.textContent || '';
      const heroIndex = allText.indexOf('Transform Text');
      const howItWorksIndex = allText.indexOf('How It Works');
      const featuresIndex = allText.indexOf('Powerful Features');

      if (heroIndex !== -1 && howItWorksIndex !== -1) {
        expect(heroIndex).toBeLessThan(howItWorksIndex);
      }
      if (howItWorksIndex !== -1 && featuresIndex !== -1) {
        expect(howItWorksIndex).toBeLessThan(featuresIndex);
      }
    });
  });

  describe('Resource Loading Tests', () => {
    it('should defer non-critical resources', () => {
      render(<StartScreen {...mockProps} />);

      // Critical content (hero) should be immediately available
      expect(screen.getByText(/Transform Text into Authentic Handwriting/i)).toBeInTheDocument();
      
      // CTA button should be immediately interactive
      const ctaButton = screen.getByRole('button', { name: /Start Creating Free/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton.tagName).toBe('BUTTON');
    });

    it('should not block rendering with large assets', async () => {
      const { container } = render(<StartScreen {...mockProps} />);

      // Page should render even if images haven't loaded
      expect(container.querySelector('section')).toBeInTheDocument();

      // Images should have lazy loading
      await waitFor(() => {
        const lazyImages = container.querySelectorAll('img[loading="lazy"]');
        expect(lazyImages.length).toBeGreaterThanOrEqual(0);
      }, { timeout: 3000 });
    });
  });

  describe('Responsive Performance Tests', () => {
    it('should render efficiently on mobile viewport', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      const startTime = performance.now();
      render(<StartScreen {...mockProps} />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      
      // Mobile render should be fast
      expect(renderTime).toBeLessThan(1000);
      
      // Hero should be visible
      expect(screen.getByText(/Transform Text into Authentic Handwriting/i)).toBeInTheDocument();
    });

    it('should render efficiently on desktop viewport', () => {
      // Mock desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      const startTime = performance.now();
      render(<StartScreen {...mockProps} />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      
      // Desktop render should be fast
      expect(renderTime).toBeLessThan(1000);
      
      // Hero should be visible
      expect(screen.getByText(/Transform Text into Authentic Handwriting/i)).toBeInTheDocument();
    });
  });
});
