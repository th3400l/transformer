/**
 * Shared support call-to-action block
 * Highlights the support email so users can reach out quickly.
 */

import React from 'react';

export const SUPPORT_EMAIL = 'coming soon';

interface SupportCTAProps {
  headline?: string;
  description?: string;
  className?: string;
}

const SupportCTA: React.FC<SupportCTAProps> = ({
  headline = 'Need a hand or want to hype us up?',
  description = 'Ping our humans any time for feedback, technical support, or to share something cool you built.',
  className = ''
}) => {
  return (
    <div
      className={`mt-10 p-5 rounded-xl border border-[var(--panel-border)] bg-[var(--control-bg)]/60 shadow-sm backdrop-blur-sm transition-colors ${className}`}
    >
      <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">{headline}</h2>
      <p className="text-sm text-[var(--text-muted)] mb-3">{description}</p>
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
