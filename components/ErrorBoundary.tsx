import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorDisplayProps {
  error: Error;
  errorId: string;
  onRetry: () => void;
  onReportError: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, errorId, onRetry, onReportError }) => (
  <div className="min-h-[400px] flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Oops! Something went wrong
      </h3>
      
      <p className="text-red-600 mb-4 text-sm">
        We encountered an unexpected error. Don't worry, your work is safe.
      </p>
      
      <div className="text-xs text-red-500 mb-4 font-mono bg-red-100 p-2 rounded border">
        Error ID: {errorId}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
        
        <button
          onClick={onReportError}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Report Issue
        </button>
      </div>
      
      <details className="mt-4 text-left">
        <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
          Technical Details
        </summary>
        <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto max-h-32">
          {error.message}
          {error.stack && `\n\nStack trace:\n${error.stack}`}
        </pre>
      </details>
    </div>
  </div>
);

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys changed
    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevResetKeys[index]);
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real application, you would send this to your error reporting service
      // For now, we'll just log it
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };

      console.error('Error Report:', errorReport);

      // Example: Send to error reporting service
      // errorReportingService.report(errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (error && errorInfo) {
      // Create a more detailed error report
      const detailedReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Copy error details to clipboard for easy reporting
      navigator.clipboard.writeText(JSON.stringify(detailedReport, null, 2))
        .then(() => {
          alert('Error details copied to clipboard. Please paste this information when reporting the issue.');
        })
        .catch(() => {
          // Fallback: show error details in a new window
          const reportWindow = window.open('', '_blank');
          if (reportWindow) {
            reportWindow.document.write(`
              <html>
                <head><title>Error Report - ${errorId}</title></head>
                <body>
                  <h1>Error Report</h1>
                  <p>Please copy the following information and report it to our support team:</p>
                  <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">
${JSON.stringify(detailedReport, null, 2)}
                  </pre>
                </body>
              </html>
            `);
          }
        });
    }
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error display
      return (
        <ErrorDisplay
          error={error}
          errorId={errorId}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
        />
      );
    }

    return children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting from functional components
export function useErrorHandler() {
  const reportError = (error: Error, context?: string) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context: context || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Manual Error Report:', errorReport);
    
    // In a real application, send to error reporting service
    // errorReportingService.report(errorReport);
  };

  return { reportError };
}