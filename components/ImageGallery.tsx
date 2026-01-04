import React from 'react';
import { GeneratedImage } from '../types/gallery';
import { Button } from './Button';
import { DownloadIcon, PDFIcon, XMarkIcon } from './icons';

interface ImageGalleryProps {
  images: GeneratedImage[];
  onFullscreenView: (image: GeneratedImage) => void;
  onRemoveImage: (imageId: string) => void;
  onBulkDownload: () => void;
  onDownloadPdf?: () => void;
  downloadQuality?: 'high' | 'medium' | 'low';
  onDownloadQualityChange?: (q: 'high' | 'medium' | 'low') => void;
  className?: string;
}

// Internal ImageCard component for cleaner code
const ImageCard: React.FC<{
  image: GeneratedImage;
  onFullscreenView: (image: GeneratedImage) => void;
  onImageSelect: (image: GeneratedImage) => void;
  onRemoveImage: (imageId: string) => void;
  className?: string;
}> = ({ image, onFullscreenView, onImageSelect, onRemoveImage, className }) => {
  return (
    <div className={`group relative bg-paper-bg rounded-lg shadow-md overflow-hidden border border-panel-border hover:shadow-xl transition-all duration-300 ${className}`}>
      {/* Image Preview */}
      <div
        className="aspect-[3/4] w-full overflow-hidden cursor-pointer relative"
        onClick={() => onFullscreenView(image)}
      >
        <img
          src={image.url}
          alt={`Handwriting Sample ${image.sequenceNumber + 1} - ${image.metadata.textContent?.substring(0, 30) || 'Converted Text'}`}
          className="w-full h-full object-contain bg-white transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullscreenView(image);
            }}
            className="p-2 bg-white/90 rounded-full text-gray-800 hover:bg-white hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            title="View Fullscreen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-3 bg-control-bg border-t border-panel-border flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-text truncate max-w-[120px]">
            Image {image.sequenceNumber + 1}
          </span>
          <span className="text-[10px] text-text-muted">
            {image.metadata.width}x{image.metadata.height} • {(image.metadata.size / 1024).toFixed(0)}KB
          </span>
        </div>
        <Button
          variant="icon"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveImage(image.id);
          }}
          className="text-text-muted hover:text-red-500 hover:bg-red-500/10 border-transparent"
          title="Remove Image"
        >
          <XMarkIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onFullscreenView,
  onRemoveImage,
  onBulkDownload,
  onDownloadPdf,
  downloadQuality = 'high',
  onDownloadQualityChange,
  className
}) => {
  const [page, setPage] = React.useState(0);
  const IMAGES_PER_PAGE = 3;
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);

  const currentImages = images.slice(
    page * IMAGES_PER_PAGE,
    (page + 1) * IMAGES_PER_PAGE
  );

  const onImageSelect = (image: GeneratedImage) => {
    // Placeholder for future selection logic
    console.log('Selected', image.id);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 px-2 gap-4">
        <h3 className="text-lg font-bold text-text flex items-center gap-3">
          Gallery
          <span className="text-xs font-semibold text-text-muted bg-control-bg px-2.5 py-1 rounded-full border border-panel-border">
            {images.length}
          </span>
        </h3>

        <div className="flex items-center gap-2 bg-control-bg p-1.5 rounded-xl border border-panel-border shadow-sm self-start sm:self-auto">
          {/* Quality Selector */}
          {onDownloadQualityChange && (
            <div className="relative px-1">
              <select
                value={downloadQuality}
                onChange={(e) => onDownloadQualityChange(e.target.value as any)}
                className="text-xs font-medium bg-transparent text-text hover:text-accent focus:text-accent border-none outline-none cursor-pointer pr-6 py-1 appearance-none"
                style={{ backgroundImage: 'none' }}
              >
                <option value="high" className="bg-control-bg text-text">High Quality</option>
                <option value="medium" className="bg-control-bg text-text">Medium</option>
                <option value="low" className="bg-control-bg text-text">Low Quality</option>
              </select>
              {/* Custom caret */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          )}

          <div className="w-px h-5 bg-panel-border mx-1" />

          {/* Download Actions */}
          <div className="flex gap-1">
            {onDownloadPdf && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownloadPdf}
                className="gap-1.5 px-3 text-text-muted hover:text-text hover:bg-panel-bg"
                title="Download all as PDF"
              >
                <PDFIcon className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onBulkDownload}
              className="gap-1.5 px-3 shadow-sm"
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Download All</span>
              <span className="sm:hidden">All</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Image Grid - Requirement 1.1: exactly 3 images, centered showcase layout */}
      <div className="flex flex-wrap justify-center gap-6 mb-6">
        {currentImages.map((image) => (
          <div key={image.id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm animate-fade-in">
            <ImageCard
              image={image}
              onFullscreenView={onFullscreenView}
              onImageSelect={onImageSelect}
              onRemoveImage={onRemoveImage}
              className="transform transition-all duration-300 w-full h-full"
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-full hover:bg-control-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-medium text-text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-full hover:bg-control-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
