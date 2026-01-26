/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useTranslation } from 'react-i18next';
import SupportCTA from './SupportCTA';
import { getLanguageInfo } from '../services/languageService';

interface PageProps {
  onGoBack: () => void;
}

const TermsPage: React.FC<PageProps> = ({ onGoBack }) => {
  const { t, i18n } = useTranslation();
  const locale = getLanguageInfo(i18n.resolvedLanguage || i18n.language)?.locale || 'en-US';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 id="terms" className="text-3xl font-bold text-[var(--accent-color)]">{t('pages.terms.title', 'Terms and Conditions')}</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; {t('pages.terms.back', 'Back to Generator')}
          </button>
        </div>
        <div className="text-[var(--text-muted)] space-y-4 leading-relaxed">
          <p>{t('pages.terms.lastUpdated', 'Last updated')}: {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>
            {t('pages.terms.welcome')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section1Title')}</h2>
          <p>
            {t('pages.terms.section1Content')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section2Title')}</h2>
          <p>
            {t('pages.terms.section2Content')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section3Title')}</h2>
          <p>
            {t('pages.terms.section3Content')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section4Title')}</h2>
          <p>
            {t('pages.terms.section4Content')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section5Title')}</h2>
          <p>
            {t('pages.terms.section5Content')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section6Title')}</h2>
          <p>
            {t('pages.terms.section6Content')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section7Title')}</h2>
          <p>
            {t('pages.terms.section7Content1')}
          </p>
          <p>
            {t('pages.terms.section7Content2')}
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.terms.section8Title')}</h2>
          <p>
            {t('pages.terms.section8Content')}
          </p>
        </div>
        <SupportCTA
          headline={t('pages.terms.supportHeadline')}
          description={t('pages.terms.supportDesc')}
        />
      </div>
    </div>
  );
};

export default TermsPage;
