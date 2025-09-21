/**
 * BulkDownloadProgress Component
 * 
 * Displays progress feedback for bulk download operations.
 * Shows download progress, current file, and error notifications.
 * 
 * Requirements: 2.3, 2.4
 */

import React from 'react';
import { BulkDownloadProgress, BulkDownloadResult, FailedDownload } from '../services/bulkDownloadManager';

// Progress Icons
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ExclamationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Progress Bar Component
interface ProgressBarProps {
  percentage: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, className = '' }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <div 
        className="h-full bg-blue-600 transition-all duration-300 ease-out"
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

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status === 'downloading' && (
            <>
              <DownloadIcon className="w-5 h-5 text-blue-600 animate-pulse" />
              <span className="font-medium text-gray-900">Downloading Images...</span>
            </>
          )}
          {status === 'completed' && (
            <>
              <CheckIcon className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Download Report</span>
            </>
          )}
          {status === 'error' && (
            <>
              <ExclamationIcon className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">Download Issues</span>
            </>
          )}
        </div>
        {onClose && status !== 'downloading' && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Information */}
      {status === 'downloading' && progress && (
        <div className="space-y-3">
          {/* Progress Bar */}
          <ProgressBar percentage={progress.percentage} />
          
          {/* Progress Details */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progress.current} of {progress.total} images</span>
            <span>{progress.percentage}%</span>
          </div>
          
          {/* Current File */}
          <div className="text-sm text-gray-500">
            <span className="font-medium">Current:</span> {progress.currentFilename}
          </div>
          
          {/* Time and Size Information */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
            </span>
            {progress.estimatedTimeRemaining > 0 && (
              <span>
                ~{formatTime(progress.estimatedTimeRemaining)} remaining
              </span>
            )}
          </div>
        </div>
      )}

      {/* Completion Results */}
      {(status === 'completed' || status === 'error') && result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Downloaded:</span>
            <span className="font-medium text-gray-900">
              {result.downloadedCount} of {result.totalCount} images
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Size:</span>
            <span className="font-medium text-gray-900">
              {formatBytes(result.downloadedBytes)}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">
              {formatTime(result.estimatedTime)}
            </span>
          </div>

          {/* Error Details */}
          {result.failedDownloads.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationIcon className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {result.failedDownloads.length} download(s) failed
                </span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.failedDownloads.map((failed, index) => (
                  <div key={index} className="text-xs text-red-700">
                    <span className="font-medium">{failed.filename}:</span> {failed.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {result.failedDownloads.length === 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  All images downloaded successfully!
                </span>
              </div>
            </div>
          )}
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <DownloadStatus
          status={status}
          progress={progress}
          result={result}
          onClose={status !== 'downloading' ? onClose : undefined}
          className="border-0 shadow-none"
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
    <div className={`flex items-center gap-3 ${className}`}>
      <DownloadIcon className="w-4 h-4 text-blue-600 animate-pulse" />
      <div className="flex-1 min-w-0">
        <ProgressBar percentage={progress.percentage} className="mb-1" />
        <div className="text-xs text-gray-500 truncate">
          {progress.current}/{progress.total} - {progress.currentFilename}
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900">
        {progress.percentage}%
      </div>
    </div>
  );
};

export default DownloadStatus;