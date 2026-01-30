import React from 'react';

interface FeedbackDialogProps {
  isOpen: boolean;
  supportEmail: string;
  onClose: () => void;
  onEmail: () => void;
  onShare: () => void;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  supportEmail,
  onClose,
  onEmail,
  onShare
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
    >
      <div className="relative w-full max-w-lg space-y-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 sm:p-8 text-left shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--text-muted)] transition-colors hover:text-[var(--text-color)] focus:outline-none"
          aria-label="Close feedback message"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="space-y-3 text-[var(--text-color)]">
          <h3 id="feedback-dialog-title" className="text-2xl font-semibold">
            Loving the handwritten vibes?
          </h3>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            We'd love to hear how it's working for you. Drop us a note at <span className="text-[var(--accent-color)]">{supportEmail}</span> or pass the link to a friend who could use prettier notes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onEmail}
            className="flex-1 min-w-[140px] rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--accent-color-hover)] hover:shadow-lg"
          >
            Email support
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex-1 min-w-[140px] rounded-lg border border-[var(--accent-color)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--accent-color)] shadow-md transition-all hover:bg-[var(--accent-color)]/10"
          >
            Share with friends
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-lg border border-[var(--panel-border)] bg-[var(--control-bg)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-all hover:text-[var(--text-color)]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

