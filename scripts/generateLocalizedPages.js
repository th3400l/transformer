import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const baseUrl = process.env.SITE_URL || 'https://txttohandwriting.org';
const defaultLanguage = 'en';

const htmlEscape = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const getNested = (obj, key) =>
  key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);

const getLanguages = () => {
  const localesDir = path.join(repoRoot, 'public', 'locales');
  if (!fs.existsSync(localesDir)) {
    return [defaultLanguage];
  }

  const entries = fs
    .readdirSync(localesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^[a-z]{2}(-[a-z0-9]+)?$/i.test(name))
    .map((name) => name.toLowerCase());

  const unique = Array.from(new Set(entries));
  const withoutDefault = unique.filter((lang) => lang !== defaultLanguage);
  return [defaultLanguage, ...withoutDefault];
};

const getLanguageLocales = () => {
  const configPath = path.join(repoRoot, 'services', 'languageConfig.ts');
  if (!fs.existsSync(configPath)) {
    return new Map([[defaultLanguage, 'en-US']]);
  }

  const source = fs.readFileSync(configPath, 'utf8');
  const regex = /code:\s*'([^']+)'.*?locale:\s*'([^']+)'/gs;
  const map = new Map();
  let match;
  while ((match = regex.exec(source)) !== null) {
    map.set(match[1], match[2]);
  }
  if (!map.has(defaultLanguage)) {
    map.set(defaultLanguage, 'en-US');
  }
  return map;
};

const getLanguageDirections = () => {
  const configPath = path.join(repoRoot, 'services', 'languageConfig.ts');
  if (!fs.existsSync(configPath)) {
    return new Map([[defaultLanguage, 'ltr']]);
  }

  const source = fs.readFileSync(configPath, 'utf8');
  const entryRegex = /{[^}]*code:\s*'([^']+)'[^}]*}/gs;
  const map = new Map();
  let match;
  while ((match = entryRegex.exec(source)) !== null) {
    const entry = match[0];
    const codeMatch = /code:\s*'([^']+)'/.exec(entry);
    const dirMatch = /dir:\s*'([^']+)'/.exec(entry);
    if (codeMatch) {
      map.set(codeMatch[1], dirMatch ? dirMatch[1] : 'ltr');
    }
  }

  if (!map.has(defaultLanguage)) {
    map.set(defaultLanguage, 'ltr');
  }

  return map;
};

const loadTranslations = (languages) => {
  const translations = new Map();
  languages.forEach((lang) => {
    const filePath = path.join(repoRoot, 'public', 'locales', lang, 'translation.json');
    if (fs.existsSync(filePath)) {
      translations.set(lang, JSON.parse(fs.readFileSync(filePath, 'utf8')));
    }
  });
  return translations;
};

const stripHtmlTags = (input) =>
  input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getBlogPosts = () => {
  const blogPath = path.join(repoRoot, 'services', 'blogPosts.ts');
  if (!fs.existsSync(blogPath)) {
    return [];
  }

  const source = fs.readFileSync(blogPath, 'utf8');
  const regex = /{\s*slug:\s*'([^']+)',\s*title:\s*'([^']+)',\s*date:\s*'([^']+)',\s*author:\s*'([^']+)',\s*content:\s*`([\s\S]*?)`\s*,?\s*}/g;
  const posts = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    posts.push({
      slug: match[1],
      title: match[2],
      content: match[5]
    });
  }
  return posts;
};

const buildLocalizedPath = (lang, routePath) => {
  const normalized = routePath === '/' ? '' : routePath;
  if (lang === defaultLanguage) {
    return normalized || '/';
  }
  return `/${lang}${normalized}`;
};

const buildAlternates = (languages, routePath) => {
  const alternates = languages.map((lang) => ({
    hreflang: lang,
    href: `${baseUrl}${buildLocalizedPath(lang, routePath) === '/' ? '' : buildLocalizedPath(lang, routePath)}`
  }));

  alternates.push({
    hreflang: 'x-default',
    href: `${baseUrl}${buildLocalizedPath(defaultLanguage, routePath) === '/' ? '' : buildLocalizedPath(defaultLanguage, routePath)}`
  });

  return alternates;
};

