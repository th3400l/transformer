/**
 * Accessibility Tests for Homepage Components
 * 
 * Tests semantic HTML structure, keyboard navigation, ARIA labels, and color contrast.
 * Requirements: 2.1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturesSection } from './FeaturesSection';
import { UseCasesSection } from './UseCasesSection';
import { TipsSection } from './TipsSection';
import { TestimonialsSection } from './TestimonialsSection';

describe('Homepage Accessibility Tests', () => {
  describe('Semantic HTML Structure', () => {
    it('HeroSection uses semantic HTML with proper heading hierarchy', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      // Check for semantic section element
      const section = container.querySelector('section');
      expect(section).toBeTruthy();
      expect(section?.getAttribute('role')).toBe('banner');
      
      // Check for h1 heading
      const h1 = container.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.id).toBe('hero-heading');
      
      // Check for button element (not div)
      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.getAttribute('type')).toBe('button');
    });

    it('HowItWorksSection uses semantic HTML with ordered list', () => {
      const { container } = render(<HowItWorksSection />);
      
      // Check for semantic section element
      const section = container.querySelector('section');
      expect(section).toBeTruthy();
      
      // Check for header element
      const header = container.querySelector('header');
      expect(header).toBeTruthy();
      
      // Check for h2 heading with id
      const h2 = container.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2?.id).toBe('how-it-works-heading');
      
      // Check for ordered list (ol) for steps
      const ol = container.querySelector('ol');
      expect(ol).toBeTruthy();
      expect(ol?.getAttribute('role')).toBe('list');
      
      // Check for list items
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('FeaturesSection uses semantic HTML with articles', () => {
      const { container } = render(<FeaturesSection />);
      
      // Check for semantic section element
      const section = container.querySelector('section');
      expect(section).toBeTruthy();
      
      // Check for header element
      const header = container.querySelector('header');
      expect(header).toBeTruthy();
      
      // Check for h2 heading with id
      const h2 = container.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2?.id).toBe('features-heading');
      
      // Check for article elements (feature cards)
      const articles = container.querySelectorAll('article');
      expect(articles.length).toBeGreaterThan(0);
      
      // Check for h3 headings in articles
      const h3s = container.querySelectorAll('article h3');
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('UseCasesSection uses semantic HTML with articles', () => {
      const { container } = render(<UseCasesSection />);
      
      // Check for semantic section element
      const section = container.querySelector('section');
      expect(section).toBeTruthy();
      
      // Check for header element
      const header = container.querySelector('header');
      expect(header).toBeTruthy();
      
      // Check for h2 heading with id
      const h2 = container.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2?.id).toBe('use-cases-heading');
      
      // Check for article elements (use case cards)
      const articles = container.querySelectorAll('article');
      expect(articles.length).toBeGreaterThan(0);
      
      // Check for proper heading hierarchy (h2 -> h3 -> h4)
      const h3s = container.querySelectorAll('article h3');
      const h4s = container.querySelectorAll('article h4');
      expect(h3s.length).toBeGreaterThan(0);
      expect(h4s.length).toBeGreaterThan(0);
    });

    it('TipsSection uses semantic HTML with nav for links', () => {
      const { container } = render(<TipsSection />);
      
      // Check for semantic section element
      const section = container.querySelector('section');
      expect(section).toBeTruthy();
      
      // Check for header element
      const header = container.querySelector('header');
      expect(header).toBeTruthy();
      
      // Check for h2 heading with id
      const h2 = container.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2?.id).toBe('tips-heading');
      
      // Check for nav element for internal links
      const nav = container.querySelector('nav');
      expect(nav).toBeTruthy();
      expect(nav?.getAttribute('aria-label')).toBe('Related pages');
      
      // Check for article elements (tip cards)
      const articles = container.querySelectorAll('article');
      expect(articles.length).toBeGreaterThan(0);
    });

    it('TestimonialsSection uses semantic HTML with blockquotes', () => {
      const { container } = render(<TestimonialsSection />);
      
      // Check for semantic section element
      const section = container.querySelector('section');
      expect(section).toBeTruthy();
      
      // Check for header element
      const header = container.querySelector('header');
      expect(header).toBeTruthy();
      
      // Check for h2 heading with id
      const h2 = container.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2?.id).toBe('testimonials-heading');
      
      // Check for article elements (testimonial cards)
      const articles = container.querySelectorAll('article');
      expect(articles.length).toBeGreaterThan(0);
      
      // Check for blockquote elements
      const blockquotes = container.querySelectorAll('blockquote');
      expect(blockquotes.length).toBeGreaterThan(0);
      
      // Check for footer elements in articles
      const footers = container.querySelectorAll('article footer');
      expect(footers.length).toBeGreaterThan(0);
    });
  });

  describe('ARIA Labels and Attributes', () => {
    it('HeroSection has proper ARIA labels', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      // Check section has aria-labelledby
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('hero-heading');
      
      // Check button has descriptive aria-label
      const button = container.querySelector('button');
      expect(button?.getAttribute('aria-label')).toContain('Scroll to handwriting generator tool');
      
      // Check decorative elements have aria-hidden
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('HowItWorksSection has proper ARIA labels', () => {
      const { container } = render(<HowItWorksSection />);
      
      // Check section has aria-labelledby
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('how-it-works-heading');
      
      // Check list has aria-label
      const ol = container.querySelector('ol');
      expect(ol?.getAttribute('aria-label')).toContain('Steps to use');
      
      // Check decorative icons have aria-hidden
      const decorativeIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });

    it('FeaturesSection has proper ARIA labels', () => {
      const { container } = render(<FeaturesSection />);
      
      // Check section has aria-labelledby
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('features-heading');
      
      // Check grid has role and aria-label
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeTruthy();
      expect(grid?.getAttribute('aria-label')).toContain('List of features');
      
      // Check articles have role="listitem"
      const articles = container.querySelectorAll('article[role="listitem"]');
      expect(articles.length).toBeGreaterThan(0);
    });

    it('UseCasesSection has proper ARIA labels', () => {
      const { container } = render(<UseCasesSection />);
      
      // Check section has aria-labelledby
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('use-cases-heading');
      
      // Check grid has role and aria-label
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeTruthy();
      expect(grid?.getAttribute('aria-label')).toContain('List of use cases');
    });

    it('TipsSection has proper ARIA labels', () => {
      const { container } = render(<TipsSection />);
      
      // Check section has aria-labelledby
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('tips-heading');
      
      // Check grid has role and aria-label
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeTruthy();
      expect(grid?.getAttribute('aria-label')).toContain('List of tips');
      
      // Check nav has aria-label
      const nav = container.querySelector('nav');
      expect(nav?.getAttribute('aria-label')).toBe('Related pages');
      
      // Check links have descriptive aria-labels
      const links = container.querySelectorAll('nav a');
      links.forEach(link => {
        expect(link.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('TestimonialsSection has proper ARIA labels', () => {
      const { container } = render(<TestimonialsSection />);
      
      // Check section has aria-labelledby
      const section = container.querySelector('section');
      expect(section?.getAttribute('aria-labelledby')).toBe('testimonials-heading');
      
      // Check grid has role and aria-label
      const grid = container.querySelector('[role="list"]');
      expect(grid).toBeTruthy();
      expect(grid?.getAttribute('aria-label')).toContain('User testimonials');
      
      // Check avatar containers have proper role and aria-label
      const avatars = container.querySelectorAll('[role="img"]');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('HeroSection CTA button is keyboard accessible', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      
      // Check button can receive focus
      expect(button?.tabIndex).not.toBe(-1);
      
      // Check button has focus styles
      const classes = button?.className || '';
      expect(classes).toContain('focus:');
    });

    it('TipsSection links are keyboard accessible', () => {
      const { container } = render(<TipsSection />);
      
      const links = container.querySelectorAll('nav a');
      expect(links.length).toBeGreaterThan(0);
      
      links.forEach(link => {
        // Check link can receive focus
        expect(link.tabIndex).not.toBe(-1);
        
        // Check link has focus styles
        const classes = link.className;
        expect(classes).toContain('focus:');
      });
    });

    it('All interactive elements have visible focus indicators', () => {
      const mockScrollToTool = vi.fn();
      const { container: heroContainer } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      const { container: tipsContainer } = render(<TipsSection />);
      
      // Check hero button
      const button = heroContainer.querySelector('button');
      expect(button?.className).toContain('focus:ring');
      
      // Check tips links
      const links = tipsContainer.querySelectorAll('nav a');
      links.forEach(link => {
        expect(link.className).toContain('focus:ring');
      });
    });
  });

  describe('Color Contrast', () => {
    it('HeroSection has sufficient color contrast for text', () => {
      const mockScrollToTool = vi.fn();
      const { container } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      
      // Check heading has dark text on light background
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('text-gray-900');
      expect(h1?.className).toContain('dark:text-white');
      
      // Check subheadline has sufficient contrast
      const p = container.querySelector('p');
      expect(p?.className).toContain('text-gray-700');
      expect(p?.className).toContain('dark:text-gray-300');
    });

    it('All sections use accessible color combinations', () => {
      const { container: howItWorksContainer } = render(<HowItWorksSection />);
      const { container: featuresContainer } = render(<FeaturesSection />);
      const { container: useCasesContainer } = render(<UseCasesSection />);
      const { container: tipsContainer } = render(<TipsSection />);
      const { container: testimonialsContainer } = render(<TestimonialsSection />);
      
      // Check all sections have proper text colors
      const allContainers = [
        howItWorksContainer,
        featuresContainer,
        useCasesContainer,
        tipsContainer,
        testimonialsContainer
      ];
      
      allContainers.forEach(container => {
        // Check headings have high contrast
        const headings = container.querySelectorAll('h2, h3, h4');
        headings.forEach(heading => {
          const classes = heading.className;
          // Headings should have dark text colors for contrast
          expect(
            classes.includes('text-gray-900') || 
            classes.includes('text-white') ||
            classes.includes('dark:text-white') ||
            classes.includes('text-gray-700')
          ).toBe(true);
        });
        
        // Check body text has sufficient contrast
        const paragraphs = container.querySelectorAll('p');
        paragraphs.forEach(p => {
          const classes = p.className;
          expect(
            classes.includes('text-gray-600') || 
            classes.includes('text-gray-700') ||
            classes.includes('text-gray-300') ||
            classes.includes('text-gray-400')
          ).toBe(true);
        });
      });
    });

    it('Interactive elements have sufficient contrast in all states', () => {
      const mockScrollToTool = vi.fn();
      const { container: heroContainer } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      const { container: tipsContainer } = render(<TipsSection />);
      
      // Check button has high contrast
      const button = heroContainer.querySelector('button');
      expect(button?.className).toContain('text-white');
      expect(button?.className).toContain('bg-gradient-to-r');
      
      // Check links have high contrast
      const links = tipsContainer.querySelectorAll('nav a');
      links.forEach(link => {
        expect(link.className).toContain('text-white');
        expect(link.className).toMatch(/bg-(blue|purple|gray)-600/);
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('Decorative images have aria-hidden', () => {
      const { container: featuresContainer } = render(<FeaturesSection />);
      const { container: useCasesContainer } = render(<UseCasesSection />);
      const { container: tipsContainer } = render(<TipsSection />);
      
      // Check decorative icons are hidden from screen readers
      const allContainers = [featuresContainer, useCasesContainer, tipsContainer];
      
      allContainers.forEach(container => {
        const decorativeIcons = container.querySelectorAll('svg[aria-hidden="true"]');
        expect(decorativeIcons.length).toBeGreaterThan(0);
      });
    });

    it('Images have proper alt text or aria-labels', () => {
      const { container } = render(<TestimonialsSection />);
      
      // Check avatar containers have aria-labels
      const avatarContainers = container.querySelectorAll('[role="img"]');
      avatarContainers.forEach(avatar => {
        expect(avatar.getAttribute('aria-label')).toBeTruthy();
      });
      
      // Check actual images have empty alt (since parent has aria-label)
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        // Images should have alt attribute (even if empty)
        expect(img.hasAttribute('alt')).toBe(true);
      });
    });

    it('Lists are properly marked up for screen readers', () => {
      const { container: howItWorksContainer } = render(<HowItWorksSection />);
      const { container: featuresContainer } = render(<FeaturesSection />);
      
      // Check ordered list has role="list"
      const ol = howItWorksContainer.querySelector('ol');
      expect(ol?.getAttribute('role')).toBe('list');
      
      // Check unordered lists have role="list"
      const uls = featuresContainer.querySelectorAll('ul[role="list"]');
      expect(uls.length).toBeGreaterThan(0);
    });

    it('Navigation landmarks are properly labeled', () => {
      const { container } = render(<TipsSection />);
      
      // Check nav element has aria-label
      const nav = container.querySelector('nav');
      expect(nav?.getAttribute('aria-label')).toBe('Related pages');
    });
  });

  describe('Responsive Text Sizing', () => {
    it('All text meets minimum size requirements', () => {
      const mockScrollToTool = vi.fn();
      const { container: heroContainer } = render(<HeroSection onScrollToTool={mockScrollToTool} />);
      const { container: featuresContainer } = render(<FeaturesSection />);
      
      // Check body text has minimum 16px (text-base or larger)
      const paragraphs = [
        ...heroContainer.querySelectorAll('p'),
        ...featuresContainer.querySelectorAll('p')
      ];
      
      paragraphs.forEach(p => {
        const classes = p.className;
        // Should have text-base (16px) or larger (text-lg, text-xl, etc.)
        expect(
          classes.includes('text-base') ||
          classes.includes('text-lg') ||
          classes.includes('text-xl') ||
          classes.includes('text-2xl')
        ).toBe(true);
      });
    });

    it('Headings use responsive sizing', () => {
      const { container } = render(<HowItWorksSection />);
      
      // Check h2 has responsive sizing
      const h2 = container.querySelector('h2');
      const classes = h2?.className || '';
      
      // Should have multiple size classes for different breakpoints
      expect(classes).toContain('text-3xl'); // Mobile
      expect(classes).toContain('md:text-5xl'); // Desktop
    });
  });
});
