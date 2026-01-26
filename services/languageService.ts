import i18n from '../src/i18n';
import {
  DEFAULT_LANGUAGE,
  LanguageInfo,
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
  isSupportedLanguage
} from './languageConfig';
import { normalizeLanguageCode } from './languageRouting';

export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, getLanguageInfo, isSupportedLanguage };

export class LanguageService {
  private static instance: LanguageService;

  private constructor() {
    i18n.on('languageChanged', (lng) => {
      this.handleLanguageChange(lng);
    });
  }

  public static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  public async changeLanguage(languageCode: string): Promise<void> {
    const normalized = normalizeLanguageCode(languageCode);
    if (normalized && isSupportedLanguage(normalized)) {
      await i18n.changeLanguage(normalized);
    }
  }

  public getCurrentLanguage(): string {
    const normalized = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
    return normalized && isSupportedLanguage(normalized) ? normalized : DEFAULT_LANGUAGE;
  }

  public getSupportedLanguages(): LanguageInfo[] {
    return SUPPORTED_LANGUAGES;
  }

  private handleLanguageChange(lng: string): void {
    const normalized = normalizeLanguageCode(lng);
    if (normalized && !isSupportedLanguage(normalized)) {
      void i18n.changeLanguage(DEFAULT_LANGUAGE);
      return;
    }

    if (typeof document !== 'undefined') {
      const language = getLanguageInfo(normalized || lng);
      document.documentElement.lang = language?.hreflang || language?.code || DEFAULT_LANGUAGE;
      document.documentElement.dir = language?.dir || 'ltr';
      // Update SEO tags logic could go here, but SEOOptimizer handles it too.
      // We might need to refresh SEO tags with new translations.
    }
  }
}

export const languageService = LanguageService.getInstance();
