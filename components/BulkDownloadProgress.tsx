/**
 * BulkDownloadProgress Component
 * 
 * Displays progress feedback for bulk download operations.
 * Shows download progress, current file, and error notifications.
 * 
 * Requirements: 2.3, 2.4
 */

import React, { useState } from 'react';
import { BulkDownloadProgress, BulkDownloadResult } from '../services/bulkDownloadManager';
import { Button } from './Button';
import RoseLogo from './RoseLogo';
import { DownloadIcon, ExclamationIcon, XMarkIcon, ShareIcon } from './icons';

// Progress Bar Component
interface ProgressBarProps {
  percentage: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, className = '' }) => {
  return (
    <div className={`w-full bg-control-bg rounded-full h-2 overflow-hidden ${className}`}>
      <div 
        className="h-full bg-accent transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
};

// Download Status Component
interface DownloadStatusProps {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress?: BulkDownloadProgress;
  result?: BulkDownloadResult;
  onClose?: () => void;
  className?: string;
}

export const DownloadStatus: React.FC<DownloadStatusProps> = ({
  status,
  progress,
  result,
  onClose,
  className = ''
}) => {
  if (status === 'idle') {
    return null;
  }

  const formatTime = (ms: number): string => {
    if (ms < 1000) return '< 1s';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const shareUrl = 'https://txttohandwriting.org';
  const shareMessage = 'I just turned my notes into gorgeous handwriting with txttohandwriting.org.';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedMessage = encodeURIComponent(shareMessage);
  const [rawLinkCopied, setRawLinkCopied] = useState(false);
  const [discordHint, setDiscordHint] = useState(false);

  const copyToClipboard = async (value: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && 'writeText' in navigator.clipboard) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch (error) {
      console.warn('Clipboard copy failed:', error);
      return false;
    }
  };

  const handleRawLinkCopy = async () => {
    const didCopy = await copyToClipboard(shareUrl);
    if (didCopy) {
      setRawLinkCopied(true);
      setTimeout(() => setRawLinkCopied(false), 2500);
    }
  };

  const handleDiscordShare = async () => {
    const didCopy = await copyToClipboard(`${shareMessage} ${shareUrl}`);
    if (didCopy) {
      setDiscordHint(true);
      setTimeout(() => setDiscordHint(false), 2500);
    }
    window.open('https://discord.com/app', '_blank', 'noopener,noreferrer');
  };

  const ShareAction: React.FC<{ label: string; href?: string; onClick?: () => void }>
    = ({ label, href, onClick }) => {
      if (href) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-control-border text-text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
          >
            {label}
          </a>
        );
      }
      return (
        <button
          type="button"
          onClick={onClick}
          className="px-3 py-1.5 text-xs font-medium rounded-full border border-control-border text-text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
        >
          {label}
        </button>
      );
    };

  return (
    <div className={`relative bg-panel-bg border border-panel-border rounded-2xl shadow-2xl p-6 overflow-hidden ${className}`}>
      {/* Decorative background gradient */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-5 z-10">
        <div className="flex items-center gap-3">
          {status === 'downloading' && (
            <div className="p-2 rounded-full bg-accent/10">
              <DownloadIcon className="w-5 h-5 text-accent animate-pulse" />
            </div>
          )}
          {status === 'completed' && (
            <RoseLogo size={32} />
          )}
          {status === 'error' && (
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <ExclamationIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          )}
          
          <div>
            <h3 className="font-bold text-lg text-text leading-none">
              {status === 'downloading' && 'Downloading Images...'}
              {status === 'completed' && 'Download Report'}
              {status === 'error' && 'Download Issues'}
            </h3>
            {status === 'completed' && (
               <p className="text-xs text-text-muted mt-1">Your files are ready!</p>
            )}
          </div>
        </div>
        
        {onClose && status !== 'downloading' && (
          <button
            onClick={onClose}
            className="p-2 rounded-full text-text-muted hover:text-text hover:bg-control-bg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Information */}
      {status === 'downloading' && progress && (
        <div className="space-y-4 relative z-10">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-text-muted">
              <span>Progress</span>
              <span>{progress.percentage}%</span>
            </div>
            <ProgressBar percentage={progress.percentage} />
          </div>
          
          {/* Current File */}
          <div className="bg-control-bg border border-panel-border rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-semibold text-text uppercase tracking-wider">Processing</span>
               <span className="text-xs text-text-muted">{progress.current} of {progress.total}</span>
            </div>
            <div className="text-sm text-text-muted truncate font-mono">
              {progress.currentFilename}
            </div>
          </div>
          
          {/* Time and Size Information */}
          <div className="flex justify-between text-xs text-text-muted px-1">
            <span>
              {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
            </span>
            {progress.estimatedTimeRemaining > 0 && (
              <span className="font-medium text-accent">
                ~{formatTime(progress.estimatedTimeRemaining)} remaining
              </span>
            )}
          </div>
        </div>
      )}

      {/* Completion Results */}
      {(status === 'completed' || status === 'error') && result && (
        <div className="space-y-5 relative z-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-control-bg border border-panel-border rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-accent">{result.downloadedCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Files</div>
            </div>
            <div className="bg-control-bg border border-panel-border rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-text">{formatBytes(result.downloadedBytes)}</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Size</div>
            </div>
            <div className="bg-control-bg border border-panel-border rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-text">{formatTime(result.estimatedTime)}</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Time</div>
            </div>
          </div>

          {/* Error Details */}
          {result.failedDownloads.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-bold text-red-800 dark:text-red-300">
                  {result.failedDownloads.length} download(s) failed
                </span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                {result.failedDownloads.map((failed, index) => (
                  <div key={index} className="text-xs text-red-700 dark:text-red-400 flex justify-between gap-2">
                    <span className="font-medium truncate">{failed.filename}:</span> 
                    <span className="opacity-80">{failed.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {result.failedDownloads.length === 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                All images downloaded successfully!
              </span>
            </div>
          )}

          {status === 'completed' && (
            <div className="pt-4 border-t border-panel-border">
              <div className="flex items-center gap-2 mb-3 text-text-muted">
                <ShareIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Share the vibe</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <ShareAction
                  label="Twitter"
                  href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`}
                />
                <ShareAction
                  label="Instagram"
                  href={`https://www.instagram.com/?url=${encodedUrl}`}
                />
                <ShareAction
                  label="WhatsApp"
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`}
                />
                <ShareAction
                  label={discordHint ? 'Copied!' : 'Discord'}
                  onClick={handleDiscordShare}
                />
                <ShareAction
                  label={rawLinkCopied ? 'Copied!' : 'Copy Link'}
                  onClick={handleRawLinkCopy}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={onClose} 
              variant="primary"
              className="w-full sm:w-auto"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Bulk Download Modal Component
interface BulkDownloadModalProps {
  isOpen: boolean;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress?: BulkDownloadProgress;
  result?: BulkDownloadResult;
  onClose: () => void;
}

export const BulkDownloadModal: React.FC<BulkDownloadModalProps> = ({
  isOpen,
  status,
  progress,
  result,
  onClose
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && status !== 'downloading') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md animate-fade-in">
        <DownloadStatus
          status={status}
          progress={progress}
          result={result}
          onClose={status !== 'downloading' ? onClose : undefined}
          className="border border-white/10 shadow-2xl"
        />
      </div>
    </div>
  );
};

// Compact Progress Indicator for Inline Display
interface CompactProgressProps {
  progress: BulkDownloadProgress;
  className?: string;
}

export const CompactProgress: React.FC<CompactProgressProps> = ({
  progress,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 bg-control-bg border border-panel-border rounded-lg p-2 ${className}`}>
      <DownloadIcon className="w-4 h-4 text-accent animate-pulse" />
      <div className="flex-1 min-w-0">
        <ProgressBar percentage={progress.percentage} className="mb-1 h-1.5" />
        <div className="text-[10px] text-text-muted truncate font-mono">
          {progress.current}/{progress.total} • {progress.currentFilename}
        </div>
      </div>
      <div className="text-xs font-bold text-text tabular-nums">
        {progress.percentage}%
      </div>
    </div>
  );
};

export default DownloadStatus;
