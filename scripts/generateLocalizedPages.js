import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  htmlEscape,
  stripHtmlTags,
  buildLocalizedPath,
  buildCanonicalUrl,
  writeFile
} from './prerender/util.js';
import {
  getLanguages,
  getLanguageLocales,
  getLanguageDirections,
  loadTranslations,
  createTranslator,
  hasOwnTranslation
} from './prerender/translations.js';
import { parseBlogPosts, parseChangelogEntries } from './prerender/blogPosts.js';
import {
  buildWebsiteStructuredData,
  buildOrganizationStructuredData,
  buildWebApplicationStructuredData,
  buildBreadcrumbStructuredData,
  buildFaqStructuredData,
  buildAboutStructuredData,
  buildPrivacyStructuredData,
  buildTermsStructuredData,
  buildContactStructuredData,
  buildBlogStructuredData,
  buildBlogPostStructuredData,
  buildChangelogStructuredData,
  renderJsonLdTags
} from './prerender/structuredData.js';
import { renderHomeBody } from './prerender/renderHome.js';
import {
  renderAboutBody,
  renderFaqBody,
  renderFaqEntries,
  renderContactBody,
  renderChangelogBody
} from './prerender/renderInfo.js';
import { renderPrivacyBody, renderTermsBody } from './prerender/renderLegal.js';
import { renderBlogListBody, renderBlogPostBody } from './prerender/renderBlog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const baseUrl = process.env.SITE_URL || 'https://www.txttohandwriting.org';
const defaultLanguage = 'en';
const supportEmail = 'nsa.tools@proton.me';
const socialImage = `${baseUrl}/app-screenshot.jpg`;

const distRoot = path.join(repoRoot, 'dist');
const baseHtmlPath = path.join(distRoot, 'index.html');

if (!fs.existsSync(baseHtmlPath)) {
  console.error('dist/index.html not found. Run vite build before generating localized pages.');
  process.exit(1);
}

const languages = getLanguages(repoRoot, defaultLanguage);
const languageLocales = getLanguageLocales(repoRoot, defaultLanguage);
const languageDirections = getLanguageDirections(repoRoot, defaultLanguage);
const translations = loadTranslations(repoRoot, languages);
const translate = createTranslator(translations, defaultLanguage);
const blogPosts = parseBlogPosts(repoRoot);
const changelogEntries = parseChangelogEntries(repoRoot);
const faqEntries = renderFaqEntries();

const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');

const updateMetaTag = (html, attr, key, value) => {
  const escaped = htmlEscape(value);
  const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${key}["'][^>]*>`, 'i');
  if (regex.test(html)) {
    return html.replace(regex, (match) => {
      if (/content=/i.test(match)) {
        return match.replace(/content=["'][^"']*["']/i, `content="${escaped}"`);
      }
      return match.replace(/>$/, ` content="${escaped}">`);
    });
  }
  return html.replace('</head>', `  <meta ${attr}="${key}" content="${escaped}" />\n</head>`);
};

const updateLinkTag = (html, rel, href) => {
  const escaped = htmlEscape(href);
  const regex = new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, 'i');
  if (regex.test(html)) {
    return html.replace(regex, (match) => {
      if (/href=/i.test(match)) {
        return match.replace(/href=["'][^"']*["']/i, `href="${escaped}"`);
      }
      return match.replace(/>$/, ` href="${escaped}">`);
    });
  }
  return html.replace('</head>', `  <link rel="${rel}" href="${escaped}" />\n</head>`);
};

const updateHtmlLang = (html, lang) => {
  if (/<html[^>]*lang=["'][^"']+["'][^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)lang=["'][^"']+["']([^>]*)>/i, `<html$1lang="${lang}"$2>`);
  }
  return html.replace(/<html([^>]*)>/i, `<html$1 lang="${lang}">`);
};

const updateHtmlDir = (html, dir) => {
  if (!dir) {
    return html;
  }
  if (/<html[^>]*dir=["'][^"']+["'][^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)dir=["'][^"']+["']([^>]*)>/i, `<html$1dir="${dir}"$2>`);
  }
  return html.replace(/<html([^>]*)>/i, `<html$1 dir="${dir}">`);
};

const stripExistingJsonLd = (html) =>
  html.replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

