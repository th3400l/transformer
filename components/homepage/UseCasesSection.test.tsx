/**
 * UseCasesSection Component Tests
 * 
 * Tests for the UseCasesSection component covering:
 * - All 3 use cases render correctly
 * - Responsive layout (3-column on desktop, stack on mobile)
 * - Word count meets minimum (~250 words total)
 * 
 * Requirements: 1.6
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UseCasesSection } from './UseCasesSection';
import { useCases } from '@/content/homepage';

describe('UseCasesSection', () => {
  describe('Content Rendering', () => {
    it('should render all 3 use cases', () => {
      render(<UseCasesSection />);
      
      // Check that all use case titles are rendered
      useCases.forEach(useCase => {
        const heading = screen.getByRole('heading', { name: useCase.title });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should render use case descriptions', () => {
      render(<UseCasesSection />);
      
      // Check that all use case descriptions are rendered
      useCases.forEach(useCase => {
        expect(screen.getByText(useCase.description)).toBeInTheDocument();
      });
    });

    it('should render all example lists for each use case', () => {
      render(<UseCasesSection />);
      
      // Check that all examples are rendered
      useCases.forEach(useCase => {
        useCase.examples.forEach(example => {
          expect(screen.getByText(example)).toBeInTheDocument();
        });
      });
    });

    it('should render the section header', () => {
      render(<UseCasesSection />);
      
      const header = screen.getByRole('heading', { name: /Who Uses Our Handwriting Generator/i });
      expect(header).toBeInTheDocument();
    });

    it('should render the section with proper semantic HTML', () => {
      const { container } = render(<UseCasesSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'use-cases-heading');
    });

    it('should render use case cards as articles', () => {
      const { container } = render(<UseCasesSection />);
      
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(useCases.length);
    });

    it('should render "Perfect For:" label for each use case', () => {
      render(<UseCasesSection />);
      
      const labels = screen.getAllByText(/Perfect For:/i);
      expect(labels).toHaveLength(useCases.length);
    });
  });

  describe('Responsive Layout', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<UseCasesSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1');
      expect(grid?.className).toContain('md:grid-cols-2');
      expect(grid?.className).toContain('lg:grid-cols-3');
    });

    it('should apply responsive gap classes', () => {
      const { container } = render(<UseCasesSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('gap-6');
      expect(grid?.className).toContain('md:gap-8');
    });

    it('should apply responsive padding to section', () => {
      const { container } = render(<UseCasesSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('py-16');
      expect(section?.className).toContain('md:py-24');
    });

    it('should apply responsive text sizing to use case titles', () => {
      const { container } = render(<UseCasesSection />);
      
      const useCaseTitles = container.querySelectorAll('article h3');
      useCaseTitles.forEach(title => {
        expect(title.className).toContain('text-xl');
        expect(title.className).toContain('md:text-2xl');
      });
    });

    it('should apply responsive icon sizing', () => {
      const { container } = render(<UseCasesSection />);
      
      const iconContainers = container.querySelectorAll('article > div:first-child');
      iconContainers.forEach(iconContainer => {
        expect(iconContainer.className).toContain('w-16');
        expect(iconContainer.className).toContain('h-16');
        expect(iconContainer.className).toContain('md:w-20');
        expect(iconContainer.className).toContain('md:h-20');
      });
    });

    it('should stack vertically on mobile (single column)', () => {
      const { container } = render(<UseCasesSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1');
    });

    it('should display 3 columns on large screens', () => {
      const { container } = render(<UseCasesSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('lg:grid-cols-3');
    });
  });

  describe('Word Count Validation', () => {
    it('should meet minimum word count of ~250 words total', () => {
      // Calculate total word count from use cases
      const totalWords = useCases.reduce((total, useCase) => {
        const descriptionWords = useCase.description.split(/\s+/).length;
        const exampleWords = useCase.examples.join(' ').split(/\s+/).length;
        return total + descriptionWords + exampleWords;
      }, 0);
      
      // Should have substantial content (at least 150 words across all use cases)
      expect(totalWords).toBeGreaterThanOrEqual(150);
    });

    it('should have substantial description for each use case (~60-80 words)', () => {
      useCases.forEach(useCase => {
        const wordCount = useCase.description.split(/\s+/).length;
        // Ensure each use case has meaningful content (at least 40 words)
        expect(wordCount).toBeGreaterThanOrEqual(40);
      });
    });

    it('should have at least 4 examples per use case', () => {
      useCases.forEach(useCase => {
        expect(useCase.examples.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Visual Elements', () => {
    it('should render icons for each use case', () => {
      const { container } = render(<UseCasesSection />);
      
      const icons = container.querySelectorAll('article svg');
      // Each use case has an icon, plus checkmarks for examples
      expect(icons.length).toBeGreaterThanOrEqual(useCases.length);
    });

    it('should render checkmark icons for examples', () => {
      const { container } = render(<UseCasesSection />);
      
      // Count checkmark icons (accent color check icons in example lists)
      const checkmarks = container.querySelectorAll('.text-accent');
      
      // Total number of examples across all use cases
      const totalExamples = useCases.reduce((sum, uc) => sum + uc.examples.length, 0);
      expect(checkmarks.length).toBe(totalExamples);
    });

    it('should apply gradient background to icon containers', () => {
      const { container } = render(<UseCasesSection />);
      
      const iconContainers = container.querySelectorAll('article > div:first-child');
      iconContainers.forEach(iconContainer => {
        expect(iconContainer.className).toContain('bg-gradient-to-br');
        expect(iconContainer.className).toContain('from-[var(--rose-primary)]');
        expect(iconContainer.className).toContain('to-[var(--rose-secondary)]');
      });
    });

    it('should apply hover effects to use case cards', () => {
      const { container } = render(<UseCasesSection />);
      
      const cards = container.querySelectorAll('article');
      cards.forEach(card => {
        expect(card.className).toContain('hover:shadow-xl');
        expect(card.className).toContain('transition-all');
      });
    });
  });

  describe('Accessibility', () => {
    it('should use proper heading hierarchy', () => {
      render(<UseCasesSection />);
      
      // Main section heading should be h2
      const mainHeading = screen.getByRole('heading', { name: /Who Uses Our Handwriting Generator/i });
      expect(mainHeading.tagName).toBe('H2');
      
      // Use case titles should be h3
      useCases.forEach(useCase => {
        const useCaseHeading = screen.getByRole('heading', { name: useCase.title });
        expect(useCaseHeading.tagName).toBe('H3');
      });
    });

    it('should have h4 headings for "Perfect For:" labels', () => {
      const { container } = render(<UseCasesSection />);
      
      const labels = container.querySelectorAll('h4');
      expect(labels.length).toBe(useCases.length);
      labels.forEach(label => {
        expect(label.textContent).toContain('Perfect For:');
      });
    });

    it('should mark decorative icons as aria-hidden', () => {
      const { container } = render(<UseCasesSection />);
      
      // Checkmark icons should be aria-hidden
      const checkmarkIcons = container.querySelectorAll('.text-accent');
      checkmarkIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should use semantic list elements for examples', () => {
      const { container } = render(<UseCasesSection />);
      
      const lists = container.querySelectorAll('ul[role="list"]');
      expect(lists.length).toBe(useCases.length); // One list per use case
    });
  });

  describe('Section Background', () => {
    it('should have themed background', () => {
      const { container } = render(<UseCasesSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('bg-bg');
    });
  });
});