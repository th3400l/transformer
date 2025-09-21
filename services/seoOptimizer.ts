import { GeneratedImage } from '../types/gallery';

export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
  };
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
  injectStructuredData(data: StructuredData): void;
}

export class SEOOptimizer implements ISEOOptimizer {
  private readonly baseUrl: string;
  private readonly appName: string;
  private readonly appDescription: string;

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    this.appName = 'Handwriting Generator';
    this.appDescription = 'Generate realistic handwritten text with customizable fonts, templates, and ink colors. Perfect for creating authentic handwriting samples.';
  }

  generateMetaTags(): MetaTag[] {
    return [
      // Basic meta tags
      { name: 'description', content: this.appDescription },
      { name: 'keywords', content: 'handwriting generator, handwritten text, custom fonts, realistic handwriting, text to handwriting' },
      { name: 'author', content: 'Handwriting Generator Team' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      
      // Open Graph meta tags
      { property: 'og:title', content: this.appName },
      { property: 'og:description', content: this.appDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: this.baseUrl },
      { property: 'og:site_name', content: this.appName },
      { property: 'og:locale', content: 'en_US' },
      
      // Twitter Card meta tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: this.appName },
      { name: 'twitter:description', content: this.appDescription },
      
      // Additional SEO meta tags
      { name: 'robots', content: 'index, follow' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'theme-color', content: '#ffffff' },
      
      // App-specific meta tags
      { name: 'application-name', content: this.appName },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: this.appName }
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
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
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
    const baseEntry = {
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 1.0
    };

    return [
      {
        url: this.baseUrl,
        ...baseEntry
      },
      {
        url: `${this.baseUrl}/about`,
        ...baseEntry,
        priority: 0.8,
        changeFrequency: 'monthly'
      },
      {
        url: `${this.baseUrl}/faq`,
        ...baseEntry,
        priority: 0.7,
        changeFrequency: 'monthly'
      },
      {
        url: `${this.baseUrl}/terms`,
        ...baseEntry,
        priority: 0.5,
        changeFrequency: 'yearly'
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

  injectStructuredData(data: StructuredData): void {
    if (typeof document === 'undefined') return;

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
}