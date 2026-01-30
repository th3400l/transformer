/**
 * HeroSection Component Tests
 * 
 * Tests for the HeroSection component covering:
 * - Component renders with correct content
 * - CTA button triggers scroll
 * - Responsive behavior
 * 
 * Requirements: 1.1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from './HeroSection';
import { heroContent } from '@/content/homepage';

describe('HeroSection', () => {
  describe('Content Rendering', () => {
    it('should render the headline from content configuration', () => {
      const mockScrollToTool = vi.fn();
      render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline).toBeInTheDocument();
      expect(headline.textContent).toBe(heroContent.headline);
    });

    it('should render the subheadline from content configuration', () => {
      const mockScrollToTool = vi.fn();
      render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      expect(screen.getByText(heroContent.subheadline)).toBeInTheDocument();
    });

    it('should render the CTA button with correct text', () => {
      const mockScrollToTool = vi.fn();
      render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const ctaButton = screen.getByRole('button', { name: /Start Creating Free/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton.textContent).toContain(heroContent.cta);
    });

    it('should render the hero section with proper semantic HTML', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'hero-heading');
    });
  });

  describe('CTA Button Functionality', () => {
    it('should call onScrollToTool when CTA button is clicked', async () => {
      const mockScrollToTool = vi.fn();
      const user = userEvent.setup();
      
      render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const ctaButton = screen.getByRole('button', { name: /Start Creating Free/i });
      await user.click(ctaButton);
      
      expect(mockScrollToTool).toHaveBeenCalledTimes(1);
    });

    it('should have proper accessibility attributes on CTA button', () => {
      const mockScrollToTool = vi.fn();
      render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const ctaButton = screen.getByRole('button', { name: /Start Creating Free/i });
      expect(ctaButton).toHaveAttribute('aria-label', `${heroContent.cta} - Scroll to handwriting generator tool`);
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes for mobile and desktop', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('min-h-[50vh]');
      expect(section?.className).toContain('md:min-h-[60vh]');
    });

    it('should apply responsive text sizing classes', () => {
      const mockScrollToTool = vi.fn();
      render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline.className).toContain('text-4xl');
      expect(headline.className).toContain('sm:text-5xl');
      expect(headline.className).toContain('md:text-6xl');
      expect(headline.className).toContain('lg:text-7xl');
    });

    it('should apply responsive padding classes to content container', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const contentContainer = container.querySelector('.max-w-4xl');
      expect(contentContainer?.className).toContain('px-4');
      expect(contentContainer?.className).toContain('sm:px-6');
      expect(contentContainer?.className).toContain('lg:px-8');
    });
  });

  describe('Visual Elements', () => {
    it('should render background gradient', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
    });

    it('should render decorative pattern overlay', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      // Check for the decorative pattern div with opacity class
      const pattern = container.querySelector('.opacity-10');
      expect(pattern).toBeInTheDocument();
    });

    it('should render down arrow icon in CTA button', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const svg = container.querySelector('button svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('SEO Keywords', () => {
    it('should include SEO keywords in a screen reader only element', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
      expect(srOnly?.textContent).toContain(heroContent.keywords[0]);
    });
  });
});
