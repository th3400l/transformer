import { DEFAULT_LANGUAGE, isSupportedLanguage } from './languageConfig';

export interface ParsedLanguagePath {
  language: string | null;
  path: string;
  hasLanguagePrefix: boolean;
}

export const normalizeLanguageCode = (code?: string | null): string | null => {
  if (!code) {
    return null;
  }
  return code.toLowerCase().split('-')[0];
};

export const normalizePath = (path: string): string => {
  if (!path) {
    return '/';
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return '/';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = withLeading.replace(/\/+$/, '');
  return normalized === '' ? '/' : normalized;
};

export const parsePathWithLanguage = (pathname: string): ParsedLanguagePath => {
  const normalized = normalizePath(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const maybeLang = segments[0] ? normalizeLanguageCode(segments[0]) : null;

  if (maybeLang && isSupportedLanguage(maybeLang)) {
    const remaining = segments.slice(1).join('/');
    const path = remaining ? `/${remaining}` : '/';
    return {
      language: maybeLang,
      path,
      hasLanguagePrefix: true
    };
  }

  return {
    language: null,
    path: normalized,
    hasLanguagePrefix: false
  };
};

export const buildLocalizedPath = (
  path: string,
  language: string | null,
  options: { includeDefault?: boolean } = {}
): string => {
  const normalizedPath = normalizePath(path);
  const normalizedLang = normalizeLanguageCode(language) || DEFAULT_LANGUAGE;

  if (!isSupportedLanguage(normalizedLang)) {
    return normalizedPath;
  }

  const parsed = parsePathWithLanguage(normalizedPath);
  const basePath = parsed.hasLanguagePrefix ? parsed.path : normalizedPath;

  const shouldPrefix = options.includeDefault || normalizedLang !== DEFAULT_LANGUAGE;
  if (!shouldPrefix) {
    return basePath;
  }

  const suffix = basePath === '/' ? '' : basePath;
  return `/${normalizedLang}${suffix}`;
};