const stripExistingAlternates = (html) =>
  html.replace(/<link\s+[^>]*rel=["']alternate["'][^>]*>\s*/gi, '');

const writeLocalizedPage = (language, routePath, html) => {
  const localizedPath = buildLocalizedPath(defaultLanguage, language, routePath);
  const outputPath =
    localizedPath === '/'
      ? path.join(distRoot, 'index.html')
      : path.join(distRoot, localizedPath.replace(/^\//, ''), 'index.html');
  writeFile(outputPath, html);
};

const formatTitle = (mainTitle) => {
  if (!mainTitle) return 'txttohandwriting.org';
  const suffix = ' | txt2hw';
  if (mainTitle.length + suffix.length <= 60) {
    return mainTitle + suffix;
  }
  return mainTitle.slice(0, 60);
};

const buildAlternates = (routePath) => {
  const alternates = languages.map((lang) => ({
    hreflang: lang,
    href: buildCanonicalUrl(baseUrl, defaultLanguage, lang, routePath)
  }));
  alternates.push({
    hreflang: 'x-default',
    href: buildCanonicalUrl(baseUrl, defaultLanguage, defaultLanguage, routePath)
  });
  return alternates;
};

const homeBreadcrumb = (lang) => [
  { name: translate(lang, 'common.backToLab', 'Home'), path: buildLocalizedPath(defaultLanguage, lang, '/') }
];

const breadcrumb = (lang, items) => [...homeBreadcrumb(lang), ...items];

const buildRouteContent = (lang, locale, routePath, post) => {
  const canonicalUrl = buildCanonicalUrl(baseUrl, defaultLanguage, lang, routePath);
  const localizedRootUrl = `${baseUrl}${buildLocalizedPath(defaultLanguage, lang, '/') === '/' ? '' : buildLocalizedPath(defaultLanguage, lang, '/')}`;
  const sharedSchemas = [
    buildWebsiteStructuredData(baseUrl, locale),
    buildOrganizationStructuredData(baseUrl)
  ];

  if (post) {
    const localizedTitle = translate(lang, `blogPosts.${post.slug}.title`, post.title);
    const localizedContent = translate(lang, `blogPosts.${post.slug}.content`, post.content);
    const articleBody = stripHtmlTags(localizedContent);
    const description = articleBody.slice(0, 160);
    const localizedPost = { ...post, title: localizedTitle, content: localizedContent };
    const noindex = lang !== defaultLanguage && !hasOwnTranslation(translations, lang, `blogPosts.${post.slug}.content`);
    // An untranslated localized post is the English article under a localized
    // URL. Canonicalize it to the English original (instead of self-canonical)
    // so Search Console consolidates signals rather than reporting
    // "Duplicate, Google chose different canonical", and skip the BlogPosting
    // schema so we don't assert a duplicate article on a canonicalized page.
    const englishCanonicalUrl = buildCanonicalUrl(baseUrl, defaultLanguage, defaultLanguage, routePath);
    return {
      title: formatTitle(localizedTitle),
      description: description.length === articleBody.length ? description : `${description}…`,
      keywords: translate(
        lang,
        'pages.blogPost.keywords',
        `handwriting blog, ${localizedTitle.toLowerCase()}, txttohandwriting`
      ),
      canonicalUrl: noindex ? englishCanonicalUrl : canonicalUrl,
      noindex,
      ogType: 'article',
      bodyHtml: renderBlogPostBody(translate, lang, locale, localizedPost),
      structuredData: noindex
        ? [...sharedSchemas]
        : [
            ...sharedSchemas,
            buildBlogPostStructuredData(localizedRootUrl, localizedPost, socialImage, locale),
            buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
              { name: translate(lang, 'pages.blog.title', 'Blog'), path: buildLocalizedPath(defaultLanguage, lang, '/blog') },
              { name: localizedTitle, path: buildLocalizedPath(defaultLanguage, lang, `/blog/${post.slug}`) }
            ]))
          ]
    };
  }

  switch (routePath) {
    case '/': {
      const title = translate(lang, 'seo.title', 'Handwriting Generator - Convert Text to Realistic Handwriting');
      const description = translate(
        lang,
        'seo.description',
        'Transform typed text into authentic handwritten documents with our free online handwriting generator.'
      );
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'seo.keywords', 'handwriting generator, text to handwriting, custom fonts'),
        canonicalUrl,
        noindex: false,
        ogType: 'website',
        bodyHtml: renderHomeBody(translate, lang),
        structuredData: [
          ...sharedSchemas,
          buildWebApplicationStructuredData(baseUrl, locale)
        ]
      };
    }
    case '/about': {
      const title = translate(lang, 'pages.about.title', 'About Our Platform');
      const description = translate(
        lang,
        'pages.about.description',
        'Learn about the people, mission, and technical principles behind txttohandwriting.org.'
      );
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'pages.about.keywords', 'about handwriting generator, mission, privacy-first'),
        canonicalUrl,
        noindex: false,
        ogType: 'website',
        bodyHtml: renderAboutBody(translate, lang),
        structuredData: [
          ...sharedSchemas,
          buildAboutStructuredData(canonicalUrl, locale),
          buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
            { name: title, path: buildLocalizedPath(defaultLanguage, lang, '/about') }
          ]))
        ]
      };
    }
    case '/faq': {
      const title = translate(lang, 'pages.faq.title', 'Frequently Asked Questions');
      const description = translate(
        lang,
        'pages.faq.description',
        'Answers about pricing, privacy, downloads, file formats, and usage rights for the txttohandwriting handwriting generator.'
      );
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'pages.faq.keywords', 'handwriting generator help, support, usage guide'),
        canonicalUrl,
        noindex: false,
        ogType: 'website',
        bodyHtml: renderFaqBody(translate, lang),
        structuredData: [
          ...sharedSchemas,
          buildFaqStructuredData(faqEntries),
          buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
            { name: title, path: buildLocalizedPath(defaultLanguage, lang, '/faq') }
          ]))
        ]
      };
    }
    case '/privacy': {
      const title = translate(lang, 'pages.privacy.title', 'Privacy Policy');
      const description = translate(
        lang,
        'pages.privacy.description',
        'Learn how txttohandwriting.org protects your privacy through client-side processing and minimal data collection.'
      );
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'pages.privacy.keywords', 'privacy policy, data security, handwriting generator'),
        canonicalUrl,
        noindex: false,
        ogType: 'website',
        bodyHtml: renderPrivacyBody(translate, lang),
        structuredData: [
          ...sharedSchemas,
          buildPrivacyStructuredData(canonicalUrl, locale),
          buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
            { name: title, path: buildLocalizedPath(defaultLanguage, lang, '/privacy') }
          ]))
        ]
      };
    }
    case '/terms': {
      const title = translate(lang, 'pages.terms.title', 'Terms of Service');
      const description = translate(
        lang,
        'pages.terms.description',
        'Review the terms of service, usage policies, and consent details for txttohandwriting.org.'
      );
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'pages.terms.keywords', 'terms of service, usage policy, handwriting generator'),
        canonicalUrl,
        noindex: false,
        ogType: 'website',
        bodyHtml: renderTermsBody(translate, lang),
        structuredData: [
          ...sharedSchemas,
          buildTermsStructuredData(canonicalUrl, locale),
          buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
            { name: title, path: buildLocalizedPath(defaultLanguage, lang, '/terms') }
          ]))
        ]
      };
    }
    case '/changelog': {
      const title = translate(lang, 'pages.changelog.title', 'Product Updates');
      const description = translate(
        lang,
        'pages.changelog.description',
        'Follow every release of txttohandwriting.org, from launch day to the latest update.'
      );
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'pages.changelog.keywords', 'product updates, changelog'),
        canonicalUrl,
        noindex: false,
        ogType: 'website',
        bodyHtml: renderChangelogBody(translate, lang, changelogEntries),
        structuredData: [
          ...sharedSchemas,
          buildChangelogStructuredData(canonicalUrl, changelogEntries, locale),
          buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
            { name: title, path: buildLocalizedPath(defaultLanguage, lang, '/changelog') }
          ]))
        ]
      };
    }
    case '/contact': {
      const title = translate(lang, 'pages.contact.title', 'Contact Us');
      const description = translate(
        lang,
        'pages.contact.description',
        'Reach the txttohandwriting.org team for support, partnerships, editorial pitches, and bug reports.'
      );
      // The contact page carries no translated copy in any locale, so every
      // /<lang>/contact is the English page under a localized URL. Search
      // Console reports all of them as "Duplicate, Google chose different
      // canonical". Mark untranslated localized variants noindex and point
      // their canonical at the English /contact so signals consolidate.
      const contactUntranslated =
        lang !== defaultLanguage && !hasOwnTranslation(translations, lang, 'pages.contact.title');
      const englishContactUrl = buildCanonicalUrl(baseUrl, defaultLanguage, defaultLanguage, routePath);
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'pages.contact.keywords', 'contact, support, txttohandwriting'),
        canonicalUrl: contactUntranslated ? englishContactUrl : canonicalUrl,
        noindex: contactUntranslated,
        ogType: 'website',
        bodyHtml: renderContactBody(translate, lang, supportEmail),
        structuredData: contactUntranslated
          ? [...sharedSchemas]
          : [
              ...sharedSchemas,
              buildContactStructuredData(canonicalUrl, locale, supportEmail),
              buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
                { name: title, path: buildLocalizedPath(defaultLanguage, lang, '/contact') }
              ]))
            ]
      };
    }
    case '/blog':
    default: {
      const title = translate(lang, 'pages.blog.title', 'Educational Insights');
      const description = translate(
        lang,
        'pages.blog.description',
        'Guides, inspiration, and tips for turning typed text into aesthetic handwriting for Studygram, planners, and assignments.'
      );
      return {
        title: formatTitle(title),
        description,
        keywords: translate(lang, 'pages.blog.keywords', 'handwriting blog, studygram handwriting tips'),
        canonicalUrl,
        noindex: false,
        ogType: 'website',
        bodyHtml: renderBlogListBody(translate, lang, locale, blogPosts),
        structuredData: [
          ...sharedSchemas,
          buildBlogStructuredData(localizedRootUrl, blogPosts, locale),
          buildBreadcrumbStructuredData(baseUrl, breadcrumb(lang, [
            { name: title, path: buildLocalizedPath(defaultLanguage, lang, '/blog') }
          ]))
        ]
      };
    }
  }
};

