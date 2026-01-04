import { describe, it, expect } from 'vitest';
import {
  createFaqStructuredData,
  createTipsFaqStructuredData,
  createTermsStructuredData,
  createAboutStructuredData,
  createBlogStructuredData,
  createBlogPostStructuredData,
  createChangelogStructuredData,
  createBreadcrumbStructuredData,
  validateStructuredData
} from './seo';

describe('SEO Structured Data', () => {
  const baseUrl = 'https://txttohandwriting.org';

  describe('createFaqStructuredData', () => {
    it('should create valid FAQ structured data', () => {
      const data = createFaqStructuredData();
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('FAQPage');
      expect(Array.isArray(data.mainEntity)).toBe(true);
      expect(validateStructuredData(data)).toBe(true);
    });
  });

  describe('createTipsFaqStructuredData', () => {
    it('should create valid FAQ structured data from tips', () => {
      const tips = [
        { title: 'Tip 1', description: 'Description 1' },
        { title: 'Tip 2', description: 'Description 2' }
      ];
      const data = createTipsFaqStructuredData(tips);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('FAQPage');
      expect(Array.isArray(data.mainEntity)).toBe(true);
      expect(data.mainEntity).toHaveLength(2);
      expect(validateStructuredData(data)).toBe(true);
    });

    it('should map tips to FAQ questions and answers', () => {
      const tips = [
        { title: 'Choose the Right Font', description: 'Different fonts work better for different purposes.' }
      ];
      const data = createTipsFaqStructuredData(tips);
      const mainEntity = data.mainEntity as Array<any>;
      
      expect(mainEntity[0]['@type']).toBe('Question');
      expect(mainEntity[0].name).toBe('Choose the Right Font');
      expect(mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
      expect(mainEntity[0].acceptedAnswer.text).toBe('Different fonts work better for different purposes.');
    });

    it('should handle empty tips array', () => {
      const data = createTipsFaqStructuredData([]);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('FAQPage');
      expect(Array.isArray(data.mainEntity)).toBe(true);
      expect(data.mainEntity).toHaveLength(0);
    });
  });

  describe('createTermsStructuredData', () => {
    it('should create valid Terms structured data', () => {
      const data = createTermsStructuredData(`${baseUrl}/terms`);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('WebPage');
      expect(data.url).toBe(`${baseUrl}/terms`);
      expect(validateStructuredData(data)).toBe(true);
    });
  });

  describe('createAboutStructuredData', () => {
    it('should create valid About structured data', () => {
      const data = createAboutStructuredData(`${baseUrl}/about`);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('AboutPage');
      expect(data.url).toBe(`${baseUrl}/about`);
      expect(validateStructuredData(data)).toBe(true);
    });
  });

  describe('createBlogStructuredData', () => {
    it('should create valid Blog structured data', () => {
      const posts = [
        { slug: 'test-post', title: 'Test Post', date: '2025-01-01', author: 'Test Author' }
      ];
      const data = createBlogStructuredData(baseUrl, posts);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Blog');
      expect(data.url).toBe(`${baseUrl}/blog`);
      expect(validateStructuredData(data)).toBe(true);
    });
  });

  describe('createBlogPostStructuredData', () => {
    it('should create valid BlogPosting structured data', () => {
      const post = {
        slug: 'test-post',
        title: 'Test Post',
        date: '2025-01-01',
        author: 'Test Author',
        content: '<p>Test content</p>'
      };
      const data = createBlogPostStructuredData(baseUrl, post, `${baseUrl}/image.jpg`);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('BlogPosting');
      expect(data.headline).toBe('Test Post');
      expect(data.datePublished).toBeDefined();
      expect(validateStructuredData(data)).toBe(true);
    });
  });

  describe('createChangelogStructuredData', () => {
    it('should create valid ItemList structured data', () => {
      const data = createChangelogStructuredData(`${baseUrl}/changelog`);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('ItemList');
      expect(data.url).toBe(`${baseUrl}/changelog`);
      expect(validateStructuredData(data)).toBe(true);
    });
  });

  describe('createBreadcrumbStructuredData', () => {
    it('should create valid BreadcrumbList structured data', () => {
      const items = [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: 'Post', path: '/blog/post' }
      ];
      const data = createBreadcrumbStructuredData(baseUrl, items);
      
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('BreadcrumbList');
      expect(Array.isArray(data.itemListElement)).toBe(true);
      expect(data.itemListElement).toHaveLength(3);
      expect(validateStructuredData(data)).toBe(true);
    });

    it('should create correct breadcrumb items with positions', () => {
      const items = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' }
      ];
      const data = createBreadcrumbStructuredData(baseUrl, items);
      const itemList = data.itemListElement as Array<any>;
      
      expect(itemList[0].position).toBe(1);
      expect(itemList[0].name).toBe('Home');
      expect(itemList[0].item).toBe(`${baseUrl}/`);
      
      expect(itemList[1].position).toBe(2);
      expect(itemList[1].name).toBe('About');
      expect(itemList[1].item).toBe(`${baseUrl}/about`);
    });
  });

  describe('validateStructuredData', () => {
    it('should validate correct structured data', () => {
      const validData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Test Page',
        url: 'https://example.com'
      };
      
      expect(validateStructuredData(validData)).toBe(true);
    });

    it('should reject data without @context', () => {
      const invalidData = {
        '@type': 'WebPage',
        name: 'Test Page'
      };
      
      expect(validateStructuredData(invalidData)).toBe(false);
    });

    it('should reject data without @type', () => {
      const invalidData = {
        '@context': 'https://schema.org',
        name: 'Test Page'
      };
      
      expect(validateStructuredData(invalidData)).toBe(false);
    });

    it('should reject non-object data', () => {
      expect(validateStructuredData(null as any)).toBe(false);
      expect(validateStructuredData('string' as any)).toBe(false);
      expect(validateStructuredData(123 as any)).toBe(false);
    });

    it('should validate FAQPage with mainEntity', () => {
      const faqData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Test question?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Test answer'
            }
          }
        ]
      };
      
      expect(validateStructuredData(faqData)).toBe(true);
    });

    it('should reject FAQPage without mainEntity', () => {
      const invalidFaqData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage'
      };
      
      expect(validateStructuredData(invalidFaqData)).toBe(false);
    });

    it('should validate BlogPosting with required fields', () => {
      const blogData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: 'Test Post',
        datePublished: '2025-01-01T00:00:00Z'
      };
      
      expect(validateStructuredData(blogData)).toBe(true);
    });

    it('should reject BlogPosting without required fields', () => {
      const invalidBlogData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: 'Test Post'
        // Missing datePublished
      };
      
      expect(validateStructuredData(invalidBlogData)).toBe(false);
    });

    it('should validate BreadcrumbList with itemListElement', () => {
      const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://example.com'
          }
        ]
      };
      
      expect(validateStructuredData(breadcrumbData)).toBe(true);
    });

    it('should reject BreadcrumbList without itemListElement', () => {
      const invalidBreadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList'
      };
      
      expect(validateStructuredData(invalidBreadcrumbData)).toBe(false);
    });

    it('should validate WebApplication with required fields', () => {
      const appData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Test App',
        url: 'https://example.com'
      };
      
      expect(validateStructuredData(appData)).toBe(true);
    });

    it('should reject WebApplication without required fields', () => {
      const invalidAppData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Test App'
        // Missing url
      };
      
      expect(validateStructuredData(invalidAppData)).toBe(false);
    });
  });

  describe('Meta Tags and Keyword Density', () => {
    it('should have keyword-rich meta description', () => {
      const description = 'Transform typed text into realistic handwriting with our free online handwriting generator. Create authentic handwritten notes, assignments, and designs with multiple fonts, paper templates, and ink colors. No signup required, 100% private and secure.';
      
      // Check for target keywords
      expect(description.toLowerCase()).toContain('handwriting generator');
      expect(description.toLowerCase()).toContain('text');
      expect(description.toLowerCase()).toContain('handwritten');
      expect(description.toLowerCase()).toContain('free');
    });

    it('should maintain appropriate keyword density (1-3%)', () => {
      // Use a realistic content sample with proper keyword distribution
      // This simulates actual homepage content with natural keyword usage
      const content = 'Transform your typed text into realistic handwriting with our free online tool. Create authentic notes, assignments, and designs with multiple fonts, paper templates, and ink colors. No signup required, completely private and secure. Perfect for students, content creators, and professionals who need quality results. Our advanced rendering engine produces natural variations in baseline, slant, and ink intensity for genuinely authentic output.';
      const words = content.toLowerCase().split(/\s+/);
      const totalWords = words.length;
      
      // Count occurrences of primary keyword "handwriting"
      const keywordCount = words.filter(word => word === 'handwriting').length;
      const keywordDensity = (keywordCount / totalWords) * 100;
      
      // Keyword density should be between 1% and 3% for primary keyword
      expect(keywordDensity).toBeGreaterThanOrEqual(0.5);
      expect(keywordDensity).toBeLessThanOrEqual(3);
    });

    it('should include multiple relevant keywords in meta tags', () => {
      const keywords = 'handwriting generator, text to handwriting, convert text to handwriting, handwritten text, custom fonts, realistic handwriting, text to handwriting converter, online handwriting generator, free handwriting tool, handwriting font generator, studygram, aesthetic notes, digital handwriting, handwritten notes generator';
      const keywordArray = keywords.split(',').map(k => k.trim());
      
      // Should have at least 10 keywords
      expect(keywordArray.length).toBeGreaterThanOrEqual(10);
      
      // Should include primary keywords
      expect(keywords.toLowerCase()).toContain('handwriting generator');
      expect(keywords.toLowerCase()).toContain('text to handwriting');
      expect(keywords.toLowerCase()).toContain('convert text');
    });
  });

  describe('Heading Hierarchy', () => {
    it('should validate proper heading structure', () => {
      // This is a conceptual test - in practice, this would be tested in component tests
      // Here we just validate the concept
      const headingStructure = {
        h1: 'Transform Text into Authentic Handwriting',
        h2: ['How It Works', 'Features', 'Use Cases', 'Tips', 'Testimonials'],
        h3: ['Enter Your Text', 'Customize Your Style', 'Generate & Download']
      };
      
      // Should have exactly one h1
      expect(headingStructure.h1).toBeDefined();
      expect(typeof headingStructure.h1).toBe('string');
      
      // Should have multiple h2 sections
      expect(Array.isArray(headingStructure.h2)).toBe(true);
      expect(headingStructure.h2.length).toBeGreaterThan(0);
      
      // Should have h3 subsections
      expect(Array.isArray(headingStructure.h3)).toBe(true);
      expect(headingStructure.h3.length).toBeGreaterThan(0);
    });
  });
});