const updateMetaTag = (html, attr, key, value) => {
  const escapedValue = htmlEscape(value);
  const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${key}["'][^>]*>`, 'i');
  if (regex.test(html)) {
    return html.replace(regex, (match) => {
      if (/content=/i.test(match)) {
        return match.replace(/content=["'][^"']*["']/i, `content="${escapedValue}"`);
      }
      return match.replace(/>$/, ` content="${escapedValue}">`);
    });
  }
  return html.replace('</head>', `  <meta ${attr}="${key}" content="${escapedValue}" />\n</head>`);
};

const updateLinkTag = (html, rel, href) => {
  const escapedHref = htmlEscape(href);
  const regex = new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, 'i');
  if (regex.test(html)) {
    return html.replace(regex, (match) => {
      if (/href=/i.test(match)) {
        return match.replace(/href=["'][^"']*["']/i, `href="${escapedHref}"`);
      }
      return match.replace(/>$/, ` href="${escapedHref}">`);
    });
  }
  return html.replace('</head>', `  <link rel="${rel}" href="${escapedHref}" />\n</head>`);
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

const updateJsonLdLanguage = (html, locale) => {
  return html.replace(/"inLanguage":\s*"[^"]+"/gi, `"inLanguage": "${locale}"`);
};

const updateHtml = (html, meta, headline) => {
  let updated = html;

  updated = updateHtmlLang(updated, meta.lang);
  updated = updateHtmlDir(updated, meta.dir);
  updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(meta.title)}</title>`);

  // Inject localized H1 into root for SEO
  if (headline) {
    updated = updated.replace(
      /<div id="root">[\s\S]*?<\/div>/i,
      `<div id="root"><h1>${htmlEscape(headline)}</h1></div>`
    );
  }

  updated = updateMetaTag(updated, 'name', 'description', meta.description);
  updated = updateMetaTag(updated, 'property', 'og:description', meta.description);
  updated = updateMetaTag(updated, 'name', 'twitter:description', meta.description);

  updated = updateMetaTag(updated, 'name', 'title', meta.title);
  updated = updateMetaTag(updated, 'property', 'og:title', meta.title);
  updated = updateMetaTag(updated, 'name', 'twitter:title', meta.title);

  if (meta.keywords) {
    updated = updateMetaTag(updated, 'name', 'keywords', meta.keywords);
  }

  updated = updateMetaTag(updated, 'property', 'og:locale', meta.locale);
  updated = updateMetaTag(updated, 'http-equiv', 'content-language', meta.locale);
  updated = updateMetaTag(updated, 'name', 'language', meta.lang);

  updated = updateLinkTag(updated, 'canonical', meta.canonical);
  updated = updateMetaTag(updated, 'property', 'og:url', meta.canonical);
  updated = updateMetaTag(updated, 'name', 'twitter:url', meta.canonical);

  const robotsDirective = meta.noindex ? 'noindex, nofollow' : 'index, follow';
  updated = updateMetaTag(updated, 'name', 'robots', robotsDirective);
  updated = updateMetaTag(updated, 'name', 'googlebot', robotsDirective);

  updated = updated.replace(/<link\s+[^>]*rel=["']alternate["'][^>]*>\s*/gi, '');
  const alternateLinks = meta.alternates
    .map((alternate) =>
      `  <link rel="alternate" hreflang="${alternate.hreflang}" href="${htmlEscape(alternate.href)}" />`
    )
    .join('\n');

  updated = updated.replace('</head>', `${alternateLinks}\n</head>`);
  updated = updateJsonLdLanguage(updated, meta.locale);

  return updated;
};

const writeLocalizedPage = (distRoot, language, routePath, html) => {
  const localizedPath = buildLocalizedPath(language, routePath);
  const outputPath = localizedPath === '/'
    ? path.join(distRoot, 'index.html')
    : path.join(distRoot, localizedPath.replace(/^\//, ''), 'index.html');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
};

const distRoot = path.join(repoRoot, 'dist');
const baseHtmlPath = path.join(distRoot, 'index.html');

if (!fs.existsSync(baseHtmlPath)) {
  console.error('dist/index.html not found. Run the build before generating localized pages.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');
const languages = getLanguages();
const languageLocales = getLanguageLocales();
const languageDirections = getLanguageDirections();
const translations = loadTranslations(languages);
const fallbackTranslations = translations.get(defaultLanguage) || {};
const blogPosts = getBlogPosts();

const getTranslation = (lang, key) =>
  getNested(translations.get(lang) || {}, key) ?? getNested(fallbackTranslations, key);

const getRouteMeta = (lang, routePath, blogPost) => {
  const localizedBlogTitle = blogPost
    ? getTranslation(lang, `blogPosts.${blogPost.slug}.title`) || blogPost.title
    : null;
  const localizedBlogContent = blogPost
    ? getTranslation(lang, `blogPosts.${blogPost.slug}.content`) || blogPost.content
    : null;

  const title = (() => {
    if (blogPost) {
      return `${localizedBlogTitle} | txttohandwriting.org`;
    }
    if (routePath === '/about') return getTranslation(lang, 'pages.about.title');
    if (routePath === '/faq') return getTranslation(lang, 'pages.faq.title');
    if (routePath === '/terms') return getTranslation(lang, 'pages.terms.title');
    if (routePath === '/privacy') return getTranslation(lang, 'pages.privacy.title');
    if (routePath === '/blog') return getTranslation(lang, 'pages.blog.title');
    if (routePath === '/changelog') return getTranslation(lang, 'pages.changelog.title');
    return getTranslation(lang, 'seo.title');
  })();

  const description = (() => {
    if (blogPost) {
      const snippet = stripHtmlTags(localizedBlogContent || '').slice(0, 160);
      return snippet || getTranslation(lang, 'pages.blog.description') || getTranslation(lang, 'seo.description');
    }
    if (routePath === '/about') return getTranslation(lang, 'pages.about.description') || getTranslation(lang, 'seo.description');
    if (routePath === '/faq') return getTranslation(lang, 'pages.faq.description') || getTranslation(lang, 'seo.description');
    if (routePath === '/terms') return getTranslation(lang, 'pages.terms.description') || getTranslation(lang, 'seo.description');
    if (routePath === '/privacy') return getTranslation(lang, 'pages.privacy.description') || getTranslation(lang, 'seo.description');
    if (routePath === '/blog') return getTranslation(lang, 'pages.blog.description') || getTranslation(lang, 'seo.description');
    if (routePath === '/changelog') return getTranslation(lang, 'pages.changelog.description') || getTranslation(lang, 'seo.description');
    return getTranslation(lang, 'seo.description');
  })();

  const keywords = (() => {
    if (blogPost) return getTranslation(lang, 'pages.blogPost.keywords');
    if (routePath === '/about') return getTranslation(lang, 'pages.about.keywords');
    if (routePath === '/faq') return getTranslation(lang, 'pages.faq.keywords');
    if (routePath === '/terms') return getTranslation(lang, 'pages.terms.keywords');
    if (routePath === '/privacy') return getTranslation(lang, 'pages.privacy.keywords');
    if (routePath === '/blog') return getTranslation(lang, 'pages.blog.keywords');
    if (routePath === '/changelog') return getTranslation(lang, 'pages.changelog.keywords');
    return getTranslation(lang, 'seo.keywords');
  })();

  const canonicalPath = buildLocalizedPath(lang, routePath);
  const canonical = `${baseUrl}${canonicalPath === '/' ? '' : canonicalPath}`;
  const alternates = buildAlternates(languages, routePath);
  const locale = languageLocales.get(lang) || 'en-US';
  const dir = languageDirections.get(lang) || 'ltr';

  return {
    title: title || getTranslation(defaultLanguage, 'seo.title') || 'txttohandwriting.org',
    description: description || getTranslation(defaultLanguage, 'seo.description') || '',
    keywords,
    canonical,
    alternates,
    lang,
    locale,
    dir,
    noindex: routePath === '/notFound'
  };
};

const baseRoutes = ['/', '/about', '/faq', '/terms', '/blog', '/changelog', '/privacy'];
const blogRoutes = blogPosts.map((post) => ({ path: `/blog/${post.slug}`, post }));

const allRoutes = [
  ...baseRoutes.map((route) => ({ path: route })),
  ...blogRoutes
];

languages.forEach((language) => {
  allRoutes.forEach(({ path: routePath, post }) => {
    const meta = getRouteMeta(language, routePath, post);
    
    // Determine the primary headline for H1
    let headline = '';
    if (post) {
      headline = getTranslation(language, `blogPosts.${post.slug}.title`) || post.title;
    } else {
      switch (routePath) {
        case '/':
          headline = getTranslation(language, 'hero.headline');
          break;
        case '/about':
          headline = getTranslation(language, 'pages.about.title');
          break;
        case '/faq':
          headline = getTranslation(language, 'pages.faq.title');
          break;
        case '/terms':
          headline = getTranslation(language, 'pages.terms.title');
          break;
        case '/privacy':
          headline = getTranslation(language, 'pages.privacy.title');
          break;
        case '/blog':
          headline = getTranslation(language, 'pages.blog.title');
          break;
        case '/changelog':
          headline = getTranslation(language, 'pages.changelog.title');
          break;
      }
    }

    const updatedHtml = updateHtml(baseHtml, meta, headline);
    writeLocalizedPage(distRoot, language, routePath, updatedHtml);
  });
});

console.log('Localized HTML pages generated in dist/.');
