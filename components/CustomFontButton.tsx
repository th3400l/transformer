// Custom Font Button Component
// Replaces the "Copy Text" button with "Use Custom Font" functionality

import React, { useState } from 'react';
import { CustomFontUploadDialog } from './CustomFontUploadDialog';
import { CustomFontUploadResult, FontErrorType } from '../types/customFontUpload';

interface CustomFontButtonProps {
  onCustomFontUpload: (result: CustomFontUploadResult) => void;
  customFontUploadManager: any;
  maxCustomFonts: number;
  currentCount: number;
  disabled?: boolean;
  className?: string;
}

export const CustomFontButton: React.FC<CustomFontButtonProps> = ({
  onCustomFontUpload,
  customFontUploadManager,
  maxCustomFonts,
  currentCount,
  disabled = false,
  className = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpload = async (file: File): Promise<CustomFontUploadResult> => {
    if (!customFontUploadManager) {
      return {
        success: false,
        error: {
          type: FontErrorType.FEATURE_UNAVAILABLE,
          message: 'Font upload manager not available',
          code: 'MANAGER_NOT_AVAILABLE',
          recoverable: false,
          severity: 'high'
        }
      };
    }

    const result = await customFontUploadManager.uploadFont(file);
    
    if (result.success) {
      onCustomFontUpload(result);
    }
    
    return result;
  };

  const canUploadMore = currentCount < maxCustomFonts;
  const buttonText = canUploadMore 
    ? 'Use Custom Font' 
    : `Custom Fonts Full (${currentCount}/${maxCustomFonts})`;

  return (
    <>
      <button 
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled}
        className={`w-full text-center bg-transparent border-2 border-[var(--accent-color)] text-[var(--accent-color)] font-semibold py-2 px-4 rounded-lg transition-colors duration-300 hover:bg-[var(--accent-color)] hover:text-white ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
        aria-label={canUploadMore 
          ? `Upload custom font. ${maxCustomFonts - currentCount} slots available.`
          : `Custom font limit reached. ${currentCount} of ${maxCustomFonts} fonts uploaded.`
        }
      >
        {buttonText}
      </button>

      <CustomFontUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpload={handleUpload}
        maxCustomFonts={maxCustomFonts}
        currentCount={currentCount}
        disabled={disabled}
      />
    </>
  );
};