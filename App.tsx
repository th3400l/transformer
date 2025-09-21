/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Header from './components/Header';

import TermsPage from './components/TermsPage';
import FaqPage from './components/FaqPage';
import BlogPage from './components/BlogPage';
import BlogPostPage from './components/BlogPostPage';
import { blogPosts } from './services/blogPosts';
import AboutPage from './components/AboutPage';
import PaperTemplateSelector from './components/PaperTemplateSelector';

import ErrorNotificationPanel from './components/ErrorNotificationPanel';
import HandwritingPreview from './components/HandwritingPreview';
import { initializeServiceContainer } from './services/ServiceConfiguration';
import { SERVICE_TOKENS, DEFAULT_RENDERING_CONFIG } from './types/index';
import { ICanvasRenderer, ITemplateProvider, IImageExportSystem, IPaperTextureManager, PaperTemplate, ExportOptions, IPageSplitter } from './types/core';
import { IFontManager } from './types/fonts';
import { GeneratedImage, ImageMetadata } from './types/gallery';
import { FontSelector } from './components/FontSelector';
import ImageGallery from './components/ImageGallery';
import FullscreenViewer from './components/FullscreenViewer';
import { useBulkDownload } from './hooks/useBulkDownload';
import { BulkDownloadModal } from './components/BulkDownloadProgress';
import { useSEO } from './hooks/useSEO';
import { ErrorBoundary } from './components/ErrorBoundary';
import { globalErrorHandler } from './services/errorHandler';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import { LoadingOverlay } from './components/LoadingOverlay';
import { RoseSpinner } from './components/Spinner';
import Testimonials from './components/Testimonials';
import { getQualityManager, QualitySettings } from './services/qualityManager';
import { computeHandwritingLayoutMetrics } from './services/layoutMetrics';
import { embedDigitalSignature } from './services/imageSignature';

// import { getSystemIntegrationManager, SystemIntegrationManager } from './services/systemIntegration';

// Footer Icons
const AboutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const BlogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
  </svg>
);

const TermsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const FaqIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);



// Font management is now handled by FontManager service

const inkColors = [
  { name: 'Black', value: 'var(--ink-black)' },
  { name: 'Blue', value: 'var(--ink-blue)' },
  { name: 'Red', value: 'var(--ink-red)' },
  { name: 'Green', value: 'var(--ink-green)' },
];

type DistortionLevel = 1 | 2 | 3;

interface DistortionProfile {
  baselineJitterRange: number;
  slantJitterRange: number;
  colorVariationIntensity: number;
  microTiltRange: number;
  description: string;
}

type DownloadIntentMode = 'bulk' | 'single';

interface DownloadIntent {
  id: string;
  mode: DownloadIntentMode;
  label: string;
  start: () => Promise<void> | void;
}

const DISTORTION_PROFILES: Record<DistortionLevel, DistortionProfile> = {
  1: {
    baselineJitterRange: 0.46,
    slantJitterRange: 0.32,
    colorVariationIntensity: 0.085,
    microTiltRange: 0.24,
    description: 'High realism – pronounced grain, softer contrast, and analog imperfections across the page.'
  },
  2: {
    baselineJitterRange: 0.24,
    slantJitterRange: 0.18,
    colorVariationIntensity: 0.055,
    microTiltRange: 0.13,
    description: 'Medium realism – balanced ink-to-paper blend with gentle texture and subtle wear.'
  },
  3: {
    baselineJitterRange: 0.16,
    slantJitterRange: 0.12,
    colorVariationIntensity: 0.042,
    microTiltRange: 0.09,
    description: 'Low realism – clean finish with restrained texture and a polished digital look.'
  }
};

const PAPER_QUALITY_OVERRIDES: Record<DistortionLevel, Partial<QualitySettings>> = {
  1: {
    renderingQuality: 0.88,
    textureQuality: 0.78,
    compressionLevel: 0.88,
    enableAntialiasing: true,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  },
  2: {
    renderingQuality: 0.96,
    textureQuality: 0.9,
    compressionLevel: 0.93,
    enableAntialiasing: true,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  },
  3: {
    renderingQuality: 1,
    textureQuality: 1,
    compressionLevel: 0.97,
    enableAntialiasing: true,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  }
};

const GENERATION_TIPS = [
  'High realism loads the toughest paper grain and jitter—great for single-page hero shots.',
  'Medium realism balances ink blend and paper wear for everyday notebook vibes.',
  'Low realism keeps things clean and digital-friendly while preserving handwriting personality.',
  'Gear 2 is in development—expect advanced stroke physics, smarter spacing, and richer paper sets.',
  'Switch inks freely: blue, red, and green all embed into the export along with a digital ID signature.',
  'Remember to skim the Terms & Conditions before submitting generated work anywhere official.',
  'Each export carries a txttohandwriting.org digital ID so you can prove it came from here.',
  'Bulk download packs pages into a tidy ZIP—perfect for big assignments or journaling sessions.'
];

const MAX_PAGES_PER_RUN = 2;
const MAX_TOTAL_PAGES = 6;

type GenerationLimitDialogState =
  | { type: 'per-run'; attempted: number; allowed: number }
  | { type: 'total'; attempted: number; allowed: number }
  | { type: 'gallery'; attempted: number; allowed: number; remove: number };

const INK_HEX_MAP: Record<string, string> = {
  'var(--ink-black)': '#2a2620',
  'var(--ink-blue)': '#2f4a92',
  'var(--ink-red)': '#b13535',
  'var(--ink-green)': '#2f6a52'
};

