import React from 'react';
import HandwritingPreview from './HandwritingPreview';
import ImageGallery from './ImageGallery';
import { PaperTemplate } from '../types/core';
import { GeneratedImage } from '../types/gallery';

interface OutputPanelProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  inkColor: string;
  resolvedInkColor: string;
  inkBoldness: number;
  currentPaperTemplate: PaperTemplate | null;
  textureManager: any;
  distortionProfile: any;
  paperDistortionLevel: number;
  isTemplateLoading: boolean;
  previewRefreshToken: number;
  generatedImages: any[];
  onFullscreenView: (image: any) => void;
  onRemoveImage: (imageId: string) => void;
  onBulkDownload: () => void;
  onDownloadPdf?: () => void;
  downloadQuality?: 'high' | 'medium' | 'low';
  onDownloadQualityChange?: (q: 'high' | 'medium' | 'low') => void;
  presentRoseRef: React.RefObject<HTMLAnchorElement>;
}

const OutputPanel: React.FC<OutputPanelProps> = ({
  text,
  fontFamily,
  fontSize,
  inkColor,
  resolvedInkColor,
  inkBoldness,
  currentPaperTemplate,
  textureManager,
  distortionProfile,
  paperDistortionLevel,
  isTemplateLoading,
  previewRefreshToken,
  generatedImages,
  onFullscreenView,
  onRemoveImage,
  onBulkDownload,
  onDownloadPdf,
  downloadQuality,
  onDownloadQualityChange,
  presentRoseRef
}) => {
  return (
    <section className="lg:col-span-2 md:col-span-1 flex flex-col gap-4 h-full" role="region" aria-labelledby="output-heading">
      <h2 id="output-heading" className="sr-only">Handwriting Preview and Gallery</h2>
      <div className="w-full flex-1 overflow-auto max-h-[75vh] md:max-h-[70vh] lg:max-h-[75vh] rounded-xl shadow-2xl shadow-[var(--shadow-color)] border border-[var(--panel-border)] transition-all duration-300" role="img" aria-label="Generated handwriting preview">
        <HandwritingPreview
          text={text}
          fontFamily={fontFamily}
          fontSize={fontSize}
          inkColor={inkColor}
          resolvedInkColor={resolvedInkColor}
          inkBoldness={inkBoldness}
          paperTemplate={currentPaperTemplate}
          textureManager={textureManager}
          distortionProfile={distortionProfile}
          distortionLevel={paperDistortionLevel}
          isTemplateLoading={isTemplateLoading}
          className="w-full h-full min-h-[460px] md:min-h-[520px] p-6"
          refreshToken={previewRefreshToken}
        />
      </div>
      <div className="w-full">
        <ImageGallery
          images={generatedImages}
          onFullscreenView={onFullscreenView}
          onRemoveImage={onRemoveImage}
          onBulkDownload={onBulkDownload}
          onDownloadPdf={onDownloadPdf}
          downloadQuality={downloadQuality}
          onDownloadQualityChange={onDownloadQualityChange}
          className="shadow-lg"
        />
      </div>
      <div className="pb-2 px-8 md:px-12">
        <a
          ref={presentRoseRef}
          href="https://www.buymeacoffee.com/th3f00l"
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 w-full bg-transparent border-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
        >
          Present rose
        </a>
      </div>
    </section>
  );
};

export default OutputPanel;
