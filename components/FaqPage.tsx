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
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q7', 'Can I upload my own handwriting as a custom font?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a7', "Yes. Use the Custom Font upload area to add a TTF, OTF, or WOFF file. Tools like Calligraphr or Glyphr Studio can convert a scanned sample of your handwriting into one of these formats. Uploaded fonts stay in your browser's local storage and are never sent to our servers.")}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q8', 'Is there a limit on how much text I can convert at once?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a8', 'There is no fixed character limit. The practical limit is the number of pages your browser can render before it slows down. Typical desktop browsers handle a 30-page document smoothly. For longer documents, generate in batches of 10 to 20 pages and use the bulk download option.')}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q9', 'Does the tool work on mobile devices?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a9', 'Yes. The interface is responsive and works on iOS Safari, Chrome on Android, and most other mobile browsers. For very long documents we recommend a desktop browser, since rendering many pages at once is faster on a larger device.')}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q10', 'What paper templates are available?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a10', 'We currently offer blank, lined, dotted, and grid templates, with additional aged and notebook variants. Each template is designed to mimic the texture of physical paper, including subtle ink absorption and grain.')}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q11', 'How do I change the ink color or boldness of the writing?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a11', 'The control panel includes ink color presets (black, blue, red, green) and a custom hex color picker. A separate boldness slider controls how heavily the ink is laid down on the page, which affects how realistic certain pen styles look.')}
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              {t('pages.faq.q12', 'Are the generated pages safe to use for school assignments and creative work?')}
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              {t('pages.faq.a12', "You retain full ownership of any pages you generate, and the tool is widely used for note-taking, mock-ups, art projects, and creative writing. Always check your school's or client's specific guidelines on submitting machine-rendered handwriting.")}
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
