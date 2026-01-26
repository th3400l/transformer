import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, getLanguageInfo, isSupportedLanguage, languageService } from '../services/languageService';
import { normalizeLanguageCode } from '../services/languageRouting';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedLanguage = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
  const activeLanguageCode = normalizedLanguage && isSupportedLanguage(normalizedLanguage)
    ? normalizedLanguage
    : DEFAULT_LANGUAGE;
  const currentLang = getLanguageInfo(activeLanguageCode) || SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    languageService.changeLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef} translate="no">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-sm font-medium text-[var(--text-color)]"
        aria-label="Select Language"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span className="hidden sm:inline" lang={currentLang.hreflang || currentLang.code} translate="no">
          {currentLang.nativeName}
        </span>
        <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-paper)] rounded-lg shadow-xl border border-[var(--panel-border)] py-1 max-h-60 overflow-y-auto">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-secondary)] transition-colors flex justify-between items-center
                ${(activeLanguageCode === lang.code) ? 'text-[var(--accent-color)] font-medium' : 'text-[var(--text-color)]'}`}
            >
              <span lang={lang.hreflang || lang.code} translate="no">{lang.nativeName}</span>
              {(activeLanguageCode === lang.code) && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
