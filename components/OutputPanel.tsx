import React, { useState, useEffect, useCallback, useRef } from 'react';
import CanvasOutput from './CanvasOutput';
import ImageGallery from './ImageGallery';
import { PaperTemplate, ICanvasRenderer, VariationRangeConfig, IPaperTextureManager, ITemplateProvider } from '../types/core';
import { GeneratedImage } from '../types/gallery';
import { TemplateNamingService, EnhancedPaperTemplate } from '../services/templateNamingService';
import { getErrorNotificationService } from '../services/errorNotificationService';

interface OutputPanelProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  inkColor: string;
  resolvedInkColor: string;
  inkBoldness: number;
  currentPaperTemplate: PaperTemplate | null;
  textureManager: IPaperTextureManager | null;
  distortionProfile: VariationRangeConfig;
  paperDistortionLevel: number;
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
  templateProvider: ITemplateProvider | null;
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  onPreviewRenderingChange?: (isRendering: boolean) => void;
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
  presentRoseRef,
  canvasRenderer,
  wordsPerPage,
  templateProvider,
  selectedTemplate,
  onTemplateChange,
  onPreviewRenderingChange
}) => {
  const [templates, setTemplates] = useState<EnhancedPaperTemplate[]>([]);
  const namingService = useRef(new TemplateNamingService()).current;

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!templateProvider) return;
      try {
        const rawTemplates = await templateProvider.getAvailableTemplates();
        let availableTemplates = rawTemplates;

        if ('prevalidateTemplates' in templateProvider) {
          try {
            const validation = await (templateProvider as any).prevalidateTemplates();
            if (validation.invalid.length > 0) {
              console.warn(`${validation.invalid.length} templates failed validation`);
            }
            availableTemplates = validation.valid;
          } catch (e) {
            console.warn('Template validation failed', e);
          }
        }

        const enhancedTemplates = namingService.mapLegacyNames(availableTemplates);
        setTemplates(enhancedTemplates);
      } catch (err) {
        console.error('Failed to load templates', err);
        const errorService = getErrorNotificationService();
        errorService.showError(err as Error, 'loading templates');
      }
    };
    loadTemplates();
  }, [templateProvider, namingService]);

  const availableBlankTemplates = templates.filter(t => t.type === 'blank');

  // Navigation Handlers
  const handleNav = useCallback((direction: 'next' | 'prev') => {
    if (availableBlankTemplates.length === 0) return;
    const currentIndex = availableBlankTemplates.findIndex(t => t.id === selectedTemplate);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % availableBlankTemplates.length;
    } else {
      nextIndex = currentIndex <= 0 ? availableBlankTemplates.length - 1 : currentIndex - 1;
    }
    const nextTemplate = availableBlankTemplates[nextIndex];
    if (nextTemplate) {
      onTemplateChange(nextTemplate.id);
    }
  }, [availableBlankTemplates, selectedTemplate, onTemplateChange]);

  const currentEnhancedTemplate = templates.find(t => t.id === selectedTemplate);

  const handleRenderError = useCallback((error: Error) => {
    console.error('Preview render error:', error);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--panel-bg)] rounded-xl shadow-lg border border-[var(--panel-border)] p-4 gap-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[var(--panel-border)] pb-2 relative z-20 flex-shrink-0">
        {/* Left: Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center">
            <h3 className="text-lg font-bold text-[var(--text-color)]">Live Preview</h3>
            <div className="blinking-dot ml-2" aria-hidden="true" />
          </div>

          {/* Mobile-only template name display */}
          <div className="md:hidden text-sm font-medium text-[var(--text-muted)] bg-[var(--surface-color)] px-3 py-1 rounded-full border border-[var(--panel-border)]">
            {currentEnhancedTemplate ? currentEnhancedTemplate.displayName : 'Loading...'}
          </div>
        </div>

        {/* Center: Template Info (Desktop) */}
        <div className="hidden md:flex items-center justify-center gap-3">
          <span className="text-[var(--text-muted)] text-sm">Template:</span>
          <span className="font-medium text-[var(--text-color)] bg-[var(--bg-secondary)] px-3 py-1 rounded-lg border border-[var(--panel-border)] min-w-[100px] text-center">
            {currentEnhancedTemplate ? currentEnhancedTemplate.displayName : 'Loading...'}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <a
            ref={presentRoseRef}
            href="https://www.buymeacoffee.com/th3f00l"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 h-10 text-sm font-medium text-pink-500 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg transition-colors whitespace-nowrap w-full md:w-auto"
          >
            <span>🌹</span>
            <span className="inline">Present Rose</span>
          </a>
        </div>
      </div>

      {/* Canvas Output Area with Overlay Navigation */}
      <div className="relative flex-1 min-h-[500px] lg:min-h-[600px] bg-[var(--paper-bg)] rounded-xl border border-[var(--panel-border)] shadow-inner z-0 overflow-hidden group">

        {/* Navigation Arrows */}
        {availableBlankTemplates.length > 1 && (
          <>
            <button
              onClick={() => handleNav('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-16 flex items-center justify-center bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)] text-[var(--accent-color)] hover:text-white border border-[var(--accent-color)]/50 backdrop-blur-md shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none rounded-lg"
              aria-label="Previous template"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => handleNav('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-16 flex items-center justify-center bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)] text-[var(--accent-color)] hover:text-white border border-[var(--accent-color)]/50 backdrop-blur-md shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none rounded-lg"
              aria-label="Next template"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        <div className="w-full h-full overflow-auto">
          {canvasRenderer && currentPaperTemplate ? (
            <CanvasOutput
              text={text}
              fontFamily={fontFamily}
              fontSize={fontSize}
              inkColor={resolvedInkColor}
              paperTemplate={currentPaperTemplate}
              canvasRenderer={canvasRenderer}
              distortionProfile={distortionProfile}
              onRenderError={handleRenderError}
              onRenderingStateChange={onPreviewRenderingChange}
              // Skip animation for preview updates to keep it snappy
              skipInitialAnimation={true}
              distortionLevel={paperDistortionLevel}
              inkBoldness={inkBoldness}
              className="w-full h-full min-h-[460px] md:min-h-[520px] p-4 md:p-8"
              wordsPerPage={wordsPerPage}
            />
          ) : (
            <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[var(--text-muted)] font-medium animate-pulse">
                {isTemplateLoading ? 'Loading paper template...' : 'Initializing handwriting engine...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
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

    </div>
  );
};

export default OutputPanel;
