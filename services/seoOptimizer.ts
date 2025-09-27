import { GeneratedImage } from '../types/gallery';

export interface MetaTag {
  name?: string;
  property?: string;
  httpEquiv?: string;
  content: string;
}

export type StructuredData = Record<string, unknown>;

export interface AlternateLocaleLink {
  hrefLang: string;
  url: string;
}

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface ISEOOptimizer {
  generateMetaTags(): MetaTag[];
  createStructuredData(): StructuredData;
  optimizeImageAlt(image: GeneratedImage): string;
  generateSitemap(): SitemapEntry[];
  updateDocumentMeta(metaTags: MetaTag[]): void;
  injectStructuredData(data: StructuredData | StructuredData[]): void;
  updateCanonicalLink(url?: string): void;
  updateAlternateLocaleLinks(alternates: AlternateLocaleLink[]): void;
  createOrganizationStructuredData(): StructuredData;
  createBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): StructuredData;
  createWebsiteStructuredData(): StructuredData;
}

export class SEOOptimizer implements ISEOOptimizer {
  private readonly baseUrl: string;
  private readonly appName: string;
  private readonly appDescription: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://txttohandwriting.org';
    this.appName = 'Handwriting Generator';
    this.appDescription = 'Generate realistic handwritten text with customizable fonts, templates, and ink colors. Perfect for creating authentic handwriting samples.';
  }

  generateMetaTags(): MetaTag[] {
    return [
      // Basic meta tags
      { name: 'description', content: this.appDescription },
      { name: 'keywords', content: 'handwriting generator, handwritten text, custom fonts, realistic handwriting, text to handwriting, online handwriting converter, free handwriting tool, studygram, aesthetic notes, digital handwriting' },
      { name: 'author', content: 'txttohandwriting.org Team' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'language', content: 'en' },
      { name: 'revisit-after', content: '7 days' },
      { name: 'distribution', content: 'global' },
      { name: 'rating', content: 'general' },
      
      // Open Graph meta tags
      { property: 'og:title', content: this.appName },
      { property: 'og:description', content: this.appDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: this.baseUrl },
      { property: 'og:site_name', content: 'txttohandwriting.org' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:image', content: `${this.baseUrl}/app-screenshot.jpg` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Handwriting Generator - Convert Text to Realistic Handwriting' },
      
      // Twitter Card meta tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: this.appName },
      { name: 'twitter:description', content: this.appDescription },
      { name: 'twitter:image', content: `${this.baseUrl}/app-screenshot.jpg` },
      { name: 'twitter:image:alt', content: 'Handwriting Generator - Convert Text to Realistic Handwriting' },
      { name: 'twitter:site', content: '@txttohandwriting' },
      { name: 'twitter:creator', content: '@txttohandwriting' },
      
      // Additional SEO meta tags
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'bingbot', content: 'index, follow' },
      { name: 'theme-color', content: '#ffffff' },
      { name: 'msapplication-TileColor', content: '#ffffff' },
      
      // App-specific meta tags
      { name: 'application-name', content: this.appName },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: this.appName },
      { name: 'mobile-web-app-capable', content: 'yes' },
      
      // Additional structured markup hints
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'HandheldFriendly', content: 'true' },
      { name: 'MobileOptimized', content: '320' }
    ];
  }

  createStructuredData(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: this.appName,
      description: this.appDescription,
      url: this.baseUrl,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web Browser',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '2.0',
      datePublished: '2024-01-01',
      dateModified: '2025-09-25',
      author: {
        '@type': 'Organization',
        name: 'txttohandwriting.org',
        url: this.baseUrl
      },
      creator: {
        '@type': 'Organization',
        name: 'txttohandwriting.org',
        url: this.baseUrl
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      },
      featureList: [
        'Custom handwriting fonts',
        'Multiple paper templates',
        'Various ink colors',
        'Realistic handwriting generation',
        'PNG export functionality',
        'Bulk download support'
      ],
      screenshot: `${this.baseUrl}/app-screenshot.jpg`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
        worstRating: '1'
      }
    };
  }

  optimizeImageAlt(image: GeneratedImage): string {
    const { metadata } = image;
    const textPreview = metadata.textContent?.substring(0, 50) || 'handwritten text';
    const timestamp = new Date(image.timestamp).toLocaleDateString();
    
    return `Handwritten text "${textPreview}" generated on ${timestamp} using custom handwriting font`;
  }

  generateSitemap(): SitemapEntry[] {
    const currentDate = new Date().toISOString();
    
    return [
      {
        url: this.baseUrl,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 1.0
      },
      {
        url: `${this.baseUrl}/about`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.8
      },
      {
        url: `${this.baseUrl}/faq`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.7
      },
      {
        url: `${this.baseUrl}/terms`,
        lastModified: currentDate,
        changeFrequency: 'yearly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/blog`,
        lastModified: '2025-09-17T00:00:00+00:00',
        changeFrequency: 'weekly',
        priority: 0.7
      },
      {
        url: `${this.baseUrl}/blog/glow-up-your-notes`,
        lastModified: '2025-09-17T00:00:00+00:00',
        changeFrequency: 'monthly',
        priority: 0.6
      },
      {
        url: `${this.baseUrl}/blog/fix-your-studygram`,
        lastModified: '2025-09-17T00:00:00+00:00',
        changeFrequency: 'monthly',
        priority: 0.6
      }
    ];
  }

  updateDocumentMeta(metaTags: MetaTag[]): void {
    if (typeof document === 'undefined') return;

    metaTags.forEach(tag => {
      const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (tag.name) element.name = tag.name;
        if (tag.property) element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      
      element.content = tag.content;
    });
  }

  injectStructuredData(data: StructuredData | StructuredData[]): void {
    if (typeof document === 'undefined') return;

    const existingScript = document.getElementById('seo-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const normalized = Array.isArray(data) ? data : [data];
    const DEFAULT_CONTEXT = 'https://schema.org';

    const entries = normalized.map(item => {
      const context = (item['@context'] as string | undefined) || DEFAULT_CONTEXT;
      return {
        '@context': context,
        ...item
      };
    });

    let payload: StructuredData;

    if (entries.length === 1) {
      payload = entries[0];
    } else {
      payload = {
        '@context': DEFAULT_CONTEXT,
        '@graph': entries.map(entry => {
          const { ['@context']: context, ...rest } = entry;
          return context && context !== DEFAULT_CONTEXT ? { '@context': context, ...rest } : rest;
        })
      };
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-structured-data';
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  }

  updateCanonicalLink(url?: string): void {
    if (typeof document === 'undefined') return;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!url) {
      if (canonical) {
        canonical.remove();
      }
      return;
    }

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = url;
  }

  updateAlternateLocaleLinks(alternates: AlternateLocaleLink[]): void {
    if (typeof document === 'undefined') return;

    const existing = document.querySelectorAll('link[rel="alternate"][data-seo-alternate="true"]');
    existing.forEach(link => link.remove());

    alternates.forEach(({ hrefLang, url }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = hrefLang;
      link.href = url;
      link.dataset.seoAlternate = 'true';
      document.head.appendChild(link);
    });
  }

  createOrganizationStructuredData(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'txttohandwriting.org',
      url: this.baseUrl,
      logo: `${this.baseUrl}/site.svg`,
      description: 'Free online handwriting generator for creating realistic handwritten text with custom fonts and templates.',
      foundingDate: '2024',
      sameAs: [
        `${this.baseUrl}/about`,
        `${this.baseUrl}/blog`
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@txttohandwriting.org',
        availableLanguage: 'English'
      }
    };
  }

  createBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  createWebsiteStructuredData(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'txttohandwriting.org',
      url: this.baseUrl,
      description: this.appDescription,
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.baseUrl}/?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: 'txttohandwriting.org',
        url: this.baseUrl
      }
    };
  }
}
