import React from 'react';
import { GenerationLimitDialogState } from '../../app/constants';

interface GenerationLimitDialogProps {
  dialog: GenerationLimitDialogState | null;
  onClose: () => void;
}

export const GenerationLimitDialog: React.FC<GenerationLimitDialogProps> = ({ dialog, onClose }) => {
  if (!dialog) {
    return null;
  }

  const renderTitle = () => {
    switch (dialog.type) {
      case 'total':
        return 'Whoa there, that’s too much text';
      case 'per-run':
        return 'Two pages per run keeps it tidy';
      case 'gallery':
        return 'Gallery limit reached';
      default:
        return '';
    }
  };

  const renderMessage = () => {
    switch (dialog.type) {
      case 'total':
        return `txttohandwriting.org can only render up to ${dialog.allowed} pages from a single block of text. Your input would spill into ${dialog.attempted} pages. Please trim the content or split it into smaller batches, then generate them one after another.`;
      case 'per-run':
        return `We only generate ${dialog.allowed} pages per pass, We are actively working to increase the limit. Your text would create ${dialog.attempted} pages. Cut it down to the first two pages’ worth, generate, then paste the next chunk and repeat.`;
      case 'gallery':
        return `You can only keep at most ${dialog.allowed} pages in the gallery. Remove at least ${dialog.remove} page${dialog.remove > 1 ? 's' : ''} before generating again. We are doing this to optimize your experience, Kindly consider.`;
      default:
        return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 sm:p-8 shadow-2xl">
        <div className="space-y-3 text-[var(--text-color)]">
          <h3 className="text-2xl font-semibold">{renderTitle()}</h3>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{renderMessage()}</p>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--accent-color-hover)]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

