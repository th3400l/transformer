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

const PrivacyPage: React.FC<PageProps> = ({ onGoBack }) => {
  const { t, i18n } = useTranslation();
  const locale = getLanguageInfo(i18n.resolvedLanguage || i18n.language)?.locale || 'en-US';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 id="privacy" className="text-3xl font-bold text-[var(--accent-color)]">{t('pages.privacy.title', 'Privacy Policy')}</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; {t('pages.privacy.back', 'Back to Generator')}
          </button>
        </div>
        <div className="text-[var(--text-muted)] space-y-4 leading-relaxed">
          <p>{t('pages.privacy.lastUpdated', 'Last updated')}: {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <p>{t('pages.privacy.intro')}</p>

          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.privacy.dataCollectionTitle')}</h2>
          <p>{t('pages.privacy.dataCollectionContent')}</p>

          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.privacy.localProcessingTitle')}</h2>
          <p>{t('pages.privacy.localProcessingContent')}</p>

          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.privacy.cookiesTitle')}</h2>
          <p>{t('pages.privacy.cookiesContent')}</p>

          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.privacy.analyticsTitle')}</h2>
          <p>{t('pages.privacy.analyticsContent')}</p>

          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.privacy.advertisingTitle')}</h2>
          <p>{t('pages.privacy.advertisingContent')}</p>

          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.privacy.rightsTitle')}</h2>
          <p>{t('pages.privacy.rightsContent')}</p>

          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">{t('pages.privacy.contactTitle')}</h2>
          <p>{t('pages.privacy.contactContent')}</p>
        </div>
        <SupportCTA
          headline={t('pages.privacy.supportHeadline')}
          description={t('pages.privacy.supportDesc')}
        />
      </div>
    </div>
  );
};

export default PrivacyPage;
