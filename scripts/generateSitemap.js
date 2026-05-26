import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const baseUrl = process.env.SITE_URL || 'https://www.txttohandwriting.org';
const defaultLanguage = 'en';

const toDateString = (date) => date.toISOString().split('T')[0];
const fallbackLastMod = toDateString(new Date());

const getNested = (obj, key) =>
  key.split('.').reduce(
    (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
    obj
  );

const loadTranslation = (language) => {
  const filePath = path.join(repoRoot, 'public', 'locales', language, 'translation.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
};

const hasTranslation = (translation, key) => {
  if (!translation) return false;
  const value = getNested(translation, key);
  return value !== undefined && value !== null && value !== '';
};

const getLanguages = () => {
  const localesDir = path.join(repoRoot, 'public', 'locales');
  if (!fs.existsSync(localesDir)) {
    return [defaultLanguage];
  }

  const languages = fs
    .readdirSync(localesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /^[a-z]{2}(-[a-z0-9]+)?$/i.test(name))
    .map((name) => name.toLowerCase())
    .sort();

  const uniqueLanguages = Array.from(new Set(languages));
  const withoutDefault = uniqueLanguages.filter((lang) => lang !== defaultLanguage);
  return [defaultLanguage, ...withoutDefault];
};

const getBlogEntries = () => {
  const blogPath = path.join(repoRoot, 'services', 'blogPosts.ts');
  if (!fs.existsSync(blogPath)) {
    return [];
  }

  const source = fs.readFileSync(blogPath, 'utf8');
  const slugMatches = Array.from(source.matchAll(/slug:\s*'((?:\\'|[^'])+)'/g));
  const titleMatches = Array.from(source.matchAll(/title:\s*'((?:\\'|[^'])+)'/g));
  const dateMatches = Array.from(source.matchAll(/date:\s*'((?:\\'|[^'])+)'/g));

  return slugMatches.map((match, index) => {
    const slug = match[1].replace(/\\'/g, "'");
    const title = (titleMatches[index]?.[1] || slug).replace(/\\'/g, "'");
    const dateValue = dateMatches[index]?.[1]?.replace(/\\'/g, "'");
    const parsedDate = dateValue ? new Date(dateValue) : null;
    const lastmod = parsedDate && !Number.isNaN(parsedDate.valueOf())
      ? toDateString(parsedDate)
      : fallbackLastMod;

    return {
      slug,
      title,
      path: `/blog/${slug}`,
      lastmod,
      changefreq: 'monthly',
      priority: 0.65,
      isBlogPost: true
    };
  });
};

const buildUrl = (language, pathName) => {
  const normalizedPath = pathName === '/' ? '' : pathName;
  const localizedPath = language === defaultLanguage
    ? normalizedPath
    : `/${language}${normalizedPath}`;
  return `${baseUrl}${localizedPath}`;
};

const buildAlternates = (eligibleLanguages, pathName) => {
  const alternates = eligibleLanguages.map((language) => ({
    hreflang: language,
    href: buildUrl(language, pathName)
  }));
  alternates.push({
    hreflang: 'x-default',
    href: buildUrl(defaultLanguage, pathName)
  });
  return alternates;
};

const staticPages = [
  { path: '/', lastmod: fallbackLastMod, changefreq: 'weekly', priority: 1.0 },
  { path: '/about', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.7 },
  { path: '/faq', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.7 },
  { path: '/contact', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.7, translationKey: 'pages.contact.title' },
  { path: '/terms', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.4 },
  { path: '/privacy', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.4 },
  { path: '/blog', lastmod: fallbackLastMod, changefreq: 'weekly', priority: 0.8 },
  { path: '/changelog', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.6 }
];

const languages = getLanguages();
const translationCache = new Map();
languages.forEach((lang) => {
  translationCache.set(lang, loadTranslation(lang));
});

const blogEntries = getBlogEntries();
const pages = [...staticPages, ...blogEntries];

const eligibleLanguagesForPage = (page) => {
  if (page.isBlogPost) {
    return languages.filter((lang) => {
      if (lang === defaultLanguage) return true;
      return hasTranslation(translationCache.get(lang), `blogPosts.${page.slug}.content`);
    });
  }
  // Static pages whose copy is never translated (e.g. /contact) must only be
  // listed for the default language; the localized variants are noindex and
  // canonicalized to English, so including them would resurface the
  // "Duplicate, Google chose different canonical" issue.
  if (page.translationKey) {
    return languages.filter((lang) => {
      if (lang === defaultLanguage) return true;
      return hasTranslation(translationCache.get(lang), page.translationKey);
    });
  }
  return languages;
};

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
];

pages.forEach((page) => {
  const eligibleLanguages = eligibleLanguagesForPage(page);
  const alternates = buildAlternates(eligibleLanguages, page.path);

  eligibleLanguages.forEach((language) => {
    lines.push('  <url>');
    lines.push(`    <loc>${buildUrl(language, page.path)}</loc>`);
    lines.push(`    <lastmod>${page.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${page.changefreq}</changefreq>`);
    lines.push(`    <priority>${page.priority}</priority>`);

    alternates.forEach((alternate) => {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`
      );
    });

    lines.push('  </url>');
  });
});

lines.push('</urlset>');

const outputPath = path.join(repoRoot, 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, lines.join('\n'));
console.log(`Sitemap written to ${outputPath} (${pages.length} routes across eligible languages).`);

const imageSitemapLines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
];

blogEntries.forEach((entry) => {
  imageSitemapLines.push('  <url>');
  imageSitemapLines.push(`    <loc>${baseUrl}${entry.path}</loc>`);
  imageSitemapLines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  imageSitemapLines.push('    <image:image>');
  imageSitemapLines.push(`      <image:loc>${baseUrl}/app-screenshot.jpg</image:loc>`);
  imageSitemapLines.push(`      <image:title><![CDATA[${entry.title.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]></image:title>`);
  imageSitemapLines.push('    </image:image>');
  imageSitemapLines.push('  </url>');
});

imageSitemapLines.push('</urlset>');

const imageSitemapOutputPath = path.join(repoRoot, 'public', 'sitemap-images.xml');
fs.writeFileSync(imageSitemapOutputPath, `${imageSitemapLines.join('\n')}\n`);
console.log(`Image sitemap written to ${imageSitemapOutputPath} (${blogEntries.length} blog images).`);
