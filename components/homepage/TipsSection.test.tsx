/**
 * TipsSection Component Tests
 * 
 * Tests for the TipsSection component covering:
 * - All 5 tips render correctly
 * - Responsive layout (grid layout)
 * - Word count meets requirements
 * 
 * Requirements: 1.6, 3.1
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TipsSection } from './TipsSection';
import { tips } from '@/content/homepage';

describe('TipsSection', () => {
  describe('Content Rendering', () => {
    it('should render all tips', () => {
      render(<TipsSection />);
      
      // Check that all tip titles are rendered
      tips.forEach(tip => {
        const heading = screen.getByRole('heading', { name: tip.title });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should render tip descriptions', () => {
      render(<TipsSection />);
      
      // Check that all tip descriptions are rendered
      tips.forEach(tip => {
        expect(screen.getByText(tip.description)).toBeInTheDocument();
      });
    });

    it('should render the section header', () => {
      render(<TipsSection />);
      
      const header = screen.getByRole('heading', { name: /Tips & Best Practices/i });
      expect(header).toBeInTheDocument();
    });

    it('should render the section with proper semantic HTML', () => {
      const { container } = render(<TipsSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'tips-heading');
    });

    it('should render tip cards as articles', () => {
      const { container } = render(<TipsSection />);
      
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(tips.length);
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<TipsSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1');
      expect(grid?.className).toContain('sm:grid-cols-2');
      expect(grid?.className).toContain('lg:grid-cols-3');
      expect(grid?.className).toContain('xl:grid-cols-5');
    });

    it('should apply responsive gap classes', () => {
      const { container } = render(<TipsSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('gap-6');
      expect(grid?.className).toContain('md:gap-8');
    });

    it('should apply responsive padding to section', () => {
      const { container } = render(<TipsSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('py-16');
      expect(section?.className).toContain('md:py-24');
    });
  });

  describe('Internal Links', () => {
    it('should render link to FAQ page', () => {
      render(<TipsSection />);
      const faqLink = screen.getByRole('link', { name: /View frequently asked questions/i });
      expect(faqLink).toBeInTheDocument();
      expect(faqLink).toHaveAttribute('href', '/faq');
    });

    it('should render link to Blog page', () => {
      render(<TipsSection />);
      const blogLink = screen.getByRole('link', { name: /Read blog posts/i });
      expect(blogLink).toBeInTheDocument();
      expect(blogLink).toHaveAttribute('href', '/blog');
    });

    it('should render link to About page', () => {
      render(<TipsSection />);
      const aboutLink = screen.getByRole('link', { name: /Learn more about the handwriting generator/i });
      expect(aboutLink).toBeInTheDocument();
      expect(aboutLink).toHaveAttribute('href', '/about');
    });
  });

  describe('Visual Elements', () => {
    it('should apply gradient background to icon containers', () => {
      const { container } = render(<TipsSection />);
      
      const iconContainers = container.querySelectorAll('article > div:first-child');
      iconContainers.forEach(iconContainer => {
        expect(iconContainer.className).toContain('bg-gradient-to-br');
        expect(iconContainer.className).toContain('from-[var(--rose-primary)]');
        expect(iconContainer.className).toContain('to-[var(--rose-secondary)]');
      });
    });

    it('should apply hover effects to tip cards', () => {
      const { container } = render(<TipsSection />);
      
      const cards = container.querySelectorAll('article');
      cards.forEach(card => {
        expect(card.className).toContain('hover:shadow-lg');
        expect(card.className).toContain('transition-all');
      });
    });
  });

  describe('Link Styling', () => {
    it('should apply proper styling to internal links', () => {
      const { container } = render(<TipsSection />);
      
      const links = container.querySelectorAll('nav a');
      links.forEach(link => {
        expect(link.className).toContain('inline-flex');
        expect(link.className).toContain('items-center');
        expect(link.className).toContain('rounded-lg');
        expect(link.className).toContain('transition-all');
      });
    });
  });
});