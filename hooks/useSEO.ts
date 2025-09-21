import { useEffect } from 'react';
import { SEOOptimizer, MetaTag, StructuredData } from '../services/seoOptimizer';

interface UseSEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  customMetaTags?: MetaTag[];
  structuredData?: Partial<StructuredData>;
}

export function useSEO(options: UseSEOOptions = {}) {
  useEffect(() => {
    const seoOptimizer = new SEOOptimizer();
    
    // Generate and apply meta tags
    const defaultMetaTags = seoOptimizer.generateMetaTags();
    const customMetaTags = options.customMetaTags || [];
    
    // Override default meta tags with custom ones
    const metaTags = [...defaultMetaTags];
    
    if (options.title) {
      const titleTag = { name: 'title', content: options.title };
      const ogTitleTag = { property: 'og:title', content: options.title };
      const twitterTitleTag = { name: 'twitter:title', content: options.title };
      
      metaTags.push(titleTag, ogTitleTag, twitterTitleTag);
      
      // Update document title
      if (typeof document !== 'undefined') {
        document.title = options.title;
      }
    }
    
    if (options.description) {
      const descTag = { name: 'description', content: options.description };
      const ogDescTag = { property: 'og:description', content: options.description };
      const twitterDescTag = { name: 'twitter:description', content: options.description };
      
      metaTags.push(descTag, ogDescTag, twitterDescTag);
    }
    
    if (options.keywords) {
      metaTags.push({ name: 'keywords', content: options.keywords });
    }
    
    // Add custom meta tags
    metaTags.push(...customMetaTags);
    
    // Apply meta tags
    seoOptimizer.updateDocumentMeta(metaTags);
    
    // Generate and inject structured data
    const defaultStructuredData = seoOptimizer.createStructuredData();
    const structuredData = { ...defaultStructuredData, ...options.structuredData };
    seoOptimizer.injectStructuredData(structuredData);
    
  }, [options.title, options.description, options.keywords, options.customMetaTags, options.structuredData]);
}