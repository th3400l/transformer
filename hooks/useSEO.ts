import { useEffect } from 'react';
import { SEOOptimizer, MetaTag, StructuredData, AlternateLocaleLink } from '../services/seoOptimizer';

interface UseSEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  alternateLocales?: AlternateLocaleLink[];
  noindex?: boolean;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  customMetaTags?: MetaTag[];
  structuredData?: StructuredData | StructuredData[];
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

    if (options.ogImage) {
      metaTags.push({ property: 'og:image', content: options.ogImage });
      metaTags.push({ name: 'twitter:image', content: options.ogImage });
    }

    if (options.twitterCard) {
      metaTags.push({ name: 'twitter:card', content: options.twitterCard });
    }

    if (typeof options.noindex === 'boolean') {
      const directive = options.noindex ? 'noindex, nofollow' : 'index, follow';
      metaTags.push({ name: 'robots', content: directive });
      metaTags.push({ name: 'googlebot', content: directive });
    }

    if (options.canonicalUrl) {
      metaTags.push({ property: 'og:url', content: options.canonicalUrl });
    }

    // Add custom meta tags
    metaTags.push(...customMetaTags);

    // Apply meta tags
    seoOptimizer.updateDocumentMeta(metaTags);

    // Update canonical and alternate locale links
    seoOptimizer.updateCanonicalLink(options.canonicalUrl);
    seoOptimizer.updateAlternateLocaleLinks(options.alternateLocales || []);

    // Generate and inject structured data
    const defaultStructuredData = seoOptimizer.createStructuredData();
    const structuredDataPayload = options.structuredData
      ? [defaultStructuredData, ...(Array.isArray(options.structuredData) ? options.structuredData : [options.structuredData])]
      : defaultStructuredData;

    seoOptimizer.injectStructuredData(structuredDataPayload);
    
  }, [
    options.title,
    options.description,
    options.keywords,
    options.customMetaTags,
    options.structuredData,
    options.canonicalUrl,
    options.alternateLocales,
    options.noindex,
    options.ogImage,
    options.twitterCard
  ]);
}