const applyContent = (html, content, lang, routePath) => {
  let updated = html;
  const locale = languageLocales.get(lang) || 'en-US';
  const dir = languageDirections.get(lang) || 'ltr';

  updated = updateHtmlLang(updated, lang);
  updated = updateHtmlDir(updated, dir);
  updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(content.title)}</title>`);

  updated = updateMetaTag(updated, 'name', 'description', content.description);
  updated = updateMetaTag(updated, 'property', 'og:description', content.description);
  updated = updateMetaTag(updated, 'name', 'twitter:description', content.description);

  updated = updateMetaTag(updated, 'name', 'title', content.title);
  updated = updateMetaTag(updated, 'property', 'og:title', content.title);
  updated = updateMetaTag(updated, 'name', 'twitter:title', content.title);
  updated = updateMetaTag(updated, 'property', 'og:type', content.ogType);

  if (content.keywords) {
    updated = updateMetaTag(updated, 'name', 'keywords', content.keywords);
  }

  updated = updateMetaTag(updated, 'property', 'og:locale', locale);
  updated = updateMetaTag(updated, 'http-equiv', 'content-language', locale);
  updated = updateMetaTag(updated, 'name', 'language', lang);

  updated = updateLinkTag(updated, 'canonical', content.canonicalUrl);
  updated = updateMetaTag(updated, 'property', 'og:url', content.canonicalUrl);
  updated = updateMetaTag(updated, 'name', 'twitter:url', content.canonicalUrl);

  const robotsDirective = content.noindex ? 'noindex, nofollow' : 'index, follow';
  updated = updateMetaTag(updated, 'name', 'robots', robotsDirective);
  updated = updateMetaTag(updated, 'name', 'googlebot', robotsDirective);

  updated = stripExistingAlternates(updated);
  if (!content.noindex) {
    const alternates = buildAlternates(routePath)
      .map(
        (alternate) =>
          `  <link rel="alternate" hreflang="${alternate.hreflang}" href="${htmlEscape(alternate.href)}" />`
      )
      .join('\n');
    updated = updated.replace('</head>', `${alternates}\n</head>`);
  }

  updated = stripExistingJsonLd(updated);
  const jsonLdTags = renderJsonLdTags(content.structuredData);
  updated = updated.replace('</head>', `${jsonLdTags}\n</head>`);

  updated = updated.replace(
    /<div id="root">[\s\S]*?<\/div>\s*<\/body>/i,
    `<div id="root">${content.bodyHtml}</div>\n  </body>`
  );

  return updated;
};

const baseRoutes = ['/', '/about', '/faq', '/privacy', '/terms', '/changelog', '/contact', '/blog'];
const blogPostRoutes = blogPosts.map((post) => ({ path: `/blog/${post.slug}`, post }));
const allRoutes = [
  ...baseRoutes.map((routePath) => ({ path: routePath })),
  ...blogPostRoutes
];

let pageCount = 0;
languages.forEach((lang) => {
  const locale = languageLocales.get(lang) || 'en-US';
  allRoutes.forEach(({ path: routePath, post }) => {
    const content = buildRouteContent(lang, locale, routePath, post);
    const html = applyContent(baseHtml, content, lang, routePath);
    writeLocalizedPage(lang, routePath, html);
    pageCount += 1;
  });
});

console.log(`Localized HTML pages generated in dist/ (${pageCount} files).`);
