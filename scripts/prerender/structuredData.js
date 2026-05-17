import { stripHtmlTags, safeIsoDate } from './util.js';

export const buildWebsiteStructuredData = (baseUrl, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'txttohandwriting.org',
  url: baseUrl,
  inLanguage: locale
  // No sitewide search exists, so no SearchAction. A SearchAction here made
  // Google crawl the literal template URL "/?q={search_term_string}".
});

export const buildOrganizationStructuredData = (baseUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'txttohandwriting.org',
  url: baseUrl,
  logo: `${baseUrl}/site.svg`,
  sameAs: ['https://buymeacoffee.com/txttohandwriting']
});

export const buildWebApplicationStructuredData = (baseUrl, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Handwriting Generator - Convert Text to Handwriting Online',
  description:
    'Transform typed text into realistic handwriting with our free online handwriting generator. Create authentic handwritten notes, assignments, and designs with multiple fonts, paper templates, and ink colors. No signup required, 100% private and secure.',
  url: baseUrl,
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock'
  },
  creator: {
    '@type': 'Person',
    name: 'Th3-F00L'
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
    'Multi-page document generation',
    'High-quality PNG and PDF output'
  ],
  screenshot: `${baseUrl}/app-screenshot.jpg`,
  softwareVersion: '1.4.1',
  datePublished: '2025-01-01',
  inLanguage: locale,
  isAccessibleForFree: true,
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1'
  }
});

export const buildBreadcrumbStructuredData = (baseUrl, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${baseUrl}${item.path === '/' ? '' : item.path}`
  }))
});

export const buildFaqStructuredData = (entries) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entries.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: entry.answer
    }
  }))
});

export const buildAboutStructuredData = (canonicalUrl, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About txttohandwriting.org',
  url: canonicalUrl,
  description:
    'Story, mission, and team behind txttohandwriting.org — the handwriting generator crafted for students and creators.',
  inLanguage: locale
});

export const buildPrivacyStructuredData = (canonicalUrl, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy - txttohandwriting.org',
  url: canonicalUrl,
  description: 'Privacy policy and data handling practices for txttohandwriting.org.',
  inLanguage: locale
});

export const buildTermsStructuredData = (canonicalUrl, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms and Conditions - txttohandwriting.org',
  url: canonicalUrl,
  description: 'Terms of service, data use, and consent information for txttohandwriting.org.',
  inLanguage: locale
});

export const buildContactStructuredData = (canonicalUrl, locale, email) => ({
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact - txttohandwriting.org',
  url: canonicalUrl,
  description: 'Get in touch with the team behind txttohandwriting.org for support, feedback, and partnership inquiries.',
  inLanguage: locale,
  mainEntity: {
    '@type': 'Organization',
    name: 'txttohandwriting.org',
    email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email,
      availableLanguage: ['English']
    }
  }
});

export const buildBlogStructuredData = (baseUrl, posts, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'txttohandwriting.org Blog',
  description:
    'Guides and ideas for turning typed text into aesthetic handwriting for study notes, planners, and content.',
  url: `${baseUrl}/blog`,
  inLanguage: locale,
  blogPost: posts.map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title,
    url: `${baseUrl}/blog/${post.slug}`,
    datePublished: safeIsoDate(post.date),
    author: {
      '@type': 'Person',
      name: post.author
    }
  }))
});

export const buildBlogPostStructuredData = (baseUrl, post, socialImage, locale) => {
  const articleBody = stripHtmlTags(post.content);
  const description = articleBody.slice(0, 220);
  const isoDate = safeIsoDate(post.date);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    articleBody,
    datePublished: isoDate,
    dateModified: isoDate,
    inLanguage: locale,
    url: `${baseUrl}/blog/${post.slug}`,
    image: socialImage,
    author: {
      '@type': 'Person',
      name: post.author
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`
    }
  };
};

export const buildChangelogStructuredData = (canonicalUrl, entries, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'txttohandwriting.org Product Updates',
  url: canonicalUrl,
  inLanguage: locale,
  itemListElement: entries.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: `Version ${entry.version}`,
    description: entry.tagline,
    url: `${canonicalUrl}#v${entry.version.replace(/\./g, '-')}`
  }))
});

export const renderJsonLdTags = (structuredDataList) =>
  structuredDataList
    .map(
      (data) =>
        `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
    )
    .join('\n');
