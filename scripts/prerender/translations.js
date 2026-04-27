import fs from 'node:fs';
import path from 'node:path';
import { getNested } from './util.js';

export const getLanguages = (repoRoot, defaultLanguage) => {
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

export const getLanguageLocales = (repoRoot, defaultLanguage) => {
  const configPath = path.join(repoRoot, 'services', 'languageConfig.ts');
  const map = new Map();
  if (fs.existsSync(configPath)) {
    const source = fs.readFileSync(configPath, 'utf8');
    const regex = /code:\s*'([^']+)'.*?locale:\s*'([^']+)'/gs;
    let match;
    while ((match = regex.exec(source)) !== null) {
      map.set(match[1], match[2]);
    }
  }
  if (!map.has(defaultLanguage)) {
    map.set(defaultLanguage, 'en-US');
  }
  return map;
};

export const getLanguageDirections = (repoRoot, defaultLanguage) => {
  const configPath = path.join(repoRoot, 'services', 'languageConfig.ts');
  const map = new Map();
  if (fs.existsSync(configPath)) {
    const source = fs.readFileSync(configPath, 'utf8');
    const entryRegex = /{[^}]*code:\s*'([^']+)'[^}]*}/gs;
    let match;
    while ((match = entryRegex.exec(source)) !== null) {
      const entry = match[0];
      const codeMatch = /code:\s*'([^']+)'/.exec(entry);
      const dirMatch = /dir:\s*'([^']+)'/.exec(entry);
      if (codeMatch) {
        map.set(codeMatch[1], dirMatch ? dirMatch[1] : 'ltr');
      }
    }
  }
  if (!map.has(defaultLanguage)) {
    map.set(defaultLanguage, 'ltr');
  }
  return map;
};

export const loadTranslations = (repoRoot, languages) => {
  const translations = new Map();
  languages.forEach((lang) => {
    const filePath = path.join(repoRoot, 'public', 'locales', lang, 'translation.json');
    if (fs.existsSync(filePath)) {
      translations.set(lang, JSON.parse(fs.readFileSync(filePath, 'utf8')));
    }
  });
  return translations;
};

export const createTranslator = (translations, defaultLanguage) => {
  const fallback = translations.get(defaultLanguage) || {};
  return (lang, key, fallbackValue) => {
    const localeData = translations.get(lang) || {};
    const localized = getNested(localeData, key);
    if (localized !== undefined && localized !== null && localized !== '') {
      return localized;
    }
    const fallbackLocalized = getNested(fallback, key);
    if (fallbackLocalized !== undefined && fallbackLocalized !== null && fallbackLocalized !== '') {
      return fallbackLocalized;
    }
    return fallbackValue;
  };
};

export const hasOwnTranslation = (translations, lang, key) => {
  const localeData = translations.get(lang);
  if (!localeData) {
    return false;
  }
  const value = getNested(localeData, key);
  return value !== undefined && value !== null && value !== '';
};
