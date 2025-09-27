import React from 'react';
import { DownloadIntent } from '../../app/constants';

interface DownloadIntentDialogProps {
  intent: DownloadIntent | null;
  countdown: number;
  onDismiss: () => void;
  onShare: () => void;
  onPresentRose: () => void;
}

export const DownloadIntentDialog: React.FC<DownloadIntentDialogProps> = ({
  intent,
  countdown,
  onDismiss,
  onShare,
  onPresentRose
}) => {
  if (!intent) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-intent-heading"
    >
      <div
        className="relative w-full max-w-xl space-y-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 sm:p-8 text-left shadow-2xl"
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 text-[var(--text-muted)] transition-colors hover:text-[var(--text-color)] focus:outline-none"
          aria-label="Close download message"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div>
          <h3 id="download-intent-heading" className="text-2xl font-semibold text-[var(--text-color)]">
            One Little Favor?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            We pour hours (and plenty of caffeine) into keeping these handwritten vibes Ad-free. As you know, nothing's truly free in this cursed world, making & maintaining a site is seriously resource-intensive (both money and time). So if this {intent.mode === 'bulk' ? 'bundle' : 'page'} helps you out, consider sharing the love or gifting a rose while we spin up your download.
          </p>
          <p className="mt-3 text-xs uppercase tracking-wide text-[var(--accent-color)]">
            Preparing {intent.label}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-[var(--control-bg)] px-4 py-3 text-sm">
          <span className="font-medium text-[var(--text-muted)]">Download begins in</span>
          <span className="text-3xl font-semibold text-[var(--accent-color)]">{countdown}s</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onShare}
            className="flex-1 min-w-[140px] rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
          >
            Share
          </button>
          <button
            type="button"
            onClick={onPresentRose}
            className="flex-1 min-w-[140px] rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-600 hover:shadow-lg"
          >
            Present rose
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="min-w-[120px] rounded-lg border border-[var(--panel-border)] bg-[var(--control-bg)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-all hover:text-[var(--text-color)]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

