import fs from 'node:fs';
import path from 'node:path';

export const htmlEscape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const htmlEscapeAttr = (value) => htmlEscape(value);

export const stripHtmlTags = (input) =>
  String(input ?? '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getNested = (obj, key) =>
  key.split('.').reduce(
    (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
    obj
  );

export const loadJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
};

export const buildLocalizedPath = (defaultLanguage, lang, routePath) => {
  const normalized = routePath === '/' ? '' : routePath;
  if (lang === defaultLanguage) {
    return normalized || '/';
  }
  return `/${lang}${normalized}`;
};

export const buildCanonicalUrl = (baseUrl, defaultLanguage, lang, routePath) => {
  const localized = buildLocalizedPath(defaultLanguage, lang, routePath);
  return `${baseUrl}${localized === '/' ? '' : localized}`;
};

export const ensureDir = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

export const writeFile = (outputPath, contents) => {
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, contents);
};

export const safeIsoDate = (input) => {
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};
