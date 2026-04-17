/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useTranslation } from 'react-i18next';
import SupportCTA from './SupportCTA';

interface PageProps {
  onGoBack: () => void;
}

const FaqPage: React.FC<PageProps> = ({ onGoBack }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[var(--accent-color)]">{t('pages.faq.title', 'Frequently Asked Questions')}</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; {t('pages.faq.back', 'Back to Tool')}
          </button>
        </div>
        <div className="space-y-4">
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q1', 'Is this tool free to use?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a1', "Yes, the Handwriting Generator is completely free to use. We do not require any subscriptions or hidden fees. Our goal is to provide a valuable utility for students and professionals alike.")}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q2', 'Can I use the output for commercial projects?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a2', 'Yes, you are free to use the generated images and PDFs for personal, educational, or commercial projects. No attribution is required, though we appreciate it if you share the tool with others.')}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q3', 'Is my data secure and private?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a3', "Your privacy is our priority. All text conversion and image generation happen locally in your web browser. We do not store or transmit your text to any external servers.")}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q4', "What file formats are supported for download?")}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a4', "Currently, you can download your handwritten pages as high-quality PNG images or compile them into a single PDF document.")}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q5', 'Why does the font appearance vary across devices?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a5', "Handwriting rendering depends on browser font rendering engines. For the best and most consistent results, we recommend using a modern, updated browser like Chrome, Firefox, or Edge.")}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q6', 'How can I print the generated pages?') ? t('pages.faq.q6', 'How can I print the generated pages?') : 'How can I print the generated pages?'}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a6', 'After generating your pages, download them as a PDF. You can then print this PDF using your standard printer settings. For the most realistic look, we recommend using high-quality paper and a color printer.')}
            </p>
          </details>
        </div>
        <SupportCTA
          headline={t('pages.faq.supportHeadline')}
          description={t('pages.faq.supportDesc')}
        />
      </div>
    </div>
  );
};

export default FaqPage;
