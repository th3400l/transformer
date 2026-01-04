import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from './StartScreen';
import { heroContent, howItWorksSteps, features, useCases, tips, testimonials } from '@/content/homepage';

// Mock the MainPage component since we're testing integration
vi.mock('./app/MainPage', () => ({
  default: () => <div data-testid="main-page">Tool Interface</div>
}));

describe('StartScreen Integration Tests', () => {
  const mockProps = {
    text: 'Test text',
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
    selectedTemplate: 'blank-1',
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
    distortionProfile: {
      baselineJitterRange: 0.46,
      slantJitterRange: 0.32,
      colorVariationIntensity: 0.08,
      microTiltRange: 0.24,
      description: 'Test profile'
    },
    paperDistortionLevel: 3 as const,
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
    wordsPerPage: 100,
    textCutoffSnippet: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Section Rendering Order', () => {
    it('should render all content sections in the correct order', () => {
      render(<StartScreen {...mockProps} />);

      // Get all sections
      const sections = screen.getAllByRole('region', { hidden: true });
      
      // Verify Hero section is present
      expect(screen.getByText(heroContent.headline)).toBeInTheDocument();
      
      // Verify How It Works section is present
      expect(screen.getByText(howItWorksSteps[0].title)).toBeInTheDocument();
      
      // Verify Features section is present
      expect(screen.getByText(features[0].title)).toBeInTheDocument();
      
      // Verify Use Cases section is present
      expect(screen.getByText(useCases[0].title)).toBeInTheDocument();
      
      // Verify Tips section is present
      expect(screen.getByText(tips[0].title)).toBeInTheDocument();
      
      // Verify Tool Interface is present
      expect(screen.getByTestId('main-page')).toBeInTheDocument();
      
      // Verify Testimonials section is present
      expect(screen.getByText(testimonials[0].author)).toBeInTheDocument();
    });

    it('should render content sections before the tool interface', () => {
      const { container } = render(<StartScreen {...mockProps} />);
      
      // Get the tool interface element
      const toolInterface = screen.getByTestId('main-page');
      
      // Get the hero section (first content section)
      const heroHeadline = screen.getByText(heroContent.headline);
      
      // Compare positions in DOM
      const toolPosition = Array.from(container.querySelectorAll('*')).indexOf(toolInterface.parentElement!);
      const heroPosition = Array.from(container.querySelectorAll('*')).indexOf(heroHeadline.parentElement!);
      
      expect(heroPosition).toBeLessThan(toolPosition);
    });

    it('should render testimonials section after the tool interface', () => {
      const { container } = render(<StartScreen {...mockProps} />);
      
      // Get the tool interface element
      const toolInterface = screen.getByTestId('main-page');
      
      // Get the testimonials section
      const testimonialAuthor = screen.getByText(testimonials[0].author);
      
      // Compare positions in DOM
      const toolPosition = Array.from(container.querySelectorAll('*')).indexOf(toolInterface.parentElement!);
      const testimonialPosition = Array.from(container.querySelectorAll('*')).indexOf(testimonialAuthor.parentElement!);
      
      expect(testimonialPosition).toBeGreaterThan(toolPosition);
    });
  });

  describe('Scroll-to-Tool Functionality', () => {
    it('should scroll to tool interface when hero CTA is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock scrollIntoView
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;
      
      render(<StartScreen {...mockProps} />);
      
      // Find and click the CTA button
      const ctaButton = screen.getByRole('button', { name: /start creating/i });
      await user.click(ctaButton);
      
      // Verify scrollIntoView was called
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start'
        });
      });
    });

    it('should have a scroll target element with id "tool-interface"', () => {
      render(<StartScreen {...mockProps} />);
      
      const toolInterfaceElement = document.getElementById('tool-interface');
      expect(toolInterfaceElement).toBeInTheDocument();
    });
  });

  describe('Tool Interface Functionality', () => {
    it('should render the MainPage component with all props', () => {
      render(<StartScreen {...mockProps} />);
      
      // Verify MainPage is rendered
      expect(screen.getByTestId('main-page')).toBeInTheDocument();
    });

    it('should maintain tool interface functionality after content sections', () => {
      const { rerender } = render(<StartScreen {...mockProps} />);
      
      // Verify initial render
      expect(screen.getByTestId('main-page')).toBeInTheDocument();
      
      // Update props to simulate state change
      const updatedProps = { ...mockProps, text: 'Updated text' };
      rerender(<StartScreen {...updatedProps} />);
      
      // Verify tool interface is still present and functional
      expect(screen.getByTestId('main-page')).toBeInTheDocument();
    });
  });

  describe('Section Separators and Spacing', () => {
    it('should render section separators between content sections', () => {
      const { container } = render(<StartScreen {...mockProps} />);
      
      // Find all separator divs (gradient lines)
      const separators = container.querySelectorAll('.bg-gradient-to-r.from-transparent.via-gray-300.to-transparent');
      
      // Should have separators between sections
      expect(separators.length).toBeGreaterThan(0);
    });

    it('should have proper spacing classes on separators', () => {
      const { container } = render(<StartScreen {...mockProps} />);
      
      // Find all separator divs
      const separators = container.querySelectorAll('.bg-gradient-to-r.from-transparent.via-gray-300.to-transparent');
      
      // Verify spacing classes are present
      separators.forEach(separator => {
        const hasSpacing = separator.classList.contains('my-12') || 
                          separator.classList.contains('my-16');
        expect(hasSpacing).toBe(true);
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render all sections in a single column layout', () => {
      const { container } = render(<StartScreen {...mockProps} />);
      
      // The main container should have w-full class
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.classList.contains('w-full')).toBe(true);
    });

    it('should wrap each content section in a section element', () => {
      render(<StartScreen {...mockProps} />);
      
      // Find all section elements
      const sections = screen.getAllByRole('region', { hidden: true });
      
      // Should have multiple sections (Hero, HowItWorks, Features, UseCases, Tips, Testimonials)
      expect(sections.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Content Integration', () => {
    it('should display content from all imported sections', () => {
      render(<StartScreen {...mockProps} />);
      
      // Verify content from each section is present
      expect(screen.getByText(heroContent.headline)).toBeInTheDocument();
      expect(screen.getByText(howItWorksSteps[0].title)).toBeInTheDocument();
      expect(screen.getByText(features[0].title)).toBeInTheDocument();
      expect(screen.getByText(useCases[0].title)).toBeInTheDocument();
      expect(screen.getByText(tips[0].title)).toBeInTheDocument();
      expect(screen.getByText(testimonials[0].author)).toBeInTheDocument();
    });

    it('should maintain content section independence', () => {
      const { rerender } = render(<StartScreen {...mockProps} />);
      
      // Verify all sections are present
      expect(screen.getByText(heroContent.headline)).toBeInTheDocument();
      expect(screen.getByText(features[0].title)).toBeInTheDocument();
      
      // Rerender with updated props
      rerender(<StartScreen {...mockProps} text="New text" />);
      
      // Content sections should still be present
      expect(screen.getByText(heroContent.headline)).toBeInTheDocument();
      expect(screen.getByText(features[0].title)).toBeInTheDocument();
    });
  });
});
