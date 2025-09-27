// Font Validation Feedback Component
// Requirements: 3.5, 3.6, 6.1, 6.2, 6.3

import React from 'react';
import { FontUploadError } from '../types/customFontUpload';

interface FontValidationFeedbackProps {
  error: FontUploadError | null;
  onDismiss?: () => void;
  className?: string;
}

export const FontValidationFeedback: React.FC<FontValidationFeedbackProps> = ({
  error,
  onDismiss,
  className = ''
}) => {
  if (!error) return null;

  const getErrorIcon = (errorType: string) => {
    const map: Record<string, string> = {
      validation: '!',
      storage: 'S',
      limit: 'L',
      duplicate: 'D',
      browser: 'N',
      default: 'X'
    };
    const symbol = map[errorType] || map.default;
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold border border-[var(--text-muted)] rounded-full text-[var(--text-muted)]" aria-hidden="true">{symbol}</span>
    );
  };

  const getErrorColor = (errorType: string) => {
    switch (errorType) {
      case 'validation':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'storage':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'limit':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'duplicate':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'browser':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getSuggestions = (error: FontUploadError): string[] => {
    switch (error.code) {
      case 'INVALID_FILE_TYPE':
        return [
          'Make sure the file has a .ttf, .otf, .woff, or .woff2 extension',
          'Try converting your font to a supported format using online font converters',
          'Check that the file is not corrupted or damaged',
          'Some font files may have invalid internal structure - try a different font'
        ];
      
      case 'FILE_TOO_LARGE':
        return [
          'Compress your font file using a font optimization tool',
          'Try converting to WOFF2 format for better compression',
          'Remove unused characters from the font if possible'
        ];
      
      case 'UPLOAD_LIMIT_REACHED':
        return [
          'Remove an existing custom font to make space',
          'Consider which fonts you use most frequently',
          'You can replace existing fonts with new ones'
        ];
      
      case 'DUPLICATE_FONT':
        return [
          'A font with this name already exists',
          'Choose to replace the existing font or rename the new one',
          'Check if you already have this font uploaded'
        ];
      
      case 'MANAGER_NOT_AVAILABLE':
        return [
          'The font upload system is not properly initialized',
          'Refresh the page and try again',
          'Check your browser console for any errors',
          'Ensure JavaScript is enabled in your browser'
        ];

      case 'BROWSER_UNSUPPORTED':
        return [
          'Your browser may not support this font format',
          'Try using a different browser or updating your current one',
          'Convert the font to a more widely supported format'
        ];

      case 'FILE_CORRUPTED':
        return [
          'The font file appears to be damaged or incomplete',
          'Try downloading the font file again from the original source',
          'Check if the font file opens correctly in other applications',
          'Convert the font to a different format using font conversion tools'
        ];
      
      default:
        return [
          'The font file has an invalid or corrupted internal structure',
          'Try downloading the font again from the original source',
          'Convert the font to a different format (TTF to WOFF2 or vice versa)',
          'Use a font validation tool to check if the font file is valid',
          'Try a different font file - some fonts may have compatibility issues'
        ];
    }
  };

  const suggestions = getSuggestions(error);

  return (
    <div 
      className={`
        border rounded-lg p-4 mb-4 ${getErrorColor(error.type)} ${className}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      aria-labelledby="error-title"
      aria-describedby="error-message error-suggestions"
    >
      <div className="flex items-start gap-3">
        <div className="text-lg flex-shrink-0">
          {getErrorIcon(error.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 id="error-title" className="font-medium text-sm mb-1 sr-only">
            Font Upload Error - {error.type}
          </h3>
          
          <div id="error-message" className="font-medium text-sm mb-1">
            {error.message}
          </div>
          
          {suggestions.length > 0 && (
            <div id="error-suggestions" className="text-xs opacity-90">
              <div className="font-medium mb-1">Suggestions to resolve this issue:</div>
              <ul className="list-disc list-inside space-y-1" role="list">
                {suggestions.map((suggestion, index) => (
                  <li key={index} role="listitem">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer hover:underline">
                Technical details
              </summary>
              <pre className="text-xs mt-1 p-2 bg-black/10 rounded overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-lg hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-1 rounded"
            aria-label={`Dismiss ${error.type} error message: ${error.message}`}
            title="Close error message"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>
    </div>
  );
};