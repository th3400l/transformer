import React from 'react';
import { DownloadIntent } from '../../app/constants';
import { Button } from '../Button';
import RoseLogo from '../RoseLogo';
import { ShareIcon, HeartIcon, XMarkIcon } from '../icons';

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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-intent-heading"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-panel-border bg-panel-bg shadow-2xl ring-1 ring-white/10 animate-fade-in"
      >
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

        <div className="relative p-6 sm:p-8 space-y-6">
          {/* Close Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-4 top-4 p-2 rounded-full text-text-muted hover:text-text hover:bg-control-bg transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Header Section */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
              <RoseLogo size={64} className="relative z-10 drop-shadow-lg" />
            </div>
            
            <div>
              <h3 id="download-intent-heading" className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
                One Small Favor?
              </h3>
              <p className="mt-2 text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
                We keep this tool ad-free with pure passion (and coffee). If this {intent.mode === 'bulk' ? 'bundle' : 'page'} helped you, consider sharing the love while we prepare your file.
              </p>
            </div>
          </div>

          {/* Countdown Status */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Preparing {intent.label}
            </div>
            <div className="text-4xl font-bold text-accent tabular-nums tracking-tight drop-shadow-sm">
              {countdown}<span className="text-lg ml-1 opacity-70">s</span>
            </div>
            <p className="text-xs text-text-muted mt-1">Download begins automatically</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={onShare}
                variant="secondary"
                className="w-full justify-center gap-2 h-12 text-text hover:text-accent hover:border-accent/50"
              >
                <ShareIcon className="w-4 h-4" />
                Share Tool
              </Button>
              
              <Button
                onClick={onPresentRose}
                className="w-full justify-center gap-2 h-12 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white border-none shadow-lg shadow-rose-500/20"
              >
                <HeartIcon className="w-4 h-4" />
                Gift a Rose
              </Button>
            </div>
            
            <Button
              onClick={onDismiss}
              variant="ghost"
              className="w-full text-xs text-text-muted hover:text-text h-8"
            >
              No thanks, just download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
