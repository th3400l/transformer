import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import LabPanel from '../LabPanel';
import OutputPanel from '../OutputPanel';
import { RoseSpinner } from '../Spinner';
import { DistortionProfile, DistortionLevel, InkColorOption } from '../../app/constants';
import { ITemplateProvider, PaperTemplate, ICanvasRenderer } from '../../types/core';
import { IFontManager } from '../../types/fonts';
import { ICustomFontUploadManager } from '../../types/customFontUpload';
import { IPaperTextureManager } from '../../types/core';
import { GeneratedImage } from '../../types/gallery';

// Lazy load non-critical components


interface MainPageProps {
  text: string;
  onTextChange: (value: string) => void;
  fontManager: IFontManager | null;
  selectedFontId: string;
  onFontChange: (fontId: string, fontFamily: string) => void;
  inkColors: InkColorOption[];
  inkColor: string;
  setInkColor: (color: string) => void;
  inkBoldness: number;
  setInkBoldness: (boldness: number) => void;
  isInkMenuOpen: boolean;
  setIsInkMenuOpen: (open: boolean) => void;
  inkMenuRef: React.RefObject<HTMLDivElement>;
  templateProvider: ITemplateProvider | null;
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  customFontUploadManager: ICustomFontUploadManager | null;
  currentCustomFontsCount: number;
  onOpenCustomFontDialog: () => void;
  onGenerateImages: () => Promise<void> | void;
  isGenerating: boolean;
  exportProgress: string;
  showPageLimitWarning: boolean;
  fontFamily: string;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  inkColorResolved: string;
  currentPaperTemplate: PaperTemplate | null;
  textureManager: IPaperTextureManager | null;
  distortionProfile: DistortionProfile;
  paperDistortionLevel: DistortionLevel;
  onPaperDistortionChange: (level: DistortionLevel) => void;
  isTemplateLoading: boolean;
  previewRefreshToken: number;
  generatedImages: GeneratedImage[];
  onFullscreenView: (image: GeneratedImage) => void;
  onRemoveImage: (imageId: string) => void;
  onBulkDownload: () => void;
  onDownloadPdf?: () => void;
  downloadQuality?: 'high' | 'medium' | 'low';
  onDownloadQualityChange?: (q: 'high' | 'medium' | 'low') => void;
  presentRoseRef: React.RefObject<HTMLAnchorElement>;
  canvasRenderer: ICanvasRenderer | null;
  wordsPerPage: number;
  textCutoffSnippet: string | null;
}

