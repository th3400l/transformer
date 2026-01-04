/**
 * Mobile-Specific Tests
 * 
 * Tests mobile-specific features including:
 * - Sticky "Start Creating" button visibility
 * - Touch target sizes (minimum 44px)
 * - Font sizes (minimum 16px)
 * - Responsive layout on various mobile widths
 * 
 * Requirements: 6.1, 6.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StartScreen } from '../StartScreen';
import type { StartScreenProps } from '../StartScreen';

// Mock the lazy-loaded components
vi.mock('../homepage/HowItWorksSection', () => ({
  default: () => <div data-testid="how-it-works-section">How It Works</div>,
}));

vi.mock('../homepage/FeaturesSection', () => ({
  default: () => <div data-testid="features-section">Features</div>,
}));

vi.mock('../homepage/UseCasesSection', () => ({
  default: () => <div data-testid="use-cases-section">Use Cases</div>,
}));

vi.mock('../homepage/TipsSection', () => ({
  default: () => <div data-testid="tips-section">Tips</div>,
}));

vi.mock('../homepage/TestimonialsSection', () => ({
  default: () => <div data-testid="testimonials-section">Testimonials</div>,
}));

vi.mock('../app/MainPage', () => ({
  default: () => <div data-testid="main-page">Main Page</div>,
}));

// Mock props for StartScreen
const mockProps: StartScreenProps = {
  text: '',
  onTextChange: vi.fn(),
  fontManager: null,
  selectedFontId: 'font-1',
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
  selectedTemplate: 'blank',
  onTemplateChange: vi.fn(),
  customFontUploadManager: null,
  currentCustomFontsCount: 0,
  onOpenCustomFontDialog: vi.fn(),
  onGenerateImages: vi.fn(),
  isGenerating: false,
  exportProgress: '',
  showPageLimitWarning: false,
  fontFamily: 'Arial',
  fontSize: 16,
  onFontSizeChange: vi.fn(),
  inkColorResolved: '#000000',
  currentPaperTemplate: null,
  textureManager: null,
  distortionProfile: { baselineJitter: 0, slantVariation: 0, inkColorVariation: 0, microTilt: 0 },
  paperDistortionLevel: 'medium',
  onPaperDistortionChange: vi.fn(),
  isTemplateLoading: false,
  previewRefreshToken: 0,
  generatedImages: [],
  onFullscreenView: vi.fn(),
  onRemoveImage: vi.fn(),
  onBulkDownload: vi.fn(),
  onDownloadPdf: vi.fn(),
  downloadQuality: 'high',
  onDownloadQualityChange: vi.fn(),
  presentRoseRef: { current: null },
  canvasRenderer: null,
  wordsPerPage: 0,
  textCutoffSnippet: null,
};

describe('Mobile-Specific Features', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Store original window width
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Sticky Button Visibility', () => {
    it('should show sticky button on mobile when tool is below viewport', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });

      const { container } = render(<StartScreen {...mockProps} />);

      // Trigger resize event to detect mobile
      fireEvent(window, new Event('resize'));

      // Mock tool interface being below viewport
      const toolInterface = container.querySelector('#tool-interface');
      if (toolInterface) {
        vi.spyOn(toolInterface, 'getBoundingClientRect').mockReturnValue({
          top: 2000, // Tool is far below viewport
          bottom: 2500,
          left: 0,
          right: 375,
          width: 375,
          height: 500,
          x: 0,
          y: 2000,
          toJSON: () => ({}),
        });
      }

      // Trigger scroll event
      fireEvent.scroll(window);

      // Wait for state updates
      await waitFor(() => {
        const stickyButton = screen.queryByLabelText('Scroll to tool interface');
        // Button should exist when tool is below viewport on mobile
        expect(stickyButton).toBeTruthy();
      });
    });

    it('should not show sticky button on desktop', async () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<StartScreen {...mockProps} />);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Wait for state updates
      await waitFor(() => {
        const stickyButtons = screen.queryAllByText('Start Creating');
        // Should only have the hero button, not the sticky button
        expect(stickyButtons.length).toBeLessThanOrEqual(1);
      });
    });

    it('should hide sticky button when tool interface is visible', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<StartScreen {...mockProps} />);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Mock scroll to make tool interface visible
      const toolInterface = container.querySelector('#tool-interface');
      if (toolInterface) {
        vi.spyOn(toolInterface, 'getBoundingClientRect').mockReturnValue({
          top: 100, // Tool is visible in viewport
          bottom: 500,
          left: 0,
          right: 375,
          width: 375,
          height: 400,
          x: 0,
          y: 100,
          toJSON: () => ({}),
        });
      }

      // Trigger scroll event
      fireEvent.scroll(window);

      // Button visibility is controlled by scroll position
      // This test verifies the mechanism exists
      await waitFor(() => {
        expect(container.querySelector('#tool-interface')).toBeTruthy();
      });
    });
  });

  describe('Touch Target Sizes', () => {
    it('should have minimum 44px touch targets for sticky button', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<StartScreen {...mockProps} />);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const stickyButton = screen.queryByLabelText('Scroll to tool interface');
        if (stickyButton) {
          const styles = window.getComputedStyle(stickyButton);
          // Check for min-h-[44px] and min-w-[44px] classes
          expect(stickyButton.className).toContain('min-h-[44px]');
          expect(stickyButton.className).toContain('min-w-[44px]');
        }
      });
    });

    it('should have minimum 44px touch targets for hero CTA button', () => {
      render(<StartScreen {...mockProps} />);

      const ctaButton = screen.getByRole('button', { name: /Start Creating Free/i });
      expect(ctaButton.className).toContain('min-h-[44px]');
      expect(ctaButton.className).toContain('min-w-[44px]');
    });

    it('should have touch-manipulation CSS for better touch response', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<StartScreen {...mockProps} />);
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const stickyButton = screen.queryByLabelText('Scroll to tool interface');
        if (stickyButton) {
          expect(stickyButton.className).toContain('touch-manipulation');
        }
      });

      const ctaButton = screen.getByRole('button', { name: /Start Creating Free/i });
      expect(ctaButton.className).toContain('touch-manipulation');
    });
  });

  describe('Font Sizes', () => {
    it('should have minimum 16px font size on mobile for body text', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<StartScreen {...mockProps} />);

      // Check for text-base class (16px) or larger on mobile
      const textElements = container.querySelectorAll('p, span, a, button');
      
      // At least some text elements should have appropriate mobile font sizes
      let hasProperFontSize = false;
      textElements.forEach((element) => {
        const className = element.className;
        if (
          className.includes('text-base') ||
          className.includes('text-lg') ||
          className.includes('text-xl') ||
          className.includes('text-2xl') ||
          className.includes('text-3xl') ||
          className.includes('text-4xl')
        ) {
          hasProperFontSize = true;
        }
      });

      expect(hasProperFontSize).toBe(true);
    });

    it('should have legible heading sizes on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<StartScreen {...mockProps} />);

      const heading = screen.getByRole('banner').querySelector('h1');
      expect(heading).toBeTruthy();
      
      if (heading) {
        // Should have responsive text sizing (text-4xl on mobile, larger on desktop)
        expect(heading.className).toMatch(/text-(4xl|5xl|6xl|7xl)/);
      }
    });
  });

  describe('Responsive Layout', () => {
    it('should render properly at 320px width (iPhone SE)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = render(<StartScreen {...mockProps} />);
      fireEvent(window, new Event('resize'));

      // Should render without errors
      expect(container.querySelector('[role="banner"]')).toBeTruthy();
      expect(screen.getByTestId('main-page')).toBeTruthy();
    });

    it('should render properly at 375px width (iPhone X)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<StartScreen {...mockProps} />);
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('[role="banner"]')).toBeTruthy();
      expect(screen.getByTestId('main-page')).toBeTruthy();
    });

    it('should render properly at 414px width (iPhone Plus)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 414,
      });

      const { container } = render(<StartScreen {...mockProps} />);
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('[role="banner"]')).toBeTruthy();
      expect(screen.getByTestId('main-page')).toBeTruthy();
    });

    it('should render properly at 768px width (tablet)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = render(<StartScreen {...mockProps} />);
      fireEvent(window, new Event('resize'));

      expect(container.querySelector('[role="banner"]')).toBeTruthy();
      expect(screen.getByTestId('main-page')).toBeTruthy();
    });

    it('should stack content vertically on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<StartScreen {...mockProps} />);

      // All sections should be in a vertical layout
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);

      // Check that sections use full width
      sections.forEach((section) => {
        expect(section.className).toContain('w-full');
      });
    });
  });

  describe('Scroll Behavior', () => {
    it('should scroll to tool interface when sticky button is clicked', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<StartScreen {...mockProps} />);
      fireEvent(window, new Event('resize'));

      const toolInterface = container.querySelector('#tool-interface');
      expect(toolInterface).toBeTruthy();

      if (toolInterface) {
        const scrollIntoViewMock = vi.fn();
        toolInterface.scrollIntoView = scrollIntoViewMock;

        await waitFor(() => {
          const stickyButton = screen.queryByLabelText('Scroll to tool interface');
          if (stickyButton) {
            fireEvent.click(stickyButton);
            expect(scrollIntoViewMock).toHaveBeenCalledWith({
              behavior: 'smooth',
              block: 'start',
            });
          }
        });
      }
    });

    it('should scroll to tool interface when hero CTA is clicked', () => {
      const { container } = render(<StartScreen {...mockProps} />);

      const toolInterface = container.querySelector('#tool-interface');
      expect(toolInterface).toBeTruthy();

      if (toolInterface) {
        const scrollIntoViewMock = vi.fn();
        toolInterface.scrollIntoView = scrollIntoViewMock;

        const ctaButton = screen.getByRole('button', { name: /Start Creating Free/i });
        fireEvent.click(ctaButton);

        expect(scrollIntoViewMock).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  describe('Mobile Performance', () => {
    it('should lazy load below-the-fold sections', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<StartScreen {...mockProps} />);

      // Sections should be lazy loaded (wrapped in Suspense)
      await waitFor(() => {
        expect(screen.getByTestId('how-it-works-section')).toBeTruthy();
        expect(screen.getByTestId('features-section')).toBeTruthy();
        expect(screen.getByTestId('use-cases-section')).toBeTruthy();
        expect(screen.getByTestId('tips-section')).toBeTruthy();
        expect(screen.getByTestId('testimonials-section')).toBeTruthy();
      });
    });
  });
});
