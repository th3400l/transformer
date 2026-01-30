// Custom Font Upload Dialog Component
// Requirements: Full-screen modal overlay, backdrop blur, click-outside-to-close, ESC key handling, modal state management

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CustomFontUploadResult, FontUploadError, FontErrorType } from '../types/customFontUpload';
import { CustomFont } from '../types/fonts';
import { CustomFontUploader } from './CustomFontUploader';
import { CustomFontManagementPanel } from './CustomFontManagementPanel';
import { FontValidationFeedback } from './FontValidationFeedback';
import { getFontErrorNotificationService } from '../services/fontErrorNotificationService';

interface CustomFontUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<CustomFontUploadResult>;
  onRemoveFont?: (fontId: string) => Promise<void>;
  onReplaceFont?: (fontId: string, newFile: File) => Promise<void>;
  onSave?: () => void;
  maxCustomFonts: number;
  currentCount: number;
  customFonts?: CustomFont[];
  disabled?: boolean;
}

export const CustomFontUploadDialog: React.FC<CustomFontUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  onRemoveFont,
  onReplaceFont,
  onSave,
  maxCustomFonts,
  currentCount,
  customFonts = [],
  disabled = false
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [showFontGuideHint, setShowFontGuideHint] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const errorService = getFontErrorNotificationService();

  // Handle modal close with confirmation if there are unsaved changes
  const handleClose = useCallback(() => {
    if (hasChanges && !isUploading && !isRemoving) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    setHasChanges(false);
    setActiveTab('upload'); // Reset to upload tab when closing
    onClose();
  }, [hasChanges, isUploading, isRemoving, onClose]);

  // Handle save action
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
    setHasChanges(false);
    onClose();
  }, [onSave, onClose]);

  // Handle escape key and click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isUploading && !isRemoving) {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (backdropRef.current && event.target === backdropRef.current && !isUploading && !isRemoving) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape, true);
    document.addEventListener('mousedown', handleClickOutside);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose, isUploading]);

  // Focus management for accessibility and reset state when opening
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Reset state when dialog opens
      setHasChanges(false);
      setIsUploading(false);
      setIsRemoving(false);
      setShowFontGuideHint(true);
      
      // Set initial tab based on whether there are custom fonts
      setActiveTab(customFonts.length > 0 ? 'manage' : 'upload');
      
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen, customFonts.length]);

  const handleCustomFontUpload = async (file: File): Promise<CustomFontUploadResult> => {
    setIsUploading(true);
    setHasChanges(true);

    try {
      const result = await onUpload(file);

      if (result.success) {
        // Success notification is handled by CustomFontUploader
        setHasChanges(true);
      }

      setIsUploading(false);

      return result;
    } catch (error) {
      setIsUploading(false);

      const uploadError: FontUploadError = {
        type: FontErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : 'Upload failed',
        code: 'UPLOAD_ERROR',
        recoverable: true,
        severity: 'medium'
      };

      return { success: false, error: uploadError };
    }
  };

  const handleValidationError = (error: FontUploadError) => {
    // Validation error notifications are handled by CustomFontUploader
    // This callback is kept for compatibility but notifications are handled elsewhere
  };

  const handleRemoveFont = async (fontId: string): Promise<void> => {
    if (!onRemoveFont) return;
    
    try {
      setIsRemoving(true);
      setHasChanges(true);
      await onRemoveFont(fontId);
      
      // Small delay to ensure all systems are synchronized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show success notification
      errorService.showFontSuccess(
        'Custom font removed successfully.',
        {
          operation: 'font removal',
          timestamp: new Date(),
          sessionId: `remove-${Date.now()}`
        }
      );
    } catch (error) {
      // Show error notification
      errorService.showFontError({
        type: FontErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : 'Failed to remove font',
        code: 'REMOVE_FAILED',
        recoverable: true,
        severity: 'medium'
      }, {
        operation: 'font removal',
        timestamp: new Date(),
        sessionId: `remove-error-${Date.now()}`
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleReplaceFont = async (fontId: string, newFile: File): Promise<void> => {
    if (!onReplaceFont) return;
    
    try {
      setIsUploading(true);
      setHasChanges(true);
      await onReplaceFont(fontId, newFile);
      
      // Show success notification
      errorService.showFontSuccess(
        'Custom font replaced successfully.',
        {
          fileName: newFile.name,
          fileSize: newFile.size,
          operation: 'font replacement',
          timestamp: new Date(),
          sessionId: `replace-${Date.now()}`
        }
      );
    } catch (error) {
      // Show error notification
      errorService.showFontError({
        type: FontErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : 'Failed to replace font',
        code: 'REPLACE_FAILED',
        recoverable: true,
        severity: 'medium'
      }, {
        fileName: newFile.name,
        fileSize: newFile.size,
        operation: 'font replacement',
        timestamp: new Date(),
        sessionId: `replace-error-${Date.now()}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[85] p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
      aria-describedby="upload-dialog-description"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div 
        ref={dialogRef}
        className="bg-[var(--control-bg)] rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--control-border)] transform transition-all duration-300 scale-100"
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
        }}
      >
        {/* Header */}
        <div className="border-b border-[var(--control-border)]">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 id="upload-dialog-title" className="text-xl font-semibold text-[var(--text-color)]">
                Custom Font Manager
              </h2>
              <p id="upload-dialog-description" className="text-sm text-[var(--text-muted)] mt-1">
                Upload new fonts or manage your existing custom fonts
              </p>
              {hasChanges && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-pulse"></div>
                  <span className="text-xs text-[var(--accent-color)]">Unsaved changes</span>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading || isRemoving}
              className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors p-2 rounded-md hover:bg-[var(--panel-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--control-border)]">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'upload'
                  ? 'text-[var(--accent-color)] border-[var(--accent-color)]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-color)]'
              }`}
              disabled={isUploading || isRemoving}
            >
              Upload New Font
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'manage'
                  ? 'text-[var(--accent-color)] border-[var(--accent-color)]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-color)]'
              }`}
              disabled={isUploading || isRemoving}
            >
              Manage Fonts ({customFonts.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Upload Status */}
          <div className="mb-4 p-3 bg-[var(--accent-color)]/10 rounded-lg border border-[var(--accent-color)]/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-color)]">Custom Fonts</span>
              <span className="text-[var(--accent-color)] font-medium">
                {currentCount} / {maxCustomFonts}
              </span>
            </div>
            <div className="w-full bg-[var(--control-border)] rounded-full h-2 mt-2">
              <div 
                className="bg-[var(--accent-color)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentCount / maxCustomFonts) * 100}%` }}
              />
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'upload' ? (
            <>
              {showFontGuideHint && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)]/80 px-4 py-3 text-sm text-[var(--text-muted)]">
                  <div className="mt-0.5 text-[var(--accent-color)]" aria-hidden="true">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 2.25h.008v.008H12V15Zm9-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[var(--text-color)] font-medium">Want to turn your handwriting into a font?</p>
                    <p>We wrote a quick guide that walks through every step, from scanning letters to exporting the perfect TTF.</p>
                    <a
                      href="/blog/create-your-own-handwriting-font"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[var(--accent-color)] font-medium hover:text-[var(--accent-color-hover)]"
                    >
                      Read the walkthrough
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFontGuideHint(false)}
                    className="ml-2 text-[var(--text-muted)] hover:text-[var(--text-color)]"
                    aria-label="Dismiss font creation tip"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Upload Area */}
              <div className="mb-6">
                <CustomFontUploader
                  onUpload={handleCustomFontUpload}
                  onValidationError={handleValidationError}
                  maxFiles={maxCustomFonts}
                  currentCount={currentCount}
                  disabled={disabled || isUploading || isRemoving}
                />
              </div>

              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="mb-6 p-4 bg-[var(--accent-color)]/10 rounded-lg border border-[var(--accent-color)]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-color)]">Processing font...</div>
                      <div className="text-xs text-[var(--text-muted)]">Please wait while we validate and prepare your font</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className="text-xs text-[var(--text-muted)] space-y-1">
                <h3 className="font-medium text-[var(--text-color)] mb-2">Font Requirements:</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Supported formats: TTF, OTF, WOFF, WOFF2</li>
                  <li>Maximum file size: 5MB per font</li>
                  <li>Maximum {maxCustomFonts} custom fonts allowed</li>
                  <li>Font files should contain valid font data</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Font Management Panel */}
              {customFonts.length > 0 ? (
                <CustomFontManagementPanel
                  customFonts={customFonts}
                  onRemoveFont={handleRemoveFont}
                  onReplaceFont={onReplaceFont ? handleReplaceFont : undefined}
                  maxFonts={maxCustomFonts}
                  disabled={disabled || isUploading || isRemoving}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 text-[var(--text-muted)]">—</div>
                  <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">
                    No Custom Fonts Yet
                  </h3>
                  <p className="text-[var(--text-muted)] mb-4">
                    Upload your first custom font to get started
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-[var(--accent-color)] text-[var(--bg-color)] hover:bg-[var(--accent-color-hover)] transition-colors rounded-md font-medium"
                  >
                    Upload Font
                  </button>
                </div>
              )}

              {/* Removal Progress Indicator */}
              {isRemoving && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <div className="text-sm font-medium text-red-700">Removing font...</div>
                      <div className="text-xs text-red-600">Please wait while we remove the font</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t border-[var(--control-border)]">
          <div className="text-xs text-[var(--text-muted)]">
            {isUploading && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading font...</span>
              </div>
            )}
            {isRemoving && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Removing font...</span>
              </div>
            )}
            {!isUploading && !isRemoving && activeTab === 'manage' && customFonts.length > 0 && (
              <span>Click on any font to preview or manage it</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading || isRemoving}
              className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors rounded-md hover:bg-[var(--panel-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasChanges ? 'Cancel' : 'Close'}
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isUploading || isRemoving}
                className="px-4 py-2 bg-[var(--accent-color)] text-[var(--bg-color)] hover:bg-[var(--accent-color-hover)] transition-colors rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
