import React, { useRef, lazy, Suspense, useState, useEffect } from 'react';
import { HeroSection } from './homepage/HeroSection';
import MainPage from './app/MainPage';

// Lazy load below-the-fold content sections for better performance
const HowItWorksSection = lazy(() => import('./homepage/HowItWorksSection'));
const FeaturesSection = lazy(() => import('./homepage/FeaturesSection'));
const UseCasesSection = lazy(() => import('./homepage/UseCasesSection'));
const TipsSection = lazy(() => import('./homepage/TipsSection'));
const TestimonialsSection = lazy(() => import('./homepage/TestimonialsSection'));
import { DistortionProfile, DistortionLevel, InkColorOption } from '../app/constants';
import { ITemplateProvider, PaperTemplate, ICanvasRenderer } from '../types/core';
import { IFontManager } from '../types/fonts';
import { ICustomFontUploadManager } from '../types/customFontUpload';
import { IPaperTextureManager } from '../types/core';
import { GeneratedImage } from '../types/gallery';

interface StartScreenProps {
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

// Loading fallback component for lazy-loaded sections
const SectionLoadingFallback: React.FC = () => (
  <div className="w-full py-16 md:py-24 flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center">
      <div className="w-16 h-16 bg-control-border rounded-full mb-4"></div>
      <div className="h-4 w-32 bg-control-border rounded"></div>
    </div>
  </div>
);

export const StartScreen: React.FC<StartScreenProps> = (props) => {
  const toolInterfaceRef = useRef<HTMLDivElement>(null);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show/hide sticky button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!toolInterfaceRef.current) return;

      const toolRect = toolInterfaceRef.current.getBoundingClientRect();
      const toolPosition = toolRect.top;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Show button when scrolled past the first 100px (hero/header area)
      // Hide button when the tool interface is coming into view
      const shouldShow = scrollY > 600 && toolPosition > windowHeight;
      setShowStickyButton(shouldShow);
    };

    handleScroll(); // Check initial position
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTool = () => {
    if (toolInterfaceRef.current) {
      toolInterfaceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="w-full">
      {/* Sticky "Start Creating" Button for Mobile */}
      {showStickyButton && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={scrollToTool}
            className="bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-color-hover)] 
                       text-white font-semibold rounded-full 
                       shadow-lg hover:shadow-xl
                       min-h-[44px] min-w-[44px] px-8 py-3
                       text-base md:text-lg
                       touch-manipulation
                       transition-all duration-200"
            aria-label="Scroll to tool interface"
          >
            Start Creating
          </button>
        </div>
      )}

      {/* Content Sections */}
      <section className="w-full">
        <HeroSection onScrollToTool={scrollToTool} />
      </section>

      {/* Section Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-12" />

      <Suspense fallback={<SectionLoadingFallback />}>
        <section className="w-full">
          <HowItWorksSection />
        </section>
      </Suspense>

      {/* Section Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-12" />

      <Suspense fallback={<SectionLoadingFallback />}>
        <section className="w-full">
          <FeaturesSection />
        </section>
      </Suspense>

      {/* Section Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-12" />

      <Suspense fallback={<SectionLoadingFallback />}>
        <section className="w-full">
          <UseCasesSection />
        </section>
      </Suspense>

      {/* Section Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-12" />

      <Suspense fallback={<SectionLoadingFallback />}>
        <section className="w-full">
          <TestimonialsSection />
        </section>
      </Suspense>

      {/* Section Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-12" />

      <Suspense fallback={<SectionLoadingFallback />}>
        <section className="w-full">
          <TipsSection />
        </section>
      </Suspense>

      {/* Section Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-16" />

      {/* Tool Interface - Scroll Target */}
      <div ref={toolInterfaceRef} id="tool-interface">
        <MainPage {...props} />
      </div>


    </div>
  );
};

export default StartScreen;
