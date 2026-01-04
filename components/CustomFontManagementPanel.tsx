// Custom Font Management Panel Component
// Requirements: 6.4, 6.5, 6.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6

import React, { useState } from 'react';
import { CustomFont } from '../types/fonts';
import { FontUploadError, FontErrorType } from '../types/customFontUpload';
import { RoseSpinner } from './Spinner';
import { Button } from './Button';

interface CustomFontManagementPanelProps {
  customFonts: CustomFont[];
  onRemoveFont: (fontId: string) => Promise<void>;
  onReplaceFont?: (fontId: string, newFile: File) => Promise<void>;
  maxFonts: number;
  disabled?: boolean;
  className?: string;
}

interface FontActionState {
  fontId: string | null;
  action: 'removing' | 'replacing' | null;
  error: FontUploadError | null;
}

export const CustomFontManagementPanel: React.FC<CustomFontManagementPanelProps> = ({
  customFonts,
  onRemoveFont,
  onReplaceFont,
  maxFonts,
  disabled = false,
  className = ''
}) => {
  const [actionState, setActionState] = useState<FontActionState>({
    fontId: null,
    action: null,
    error: null
  });
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Handle font removal
  const handleRemoveFont = async (fontId: string) => {
    if (disabled) return;

    try {
      setActionState({ fontId, action: 'removing', error: null });
      await onRemoveFont(fontId);
      setConfirmRemove(null);
      setActionState({ fontId: null, action: null, error: null });
    } catch (error) {
      setActionState({
        fontId: null,
        action: null,
        error: {
          type: FontErrorType.PROCESSING_ERROR,
          message: error instanceof Error ? error.message : 'Failed to remove font',
          code: 'REMOVE_FAILED',
          recoverable: true,
          severity: 'medium'
        }
      });
    }
  };

  // Handle font replacement
  const handleReplaceFont = async (fontId: string, file: File) => {
    if (disabled || !onReplaceFont) return;

    try {
      setActionState({ fontId, action: 'replacing', error: null });
      await onReplaceFont(fontId, file);
      setActionState({ fontId: null, action: null, error: null });
    } catch (error) {
      setActionState({
        fontId: null,
        action: null,
        error: {
          type: FontErrorType.PROCESSING_ERROR,
          message: error instanceof Error ? error.message : 'Failed to replace font',
          code: 'REPLACE_FAILED',
          recoverable: true,
          severity: 'medium'
        }
      });
    }
  };

  // Handle file input for replacement
  const handleFileInputChange = (fontId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleReplaceFont(fontId, file);
    }
    // Reset input value to allow re-selecting same file
    event.target.value = '';
  };

  // Render font item
  const renderFontItem = (font: CustomFont) => {
    const isProcessing = actionState.fontId === font.id && actionState.action !== null;
    const isComponentDisabled = Boolean(disabled);
    const isRemoving = actionState.fontId === font.id && actionState.action === 'removing';
    const isReplacing = actionState.fontId === font.id && actionState.action === 'replacing';
    const showConfirm = confirmRemove === font.id;
    const displayName = font.name?.trim() || font.originalFilename.replace(/\.[^/.]+$/, '');

    return (
      <article
        key={font.id}
        className={`
          border border-control-border rounded-lg p-3 sm:p-4 transition-all duration-200
          ${isProcessing ? 'opacity-50' : 'hover:border-accent'}
          ${showConfirm ? 'border-red-300 bg-red-50/50' : ''}
        `}
        aria-labelledby={`font-name-${font.id}`}
        aria-describedby={`font-details-${font.id} font-sample-${font.id}`}
      >
        {/* Font Preview */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 
              id={`font-name-${font.id}`}
              className="text-lg font-medium text-text mb-1 truncate"
              style={{ fontFamily: font.loaded ? font.family : 'inherit' }}
              title={displayName}
            >
              {displayName}
            </h4>
            <div 
              id={`font-details-${font.id}`}
              className="text-sm text-text-muted space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-accent text-white rounded-full">
                  Custom
                </span>
                <span>{font.format.toUpperCase()}</span>
                <span>{formatFileSize(font.fileSize)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
                <span title={font.originalFilename} className="truncate">
                  File: {font.originalFilename.length > 15 
                    ? `${font.originalFilename.substring(0, 15)}...` 
                    : font.originalFilename}
                </span>
                <span className="whitespace-nowrap">Uploaded: {formatDate(font.uploadDate)}</span>
                {font.lastUsed && (
                  <span className="whitespace-nowrap">Last used: {formatDate(font.lastUsed)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Font Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {font.loaded ? (
              <span className="text-green-600 text-sm" title="Font loaded successfully">
                ✓
              </span>
            ) : (
              <span className="text-yellow-600 text-sm" title="Font not loaded">
                ⚠
              </span>
            )}
            {font.usageCount > 0 && (
              <span className="text-xs text-text-muted" title="Usage count">
                Used {font.usageCount} time{font.usageCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Font Sample */}
        <div 
          id={`font-sample-${font.id}`}
          className="mb-3 p-2 sm:p-3 bg-control-bg rounded border"
          role="img"
          aria-label={`Font sample showing ${font.name} with pangram and alphabet`}
        >
          <div 
            className="text-base sm:text-lg text-text break-words"
            style={{ fontFamily: font.loaded ? font.family : 'inherit' }}
            aria-label="Pangram sample text"
          >
            The quick brown fox jumps over the lazy dog
          </div>
          <div 
            className="text-xs sm:text-sm text-text-muted mt-1 break-all"
            style={{ fontFamily: font.loaded ? font.family : 'inherit' }}
            aria-label="Alphabet and numbers sample"
          >
            ABCDEFGHIJKLMNOPQRSTUVWXYZ 1234567890
          </div>
        </div>

        {/* Actions */}
        {showConfirm ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
            <span className="text-sm text-red-700 flex-1">
              Remove "{font.name}"? This action cannot be undone.
            </span>
            <div className="flex gap-2">
            <Button
              onClick={() => handleRemoveFont(font.id)}
              disabled={isProcessing}
              isLoading={isRemoving}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              aria-label={`Confirm remove ${font.name}`}
            >
              Remove
            </Button>
            <Button
              onClick={() => setConfirmRemove(null)}
              disabled={isProcessing}
              variant="secondary"
              size="sm"
              aria-label="Cancel removal"
            >
              Cancel
            </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Replace Font */}
            {onReplaceFont && (
              <>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={handleFileInputChange(font.id)}
                  className="hidden"
                  id={`replace-${font.id}`}
                  disabled={isComponentDisabled || isProcessing}
                  aria-label={`Replace ${font.name} with new font file`}
                />
                <label
                  htmlFor={`replace-${font.id}`}
                  className={`
                    px-3 py-2 text-sm border border-control-border rounded cursor-pointer
                    transition-colors flex items-center gap-2
                    ${isComponentDisabled || isProcessing 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:border-accent hover:bg-accent/5'
                    }
                  `}
                  tabIndex={isComponentDisabled || isProcessing ? -1 : 0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isComponentDisabled && !isProcessing) {
                      e.preventDefault();
                      document.getElementById(`replace-${font.id}`)?.click();
                    }
                  }}
                >
                  {isReplacing ? (
                    <>
                      <RoseSpinner size={16} announce={false} />
                      Replacing...
                    </>
                  ) : (
                    <>
                      Replace
                    </>
                  )}
                </label>
              </>
            )}

            {/* Remove Font */}
            <Button
              onClick={() => setConfirmRemove(font.id)}
              disabled={isComponentDisabled || isProcessing}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              aria-label={`Remove ${font.name}`}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Error Display */}
        {actionState.error && actionState.fontId === font.id && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {actionState.error.message}
          </div>
        )}
      </article>
    );
  };

  // Don't render if no fonts
  if (customFonts.length === 0) {
    return null;
  }

  return (
    <section 
      className={`custom-font-management-panel ${className}`}
      aria-labelledby="custom-fonts-heading"
      role="region"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <h3 
          id="custom-fonts-heading" 
          className="text-lg font-medium text-text"
        >
          Custom Fonts ({customFonts.length}/{maxFonts})
        </h3>
        <div 
          className="text-sm text-text-muted"
          aria-label={`Font usage: ${customFonts.length} of ${maxFonts} slots used`}
        >
          {customFonts.length === maxFonts ? 'At limit' : `${maxFonts - customFonts.length} remaining`}
        </div>
      </header>

      {/* Font List */}
      <div 
        className="space-y-4"
        role="list"
        aria-label={`${customFonts.length} custom fonts`}
      >
        {customFonts.map((font) => (
          <div key={font.id} role="listitem">
            {renderFontItem(font)}
          </div>
        ))}
      </div>

      {/* Global Error */}
      {actionState.error && !actionState.fontId && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {actionState.error.message}
          <button
            onClick={() => setActionState({ fontId: null, action: null, error: null })}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Enhanced screen reader announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
        aria-label="Font management status updates"
      >
        {actionState.action === 'removing' && `Removing custom font. Please wait...`}
        {actionState.action === 'replacing' && `Replacing custom font with new file. Please wait...`}
        {actionState.error && `Font management error: ${actionState.error.message}`}
        {confirmRemove && `Confirmation required to remove font. Use the Remove button to confirm or Cancel to abort.`}
      </div>

      {/* SEO-friendly structured data for font management */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Custom Font Management Panel",
            "description": "Manage uploaded custom fonts with preview, replacement, and removal capabilities",
            "featureList": [
              "Font preview with sample text",
              "Font metadata display",
              "Font replacement functionality", 
              "Safe font removal with confirmation",
              "Usage statistics tracking"
            ],
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "accessibilityFeature": [
              "fullKeyboardControl",
              "screenReaderSupport",
              "alternativeText",
              "structuredNavigation"
            ],
            "accessibilityControl": [
              "fullKeyboardControl",
              "fullMouseControl",
              "fullTouchControl"
            ]
          })
        }}
      />
    </section>
  );
};
