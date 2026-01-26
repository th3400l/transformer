/**
 * Shared support call-to-action block
 * Highlights the support email so users can reach out quickly.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export const SUPPORT_EMAIL = 'support@txttohandwriting.org';

interface SupportCTAProps {
  headline?: string;
  description?: string;
  className?: string;
}

const SupportCTA: React.FC<SupportCTAProps> = ({
  headline,
  description,
  className = ''
}) => {
  const { t } = useTranslation();
  
  const finalHeadline = headline || t('pages.faq.supportHeadline', 'Need a hand or want to hype us up?');
  const finalDescription = description || t('pages.faq.supportDesc', 'Ping our humans any time for feedback, technical support, or to share something cool you built.');

  return (
    <div
      className={`mt-10 p-5 rounded-xl border border-[var(--panel-border)] bg-[var(--control-bg)]/60 shadow-sm backdrop-blur-sm transition-colors ${className}`}
    >
      <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">{finalHeadline}</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">{finalDescription}</p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] transition-colors"
      >
        {SUPPORT_EMAIL}
        <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  );
};

export default SupportCTA;
