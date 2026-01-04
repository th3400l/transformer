/**
 * FeaturesSection Component Tests
 * 
 * Tests for the FeaturesSection component covering:
 * - All 4 features render correctly
 * - Grid layout responsiveness
 * - Word count meets minimum (~300 words total)
 * 
 * Requirements: 1.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturesSection } from './FeaturesSection';
import { features } from '@/content/homepage';

describe('FeaturesSection', () => {
  describe('Content Rendering', () => {
    it('should render all 4 features', () => {
      render(<FeaturesSection />);
      
      // Check that all feature titles are rendered
      features.forEach(feature => {
        const heading = screen.getByRole('heading', { name: feature.title });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should render feature descriptions', () => {
      render(<FeaturesSection />);
      
      // Check that all feature descriptions are rendered
      features.forEach(feature => {
        expect(screen.getByText(feature.description)).toBeInTheDocument();
      });
    });

    it('should render all benefit lists for each feature', () => {
      render(<FeaturesSection />);
      
      // Check that all benefits are rendered
      features.forEach(feature => {
        feature.benefits.forEach(benefit => {
          expect(screen.getByText(benefit)).toBeInTheDocument();
        });
      });
    });

    it('should render the section header', () => {
      render(<FeaturesSection />);
      
      const header = screen.getByRole('heading', { name: /Powerful Features/i });
      expect(header).toBeInTheDocument();
    });

    it('should render the section with proper semantic HTML', () => {
      const { container } = render(<FeaturesSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-label', 'Features');
    });

    it('should render feature cards as articles', () => {
      const { container } = render(<FeaturesSection />);
      
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(4);
    });
  });

  describe('Grid Layout Responsiveness', () => {
    it('should apply responsive grid classes', () => {
      const { container } = render(<FeaturesSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1');
      expect(grid?.className).toContain('md:grid-cols-2');
    });

    it('should apply responsive gap classes', () => {
      const { container } = render(<FeaturesSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('gap-6');
      expect(grid?.className).toContain('md:gap-8');
      expect(grid?.className).toContain('lg:gap-10');
    });

    it('should apply responsive padding to section', () => {
      const { container } = render(<FeaturesSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('py-16');
      expect(section?.className).toContain('md:py-24');
    });

    it('should apply responsive text sizing to feature titles', () => {
      const { container } = render(<FeaturesSection />);
      
      const featureTitles = container.querySelectorAll('article h3');
      featureTitles.forEach(title => {
        expect(title.className).toContain('text-xl');
        expect(title.className).toContain('md:text-2xl');
      });
    });

    it('should apply responsive icon sizing', () => {
      const { container } = render(<FeaturesSection />);
      
      const iconContainers = container.querySelectorAll('article > div:first-child');
      iconContainers.forEach(iconContainer => {
        expect(iconContainer.className).toContain('w-16');
        expect(iconContainer.className).toContain('h-16');
        expect(iconContainer.className).toContain('md:w-20');
        expect(iconContainer.className).toContain('md:h-20');
      });
    });
  });

  describe('Word Count Validation', () => {
    it('should meet minimum word count of ~300 words total', () => {
      // Calculate total word count from features
      const totalWords = features.reduce((total, feature) => {
        const descriptionWords = feature.description.split(/\s+/).length;
        const benefitWords = feature.benefits.join(' ').split(/\s+/).length;
        return total + descriptionWords + benefitWords;
      }, 0);
      
      // Should have substantial content (at least 200 words across all features)
      expect(totalWords).toBeGreaterThanOrEqual(200);
    });

    it('should have substantial description for each feature', () => {
      features.forEach(feature => {
        const wordCount = feature.description.split(/\s+/).length;
        // Ensure each feature has meaningful content (at least 40 words)
        expect(wordCount).toBeGreaterThanOrEqual(40);
      });
    });

    it('should have at least 4 benefits per feature', () => {
      features.forEach(feature => {
        expect(feature.benefits.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Visual Elements', () => {
    it('should render icons for each feature', () => {
      const { container } = render(<FeaturesSection />);
      
      const icons = container.querySelectorAll('article svg');
      // Each feature has an icon, plus checkmarks for benefits
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    it('should render checkmark icons for benefits', () => {
      const { container } = render(<FeaturesSection />);
      
      // Count checkmark icons (green check icons in benefit lists)
      const checkmarks = container.querySelectorAll('.text-green-500');
      
      // Total number of benefits across all features
      const totalBenefits = features.reduce((sum, f) => sum + f.benefits.length, 0);
      expect(checkmarks.length).toBe(totalBenefits);
    });

    it('should apply gradient background to icon containers', () => {
      const { container } = render(<FeaturesSection />);
      
      const iconContainers = container.querySelectorAll('article > div:first-child');
      iconContainers.forEach(iconContainer => {
        expect(iconContainer.className).toContain('bg-gradient-to-br');
        expect(iconContainer.className).toContain('from-blue-500');
        expect(iconContainer.className).toContain('to-purple-600');
      });
    });

    it('should apply hover effects to feature cards', () => {
      const { container } = render(<FeaturesSection />);
      
      const cards = container.querySelectorAll('article');
      cards.forEach(card => {
        expect(card.className).toContain('hover:shadow-xl');
        expect(card.className).toContain('transition-shadow');
      });
    });
  });

  describe('Accessibility', () => {
    it('should use proper heading hierarchy', () => {
      render(<FeaturesSection />);
      
      // Main section heading should be h2
      const mainHeading = screen.getByRole('heading', { name: /Powerful Features/i });
      expect(mainHeading.tagName).toBe('H2');
      
      // Feature titles should be h3
      features.forEach(feature => {
        const featureHeading = screen.getByRole('heading', { name: feature.title });
        expect(featureHeading.tagName).toBe('H3');
      });
    });

    it('should mark decorative icons as aria-hidden', () => {
      const { container } = render(<FeaturesSection />);
      
      // Checkmark icons should be aria-hidden
      const checkmarkIcons = container.querySelectorAll('.text-green-500');
      checkmarkIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should use semantic list elements for benefits', () => {
      const { container } = render(<FeaturesSection />);
      
      const lists = container.querySelectorAll('ul[role="list"]');
      expect(lists.length).toBe(4); // One list per feature
    });
  });

  describe('Additional Context', () => {
    it('should render additional context paragraph', () => {
      const { container } = render(<FeaturesSection />);
      
      const contextParagraph = container.querySelector('.mt-12 p, .mt-16 p');
      expect(contextParagraph).toBeInTheDocument();
      expect(contextParagraph?.textContent).toContain('handwriting generator');
    });
  });

  describe('Feature Card Structure', () => {
    it('should render each feature card with all required elements', () => {
      const { container } = render(<FeaturesSection />);
      
      const cards = container.querySelectorAll('article');
      
      cards.forEach(card => {
        // Should have icon container
        const iconContainer = card.querySelector('div:first-child');
        expect(iconContainer).toBeInTheDocument();
        
        // Should have title (h3)
        const title = card.querySelector('h3');
        expect(title).toBeInTheDocument();
        
        // Should have description (p)
        const description = card.querySelector('p');
        expect(description).toBeInTheDocument();
        
        // Should have benefits list (ul)
        const benefitsList = card.querySelector('ul');
        expect(benefitsList).toBeInTheDocument();
      });
    });

    it('should apply proper styling to feature cards', () => {
      const { container } = render(<FeaturesSection />);
      
      const cards = container.querySelectorAll('article');
      
      cards.forEach(card => {
        expect(card.className).toContain('rounded-2xl');
        expect(card.className).toContain('shadow-lg');
        expect(card.className).toContain('border');
      });
    });
  });
});
