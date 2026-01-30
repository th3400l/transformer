import React from 'react';
import { RoseSpinner } from './Spinner';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  detail?: string;
  tip?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Preparing your handwritten magic...',
  detail,
  tip
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="loading-overlay" role="alert" aria-live="assertive">
      <div className="loading-overlay__card">
        <RoseSpinner size={96} label={message} />
        <p className="loading-overlay__message">{message}</p>
        {detail && (
          <p className="loading-overlay__detail">{detail}</p>
        )}
        {tip && (
          <p className="loading-overlay__tip">{tip}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
