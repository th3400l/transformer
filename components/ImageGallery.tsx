/**
 * ImageGallery Component
 * 
 * Displays generated images in a gallery with navigation controls.
 * Shows exactly 3 images at a time with left/right arrow navigation.
 * Includes fullscreen icon overlays and smooth transitions.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React, { useState, useEffect, useMemo } from 'react';
import { GeneratedImage, ImageGalleryProps } from '../types/gallery';
import { RoseSpinner } from './Spinner';

// Navigation Icons
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

const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

// Close Icon
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Individual Image Card Component
interface ImageCardProps {
  image: GeneratedImage;
  onFullscreenView: (image: GeneratedImage) => void;
  onImageSelect?: (image: GeneratedImage) => void;
  onRemoveImage: (imageId: string) => void; // New prop for removing an image
  className?: string;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  onFullscreenView, 
  onImageSelect, 
  onRemoveImage,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = () => {
    if (onImageSelect) {
      onImageSelect(image);
    }
  };

  const handleFullscreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFullscreenView(image);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveImage(image.id);
  };

  const summaryText = image.metadata.textContent
    ? image.metadata.textContent.replace(/\s+/g, ' ').trim()
    : '';

  return (
    <div 
      className={`relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Generated image ${image.metadata.label || image.sequenceNumber}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Image */}
      <div className="aspect-[4/5] relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 bg-opacity-70 backdrop-blur-sm flex items-center justify-center">
            <RoseSpinner size={32} announce={false} label={`Loading ${image.metadata.label || `image ${image.sequenceNumber}`}`} />
          </div>
        )}
        <img
          src={image.url}
          alt={`Generated handwriting image ${image.metadata.label || image.sequenceNumber}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        
        {/* Close Icon Overlay */}
        <button
          onClick={handleRemoveClick}
          className={`absolute top-2 left-2 p-2 bg-black bg-opacity-50 text-white rounded-full transition-all duration-300 hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
          aria-label="Remove image"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
        
        {/* Fullscreen Icon Overlay - Requirement 1.4 */}
        <button
          onClick={handleFullscreenClick}
          className={`absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full transition-all duration-300 hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
          aria-label="View in fullscreen"
        >
          <ExpandIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Image Info */}
      <div className="p-3">
        <div
          className="text-sm text-gray-600 mb-1 truncate"
          title={image.metadata.label || `Image ${image.sequenceNumber}`}
        >
          {image.metadata.label || `Image ${image.sequenceNumber}`}
        </div>
        <div className="text-xs text-gray-400 truncate" title={summaryText}>
          {summaryText.substring(0, 50)}
          {summaryText.length > 50 ? '...' : ''}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {Math.round(image.metadata.size / 1024)}KB • {image.metadata.format.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// Gallery Navigation Component
interface GalleryNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

const GalleryNavigation: React.FC<GalleryNavigationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext
}) => {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          canGoPrevious
            ? 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] shadow-md hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Previous images"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          canGoNext
            ? 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] shadow-md hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        aria-label="Next images"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// Main ImageGallery Component

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImageSelect,
  onFullscreenView,
  onRemoveImage,
  onBulkDownload,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 3; // Requirement 1.1: exactly 3 images at a time

  // Calculate pagination - Requirement 1.2: navigation controls
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;
  const currentImages = images.slice(startIndex, endIndex);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Navigation handlers - Requirement 1.3: smooth transitions
  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Reset to first page when images change
  useEffect(() => {
    setCurrentPage(1);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrevious) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoPrevious, canGoNext]);

  return (
    <div className={`bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[var(--text-color)] tracking-tight">
            Gallery
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-color)] opacity-60"></div>
            <span className="text-sm font-medium text-[var(--text-muted)]">
              {images.length} {images.length === 1 ? 'image' : 'images'}
            </span>
          </div>
        </div>
        {onBulkDownload && (
          <button
            onClick={onBulkDownload}
            disabled={images.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg ${
              images.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={images.length > 0 ? "Download all images" : "No images to download"}
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Download All</span>
          </button>
        )}
      </div>

      {images.length === 0 ? (
        /* Empty State - Show message when no images */
        <div className="flex items-center justify-center py-20 min-h-[300px]">
          <div className="text-center">
            <h2 className="text-sm font-medium text-[var(--text-muted)] mb-2 tracking-wide">
              Click "Generate Images" to see the magic.
            </h2>
          </div>
        </div>
      ) : (
        <>
          {/* Image Grid - Requirement 1.1: exactly 3 images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {currentImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onFullscreenView={onFullscreenView}
                onImageSelect={onImageSelect}
                onRemoveImage={onRemoveImage}
                className="transform transition-all duration-300"
              />
            ))}
          </div>

          {/* Navigation - Requirement 1.2: left/right arrow navigation */}
          {totalPages > 1 && (
            <GalleryNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              onPrevious={handlePrevious}
              onNext={handleNext}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ImageGallery;
