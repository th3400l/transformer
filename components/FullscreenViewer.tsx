/**
 * FullscreenViewer Component
 * 
 * Provides fullscreen viewing capability for generated images.
 * Includes proper image scaling, positioning, keyboard navigation, and close functionality.
 * 
 * Requirements: 1.5
 */

import React, { useEffect, useState, useCallback } from 'react';
import { GeneratedImage, FullscreenViewerProps } from '../types/gallery';
import { RoseSpinner } from './Spinner';

// Icons
const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
  image,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onDownloadRequest
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle keyboard navigation - Requirement 1.5
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (onPrevious) {
          onPrevious();
        }
        break;
      case 'ArrowRight':
        if (onNext) {
          onNext();
        }
        break;
      default:
        break;
    }
  }, [isOpen, onClose, onNext, onPrevious]);

  // Handle mouse movement for control visibility
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    setControlsTimeout(prev => {
      if (prev) {
        clearTimeout(prev);
      }
      
      return setTimeout(() => {
        setShowControls(false);
      }, 3000);
    });
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Initial control visibility timeout
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = 'unset';
      
      setControlsTimeout(prev => {
        if (prev) {
          clearTimeout(prev);
        }
        return null;
      });
    };
  }, [isOpen, handleKeyDown, handleMouseMove]);

  // Reset image loaded state when image changes
  useEffect(() => {
    setImageLoaded(false);
  }, [image?.id]);

  // Handle download
  const handleDownload = () => {
    if (!image) return;

    if (onDownloadRequest) {
      onDownloadRequest(image);
      return;
    }

    const link = document.createElement('a');
    link.href = image.url;
    link.download = `handwritten-image-${image.sequenceNumber}.${image.metadata.format}`;
    link.click();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !image) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image viewer"
    >
      {/* Loading indicator */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white">
            <RoseSpinner size={48} label="Loading image" announce={false} />
            <span className="text-sm tracking-wide uppercase">Loading image...</span>
          </div>
        </div>
      )}

      {/* Main image - Requirement 1.5: proper scaling and positioning */}
      <div className="relative max-w-full max-h-full p-4">
        <img
          src={image.url}
          alt={`Generated handwriting image ${image.sequenceNumber} - fullscreen view`}
          className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            maxWidth: 'calc(100vw - 2rem)'
          }}
        />
      </div>

      {/* Controls overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black to-transparent pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-lg font-medium">{image.metadata.label || `Image ${image.sequenceNumber}`}</h3>
              <p className="text-sm text-gray-300">
                {image.metadata.width} × {image.metadata.height} • {Math.round(image.metadata.size / 1024)}KB
              </p>
              {image.metadata.digitalId && (
                <p className="text-xs text-gray-400">Digital ID: {image.metadata.digitalId}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Download button */}
              <button
                onClick={handleDownload}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                aria-label="Download image"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                aria-label="Close fullscreen view"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation arrows - Requirement 1.5: keyboard navigation */}
        {onPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 pointer-events-auto"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}

        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 pointer-events-auto"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent pointer-events-auto">
          <div className="text-center text-white">
            <p className="text-sm text-gray-300 mb-2">
              {image.metadata.textContent.length > 100 
                ? `${image.metadata.textContent.substring(0, 100)}...`
                : image.metadata.textContent
              }
            </p>
            <p className="text-xs text-gray-400">
              Press ESC to close • Use arrow keys to navigate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenViewer;
