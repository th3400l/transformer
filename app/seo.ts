import { StructuredData } from '../services/seoOptimizer';
import { FAQ_ENTRIES, Page, CHANGELOG_ENTRIES } from './constants';

export const stripHtmlTags = (input: string): string =>
  input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const createFaqStructuredData = (): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ENTRIES.map(entry => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: entry.answer
    }
  }))
});

export const createTipsFaqStructuredData = (tips: Array<{ title: string; description: string }>): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: tips.map(tip => ({
    '@type': 'Question',
    name: tip.title,
    acceptedAnswer: {
      '@type': 'Answer',
      text: tip.description
    }
  }))
});

export const createTermsStructuredData = (url: string): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms and Conditions - txttohandwriting.org',
  url,
  description: 'Terms of service, data use, and consent information for txttohandwriting.org.',
  inLanguage: 'en-US'
});

export const createAboutStructuredData = (url: string): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About txttohandwriting.org',
  url,
  description: 'Story, mission, and team behind txttohandwriting.org — the handwriting generator crafted for students and creators.'
});

export const createBlogStructuredData = (baseUrl: string, posts: Array<{ slug: string; title: string; date: string; author: string }>): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'txttohandwriting.org Blog',
  description: 'Guides and ideas for turning typed text into aesthetic handwriting for study notes, planners, and content.',
  url: `${baseUrl}/blog`,
  blogPost: posts.map(post => ({
    '@type': 'BlogPosting',
    headline: post.title,
    url: `${baseUrl}/blog/${post.slug}`,
    datePublished: (() => {
      const parsed = new Date(post.date);
      return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    })(),
    author: {
      '@type': 'Person',
      name: post.author
    }
  }))
});

export const createBlogPostStructuredData = (
  baseUrl: string,
  post: { slug: string; title: string; date: string; author: string; content: string },
  socialImage: string
): StructuredData => {
  const parsed = new Date(post.date);
  const isoDate = isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  const articleBody = stripHtmlTags(post.content);
  const description = articleBody.slice(0, 220);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    articleBody,
    datePublished: isoDate,
    dateModified: isoDate,
    url: `${baseUrl}/blog/${post.slug}`,
    image: socialImage,
    author: {
      '@type': 'Person',
      name: post.author
    }
  };
};

export const createChangelogStructuredData = (url: string): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'txttohandwriting.org Product Updates',
  url,
  itemListElement: CHANGELOG_ENTRIES.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: `Version ${entry.version}`,
    description: entry.tagline,
    url: `${url}#v${entry.version.replace(/\./g, '-')}`
  }))
});

export const createBreadcrumbStructuredData = (
  baseUrl: string,
  items: Array<{ name: string; path: string }>
): StructuredData => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${baseUrl}${item.path}`
  }))
});

export const validateStructuredData = (data: StructuredData): boolean => {
  try {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      console.warn('Structured data validation failed: data is not an object');
      return false;
    }

    // Check for required @context
    if (!data['@context']) {
      console.warn('Structured data validation failed: missing @context');
      return false;
    }

    // Check for required @type
    if (!data['@type']) {
      console.warn('Structured data validation failed: missing @type');
      return false;
    }

    // Validate @context is a valid URL or schema.org
    const context = data['@context'] as string;
    if (!context.includes('schema.org') && !context.startsWith('http')) {
      console.warn('Structured data validation failed: invalid @context');
      return false;
    }

    // Type-specific validation
    const type = data['@type'] as string;
    
    switch (type) {
      case 'FAQPage':
        if (!Array.isArray(data.mainEntity) || data.mainEntity.length === 0) {
          console.warn('FAQPage validation failed: mainEntity must be a non-empty array');
          return false;
        }
        break;
      
      case 'BlogPosting':
        if (!data.headline || !data.datePublished) {
          console.warn('BlogPosting validation failed: missing required fields (headline, datePublished)');
          return false;
        }
        break;
      
      case 'BreadcrumbList':
        if (!Array.isArray(data.itemListElement) || data.itemListElement.length === 0) {
          console.warn('BreadcrumbList validation failed: itemListElement must be a non-empty array');
          return false;
        }
        break;
      
      case 'WebApplication':
        if (!data.name || !data.url) {
          console.warn('WebApplication validation failed: missing required fields (name, url)');
          return false;
        }
        break;
      
      case 'Blog':
        if (!data.name || !data.url) {
          console.warn('Blog validation failed: missing required fields (name, url)');
          return false;
        }
        break;
      
      case 'ItemList':
        if (!Array.isArray(data.itemListElement)) {
          console.warn('ItemList validation failed: itemListElement must be an array');
          return false;
        }
        break;
    }

    return true;
  } catch (error) {
    console.error('Structured data validation error:', error);
    return false;
  }
};

export const getPathForPage = (page: Page, slug: string | null): string => {
  switch (page) {
    case 'terms':
      return '/terms';
    case 'faq':
      return '/faq';
    case 'about':
      return '/about';
    case 'blog':
      return '/blog';
    case 'blogPost':
      return slug ? `/blog/${slug}` : '/blog';
    case 'changelog':
      return '/changelog';
    case 'notFound':
      return '/';
    case 'main':
    default:
      return '/';
  }
};