type Page = 'main' | 'terms' | 'faq' | 'blog' | 'blogPost' | 'about';
export type Theme = 'nightlight' | 'dark' | 'feminine';

const App: React.FC = () => {
  // Initialize service container
  const [serviceContainer, setServiceContainer] = useState<any>(null);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const container = initializeServiceContainer();
      setServiceContainer(container);
      setServicesInitialized(true);
      console.log('Service container initialized successfully');
    } catch (error) {
      console.error('Failed to initialize service container:', error);
      setInitializationError('Failed to initialize services. Please refresh the page.');
    }
  }, []);
  const [text, setText] = useState<string>("Got some tea to spill? Or just trying to make your essay look like you actually wrote it? \n\nDrop it here. Main character energy only.");
  const [selectedFontId, setSelectedFontId] = useState<string>('inkwell');
  const [fontFamily, setFontFamily] = useState<string>("'Caveat', cursive");
  const [fontSize, setFontSize] = useState<number>(24);

  const [inkColor, setInkColor] = useState<string>(inkColors[0].value);
  const [theme, setTheme] = useState<Theme>('nightlight');
  const [paperDistortionLevel, setPaperDistortionLevel] = useState<DistortionLevel>(3);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [page, setPage] = useState<Page>('main');
  const [currentPostSlug, setCurrentPostSlug] = useState<string | null>(null);
  const [isPaperVibeOpen, setIsPaperVibeOpen] = useState(true);

  const [canvasRenderer, setCanvasRenderer] = useState<ICanvasRenderer | null>(null);
  const [templateProvider, setTemplateProvider] = useState<ITemplateProvider | null>(null);
  const [imageExportSystem, setImageExportSystem] = useState<IImageExportSystem | null>(null);
  const [textureManager, setTextureManager] = useState<IPaperTextureManager | null>(null);
  const [fontManager, setFontManager] = useState<IFontManager | null>(null);
  const [pageSplitter, setPageSplitter] = useState<IPageSplitter | null>(null);

  const distortionProfile = useMemo(
    () => DISTORTION_PROFILES[paperDistortionLevel],
    [paperDistortionLevel]
  );

  const layoutMetrics = useMemo(
    () => computeHandwritingLayoutMetrics({
      canvasWidth: 800,
      canvasHeight: 1000,
      fontSize,
      baselineJitterRange: distortionProfile.baselineJitterRange,
      distortionLevel: paperDistortionLevel
    }),
    [fontSize, distortionProfile.baselineJitterRange, paperDistortionLevel]
  );

  const resolvedInkColor = useMemo(() => {
    return INK_HEX_MAP[inkColor] || INK_HEX_MAP['var(--ink-black)'];
  }, [inkColor]);

  const baseRenderConfig = useMemo(() => ({
    ...DEFAULT_RENDERING_CONFIG,
    baselineJitterRange: distortionProfile.baselineJitterRange,
    slantJitterRange: distortionProfile.slantJitterRange,
    colorVariationIntensity: distortionProfile.colorVariationIntensity,
    microTiltRange: distortionProfile.microTiltRange,
    baseInkColor: resolvedInkColor,
    wordsPerPage: layoutMetrics.wordsPerPage,
    distortionLevel: paperDistortionLevel
  }), [distortionProfile, resolvedInkColor, layoutMetrics.wordsPerPage, paperDistortionLevel]);

  useEffect(() => {
    if (servicesInitialized && serviceContainer) {
      try {
        setCanvasRenderer(serviceContainer.resolve(SERVICE_TOKENS.CANVAS_RENDERER));
        setTemplateProvider(serviceContainer.resolve(SERVICE_TOKENS.TEMPLATE_PROVIDER));
        setImageExportSystem(serviceContainer.resolve(SERVICE_TOKENS.IMAGE_EXPORT_SYSTEM));
        setTextureManager(serviceContainer.resolve(SERVICE_TOKENS.PAPER_TEXTURE_MANAGER));
        setFontManager(serviceContainer.resolve(SERVICE_TOKENS.FONT_MANAGER));
        setPageSplitter(serviceContainer.resolve(SERVICE_TOKENS.PAGE_SPLITTER));
      } catch (error) {
        console.error('Failed to resolve services:', error);
        setInitializationError('Failed to resolve services. Some features may be unavailable.');
      }
    }
  }, [servicesInitialized, serviceContainer]);

  // Paper template state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank-1');
  const defaultPaperTemplate: PaperTemplate = useMemo(() => ({
    id: 'blank-1',
    name: 'Default Blank',
    filename: 'blank-1.jpeg',
    type: 'blank'
  }), []);
  const [currentPaperTemplate, setCurrentPaperTemplate] = useState<PaperTemplate | null>(defaultPaperTemplate);
  const [isTemplateLoading, setIsTemplateLoading] = useState<boolean>(false);

  const [exportProgress, setExportProgress] = useState<string>('');
  const [showPageLimitWarning, setShowPageLimitWarning] = useState<boolean>(false);

  // Image gallery state - Requirement 1.3: proper image metadata tracking
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);

  // Bulk download state - Requirements: 2.1, 2.2, 2.3, 2.4
  const bulkDownload = useBulkDownload();
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showGenerationOverlay, setShowGenerationOverlay] = useState<boolean>(false);

  const [downloadIntent, setDownloadIntent] = useState<DownloadIntent | null>(null);
  const [downloadCountdown, setDownloadCountdown] = useState<number>(5);
  const downloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const downloadTriggeredRef = useRef<boolean>(false);
  const bodyOverflowRef = useRef<string | null>(null);
  const [overlayTipIndex, setOverlayTipIndex] = useState<number>(0);
  const [generationLimitDialog, setGenerationLimitDialog] = useState<GenerationLimitDialogState | null>(null);

  // System integration manager disabled for now
  // const [systemManager] = useState<SystemIntegrationManager | null>(() => systemIntegrationManager);

  // SEO optimization - Requirements 7.1, 7.2
  useSEO({
    title: 'Handwriting Generator - Convert Text to Realistic Handwriting',
    description: 'Generate realistic handwritten text with customizable fonts, templates, and ink colors. Perfect for creating authentic handwriting samples with multiple paper templates.',
    keywords: 'handwriting generator, text to handwriting, custom fonts, realistic handwriting, handwritten text, paper templates, ink colors'
  });

  useEffect(() => {
    console.log('ErrorBoundary resetKeys:', { page, selectedTemplate, selectedFontId });
  }, [page, selectedTemplate, selectedFontId]);

  // Performance monitoring - Requirements 7.4, 7.5, 7.6
  const performanceMonitor = usePerformanceMonitoring({
    enableAutoReporting: process.env.NODE_ENV === 'production',
    reportInterval: 60000, // 1 minute
    memoryThreshold: 85,
    onHighMemoryUsage: (usage) => {
      globalErrorHandler.handleError(
        new Error(`High memory usage detected: ${usage.toFixed(1)}%`),
        'memory-warning',
        'medium',
        { memoryUsage: usage }
      );
    },
    onPerformanceIssue: (suggestions) => {
      globalErrorHandler.handleError(
        new Error(`Performance issues detected: ${suggestions.length} suggestions`),
        'performance-warning',
        'medium',
        { suggestions: suggestions.map(s => s.description) }
      );
    }
  });

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      generatedImages.forEach(image => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'feminine', 'nightlight');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'feminine') {
      document.documentElement.classList.add('feminine');
    } else {
      document.documentElement.classList.add('nightlight');
    }
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (showGenerationOverlay) {
      if (bodyOverflowRef.current === null) {
        bodyOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
    } else if (bodyOverflowRef.current !== null) {
      document.body.style.overflow = bodyOverflowRef.current;
      bodyOverflowRef.current = null;
    }

    return () => {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
    };
  }, [showGenerationOverlay]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const qualityManager = getQualityManager();
    qualityManager.resetToOptimal();
    qualityManager.overrideSettings(PAPER_QUALITY_OVERRIDES[paperDistortionLevel]);
  }, [paperDistortionLevel]);

  useEffect(() => {
    if (!downloadIntent) {
      if (downloadTimerRef.current) {
        clearInterval(downloadTimerRef.current);
        downloadTimerRef.current = null;
      }
      downloadTriggeredRef.current = false;
      setDownloadCountdown(5);
      return;
    }

    downloadTriggeredRef.current = false;
    setDownloadCountdown(5);

    const timer = setInterval(() => {
      setDownloadCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          downloadTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    downloadTimerRef.current = timer;

    return () => {
      clearInterval(timer);
      downloadTimerRef.current = null;
    };
  }, [downloadIntent]);

  useEffect(() => {
    if (!downloadIntent) {
      return;
    }

    if (downloadCountdown === 0 && !downloadTriggeredRef.current) {
      downloadTriggeredRef.current = true;
      Promise.resolve(downloadIntent.start())
        .catch((error) => {
          console.error('Download start failed:', error);
        });
      // Note: Removed automatic dialogue closing - user can manually close or use "Maybe later" button
    }
  }, [downloadCountdown, downloadIntent]);

  useEffect(() => {
    if (!downloadIntent) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDownloadIntent(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [downloadIntent]);

  useEffect(() => {
    if (!showGenerationOverlay || GENERATION_TIPS.length === 0) {
      return;
    }

    setOverlayTipIndex(Math.floor(Math.random() * GENERATION_TIPS.length));
    const interval = window.setInterval(() => {
      setOverlayTipIndex((prev) => (prev + 1) % GENERATION_TIPS.length);
    }, 4500);

    return () => {
      window.clearInterval(interval);
    };
  }, [showGenerationOverlay]);

  // Font change handler
  const handleFontChange = (fontId: string, fontFamily: string) => {
    setSelectedFontId(fontId);
    setFontFamily(fontFamily);
  };

  // Image gallery handlers - Requirement 1.3: connect to existing image generation
  const addGeneratedImage = async (blob: Blob, metadata: Partial<ImageMetadata> = {}): Promise<void> => {
    const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const digitalId = metadata.digitalId || `txttohandwriting.org/${imageId}`;
    const format = (metadata.format || 'png').toLowerCase();
    const signedBlob = await embedDigitalSignature(blob, digitalId, format);
    const url = URL.createObjectURL(signedBlob);

    const sourceText = metadata.textContent ?? text;
    const storedTextContent = sourceText.length > 600 ? `${sourceText.slice(0, 600)}…` : sourceText;
    const flattenedText = storedTextContent.replace(/\s+/g, ' ').trim();
    const derivedLabel = flattenedText ? flattenedText.split(' ').slice(0, 6).join(' ') : `Image ${generatedImages.length + 1}`;
    const finalLabel = metadata.label || (derivedLabel.length > 40 ? `${derivedLabel.slice(0, 37)}…` : derivedLabel);

    const imageMetadata: ImageMetadata = {
      width: metadata.width || 800,
      height: metadata.height || 1000,
      format: metadata.format || 'png',
      size: signedBlob.size,
      textContent: storedTextContent,
      templateId: metadata.templateId || selectedTemplate,
      fontFamily: metadata.fontFamily || fontFamily,
      fontSize: metadata.fontSize || fontSize,
      inkColor: metadata.inkColor || resolvedInkColor,
      label: finalLabel,
      digitalId
    };

    setGeneratedImages(prev => {
      if (prev.length >= MAX_TOTAL_PAGES) {
        URL.revokeObjectURL(url);
        return prev;
      }
      const sequenceNumber = prev.length + 1;
      const newImage: GeneratedImage = {
        id: imageId,
        blob: signedBlob,
        url,
        timestamp: new Date(),
        metadata: imageMetadata,
        sequenceNumber
      };
      return [...prev, newImage];
    });
  };

  const handleFullscreenView = (image: GeneratedImage) => {
    setFullscreenImage(image);
    setIsFullscreenOpen(true);
  };

  const handleFullscreenClose = () => {
    setIsFullscreenOpen(false);
    setFullscreenImage(null);
  };

  const handleRemoveImage = (imageId: string) => {
    setGeneratedImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url); // Clean up the object URL
      }
      const updatedImages = prevImages.filter(img => img.id !== imageId);
      // Re-sequence the remaining images
      return updatedImages.map((img, index) => ({
        ...img,
        sequenceNumber: index + 1,
        metadata: {
          ...img.metadata,
          label:
            img.metadata.label ||
            img.metadata.textContent.replace(/\s+/g, ' ').trim().substring(0, 32) ||
            `Image ${index + 1}`
        }
      }));
    });
  };

  const handleFullscreenNext = () => {
    if (!fullscreenImage) return; 
    
    const currentIndex = generatedImages.findIndex(img => img.id === fullscreenImage.id);
    const nextIndex = (currentIndex + 1) % generatedImages.length;
    setFullscreenImage(generatedImages[nextIndex]);
  };

  const handleFullscreenPrevious = () => {
    if (!fullscreenImage) return; 
    
    const currentIndex = generatedImages.findIndex(img => img.id === fullscreenImage.id);
    const previousIndex = currentIndex === 0 ? generatedImages.length - 1 : currentIndex - 1;
    setFullscreenImage(generatedImages[previousIndex]);
  };

  const handleImageDownloadRequest = (image: GeneratedImage) => {
    if (!image || downloadIntent) {
      return;
    }

    const extension = image.metadata.format
      ? image.metadata.format.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
      : 'png';
    const safeLabel = (image.metadata.label || image.metadata.textContent || `image-${image.sequenceNumber}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    setDownloadIntent({
      id: `single-${image.id}`,
      mode: 'single',
      label: image.metadata.label || `Image ${image.sequenceNumber}`,
      start: () => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `handwritten-${safeLabel || 'image'}-${image.sequenceNumber}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleDownloadIntentDismiss = () => {
    setDownloadIntent(null);
  };

  const handleShareSite = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const shareData = {
      title: 'Handwriting Generator',
      text: 'I just turned typed words into cozy handwriting. Try it out!',
      url: window.location.origin
    };

    try {
      const nav = window.navigator;

      if (nav.share) {
        await nav.share(shareData);
        return;
      }

      if (nav.clipboard && nav.clipboard.writeText) {
        await nav.clipboard.writeText(shareData.url);
        alert('Link copied! Share the vibes with a friend.');
      } else {
        window.open(shareData.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      alert('Could not trigger share. Feel free to copy the link manually!');
    }
  };

  const handlePresentRose = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.open('https://www.buymeacoffee.com/th3f00l', '_blank', 'noopener,noreferrer');
  };

  // Enhanced bulk download handler - Requirements: 2.1, 2.2, 2.3, 2.4
  const handleBulkDownload = () => {
    if (generatedImages.length === 0) {
      alert('No images to download. Please generate some handwriting first.');
      return;
    }

    if (downloadIntent || bulkDownload.isDownloading) {
      return;
    }

    const label = generatedImages.length === 1
      ? '1 handwritten image'
      : `${generatedImages.length} handwritten images`;

    setDownloadIntent({
      id: `bulk-${Date.now()}`,
      mode: 'bulk',
      label,
      start: async () => {
        try {
          setShowDownloadModal(true);
          await bulkDownload.startDownload(generatedImages, 'handwritten-image');
        } catch (error) {
          console.error('Bulk download failed:', error);
          alert('Download failed. Please try again.');
          setShowDownloadModal(false);
        }
      }
    });
  };

  // Handle download modal close
  const handleDownloadModalClose = () => {
    if (!bulkDownload.isDownloading) {
      setShowDownloadModal(false);
      bulkDownload.clearState();
    }
  };

  // Load selected paper template with enhanced error handling
  useEffect(() => {
    const loadTemplate = async () => {
      setIsTemplateLoading(true);
      try {
        const templatePromise = new Promise<PaperTemplate | null>(async (resolve) => {
          try {
            if (templateProvider) {
              const template = await templateProvider.getTemplate(selectedTemplate);
              resolve(template);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error('Failed to load paper template:', error);
            resolve(null);
          }
        });

        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));

        const [templateResult] = await Promise.all([templatePromise, timeoutPromise]);

        if (templateResult) {
          setCurrentPaperTemplate(templateResult);
        } else {
          // Set emergency fallback
          setCurrentPaperTemplate(defaultPaperTemplate);
        }
      } catch (error) {
        // This catch block might be redundant due to the inner catch, but it's good for safety.
        console.error('An unexpected error occurred during template loading:', error);
        setCurrentPaperTemplate(defaultPaperTemplate);
      } finally {
        setIsTemplateLoading(false);
      }
    };

    loadTemplate();
  }, [selectedTemplate, templateProvider, defaultPaperTemplate]);
  const handleGenerateImages = async () => {
    if (!currentPaperTemplate || !canvasRenderer || !imageExportSystem) {
      alert('System not ready. Please wait a moment and try again.');
      return;
    }

    const normalizedText = text.replace(/\r?\n/g, '\n');
    if (!normalizedText.trim()) {
      alert('Please enter some text to generate handwriting.');
      return;
    }

    const wordCount = normalizedText.trim().split(/\s+/).length;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / layoutMetrics.wordsPerPage));

    if (estimatedPages > MAX_TOTAL_PAGES) {
      setGenerationLimitDialog({ type: 'total', attempted: estimatedPages, allowed: MAX_TOTAL_PAGES });
      return;
    }

    if (estimatedPages > MAX_PAGES_PER_RUN) {
      setGenerationLimitDialog({ type: 'per-run', attempted: estimatedPages, allowed: MAX_PAGES_PER_RUN });
      return;
    }

    const pagesToAdd = Math.min(estimatedPages, MAX_PAGES_PER_RUN);
    const existingCount = generatedImages.length;

    if (existingCount >= MAX_TOTAL_PAGES) {
      const remove = Math.min(pagesToAdd, existingCount - MAX_TOTAL_PAGES + pagesToAdd);
      setGenerationLimitDialog({ type: 'gallery', attempted: existingCount, allowed: MAX_TOTAL_PAGES, remove });
      return;
    }

    if (existingCount + pagesToAdd > MAX_TOTAL_PAGES) {
      const remove = existingCount + pagesToAdd - MAX_TOTAL_PAGES;
      setGenerationLimitDialog({ type: 'gallery', attempted: existingCount + pagesToAdd, allowed: MAX_TOTAL_PAGES, remove });
      return;
    }

    const runGeneration = async () => {
      try {
        setShowPageLimitWarning(false);

        if (estimatedPages <= 1) {
          setExportProgress('Generating single page...');
          const renderConfig = {
            ...baseRenderConfig,
            text: normalizedText,
            paperTemplate: currentPaperTemplate,
            canvasWidth: 800,
            canvasHeight: 1000,
            fontFamily: fontFamily,
            fontSize: fontSize,
            baseInkColor: resolvedInkColor,
            wordsPerPage: layoutMetrics.wordsPerPage,
            distortionLevel: paperDistortionLevel
          };
          const handwrittenCanvas = await canvasRenderer.render(renderConfig);
          const blob = await imageExportSystem.exportSinglePage(handwrittenCanvas, { format: 'png', quality: 0.9 });
          await addGeneratedImage(blob, {
            width: renderConfig.canvasWidth,
            height: renderConfig.canvasHeight,
            format: 'png',
            textContent: normalizedText,
            label: normalizedText.replace(/\s+/g, ' ').trim().slice(0, 40)
          });
          setExportProgress('Image generated successfully!');
        } else {
          setExportProgress('Generating multiple pages...');
          const pageResults = await generateMultiplePages(normalizedText, pagesToAdd);
          if (pageResults.length === 0) {
            throw new Error('Failed to generate pages');
          }
          setExportProgress(`Exporting ${pageResults.length} pages...`);
          const canvases = pageResults.map(result => result.canvas);
          const result = await imageExportSystem.exportMultiplePages(canvases, {
            format: 'png',
            quality: 0.9,
            maxPages: pageResults.length,
            shouldDownload: false
          });
          if (!result.success) {
            throw new Error(result.error || 'Export failed');
          }
          if (result.images && result.images.length > 0) {
            for (let i = 0; i < result.images.length; i++) {
              const blob = result.images[i];
              const pageText = pageResults[i]?.text || '';
              await addGeneratedImage(blob, {
                width: 800,
                height: 1000,
                format: 'png',
                textContent: pageText,
                label: `Page ${i + 1}${pageText ? ` • ${pageText.replace(/\s+/g, ' ').trim().slice(0, 24)}${pageText.length > 24 ? '…' : ''}` : ''}`
              });
            }
          }
          setExportProgress(`Successfully generated ${result.totalPages} pages!`);
        }

        setTimeout(() => {
          setExportProgress('');
          setShowPageLimitWarning(false);
        }, 2000);
      } catch (err) {
        console.error('Generation failed:', err);
        setExportProgress('Generation failed. Please try again.');
        setTimeout(() => setExportProgress(''), 3000);
      }
    };

    setIsGenerating(true);
    setShowGenerationOverlay(true);
    setExportProgress('Preparing to generate...');

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return await performanceMonitor.trackAsync('image-generation', runGeneration);
    } finally {
      setIsGenerating(false);
      setShowGenerationOverlay(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Canvas handlers removed since we're using CSS preview

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const generateMultiplePages = async (
    sourceText: string,
    limit: number
  ): Promise<Array<{ canvas: HTMLCanvasElement; text: string }>> => {
    if (!currentPaperTemplate || !canvasRenderer) {
      throw new Error('Canvas renderer or paper template not available');
    }

    // Split text into pages while preserving structure
    const maxPages = Math.max(1, Math.min(limit, MAX_PAGES_PER_RUN, MAX_TOTAL_PAGES));
    let pages: string[] = [];

    if (pageSplitter) {
      const splitResult = pageSplitter.splitTextIntoPages(sourceText, {
        wordsPerPage: layoutMetrics.wordsPerPage,
        maxPages
      });
      pages = splitResult.pages.length ? splitResult.pages.slice(0, maxPages) : [sourceText];
    } else {
      const wordsPerPage = layoutMetrics.wordsPerPage;
      const tokens = sourceText.match(/[^\s]+\s*/g) || [];
      const tempPages: string[] = [];
      let currentPage = '';
      let wordCount = 0;

      for (const token of tokens) {
        currentPage += token;
        if (/[^\s]/.test(token)) {
          wordCount++;
        }
        if (wordCount >= wordsPerPage) {
          tempPages.push(currentPage);
          currentPage = '';
          wordCount = 0;
          if (tempPages.length >= maxPages) {
            break;
          }
        }
      }

      if (currentPage && tempPages.length < maxPages) {
        tempPages.push(currentPage);
      }
      pages = tempPages.length ? tempPages.slice(0, maxPages) : [sourceText];
    }

    // Generate canvas for each page
    const pageResults: Array<{ canvas: HTMLCanvasElement; text: string }> = [];

    for (let i = 0; i < pages.length; i++) {
      setExportProgress(`Rendering page ${i + 1} of ${pages.length}...`);

      const pageConfig = {
        ...baseRenderConfig,
        text: pages[i],
        paperTemplate: currentPaperTemplate,
        canvasWidth: 800,
        canvasHeight: 1000,
        fontFamily: fontFamily,
        fontSize: fontSize,
        baseInkColor: resolvedInkColor,
        wordsPerPage: layoutMetrics.wordsPerPage,
        distortionLevel: paperDistortionLevel
      };

      const pageCanvas = await canvasRenderer.render(pageConfig);
      pageResults.push({ canvas: pageCanvas, text: pages[i] });
    }

    return pageResults;
  };

  if (initializationError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{initializationError}</div>
      </div>
    );
  }

  if (!servicesInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-color)]">
        <div className="flex flex-col items-center gap-4 text-[var(--text-muted)]">
          <RoseSpinner size={72} label="Initializing services" />
          <span className="text-sm uppercase tracking-wide">Initializing services...</span>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'terms':
        return <TermsPage onGoBack={() => setPage('main')} />;
      case 'faq':
        return <FaqPage onGoBack={() => setPage('main')} />;
      case 'about':
        return <AboutPage onGoBack={() => setPage('main')} />;
      case 'blog':
        return <BlogPage onGoBack={() => setPage('main')} onSelectPost={(slug: string) => { setCurrentPostSlug(slug); setPage('blogPost'); }} />;
      case 'blogPost':
        const post = blogPosts.find(p => p.slug === currentPostSlug);
        if (!post) {
          setPage('blog'); // or a 404 page
          return null;
        }
        return <BlogPostPage post={post} onGoBack={() => setPage('blog')} />;
      case 'main':
      default:


        return (
          <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8" role="main" aria-label="Handwriting generator application">
            <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 md:items-start md:h-full">
              {/* Controls Panel */}
              <section className="lg:col-span-1 md:col-span-1 bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-4 md:p-6 flex flex-col gap-4 md:gap-6" role="form" aria-labelledby="controls-heading">
                <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
                  <h2 id="controls-heading" className="text-2xl font-bold text-[var(--text-color)]">The Lab</h2>
                  <div className="flex items-center gap-2" role="status" aria-label="Application status">
                    <div className="blinking-dot" aria-hidden="true"></div>
                    <span className="text-sm font-medium text-[var(--text-muted)]">Gear 1</span>
                  </div>
                </div>

                {/* Text Input */}
                <div>
                  <label htmlFor="text-input" className="block text-sm font-medium text-[var(--text-muted)] mb-2">Spill the tea here...</label>
                  <textarea
                    id="text-input"
                    value={text}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
                    placeholder="Type your text here..."
                    className="w-full h-48 bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition resize-none"
                    aria-label="Text input for handwriting conversion"
                  />
                </div>

                {/* Font Selector */}
                <FontSelector
                  fontManager={fontManager}
                  selectedFontId={selectedFontId}
                  onFontChange={handleFontChange}
                />

                {/* Ink Color Selector */}
                <div>
                  <label htmlFor="ink-select" className="block text-sm font-medium text-[var(--text-muted)] mb-2">Ink Color</label>
                  <select
                    id="ink-select"
                    value={inkColor}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInkColor(e.target.value)}
                    className="w-full bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    aria-label="Select ink color"
                  >
                    {inkColors.map(color => (
                      <option key={color.name} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Paper Quality Distortion Meter */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="paper-distortion" className="block text-sm font-medium text-[var(--text-muted)]">
                      Paper Distortion Level
                    </label>
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                      Lv. {paperDistortionLevel}
                    </span>
                  </div>
                  <input
                    id="paper-distortion"
                    type="range"
                    min={1}
                    max={3}
                    step={1}
                    value={paperDistortionLevel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaperDistortionLevel(Number(e.target.value) as DistortionLevel)}
                    className="w-full cursor-pointer"
                    aria-label="Adjust paper distortion level"
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-muted)]">
                    {[1, 2, 3].map(level => (
                      <span
                        key={level}
                        className={`px-2 py-1 rounded-full border ${paperDistortionLevel === level
                          ? 'border-[var(--accent-color)] text-[var(--accent-color)] bg-[var(--control-bg)]'
                          : 'border-transparent text-[var(--text-muted)] opacity-70'} transition-colors`}
                      >
                        {level === 1 ? 'High realism' : level === 2 ? 'Medium realism' : 'Low realism'}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                    {distortionProfile.description}
                  </p>
                </div>

                {/* Font Size Adjuster */}
                <div>
                  <label htmlFor="font-size-slider" className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                    Font Size <span className="font-bold text-[var(--accent-color)]">{fontSize}px</span>
                  </label>
                  <input
                    id="font-size-slider"
                    type="range"
                    min="12"
                    max="48"
                    step="1"
                    value={fontSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFontSize(Number(e.target.value))}
                    className="w-full cursor-pointer"
                    aria-label="Adjust font size"
                  />
                </div>

                {/* Paper Template Selector */}
                <div className="relative">
                  <button
                    className="flex items-center justify-between w-full text-left text-sm font-medium text-[var(--text-muted)] mb-2 focus:outline-none"
                    onClick={() => setIsPaperVibeOpen(!isPaperVibeOpen)}
                    aria-expanded={isPaperVibeOpen}
                    aria-controls="paper-vibe-content"
                  >
                    Paper Vibe
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isPaperVibeOpen ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {isPaperVibeOpen && (
                    <div id="paper-vibe-content" className="mt-2">
                      <PaperTemplateSelector
                        templateProvider={templateProvider}
                        selectedTemplate={selectedTemplate}
                        onTemplateChange={handleTemplateChange}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-[var(--panel-border)] pt-6 flex flex-col gap-3">
                  <button onClick={handleCopy} className="w-full text-center bg-transparent border-2 border-[var(--accent-color)] text-[var(--accent-color)] font-semibold py-2 px-4 rounded-lg transition-colors duration-300 hover:bg-[var(--accent-color)] hover:text-white">
                    {isCopied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleGenerateImages}
                    disabled={isGenerating}
                    className={`w-full text-center font-semibold py-2 px-4 rounded-lg transition-colors duration-300 ${isGenerating
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)]'
                      }`}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Images'}
                  </button>

                  {/* Export Progress */}
                  {exportProgress && (
                    <div className={`text-sm text-center p-2 rounded-lg ${showPageLimitWarning
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                      {exportProgress}
                    </div>
                  )}

                </div>
              </section>

              {/* Output Panel */}
              <section className="lg:col-span-2 md:col-span-1 flex flex-col gap-4 h-full" role="region" aria-labelledby="output-heading">
                <h2 id="output-heading" className="sr-only">Handwriting Preview and Gallery</h2>
                
                {/* Handwriting Preview */}
                <div className="w-full flex-1 overflow-auto max-h-[75vh] md:max-h-[70vh] lg:max-h-[75vh] rounded-xl shadow-2xl shadow-[var(--shadow-color)] border border-[var(--panel-border)] transition-all duration-300" role="img" aria-label="Generated handwriting preview">
                  <HandwritingPreview
                    text={text}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    inkColor={inkColor}
                    resolvedInkColor={resolvedInkColor}
                    paperTemplate={currentPaperTemplate}
                    textureManager={textureManager}
                    distortionProfile={distortionProfile}
                    distortionLevel={paperDistortionLevel}
                    isTemplateLoading={isTemplateLoading}
                    className="w-full h-full min-h-[460px] md:min-h-[520px] p-6"
                  />
                </div>

                {/* Image Gallery - Requirements 1.1, 1.2, 1.3, 1.4, 1.5 */}
                <div className="w-full">
                  <ImageGallery
                    images={generatedImages}
                    onFullscreenView={handleFullscreenView}
                    onRemoveImage={handleRemoveImage}
                    onBulkDownload={handleBulkDownload}
                    className="shadow-lg"
                  />
                </div>
                <div className="pb-2 px-8 md:px-12">
                  <a
                    href="https://www.buymeacoffee.com/th3f00l"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-transparent border-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 text-sm flex items-center justify-center gap-2"
                  >
                    Present rose
                  </a>
                </div>
              </section>
            </div>

            {/* The Tea Section */}
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
    }
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        globalErrorHandler.handleError(error, 'app-root', 'critical', {
          componentStack: errorInfo.componentStack
        });
      }}
      resetKeys={[page, selectedTemplate, selectedFontId]}
      resetOnPropsChange={true}
    >
      <div className="min-h-screen text-gray-800 dark:text-gray-200 flex flex-col bg-transparent">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            globalErrorHandler.handleError(error, 'header-component', 'medium', {
              componentStack: errorInfo.componentStack
            });
          }}
        >
          <Header theme={theme} setTheme={setTheme} onGoHome={() => setPage('main')} onGoToBlog={() => setPage('blog')} />
        </ErrorBoundary>
        
        <div className="flex-grow flex flex-col">
          <ErrorBoundary
            onError={(error, errorInfo) => {
              globalErrorHandler.handleError(error, 'page-content', 'high', {
                currentPage: page,
                componentStack: errorInfo.componentStack
              });
            }}
            resetKeys={[page]}
            resetOnPropsChange={true}
          >
            {renderPage()}
          </ErrorBoundary>
        </div>

      {/* Error Notification Panel */}
      <LoadingOverlay
        isVisible={showGenerationOverlay}
        message={exportProgress || 'Preparing your handwritten magic...'}
        detail={showPageLimitWarning ? 'Large inputs may take a touch longer while we split pages.' : undefined}
        tip={GENERATION_TIPS.length ? GENERATION_TIPS[overlayTipIndex % GENERATION_TIPS.length] : undefined}
      />

      <ErrorNotificationPanel
        position="top-right"
        maxNotifications={3}
        className="z-50"
      />

      {/* Fullscreen Viewer - Requirement 1.5 */}
      <FullscreenViewer
        image={fullscreenImage}
        isOpen={isFullscreenOpen}
        onClose={handleFullscreenClose}
        onNext={generatedImages.length > 1 ? handleFullscreenNext : undefined}
        onPrevious={generatedImages.length > 1 ? handleFullscreenPrevious : undefined}
        onDownloadRequest={handleImageDownloadRequest}
      />

      {/* Bulk Download Modal - Requirements 2.3, 2.4 */}
      <BulkDownloadModal
        isOpen={showDownloadModal}
        status={bulkDownload.status}
        progress={bulkDownload.progress}
        result={bulkDownload.result}
        onClose={handleDownloadModalClose}
      />

      {downloadIntent && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-intent-heading"
        >
          <div
            className="relative w-full max-w-xl space-y-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 sm:p-8 text-left shadow-2xl"
          >
            <button
              type="button"
              onClick={handleDownloadIntentDismiss}
              className="absolute right-4 top-4 text-[var(--text-muted)] transition-colors hover:text-[var(--text-color)] focus:outline-none"
              aria-label="Close download message"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div>
              <h3 id="download-intent-heading" className="text-2xl font-semibold text-[var(--text-color)]">
                One Little Favor?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                We pour hours (and plenty of caffeine) into keeping these handwritten vibes Ad-free. As you know, nothing's truly free in this cursed world, making & maintaining a site is seriously resource-intensive (both money and time). So if this {downloadIntent.mode === 'bulk' ? 'bundle' : 'page'} helps you out, consider sharing the love or gifting a rose while we spin up your download.
              </p>
              <p className="mt-3 text-xs uppercase tracking-wide text-[var(--accent-color)]">
                Preparing {downloadIntent.label}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-[var(--control-bg)] px-4 py-3 text-sm">
              <span className="font-medium text-[var(--text-muted)]">Download begins in</span>
              <span className="text-3xl font-semibold text-[var(--accent-color)]">{downloadCountdown}s</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleShareSite}
                className="flex-1 min-w-[140px] rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
              >
                Share
              </button>
              <button
                type="button"
                onClick={handlePresentRose}
                className="flex-1 min-w-[140px] rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-600 hover:shadow-lg"
              >
                Present rose
              </button>
              <button
                type="button"
                onClick={handleDownloadIntentDismiss}
                className="min-w-[120px] rounded-lg border border-[var(--panel-border)] bg-[var(--control-bg)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition-all hover:text-[var(--text-color)]"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {generationLimitDialog && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 sm:p-8 shadow-2xl">
            <div className="space-y-3 text-[var(--text-color)]">
              <h3 className="text-2xl font-semibold">
                {generationLimitDialog.type === 'total'
                  ? 'Whoa there, that’s too much text'
                  : generationLimitDialog.type === 'per-run'
                    ? 'Two pages per run keeps it tidy'
                    : 'Gallery limit reached'}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {generationLimitDialog.type === 'total'
                  ? `txttohandwriting.org can render up to ${generationLimitDialog.allowed} pages from a single block of text. Your input would spill into ${generationLimitDialog.attempted} pages. Trim the content or split it into smaller batches, then generate them one after another.`
                  : generationLimitDialog.type === 'per-run'
                    ? `We only generate ${generationLimitDialog.allowed} pages per pass so you can review the layout between batches. Your text would create ${generationLimitDialog.attempted} pages. Cut it down to the first two pages’ worth, generate, then paste the next chunk and repeat.`
                    : `You can keep at most ${generationLimitDialog.allowed} pages in the gallery. Remove at least ${generationLimitDialog.remove} page${generationLimitDialog.remove > 1 ? 's' : ''} before generating again.`}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setGenerationLimitDialog(null)}
                className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--accent-color-hover)]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      <footer className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-8 text-center text-sm">
        <div className="flex justify-center items-center flex-col sm:flex-row gap-2 sm:gap-6 border-t border-[var(--panel-border)] pt-6">
          <button onClick={() => setPage('about')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
            <AboutIcon className="w-4 h-4" />
            About
          </button>
          <button onClick={() => setPage('blog')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
            <BlogIcon className="w-4 h-4" />
            The Tea
          </button>
          <button onClick={() => setPage('terms')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
            <TermsIcon className="w-4 h-4" />
            Terms and Conditions
          </button>
          <button onClick={() => setPage('faq')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
            <FaqIcon className="w-4 h-4" />
            Frequently Asked Questions
          </button>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--panel-border)] text-[var(--text-muted)]">
          <p>&copy; 2025 txttohandwriting.org. All rights reserved.</p>
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
