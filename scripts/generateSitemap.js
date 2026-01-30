import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const baseUrl = process.env.SITE_URL || 'https://txttohandwriting.org';
const defaultLanguage = 'en';

const toDateString = (date) => date.toISOString().split('T')[0];
const fallbackLastMod = toDateString(new Date());

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
  const slugMatches = Array.from(source.matchAll(/slug:\s*'([^']+)'/g));
  const dateMatches = Array.from(source.matchAll(/date:\s*'([^']+)'/g));

  return slugMatches.map((match, index) => {
    const slug = match[1];
    const dateValue = dateMatches[index]?.[1];
    const parsedDate = dateValue ? new Date(dateValue) : null;
    const lastmod = parsedDate && !Number.isNaN(parsedDate.valueOf())
      ? toDateString(parsedDate)
      : fallbackLastMod;

    return {
      path: `/blog/${slug}`,
      lastmod,
      changefreq: 'monthly',
      priority: 0.65
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

const buildAlternates = (languages, pathName) => {
  const alternates = languages.map((language) => ({
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
  { path: '/', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 1.0 },
  { path: '/about', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.7 },
  { path: '/faq', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.6 },
  { path: '/terms', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.4 },
  { path: '/privacy', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.4 },
  { path: '/blog', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.7 },
  { path: '/changelog', lastmod: fallbackLastMod, changefreq: 'monthly', priority: 0.6 }
];

const languages = getLanguages();
const pages = [...staticPages, ...getBlogEntries()];

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
];

pages.forEach((page) => {
  const alternates = buildAlternates(languages, page.path);

  languages.forEach((language) => {
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
console.log(`Sitemap written to ${outputPath}`);
