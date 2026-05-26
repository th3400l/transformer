import { GeneratedImage } from '../types/gallery';
import { LanguageInfo, SUPPORTED_LANGUAGES, getLanguageInfo } from './languageConfig';

const FALLBACK_LANGUAGE: LanguageInfo = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  locale: 'en-US',
  hreflang: 'en'
};

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
  private readonly activeLanguage: LanguageInfo;

  constructor(options: { languageCode?: string } = {}) {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.txttohandwriting.org';
    this.appName = 'Handwriting Generator - Convert Text to Handwriting Online';
    this.appDescription = 'Transform typed text into realistic handwriting with our free online handwriting generator. Create authentic handwritten notes, assignments, and designs with multiple fonts, paper templates, and ink colors. No signup required, 100% private and secure. Perfect for students, content creators, and professionals.';
    this.activeLanguage = getLanguageInfo(options.languageCode) || FALLBACK_LANGUAGE;
  }

  generateMetaTags(): MetaTag[] {
    const primaryLanguage = this.activeLanguage || SUPPORTED_LANGUAGES[0] || FALLBACK_LANGUAGE;
    const alternateLanguages = SUPPORTED_LANGUAGES.filter(lang => lang.code !== primaryLanguage.code);

    const metaTags: MetaTag[] = [
      // Basic meta tags
      { name: 'description', content: this.appDescription },
      { name: 'keywords', content: 'handwriting generator, text to handwriting, convert text to handwriting, handwritten text, custom fonts, realistic handwriting, text to handwriting converter, online handwriting generator, free handwriting tool, handwriting font generator, studygram, aesthetic notes, digital handwriting, handwritten notes generator, handwriting maker' },
      { name: 'author', content: 'txttohandwriting.org Team' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'revisit-after', content: '1 day' },
      { name: 'distribution', content: 'global' },
      { name: 'rating', content: 'general' },
      { name: 'language', content: primaryLanguage.hreflang || primaryLanguage.code },
      { httpEquiv: 'content-language', content: primaryLanguage.locale },

      // Open Graph meta tags (Enhanced for social sharing)
      { property: 'og:title', content: this.appName },
      { property: 'og:description', content: this.appDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: this.baseUrl },
      { property: 'og:site_name', content: 'txttohandwriting.org' },
      { property: 'og:locale', content: primaryLanguage.locale },
      { property: 'og:image', content: `${this.baseUrl}/app-screenshot.jpg` },
      { property: 'og:image:secure_url', content: `${this.baseUrl}/app-screenshot.jpg` },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Handwriting Generator - Convert Text to Realistic Handwriting' },

      // Twitter Card meta tags (Enhanced for Twitter sharing)
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: this.appName },
      { name: 'twitter:description', content: this.appDescription },
      { name: 'twitter:image', content: `${this.baseUrl}/app-screenshot.jpg` },
      { name: 'twitter:image:alt', content: 'Handwriting Generator - Convert Text to Realistic Handwriting' },
      { name: 'twitter:site', content: '@txttohandwriting' },
      { name: 'twitter:creator', content: '@txttohandwriting' },
      { name: 'twitter:domain', content: 'txttohandwriting.org' },
      { name: 'twitter:url', content: this.baseUrl },

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
    
    const alternateLocaleMeta = alternateLanguages.map(lang => ({
      property: 'og:locale:alternate',
      content: lang.locale
    }));

    return [...metaTags, ...alternateLocaleMeta];
  }

  createStructuredData(): StructuredData {
    const languages = SUPPORTED_LANGUAGES.map(lang => lang.locale);

    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: this.appName,
      description: this.appDescription,
      url: this.baseUrl,
      inLanguage: languages,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web Browser',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '1.4.1',
      datePublished: '2025-01-01',
      dateModified: '2025-12-28',
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
        'Realistic handwriting variations with natural baseline jitter and slant',
        'Multiple paper templates including blank, lined, and dotted options',
        'Upload your own handwriting fonts (TTF, OTF, WOFF formats)',
        'Custom ink colors and boldness control',
        'Instant live preview while typing',
        'Bulk download and PDF export functionality',
        '100% free and private - all processing happens in your browser',
        'No signup required - start creating immediately',
        'Multi-page document generation (up to 6 pages)',
        'High-quality PNG and PDF output'
      ],
      screenshot: `${this.baseUrl}/app-screenshot.jpg`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
        worstRating: '1'
      },
      mainEntity: {
        '@type': 'SoftwareApplication',
        name: 'Text to Handwriting Converter',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any (Web-based)',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        }
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
      const selector = tag.name
        ? `meta[name="${tag.name}"]`
        : tag.property
          ? `meta[property="${tag.property}"]`
          : `meta[http-equiv="${tag.httpEquiv}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        if (tag.name) element.name = tag.name;
        if (tag.property) element.setAttribute('property', tag.property);
        if (tag.httpEquiv) element.setAttribute('http-equiv', tag.httpEquiv);
        document.head.appendChild(element);
      }

      element.content = tag.content;
    });
  }

  injectStructuredData(data: StructuredData | StructuredData[]): void {
    if (typeof document === 'undefined') return;

    // Remove every JSON-LD block on the page before injecting the runtime one.
    // The prerendered HTML ships its own <script type="application/ld+json">
    // tags (WebApplication, Organization, WebSite, FAQPage, ...). If we only
    // removed our previous #seo-structured-data node, hydration would leave
    // BOTH the prerendered and the runtime FAQPage in the DOM, which Google
    // Search Console reports as "Duplicate field FAQPage". Replacing all of
    // them with a single consolidated graph guarantees exactly one block.
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach(node => node.remove());

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
    const availableLanguages = SUPPORTED_LANGUAGES.map(
      lang => lang.hreflang || lang.code
    );

    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'txttohandwriting.org',
      url: this.baseUrl,
      logo: `${this.baseUrl}/site.svg`,
      description: 'The premier online handwriting generator. Convert text to realistic handwritten notes with custom fonts, ink styles, and paper templates. Free and privacy-focused.',
      foundingDate: '2025',
      sameAs: [
        `${this.baseUrl}/about`,
        `${this.baseUrl}/blog`
      ],
      availableLanguage: availableLanguages,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'nsa.tools@proton.me',
        availableLanguage: availableLanguages
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
    const languages = SUPPORTED_LANGUAGES.map(lang => lang.locale);
    const availableLanguages = SUPPORTED_LANGUAGES.map(
      lang => lang.hreflang || lang.code
    );

    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'txttohandwriting.org',
      url: this.baseUrl,
      description: this.appDescription,
      inLanguage: languages,
      availableLanguage: availableLanguages,
      publisher: {
        '@type': 'Organization',
        name: 'txttohandwriting.org',
        url: this.baseUrl
      }
    };
  }
}
