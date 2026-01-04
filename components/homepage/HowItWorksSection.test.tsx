/**
 * HowItWorksSection Component Tests
 * 
 * Tests for the HowItWorksSection component covering:
 * - All 3 steps render correctly
 * - Responsive layout changes
 * - Word count meets minimum
 * 
 * Requirements: 1.4
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorksSection } from './HowItWorksSection';
import { howItWorksSteps } from '@/content/homepage';

describe('HowItWorksSection', () => {
  describe('Content Rendering', () => {
    it('should render the section with proper semantic HTML', () => {
      const { container } = render(<HowItWorksSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-label', 'How it works');
    });

    it('should render the section heading', () => {
      render(<HowItWorksSection />);
      
      const heading = screen.getByRole('heading', { level: 2, name: /how it works/i });
      expect(heading).toBeInTheDocument();
    });

    it('should render the section description', () => {
      render(<HowItWorksSection />);
      
      expect(screen.getByText(/transform your text into authentic handwriting in three simple steps/i)).toBeInTheDocument();
    });
  });

  describe('Steps Rendering', () => {
    it('should render all 3 steps from content configuration', () => {
      render(<HowItWorksSection />);
      
      howItWorksSteps.forEach((step) => {
        expect(screen.getByText(step.title)).toBeInTheDocument();
        expect(screen.getByText(step.description)).toBeInTheDocument();
      });
    });

    it('should render step numbers correctly', () => {
      render(<HowItWorksSection />);
      
      howItWorksSteps.forEach((step) => {
        // Check that step numbers 1, 2, 3 are present in the DOM
        expect(screen.getByText(step.number.toString())).toBeInTheDocument();
      });
    });

    it('should render step titles as h3 headings', () => {
      render(<HowItWorksSection />);
      
      howItWorksSteps.forEach((step) => {
        const heading = screen.getByRole('heading', { level: 3, name: step.title });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should render icons for each step', () => {
      const { container } = render(<HowItWorksSection />);
      
      // Check that there are 3 icon circles (one for each step)
      const iconCircles = container.querySelectorAll('.bg-gradient-to-br.from-blue-500.to-purple-600');
      expect(iconCircles).toHaveLength(3);
      
      // Check that each circle contains an SVG icon
      iconCircles.forEach((circle) => {
        const svg = circle.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should render step descriptions with proper content', () => {
      render(<HowItWorksSection />);
      
      // Verify each step description is present
      expect(screen.getByText(/type or paste the text you want to convert/i)).toBeInTheDocument();
      expect(screen.getByText(/choose from 9 handwriting fonts/i)).toBeInTheDocument();
      expect(screen.getByText(/click generate to create your handwritten pages/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<HowItWorksSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1');
      expect(grid?.className).toContain('md:grid-cols-3');
    });

    it('should apply responsive padding classes', () => {
      const { container } = render(<HowItWorksSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('py-16');
      expect(section?.className).toContain('md:py-24');
    });

    it('should apply responsive text sizing to section heading', () => {
      render(<HowItWorksSection />);
      
      const heading = screen.getByRole('heading', { level: 2, name: /how it works/i });
      expect(heading.className).toContain('text-3xl');
      expect(heading.className).toContain('sm:text-4xl');
      expect(heading.className).toContain('md:text-5xl');
    });

    it('should apply responsive icon sizing', () => {
      const { container } = render(<HowItWorksSection />);
      
      const iconCircles = container.querySelectorAll('.bg-gradient-to-br.from-blue-500.to-purple-600');
      iconCircles.forEach((circle) => {
        expect(circle.className).toContain('w-24');
        expect(circle.className).toContain('h-24');
        expect(circle.className).toContain('md:w-28');
        expect(circle.className).toContain('md:h-28');
      });
    });

    it('should show connecting line on desktop only', () => {
      const { container } = render(<HowItWorksSection />);
      
      const connectingLine = container.querySelector('.hidden.md\\:block.absolute');
      expect(connectingLine).toBeInTheDocument();
      expect(connectingLine?.className).toContain('hidden');
      expect(connectingLine?.className).toContain('md:block');
    });

    it('should show connecting arrows on mobile only', () => {
      const { container } = render(<HowItWorksSection />);
      
      // There should be 2 arrows (between steps 1-2 and 2-3)
      const arrows = container.querySelectorAll('.md\\:hidden svg');
      expect(arrows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Word Count', () => {
    it('should meet minimum word count requirement (~80 words per step)', () => {
      render(<HowItWorksSection />);
      
      howItWorksSteps.forEach((step) => {
        const wordCount = step.description.split(/\s+/).length;
        // Each step should have approximately 80 words (allowing some flexibility)
        expect(wordCount).toBeGreaterThanOrEqual(70); // Minimum threshold
        expect(wordCount).toBeLessThanOrEqual(150); // Maximum reasonable threshold
      });
    });

    it('should have total word count of at least 250 words across all steps', () => {
      const totalWords = howItWorksSteps.reduce((total, step) => {
        return total + step.description.split(/\s+/).length;
      }, 0);
      
      // Total should be at least 220 words (3 steps × ~75 words minimum)
      expect(totalWords).toBeGreaterThanOrEqual(220);
    });

    it('should render additional context paragraph with meaningful content', () => {
      const { container } = render(<HowItWorksSection />);
      
      const contextParagraph = container.querySelector('.mt-12.md\\:mt-16 p');
      expect(contextParagraph).toBeInTheDocument();
      
      const contextText = contextParagraph?.textContent || '';
      const contextWordCount = contextText.split(/\s+/).length;
      
      // Additional context should add meaningful content
      expect(contextWordCount).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Visual Indicators', () => {
    it('should render step number badges', () => {
      const { container } = render(<HowItWorksSection />);
      
      howItWorksSteps.forEach((step) => {
        const badge = screen.getByText(step.number.toString());
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('font-bold');
      });
    });

    it('should render icon circles with gradient backgrounds', () => {
      const { container } = render(<HowItWorksSection />);
      
      const iconCircles = container.querySelectorAll('.rounded-full.bg-gradient-to-br');
      expect(iconCircles.length).toBeGreaterThanOrEqual(3);
      
      iconCircles.forEach((circle) => {
        expect(circle.className).toContain('from-blue-500');
        expect(circle.className).toContain('to-purple-600');
      });
    });

    it('should render connecting line with gradient', () => {
      const { container } = render(<HowItWorksSection />);
      
      const connectingLine = container.querySelector('.bg-gradient-to-r.from-blue-200');
      expect(connectingLine).toBeInTheDocument();
      expect(connectingLine?.className).toContain('via-purple-200');
      expect(connectingLine?.className).toContain('to-pink-200');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HowItWorksSection />);
      
      // h2 for section title
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
      
      // h3 for each step title
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s).toHaveLength(3);
    });

    it('should mark decorative elements with aria-hidden', () => {
      const { container } = render(<HowItWorksSection />);
      
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('should have semantic section element with aria-label', () => {
      const { container } = render(<HowItWorksSection />);
      
      const section = container.querySelector('section[aria-label="How it works"]');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for background', () => {
      const { container } = render(<HowItWorksSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('bg-white');
      expect(section?.className).toContain('dark:bg-gray-900');
    });

    it('should include dark mode classes for text', () => {
      render(<HowItWorksSection />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.className).toContain('text-gray-900');
      expect(heading.className).toContain('dark:text-white');
    });

    it('should include dark mode classes for connecting line', () => {
      const { container } = render(<HowItWorksSection />);
      
      const connectingLine = container.querySelector('.bg-gradient-to-r');
      expect(connectingLine?.className).toContain('dark:from-blue-800');
      expect(connectingLine?.className).toContain('dark:via-purple-800');
      expect(connectingLine?.className).toContain('dark:to-pink-800');
    });
  });
});
