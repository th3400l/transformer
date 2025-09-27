import React from 'react';
import LabPanel from '../LabPanel';
import OutputPanel from '../OutputPanel';
import Testimonials from '../Testimonials';
import { DistortionProfile, DistortionLevel, InkColorOption } from '../../app/constants';
import { ITemplateProvider, PaperTemplate } from '../../types/core';
import { IFontManager } from '../../types/fonts';
import { ICustomFontUploadManager } from '../../types/customFontUpload';
import { IPaperTextureManager } from '../../types/core';
import { GeneratedImage } from '../../types/gallery';

interface MainPageProps {
  text: string;
  onTextChange: (value: string) => void;
  fontManager: IFontManager | null;
  selectedFontId: string;
  onFontChange: (fontId: string, fontFamily: string) => void;
  inkColors: InkColorOption[];
  inkColor: string;
  setInkColor: (color: string) => void;
  isInkMenuOpen: boolean;
  setIsInkMenuOpen: (open: boolean) => void;
  inkMenuRef: React.RefObject<HTMLDivElement>;
  templateProvider: ITemplateProvider | null;
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  isPaperVibeOpen: boolean;
  togglePaperVibe: () => void;
  paperVibeInnerRef: React.RefObject<HTMLDivElement>;
  paperVibeHeight: number;
  customFontUploadManager: ICustomFontUploadManager | null;
  currentCustomFontsCount: number;
  onOpenCustomFontDialog: () => void;
  onGenerateImages: () => Promise<void> | void;
  isGenerating: boolean;
  exportProgress: string;
  showPageLimitWarning: boolean;
  fontFamily: string;
  fontSize: number;
  inkColorResolved: string;
  currentPaperTemplate: PaperTemplate | null;
  textureManager: IPaperTextureManager | null;
  distortionProfile: DistortionProfile;
  paperDistortionLevel: DistortionLevel;
  isTemplateLoading: boolean;
  previewRefreshToken: number;
  generatedImages: GeneratedImage[];
  onFullscreenView: (image: GeneratedImage) => void;
  onRemoveImage: (imageId: string) => void;
  onBulkDownload: () => void;
  presentRoseRef: React.RefObject<HTMLAnchorElement>;
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
  isInkMenuOpen,
  setIsInkMenuOpen,
  inkMenuRef,
  templateProvider,
  selectedTemplate,
  onTemplateChange,
  isPaperVibeOpen,
  togglePaperVibe,
  paperVibeInnerRef,
  paperVibeHeight,
  customFontUploadManager,
  currentCustomFontsCount,
  onOpenCustomFontDialog,
  onGenerateImages,
  isGenerating,
  exportProgress,
  showPageLimitWarning,
  fontFamily,
  fontSize,
  inkColorResolved,
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
  presentRoseRef
}) => (
  <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8" role="main" aria-label="Handwriting generator application">
    <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 items-start">
      <LabPanel
        text={text}
        onTextChange={onTextChange}
        fontManager={fontManager}
        selectedFontId={selectedFontId}
        onFontChange={onFontChange}
        inkColors={inkColors}
        inkColor={inkColor}
        setInkColor={setInkColor}
        isInkMenuOpen={isInkMenuOpen}
        setIsInkMenuOpen={setIsInkMenuOpen}
        inkMenuRef={inkMenuRef}
        templateProvider={templateProvider}
        selectedTemplate={selectedTemplate}
        onTemplateChange={onTemplateChange}
        isPaperVibeOpen={isPaperVibeOpen}
        togglePaperVibe={togglePaperVibe}
        paperVibeInnerRef={paperVibeInnerRef}
        paperVibeHeight={paperVibeHeight}
        customFontUploadManager={customFontUploadManager}
        currentCustomFontsCount={currentCustomFontsCount}
        onOpenCustomFontDialog={onOpenCustomFontDialog}
        onGenerateImages={() => {
          void onGenerateImages();
        }}
        isGenerating={isGenerating}
        exportProgress={exportProgress}
        showPageLimitWarning={showPageLimitWarning}
      />

      <OutputPanel
        text={text}
        fontFamily={fontFamily}
        fontSize={fontSize}
        inkColor={inkColor}
        resolvedInkColor={inkColorResolved}
        currentPaperTemplate={currentPaperTemplate}
        textureManager={textureManager}
        distortionProfile={distortionProfile}
        paperDistortionLevel={paperDistortionLevel}
        isTemplateLoading={isTemplateLoading}
        previewRefreshToken={previewRefreshToken}
        generatedImages={generatedImages as any}
        onFullscreenView={onFullscreenView as any}
        onRemoveImage={onRemoveImage}
        onBulkDownload={onBulkDownload}
        presentRoseRef={presentRoseRef}
      />
    </div>

    <section className="w-full max-w-4xl mx-auto mt-12">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-8 md:p-12 text-center">
        <div className="mb-6">
          <button className="px-6 py-2 border border-[var(--accent-color)] rounded-full text-sm font-medium text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-white transition-colors duration-300">
            A Word
          </button>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-color)] mb-6 leading-tight">
          What is the motivation behind this?<br />
        </h2>

        <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          We believe in a future where students can focus on their ideas instead of getting hand cramps from writing assignments. No cap, it's time to embrace the digital age while keeping that authentic handwritten vibe.
        </p>
      </div>
    </section>

    <Testimonials />
  </main>
);
