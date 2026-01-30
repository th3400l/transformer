export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  locale: string;
  hreflang?: string;
  dir?: 'ltr' | 'rtl';
}

export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', locale: 'en-US', hreflang: 'en' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', locale: 'es-ES', hreflang: 'es' },
  { code: 'fr', name: 'French', nativeName: 'Français', locale: 'fr-FR', hreflang: 'fr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', locale: 'de-DE', hreflang: 'de' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', locale: 'pt-BR', hreflang: 'pt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', locale: 'id-ID', hreflang: 'id' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', locale: 'zh-CN', hreflang: 'zh' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', locale: 'ja-JP', hreflang: 'ja' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', locale: 'ru-RU', hreflang: 'ru' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', locale: 'ko-KR', hreflang: 'ko' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', locale: 'it-IT', hreflang: 'it' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', locale: 'pl-PL', hreflang: 'pl' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', locale: 'tr-TR', hreflang: 'tr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', locale: 'ar-SA', hreflang: 'ar', dir: 'rtl' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', locale: 'he-IL', hreflang: 'he', dir: 'rtl' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', locale: 'fa-IR', hreflang: 'fa', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi-IN', hreflang: 'hi' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', locale: 'bn-BD', hreflang: 'bn' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', locale: 'ta-IN', hreflang: 'ta' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', locale: 'am-ET', hreflang: 'am' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', locale: 'th-TH', hreflang: 'th' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', locale: 'vi-VN', hreflang: 'vi' }
];

const LANGUAGE_LOOKUP = new Map(SUPPORTED_LANGUAGES.map((lang) => [lang.code, lang]));

export const getLanguageInfo = (code?: string | null): LanguageInfo | undefined => {
  if (!code) {
    return LANGUAGE_LOOKUP.get(DEFAULT_LANGUAGE);
  }
  const normalized = code.toLowerCase().split('-')[0];
  return LANGUAGE_LOOKUP.get(normalized) || LANGUAGE_LOOKUP.get(DEFAULT_LANGUAGE);
};

export const isSupportedLanguage = (code?: string | null): boolean => {
  if (!code) {
    return false;
  }
  const normalized = code.toLowerCase().split('-')[0];
  return LANGUAGE_LOOKUP.has(normalized);
};

export const supportedLanguageCodes = SUPPORTED_LANGUAGES.map((lang) => lang.code);
