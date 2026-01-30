// Custom Font Uploader Component
// Requirements: 3.5, 3.6, 6.1, 6.2, 6.3

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CustomFontUploadResult, FontUploadError, FontErrorType } from '../types/customFontUpload';
import { RoseSpinner } from './Spinner';
import { BrowserCompatibilityLayer } from '../services/browserCompatibilityLayer';
import { getFontErrorNotificationService } from '../services/fontErrorNotificationService';

interface CustomFontUploaderProps {
  onUpload: (file: File) => Promise<CustomFontUploadResult>;
  onValidationError: (error: FontUploadError) => void;
  maxFiles: number;
  currentCount: number;
  disabled?: boolean;
  className?: string;
}

interface UploadState {
  type: 'idle' | 'dragover' | 'uploading' | 'validating' | 'success';
  progress?: number;
  uploadedFont?: any;
}

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 16v2.25A2.25 2.25 0 0 1 17.75 20.5H6.25A2.25 2.25 0 0 1 4 18.25V16" />
  </svg>
);

export const CustomFontUploader: React.FC<CustomFontUploaderProps> = ({
  onUpload,
  onValidationError,
  maxFiles,
  currentCount,
  disabled = false,
  className = ''
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({ type: 'idle' });
  const [browserCapabilities, setBrowserCapabilities] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const browserCompatibility = useRef(new BrowserCompatibilityLayer());
  const fontErrorService = getFontErrorNotificationService();

  // Detect browser capabilities and mobile optimizations on mount
  useEffect(() => {
    const capabilities = browserCompatibility.current.detectCapabilities();
    const optimizations = browserCompatibility.current.getBrowserOptimizations();
    setBrowserCapabilities({ ...capabilities, ...optimizations });
  }, []);

  // Check if we can upload more fonts
  const canUpload = currentCount < maxFiles && !disabled;

  // Supported file types
  const acceptedTypes = '.ttf,.otf,.woff,.woff2';
  const acceptedMimeTypes = [
    'font/ttf',
    'font/otf', 
    'font/woff',
    'font/woff2',
    'application/font-ttf',
    'application/font-otf',
    'application/font-woff',
    'application/x-font-ttf',
    'application/x-font-otf'
  ];

  // Validate file before upload
  const validateFile = (file: File): FontUploadError | null => {
    // Check file type
    const isValidType = acceptedMimeTypes.includes(file.type) || 
                       acceptedTypes.split(',').some(ext => 
                         file.name.toLowerCase().endsWith(ext.trim())
                       );
    
    if (!isValidType) {
      return {
        type: FontErrorType.INVALID_FORMAT,
        message: 'Invalid file type. Please upload TTF, OTF, WOFF, or WOFF2 files.',
        code: 'INVALID_FILE_TYPE',
        recoverable: true,
        severity: 'high'
      };
    }

    // Additional validation for common font file issues
    if (file.size < 1024) { // Less than 1KB is likely corrupted
      return {
        type: FontErrorType.FILE_CORRUPTED,
        message: 'Font file appears to be corrupted or incomplete. Please try a different font file.',
        code: 'FILE_CORRUPTED',
        recoverable: true,
        severity: 'high'
      };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        type: FontErrorType.FILE_TOO_LARGE,
        message: `File size too large. Maximum size is 5MB, but file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
        code: 'FILE_TOO_LARGE',
        recoverable: true,
        severity: 'high'
      };
    }

    // Check if we can upload more fonts
    if (currentCount >= maxFiles) {
      return {
        type: FontErrorType.FONT_LIMIT_REACHED,
        message: `Maximum of ${maxFiles} custom fonts allowed. Please remove a font before uploading.`,
        code: 'UPLOAD_LIMIT_REACHED',
        recoverable: true,
        severity: 'medium'
      };
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!canUpload) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      // Show validation error as notification instead of inline
      fontErrorService.showFontError(validationError, {
        fileName: file.name,
        fileSize: file.size,
        operation: 'file validation',
        timestamp: new Date(),
        sessionId: `validation-${Date.now()}`
      });
      onValidationError(validationError);
      return;
    }

    let progressInterval: NodeJS.Timeout | null = null;
    let validationTimeout: NodeJS.Timeout | null = null;

    try {
      // Start upload
      setUploadState({ type: 'uploading', progress: 0 });

      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadState(prev => {
          if (prev.type === 'uploading' && prev.progress !== undefined) {
            const newProgress = Math.min(prev.progress + 10, 90);
            return { ...prev, progress: newProgress };
          }
          return prev;
        });
      }, 100);

      // Switch to validation phase
      validationTimeout = setTimeout(() => {
        setUploadState({ type: 'validating' });
      }, 1000);

      // Perform actual upload
      const result = await onUpload(file);

      // Clear timers immediately after upload completes
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (validationTimeout) {
        clearTimeout(validationTimeout);
        validationTimeout = null;
      }

      if (result.success) {
        setUploadState({ type: 'validating' });

        const stripExtension = (filename: string) => filename.replace(/\.[^/.]+$/, '');
        const displayName = stripExtension(result.font?.originalFilename || file.name);
        setUploadState({ 
          type: 'success', 
          uploadedFont: result.font 
        });
        
        // Show success notification
        fontErrorService.showFontSuccess(
          `Font ${displayName} uploaded successfully. You can now select it from the font list.`,
          {
            fileName: file.name,
            fileSize: file.size,
            fontFamily: result.font?.family,
            operation: 'font upload',
            timestamp: new Date(),
            sessionId: `upload-${Date.now()}`
          }
        );
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('customFontUploaded', {
          detail: { font: result.font }
        }));
        
        // Reset to idle after success message
        setTimeout(() => {
          setUploadState({ type: 'idle' });
        }, 2000);
      } else {
        const uploadError: FontUploadError = result.error ?? {
          type: FontErrorType.PROCESSING_ERROR,
          message: 'Upload failed',
          code: 'UPLOAD_FAILED',
          recoverable: true,
          severity: 'medium'
        };
        
        // Show error as notification instead of inline
        fontErrorService.showFontError(uploadError, {
          fileName: file.name,
          fileSize: file.size,
          operation: 'font upload',
          timestamp: new Date(),
          sessionId: `upload-error-${Date.now()}`
        });
        
        if (result.error) {
          onValidationError(result.error);
        }
        
        // Reset to idle state immediately for all errors (including duplicates)
        setUploadState({ type: 'idle' });
      }
    } catch (error) {
      // Clear all timers on error
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (validationTimeout) {
        clearTimeout(validationTimeout);
        validationTimeout = null;
      }
      
      // Check for specific font parsing errors
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      let errorCode = 'UPLOAD_ERROR';
      
      if (errorMessage.includes('OTS parsing error') || 
          errorMessage.includes('invalid sfntVersion') ||
          errorMessage.includes('Failed to decode downloaded font')) {
        errorCode = 'FONT_PARSING_ERROR';
      }
      
      const uploadError: FontUploadError = {
        type: errorCode === 'FONT_PARSING_ERROR' ? FontErrorType.MALFORMED_FONT : FontErrorType.PROCESSING_ERROR,
        message: errorCode === 'FONT_PARSING_ERROR'
          ? 'Font file has invalid format or structure. Please try a different font file.'
          : errorMessage,
        code: errorCode,
        recoverable: true,
        severity: 'high'
      };
      
      // Show error as notification instead of inline
      fontErrorService.showFontError(uploadError, {
        fileName: file.name,
        fileSize: file.size,
        operation: 'font upload processing',
        timestamp: new Date(),
        sessionId: `upload-exception-${Date.now()}`
      });
      
      onValidationError(uploadError);
      
      // Reset to idle state immediately for all errors
      setUploadState({ type: 'idle' });
    } finally {
      // Final cleanup - ensure all timers are cleared
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    }
  }, [canUpload, currentCount, maxFiles, onUpload, onValidationError]);

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow re-uploading same file
    event.target.value = '';
  };

  // Check if drag and drop is supported (not on mobile)
  const supportsDragDrop = browserCapabilities?.hasDragAndDrop && !browserCapabilities?.mobile?.isMobile;

  // Handle drag and drop events (only if supported)
  const handleDragEnter = (event: React.DragEvent) => {
    if (!supportsDragDrop) return;
    
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current++;
    
    if (canUpload && uploadState.type === 'idle') {
      setUploadState({ type: 'dragover' });
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    if (!supportsDragDrop) return;
    
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setUploadState({ type: 'idle' });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (!supportsDragDrop) return;
    
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    if (!supportsDragDrop) return;
    
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setUploadState({ type: 'idle' });

    if (!canUpload) return;

    const files = Array.from(event.dataTransfer.files);
    const fontFile = files.find(file => 
      acceptedMimeTypes.includes(file.type) || 
      acceptedTypes.split(',').some(ext => 
        file.name.toLowerCase().endsWith(ext.trim())
      )
    );

    if (fontFile) {
      handleFileUpload(fontFile);
    } else if (files.length > 0) {
      const error: FontUploadError = {
        type: FontErrorType.INVALID_FORMAT,
        message: 'Please drop a valid font file (TTF, OTF, WOFF, or WOFF2).',
        code: 'INVALID_DROP_FILE',
        recoverable: true,
        severity: 'medium'
      };
      
      // Show error as notification instead of inline
      fontErrorService.showFontError(error, {
        operation: 'drag and drop validation',
        timestamp: new Date(),
        sessionId: `drop-validation-${Date.now()}`
      });
      
      onValidationError(error);
    }
  };

  // Handle click to open file dialog
  const handleClick = () => {
    if (canUpload && uploadState.type === 'idle') {
      fileInputRef.current?.click();
    }
  };

  // Render upload state content with mobile optimizations
  const renderUploadContent = () => {
    const isMobile = browserCapabilities?.mobile?.isMobile;
    const isTablet = browserCapabilities?.mobile?.useTouch && !isMobile;
    
    switch (uploadState.type) {
      case 'idle':
        return (
          <>
            <div className="mb-3 flex justify-center">
              <UploadIcon
                className={`${isMobile ? 'w-14 h-14' : 'w-12 h-12'} text-[var(--accent-color)]`}
              />
              <span className="sr-only">Upload font file</span>
            </div>
            <div className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-[var(--text-color)] mb-1`}>
              {isMobile ? (
                'Tap to select font file'
              ) : isTablet ? (
                'Tap to browse or drop font file'
              ) : (
                <>
                  <span className="hidden sm:inline">Drop font file here or </span>Click to browse
                </>
              )}
            </div>
            <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-[var(--text-muted)]`}>
              TTF, OTF, WOFF, WOFF2 (max 5MB)
            </div>
          </>
        );

      case 'dragover':
        return (
          <>
            <div className={`${browserCapabilities?.mobile?.isMobile ? 'text-3xl' : 'text-2xl'} mb-2`}>⬇️</div>
            <div className={`${browserCapabilities?.mobile?.isMobile ? 'text-base' : 'text-sm'} font-medium text-[var(--accent-color)]`}>
              Drop to upload
            </div>
          </>
        );

      case 'uploading':
        const isMobileUploading = browserCapabilities?.mobile?.isMobile;
        const reducedAnimations = browserCapabilities?.mobile?.reducedAnimations;
        
        return (
          <>
            <RoseSpinner 
              size={isMobileUploading ? 40 : 32} 
              className="mb-2" 
              announce={false} 
            />
            <div className={`${isMobileUploading ? 'text-base' : 'text-sm'} font-medium text-[var(--text-color)] mb-1`}>
              Uploading font... {uploadState.progress}%
            </div>
            <div className={`w-full bg-[var(--control-border)] rounded-full ${isMobileUploading ? 'h-3' : 'h-2'}`}>
              <div 
                className={`bg-[var(--accent-color)] ${isMobileUploading ? 'h-3' : 'h-2'} rounded-full ${reducedAnimations ? '' : 'transition-all duration-300'}`}
                style={{ width: `${uploadState.progress || 0}%` }}
              />
            </div>
          </>
        );

      case 'validating':
        const isMobileValidating = browserCapabilities?.mobile?.isMobile;
        
        return (
          <>
            <RoseSpinner 
              size={isMobileValidating ? 40 : 32} 
              className="mb-2" 
              announce={false} 
            />
            <div className={`${isMobileValidating ? 'text-base' : 'text-sm'} font-medium text-[var(--text-color)]`}>
              Validating font file...
            </div>
            <div className={`${isMobileValidating ? 'text-sm' : 'text-xs'} text-[var(--text-muted)]`}>
              Checking format and compatibility
            </div>
          </>
        );

      case 'success':
        const isMobileSuccess = browserCapabilities?.mobile?.isMobile;
        
        return (
          <>
            <div className={`${isMobileSuccess ? 'text-3xl' : 'text-2xl'} mb-2 text-green-600`}>Success</div>
            <div className={`${isMobileSuccess ? 'text-base' : 'text-sm'} font-medium text-green-600`}>
              Font uploaded successfully!
            </div>
            {uploadState.uploadedFont && (
              <div className={`${isMobileSuccess ? 'text-sm' : 'text-xs'} text-[var(--text-muted)]`}>
                {uploadState.uploadedFont.name}
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // Don't render if at limit
  if (currentCount >= maxFiles) {
    return null;
  }

  // Get responsive classes based on device type
  const getResponsiveClasses = () => {
    const isMobile = browserCapabilities?.mobile?.isMobile;
    const isTablet = browserCapabilities?.mobile?.useTouch && !isMobile;
    const reducedAnimations = browserCapabilities?.mobile?.reducedAnimations;
    
    let classes = 'border-2 rounded-lg text-center cursor-pointer ';
    
    // Mobile-specific styling
    if (isMobile) {
      classes += 'p-6 min-h-[120px] border-solid '; // Solid border for mobile, larger touch targets
    } else if (isTablet) {
      classes += 'p-5 min-h-[100px] border-dashed '; // Medium size for tablets
    } else {
      classes += 'p-4 sm:p-6 border-dashed '; // Desktop with drag-and-drop styling
    }
    
    // Animation classes
    if (!reducedAnimations) {
      classes += 'transition-all duration-200 ';
    }
    
    // State-specific classes
    if (uploadState.type === 'dragover' && supportsDragDrop) {
      classes += 'border-[var(--accent-color)] bg-[var(--accent-color)]/5 ';
      if (!reducedAnimations) {
        classes += 'scale-105 ';
      }
    } else {
      classes += 'border-[var(--control-border)] hover:border-[var(--accent-color)] hover:bg-[var(--accent-color)]/5 ';
    }
    
    if (!canUpload) {
      classes += 'opacity-50 cursor-not-allowed ';
    }
    
    if (uploadState.type === 'success') {
      classes += 'border-green-300 bg-green-50/50 ';
    }
    
    return classes;
  };

  return (
    <div className={`custom-font-uploader ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || !canUpload}
        aria-label="Select font file from device"
      />
      
      <div
        onClick={handleClick}
        onDragEnter={supportsDragDrop ? handleDragEnter : undefined}
        onDragLeave={supportsDragDrop ? handleDragLeave : undefined}
        onDragOver={supportsDragDrop ? handleDragOver : undefined}
        onDrop={supportsDragDrop ? handleDrop : undefined}
        className={getResponsiveClasses()}
        role="button"
        tabIndex={canUpload ? 0 : -1}
        aria-label={
          canUpload 
            ? `Upload font file area. ${supportsDragDrop ? 'Drag and drop or click' : 'Click'} to select font file. ${maxFiles - currentCount} uploads remaining.`
            : `Upload disabled. Maximum ${maxFiles} fonts reached.`
        }
        aria-disabled={!canUpload}
        aria-describedby="upload-instructions upload-requirements"
        aria-expanded={uploadState.type !== 'idle'}
        aria-busy={uploadState.type === 'uploading' || uploadState.type === 'validating'}
        onKeyDown={(e) => {
          if (canUpload && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {renderUploadContent()}
      </div>

      {/* Hidden instructions for screen readers */}
      <div id="upload-instructions" className="sr-only">
        {supportsDragDrop 
          ? 'Drag font files onto this area or click to open file browser. Supported on desktop browsers.'
          : 'Click or tap to open file browser and select font files from your device.'
        }
      </div>

      <div id="upload-requirements" className="sr-only">
        File requirements: TTF, OTF, WOFF, or WOFF2 format. Maximum 5MB file size. {maxFiles - currentCount} upload slots available.
      </div>

      {/* Enhanced screen reader announcements with detailed progress */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
        aria-label="Font upload status and progress updates"
      >
        {uploadState.type === 'uploading' && `Uploading font file, ${uploadState.progress}% complete. Please wait while the file is being processed.`}
        {uploadState.type === 'validating' && 'Validating font file format and integrity. This may take a few moments.'}
        {uploadState.type === 'success' && `Font uploaded successfully: ${uploadState.uploadedFont?.name || 'Custom font'}. The font is now available in the font selector.`}
        {uploadState.type === 'dragover' && supportsDragDrop && 'Drop file now to begin font upload'}
        {uploadState.type === 'idle' && canUpload && `Ready to upload font. ${maxFiles - currentCount} upload slots remaining.`}
      </div>

      {/* Comprehensive accessibility information and instructions */}
      <div className="sr-only">
        <h3>Font Upload Requirements and Instructions</h3>
        <ul>
          <li>Supported file formats: TTF (TrueType Font), OTF (OpenType Font), WOFF (Web Open Font Format), and WOFF2 (Web Open Font Format 2)</li>
          <li>Maximum file size: 5 megabytes per font file</li>
          <li>Maximum custom fonts allowed: {maxFiles} fonts total</li>
          <li>Current custom fonts uploaded: {currentCount} of {maxFiles}</li>
          {supportsDragDrop && <li>Desktop users can drag and drop font files onto the upload area</li>}
          <li>Mobile and tablet users can tap the upload area to select files from their device</li>
          <li>Upload progress will be announced as the file is processed</li>
          <li>Validation checks file format, size, and font integrity before adding to your collection</li>
        </ul>
        {!canUpload && (
          <p role="alert">Upload limit reached. You have uploaded the maximum number of custom fonts ({maxFiles}). Remove an existing font to upload a new one.</p>
        )}
        {currentCount === 0 && (
          <p>No custom fonts uploaded yet. Upload your first custom font to personalize your handwriting generation.</p>
        )}
      </div>

      {/* SEO-friendly structured data for upload feature */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Custom Font Uploader",
            "description": "Upload and manage custom fonts for handwriting generation",
            "featureList": [
              "TTF, OTF, WOFF, WOFF2 font support",
              "Drag and drop file upload",
              "Real-time upload progress",
              "Font validation and integrity checking",
              "Cross-platform file selection"
            ],
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "fileFormat": ["font/ttf", "font/otf", "font/woff", "font/woff2"],
            "storageRequirements": "5MB maximum per font file",
            "accessibilityFeature": [
              "fullKeyboardControl",
              "screenReaderSupport",
              "alternativeText",
              "longDescription"
            ],
            "accessibilityControl": [
              "fullKeyboardControl",
              "fullMouseControl", 
              "fullTouchControl"
            ]
          })
        }}
      />
    </div>
  );
};
