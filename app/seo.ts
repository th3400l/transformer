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
