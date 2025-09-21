// Image Gallery types and interfaces for handwriting app enhancements
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

export interface GeneratedImage {
  id: string;
  blob: Blob;
  url: string;
  timestamp: Date;
  metadata: ImageMetadata;
  sequenceNumber: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  textContent: string;
  label?: string;
  digitalId?: string;
  templateId?: string;
  fontFamily?: string;
  fontSize?: number;
  inkColor?: string;
}

export interface ImageGalleryProps {
  images: GeneratedImage[];
  onImageSelect?: (image: GeneratedImage) => void;
  onFullscreenView: (image: GeneratedImage) => void;
  onRemoveImage: (imageId: string) => void;
  onBulkDownload?: () => void;
  className?: string;
}

export interface FullscreenViewerProps {
  image: GeneratedImage | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onDownloadRequest?: (image: GeneratedImage) => void;
}

export interface GalleryNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export interface ImageCardProps {
  image: GeneratedImage;
  onFullscreenView: (image: GeneratedImage) => void;
  onImageSelect?: (image: GeneratedImage) => void;
  onRemoveImage: (imageId: string) => void;
  className?: string;
}
