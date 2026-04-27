import React from 'react';
import { useTranslation } from 'react-i18next';
import SupportCTA, { SUPPORT_EMAIL } from './SupportCTA';

interface PageProps {
  onGoBack: () => void;
}

const ContactPage: React.FC<PageProps> = ({ onGoBack }) => {
  const { t } = useTranslation();

  const sections = [
    {
      titleKey: 'pages.contact.supportTitle',
      titleFallback: 'Support & Bug Reports',
      contentKey: 'pages.contact.supportDesc',
      contentFallback:
        'For technical issues — broken downloads, font rendering problems, paper templates that fail to load — email us with the browser and operating system you are using. We respond to most messages within two business days.'
    },
    {
      titleKey: 'pages.contact.businessTitle',
      titleFallback: 'Business & Partnership Inquiries',
      contentKey: 'pages.contact.businessDesc',
      contentFallback:
        'For sponsorships, integrations, content collaborations, and licensing questions, please include the nature of your project and the audience or scale you are working with so we can route you to the right person.'
    },
    {
      titleKey: 'pages.contact.editorialTitle',
      titleFallback: 'Editorial & Guest Contributions',
      contentKey: 'pages.contact.editorialDesc',
      contentFallback:
        'Want to contribute a guest article on note-taking, calligraphy, or learning techniques? Send a short pitch with your background and a few topic ideas. We consider every submission.'
    },
    {
      titleKey: 'pages.contact.responseTitle',
      titleFallback: 'Response Times',
      contentKey: 'pages.contact.responseDesc',
      contentFallback:
        'Most emails receive a reply within 1–2 business days. Complex bug reports may take longer while we reproduce the issue. We do not use auto-responders or chatbots — every message is read by a human.'
    },
    {
      titleKey: 'pages.contact.githubTitle',
      titleFallback: 'Public Issues',
      contentKey: 'pages.contact.githubDesc',
      contentFallback:
        'For reproducible bugs and feature discussions you would like the community to see, you can also open a GitHub issue. Public issues are great for tracking — private email is better for confidential concerns.'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[var(--accent-color)]">
            {t('pages.contact.title', 'Contact Us')}
          </h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; {t('pages.contact.back', 'Back to Tool')}
          </button>
        </div>

        <p className="text-[var(--text-muted)] leading-relaxed mb-6">
          {t(
            'pages.contact.intro',
            'We love hearing from the people who use txttohandwriting.org. Whether you have a feature request, a bug report, a partnership inquiry, or feedback about a specific blog post, this page is the fastest way to reach the team.'
          )}
        </p>

        <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--control-bg)]/60 p-5 mb-8">
          <p className="text-sm text-[var(--text-muted)] mb-2">
            <strong>{t('pages.contact.emailLabel', 'Email us at')}:</strong>{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] transition-colors font-medium"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {t(
              'pages.contact.subjectHelper',
              'Tip: include "[support]", "[business]", or "[editorial]" in your subject line so we can route your message faster.'
            )}
          </p>
        </div>

        <div className="text-[var(--text-muted)] space-y-6 leading-relaxed">
          {sections.map((section) => (
            <section key={section.titleKey}>
              <h2 className="text-xl font-semibold text-[var(--text-color)] mb-2">
                {t(section.titleKey, section.titleFallback)}
              </h2>
              <p>{t(section.contentKey, section.contentFallback)}</p>
            </section>
          ))}
        </div>

        <SupportCTA
          headline={t('pages.contact.supportHeadline', 'Direct Email')}
          description={t(
            'pages.contact.supportCtaDesc',
            'Send your message directly — we read every email.'
          )}
        />
      </div>
    </div>
  );
};

export default ContactPage;