export const MainPage: React.FC<MainPageProps> = ({
  text,
  onTextChange,
  fontManager,
  selectedFontId,
  onFontChange,
  inkColors,
  inkColor,
  setInkColor,
  inkBoldness,
  setInkBoldness,
  isInkMenuOpen,
  setIsInkMenuOpen,
  inkMenuRef,
  templateProvider,
  selectedTemplate,
  onTemplateChange,
  customFontUploadManager,
  currentCustomFontsCount,
  onOpenCustomFontDialog,
  onGenerateImages,
  isGenerating,
  exportProgress,
  showPageLimitWarning,
  fontFamily,
  fontSize,
  onFontSizeChange,
  inkColorResolved,
  currentPaperTemplate,
  textureManager,
  distortionProfile,
  paperDistortionLevel,
  onPaperDistortionChange,
  isTemplateLoading,
  previewRefreshToken,
  generatedImages,
  onFullscreenView,
  onRemoveImage,
  onBulkDownload,
  onDownloadPdf,
  downloadQuality,
  onDownloadQualityChange,
  presentRoseRef,
  canvasRenderer,
  wordsPerPage,
  textCutoffSnippet
}) => {
  // Live Preview Logic - Removed auto-generation as per user feedback
  // The CanvasOutput component automatically re-renders when props change, providing a visual preview
  // without adding to the generated images gallery.
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);
  const [activeTab, setActiveTab] = useState<'lab' | 'output'>('lab'); // Assuming a default tab for mobile

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8" role="main" aria-label="Handwriting generator application">
      <h1 className="sr-only">Handwriting Generator - Convert Text to Realistic Handwritten Notes</h1>
      {/* Mobile Tab Navigation (example, assuming this is part of the mobile layout) */}
      <div className="lg:hidden flex justify-center gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'lab' ? 'bg-accent text-white' : 'bg-control-bg text-text-muted hover:text-text'}`}
          onClick={() => setActiveTab('lab')}
        >
          Controls
        </button>
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'output' ? 'bg-accent text-white' : 'bg-control-bg text-text-muted hover:text-text'}`}
          onClick={() => setActiveTab('output')}
        >
          Preview & Gallery
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Controls Sidebar */}
        <div className={`w-full lg:w-[420px] flex-shrink-0 lg:sticky lg:top-28 z-10 ${isPreviewRendering && activeTab === 'lab' ? 'opacity-90' : ''} ${activeTab === 'output' ? 'hidden lg:block' : ''}`}>
          <LabPanel
            text={text}
            onTextChange={onTextChange}
            fontManager={fontManager}
            selectedFontId={selectedFontId}
            onFontChange={onFontChange}
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
            inkColors={inkColors}
            inkColor={inkColor}
            setInkColor={setInkColor}
            inkBoldness={inkBoldness}
            setInkBoldness={setInkBoldness}
            isInkMenuOpen={isInkMenuOpen}
            setIsInkMenuOpen={setIsInkMenuOpen}
            inkMenuRef={inkMenuRef}
            paperDistortionLevel={paperDistortionLevel}
            onPaperDistortionChange={onPaperDistortionChange}
            customFontUploadManager={customFontUploadManager}
            currentCustomFontsCount={currentCustomFontsCount}
            onOpenCustomFontDialog={onOpenCustomFontDialog}
            onGenerateImages={onGenerateImages}
            isGenerating={isGenerating}
            exportProgress={exportProgress}
            showPageLimitWarning={showPageLimitWarning}
            textCutoffSnippet={textCutoffSnippet}
            isDisabled={isPreviewRendering}
          />
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 w-full min-w-0 lg:block" style={{ display: activeTab === 'output' || window.innerWidth >= 1024 ? 'block' : 'none' }}>
          <OutputPanel
            text={text}
            fontFamily={fontFamily}
            fontSize={fontSize}
            inkColor={inkColor}
            resolvedInkColor={inkColorResolved}
            inkBoldness={inkBoldness}
            currentPaperTemplate={currentPaperTemplate}
            textureManager={textureManager}
            distortionProfile={distortionProfile}
            paperDistortionLevel={paperDistortionLevel}
            isTemplateLoading={isTemplateLoading}
            previewRefreshToken={previewRefreshToken}
            generatedImages={generatedImages}
            onFullscreenView={onFullscreenView}
            onRemoveImage={onRemoveImage}
            onBulkDownload={onBulkDownload}
            onDownloadPdf={onDownloadPdf}
            downloadQuality={downloadQuality}
            onDownloadQualityChange={onDownloadQualityChange}
            presentRoseRef={presentRoseRef}
            canvasRenderer={canvasRenderer}
            wordsPerPage={wordsPerPage}
            templateProvider={templateProvider}
            selectedTemplate={selectedTemplate}
            onTemplateChange={onTemplateChange}
            onPreviewRenderingChange={setIsPreviewRendering}
          />
        </div>
      </div>

      {/* Floating Warning for Mobile if Rendering */}
      {isPreviewRendering && activeTab === 'lab' && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 backdrop-blur-md">
          <RoseSpinner size={16} className="flex-shrink-0" announce={false} />
          <span>Updating preview...</span>
        </div>
      )}

      <section className="w-full max-w-4xl mx-auto mt-20 mb-12">
        <div className="glass-panel rounded-2xl shadow-2xl p-10 md:p-14 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent opacity-50"></div>

          <div className="mb-8 relative z-10">
            <span className="px-6 py-2 border border-[var(--accent-color)] rounded-full text-sm font-bold text-[var(--accent-color)] tracking-widest uppercase bg-[var(--bg-color)]">
              Our Mission
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-color)] mb-8 leading-tight">
            Why we built this?
          </h2>

          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            We believe in a future where students can focus on their ideas instead of getting hand cramps from writing assignments. No cap, it's time to embrace the digital age while keeping that authentic handwritten vibe.
          </p>
        </div>
      </section>


    </main>
  );
};

export default MainPage;
