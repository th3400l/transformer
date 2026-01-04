/**
 * Error Recovery Notification Component
 * Displays user-friendly error messages with recovery suggestions
 * Requirements: 10.1, 10.2 - User-friendly error messages
 */

import React from 'react';
import { UserErrorMessage } from '../services/errorRecoveryService';

interface ErrorRecoveryNotificationProps {
  errorMessage: UserErrorMessage;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetryButton?: boolean;
}

/**
 * Error Recovery Notification Component
 * Displays contextual error information with recovery options
 */
export const ErrorRecoveryNotification: React.FC<ErrorRecoveryNotificationProps> = ({
  errorMessage,
  onRetry,
  onDismiss,
  showRetryButton = true
}) => {
  const getSeverityStyles = () => {
    switch (errorMessage.severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          text: 'text-red-800 dark:text-red-200'
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-500 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          text: 'text-red-700 dark:text-red-200'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-100',
          text: 'text-yellow-800 dark:text-yellow-200'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100',
          text: 'text-blue-800 dark:text-blue-200'
        };
    }
  };

  const getSeverityIcon = () => {
    switch (errorMessage.severity) {
      case 'critical':
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const styles = getSeverityStyles();

  return (
    <div
      className={`rounded-lg border ${styles.border} ${styles.bg} p-4 shadow-sm`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getSeverityIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {errorMessage.title}
          </h3>
          
          <div className={`mt-2 text-sm ${styles.text}`}>
            <p>{errorMessage.message}</p>
            
            {errorMessage.suggestion && (
              <p className="mt-2 font-medium">
                💡 {errorMessage.suggestion}
              </p>
            )}
          </div>

          {(errorMessage.recoverable && (showRetryButton && onRetry)) && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onRetry}
                className={`
                  inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md
                  ${errorMessage.severity === 'warning' 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700'
                    : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700'
                  }
                  transition-colors duration-200
                `}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className={`
                    inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md
                    ${styles.text} hover:opacity-80 transition-opacity duration-200
                  `}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {onDismiss && !errorMessage.recoverable && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className={`
                inline-flex rounded-md p-1.5 ${styles.icon}
                hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-opacity duration-200
              `}
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorRecoveryNotification;
