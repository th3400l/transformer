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
import BottomControlDock from './components/BottomControlDock';
import { GENERATION_TIPS } from './components/GenerationTips';

import ErrorNotificationPanel from './components/ErrorNotificationPanel';
import { initializeServiceContainer } from './services/ServiceConfiguration';
import { SERVICE_TOKENS, DEFAULT_RENDERING_CONFIG } from './types/index';
import { ICanvasRenderer, ITemplateProvider, IImageExportSystem, IPaperTextureManager, PaperTemplate, IPageSplitter } from './types/core';
import { IFontManager } from './types/fonts';
import { ICustomFontUploadManager, FontErrorType } from './types/customFontUpload';
import { GeneratedImage, ImageMetadata } from './types/gallery';
import { useBulkDownload } from './hooks/useBulkDownload';
import { BulkDownloadModal } from './components/BulkDownloadProgress';
import FullscreenViewer from './components/FullscreenViewer';
import { CustomFontUploadDialog } from './components/CustomFontUploadDialog';
import { useSEO } from './hooks/useSEO';
import { ErrorBoundary } from './components/ErrorBoundary';
import { globalErrorHandler } from './services/errorHandler';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import { LoadingOverlay } from './components/LoadingOverlay';
import { RoseSpinner } from './components/Spinner';
import { getQualityManager } from './services/qualityManager';
import { computeHandwritingLayoutMetrics } from './services/layoutMetrics';
import { embedDigitalSignature } from './services/imageSignature';
import CookieConsentBanner from './components/CookieConsentBanner';
import { SUPPORT_EMAIL } from './components/SupportCTA';
import { MetaTag, StructuredData } from './services/seoOptimizer';
import { MainPage } from './components/app/MainPage';
import { FeedbackDialog } from './components/app/FeedbackDialog';
import { DownloadIntentDialog } from './components/app/DownloadIntentDialog';
import { GenerationLimitDialog } from './components/app/GenerationLimitDialog';
import { AppFooter } from './components/app/AppFooter';
import ChangeLogPage from './components/ChangeLogPage';
import {
  inkColors,
  DISTORTION_PROFILES,
  PAPER_QUALITY_OVERRIDES,
  MAX_PAGES_PER_RUN,
  MAX_TOTAL_PAGES,
  FEEDBACK_DIALOG_DELAY_MS,
  DEFAULT_SITE_URL,
  DEFAULT_KEYWORDS,
  INK_HEX_MAP,
  Page,
  Theme,
  DownloadIntent,
  GenerationLimitDialogState,
  DistortionLevel,
  THEME_STORAGE_KEY
} from './app/constants';
import {
  stripHtmlTags,
  createFaqStructuredData,
  createTermsStructuredData,
  createAboutStructuredData,
  createBlogStructuredData,
  createBlogPostStructuredData,
  createChangelogStructuredData,
  getPathForPage
} from './app/seo';

const MANDATORY_FONT_UPLOAD_DELAY_MS = 3000;

// import { getSystemIntegrationManager, SystemIntegrationManager } from './services/systemIntegration';

// Font management is now handled by FontManager service

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
    } catch (error) {
      console.error('Failed to initialize service container:', error);
      setInitializationError('Failed to initialize services. Please refresh the page.');
    }
  }, []);
  const [canonicalBase] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (/localhost|127\.0\.0\.1|::1/.test(origin)) {
        return DEFAULT_SITE_URL;
      }
      return origin;
    }
    return DEFAULT_SITE_URL;
  });
  const [text, setText] = useState<string>("Got some tea to spill? Or just trying to make your essay look like you actually wrote it? \n\nDrop it here. Main character energy only.");
  const [selectedFontId, setSelectedFontId] = useState<string>('inkwell');
  const [fontFamily, setFontFamily] = useState<string>("'Caveat', cursive");
  const [fontSize, setFontSize] = useState<number>(24);

  const [inkColor, setInkColor] = useState<string>(inkColors[0].value);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'nightlight' || storedTheme === 'dark' || storedTheme === 'feminine') {
        return storedTheme;
      }
    }
    return 'nightlight';
  });
  const [paperDistortionLevel, setPaperDistortionLevel] = useState<DistortionLevel>(3);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [page, setPage] = useState<Page>('main');
  const [currentPostSlug, setCurrentPostSlug] = useState<string | null>(null);
  const [isPaperVibeOpen, setIsPaperVibeOpen] = useState(false);
  const [isControlDockOpen, setIsControlDockOpen] = useState(false);
  const [isControlDockVisible, setIsControlDockVisible] = useState(true);
  const [isInkMenuOpen, setIsInkMenuOpen] = useState(false);

  const [canvasRenderer, setCanvasRenderer] = useState<ICanvasRenderer | null>(null);
  const [templateProvider, setTemplateProvider] = useState<ITemplateProvider | null>(null);
  const [imageExportSystem, setImageExportSystem] = useState<IImageExportSystem | null>(null);
  const [textureManager, setTextureManager] = useState<IPaperTextureManager | null>(null);
  const [fontManager, setFontManager] = useState<IFontManager | null>(null);
  const [customFontUploadManager, setCustomFontUploadManager] = useState<ICustomFontUploadManager | null>(null);
  const [pageSplitter, setPageSplitter] = useState<IPageSplitter | null>(null);
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const [paperVibeHeight, setPaperVibeHeight] = useState(0);
  const paperVibeInnerRef = useRef<HTMLDivElement>(null);
  const hasClearedFontsRef = useRef(false);
  const inkMenuRef = useRef<HTMLDivElement>(null);
  const presentRoseRef = useRef<HTMLAnchorElement | null>(null);

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
        
        try {
          setCustomFontUploadManager(serviceContainer.resolve(SERVICE_TOKENS.CUSTOM_FONT_UPLOAD_MANAGER));
        } catch (error) {
          console.error('Failed to initialize custom font upload manager:', error);
          setCustomFontUploadManager(null);
        }
        
        setPageSplitter(serviceContainer.resolve(SERVICE_TOKENS.PAGE_SPLITTER));
      } catch (error) {
        console.error('Failed to resolve services:', error);
        setInitializationError('Failed to resolve services. Some features may be unavailable.');
      }
    }
  }, [servicesInitialized, serviceContainer]);

  useEffect(() => {
    if (!fontManager || !customFontUploadManager) {
      return;
    }
    if (hasClearedFontsRef.current) {
      return;
    }

    hasClearedFontsRef.current = true;

    const clearFonts = async () => {
      try {
        const existingCustomFonts = fontManager.getCustomFonts();
        await Promise.all(existingCustomFonts.map(async (font) => {
          try {
            await fontManager.removeCustomFont(font.id);
          } catch (error) {
            console.warn(`Failed to remove custom font ${font.id} from font manager:`, error);
          }
        }));

        await customFontUploadManager.clearAllCustomFonts();
        await customFontUploadManager.refreshCustomFonts();
      } catch (error) {
        console.warn('Failed to clear custom fonts on refresh:', error);
      } finally {
        setPreviewRefreshToken(prev => prev + 1);
      }
    };

    clearFonts();
  }, [fontManager, customFontUploadManager]);

  // Listen for custom font events to refresh the preview
  useEffect(() => {
    const handleCustomFontEvent = () => {
      // Force refresh the preview when custom fonts change
      setPreviewRefreshToken(prev => prev + 1);
    };

    window.addEventListener('customFontUploaded', handleCustomFontEvent);
    window.addEventListener('customFontAdded', handleCustomFontEvent);
    window.addEventListener('customFontRemoved', handleCustomFontEvent);

    return () => {
      window.removeEventListener('customFontUploaded', handleCustomFontEvent);
      window.removeEventListener('customFontAdded', handleCustomFontEvent);
      window.removeEventListener('customFontRemoved', handleCustomFontEvent);
    };
  }, []);

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
  const feedbackTimerRef = useRef<number | null>(null);
  const [hasStartedUsing, setHasStartedUsing] = useState<boolean>(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<boolean>(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState<boolean>(false);
  const [showCustomFontDialog, setShowCustomFontDialog] = useState<boolean>(false);
  const normalizedCanonicalBase = useMemo(() => canonicalBase.replace(/\/+$/, ''), [canonicalBase]);
  const socialImageUrl = useMemo(() => `${normalizedCanonicalBase}/app-screenshot.jpg`, [normalizedCanonicalBase]);

  // System integration manager disabled for now
  // const [systemManager] = useState<SystemIntegrationManager | null>(() => systemIntegrationManager);

  const seoOptions = useMemo(() => {
    const defaultTitle = 'Handwriting Generator - Convert Text to Realistic Handwriting';
    const defaultDescription = 'Generate realistic handwritten text with customizable fonts, templates, and ink colors. Perfect for creating authentic handwriting samples with multiple paper templates.';
    const canonicalPath = getPathForPage(page, currentPostSlug);
    const canonicalUrl = `${normalizedCanonicalBase}${canonicalPath === '/' ? '' : canonicalPath}`;
    const alternateLocales = [
      { hrefLang: 'x-default', url: canonicalUrl },
      { hrefLang: 'en', url: canonicalUrl }
    ];

    let title = defaultTitle;
    let description = defaultDescription;
    let keywords = DEFAULT_KEYWORDS;
    let ogImage = socialImageUrl;
    let twitterCard: 'summary' | 'summary_large_image' = 'summary_large_image';
    let noindex = false;
    const customMetaTags: MetaTag[] = [];
    const structuredData: StructuredData[] = [];

    const activeBlogPost = currentPostSlug ? blogPosts.find(post => post.slug === currentPostSlug) : undefined;

    switch (page) {
      case 'faq':
        title = 'Handwriting Generator FAQ | txttohandwriting.org';
        description = 'Answers to the most common questions about txttohandwriting.org — pricing, privacy, downloads, and usage rights.';
        keywords = `${DEFAULT_KEYWORDS}, handwriting generator faq, handwriting tool support`;
        structuredData.push(createFaqStructuredData());
        break;
      case 'terms':
        title = 'Terms & Conditions | txttohandwriting.org';
        description = 'Review the official terms of service, usage policies, and consent details for txttohandwriting.org.';
        keywords = `${DEFAULT_KEYWORDS}, handwriting generator terms, txttohandwriting terms of service`;
        structuredData.push(createTermsStructuredData(canonicalUrl));
        break;
      case 'about':
        title = 'About txttohandwriting.org | Meet the Team and Mission';
        description = 'Get to know the people and purpose behind txttohandwriting.org — a handwriting generator built for students, creators, and storytellers.';
        keywords = `${DEFAULT_KEYWORDS}, about txttohandwriting, handwriting generator mission`;
        structuredData.push(createAboutStructuredData(canonicalUrl));
        break;
      case 'blog':
        title = 'Handwriting Inspiration Blog | txttohandwriting.org';
        description = 'Guides, inspiration, and tips for turning typed text into aesthetic handwriting for Studygram, planners, and assignments.';
        keywords = `${DEFAULT_KEYWORDS}, handwriting blog, studygram handwriting tips`;
        structuredData.push(createBlogStructuredData(normalizedCanonicalBase, blogPosts));
        break;
      case 'blogPost':
        if (activeBlogPost) {
          const articleBody = stripHtmlTags(activeBlogPost.content);
          const snippet = articleBody.slice(0, 155);
          title = `${activeBlogPost.title} | txttohandwriting.org`;
          description = snippet.length === articleBody.length ? snippet : `${snippet}…`;
          keywords = `${DEFAULT_KEYWORDS}, handwriting blog, ${activeBlogPost.title.toLowerCase()}`;
          structuredData.push(createBlogPostStructuredData(normalizedCanonicalBase, activeBlogPost, socialImageUrl));
          customMetaTags.push({ property: 'og:type', content: 'article' });
        } else {
          title = 'Handwriting Inspiration Blog | txttohandwriting.org';
          description = 'Guides, inspiration, and tips for turning typed text into aesthetic handwriting for Studygram, planners, and assignments.';
          keywords = `${DEFAULT_KEYWORDS}, handwriting blog, studygram handwriting tips`;
          structuredData.push(createBlogStructuredData(normalizedCanonicalBase, blogPosts));
        }
        break;
      case 'changelog':
        title = 'Changelog | txttohandwriting.org';
        description = 'Follow every release of txttohandwriting.org, from launch day to the latest glow-up.';
        keywords = `${DEFAULT_KEYWORDS}, product updates, txttohandwriting changelog`;
        structuredData.push(createChangelogStructuredData(canonicalUrl));
        break;
      default:
        title = defaultTitle;
        description = defaultDescription;
        keywords = DEFAULT_KEYWORDS;
    }

    if (customMetaTags.length === 0) {
      customMetaTags.push({ property: 'og:type', content: 'website' });
    }

    return {
      title,
      description,
      keywords,
      canonicalUrl,
      alternateLocales,
      ogImage,
      twitterCard,
      noindex,
      customMetaTags,
      structuredData: structuredData.length ? structuredData : undefined
    };
  }, [page, currentPostSlug, normalizedCanonicalBase, socialImageUrl]);

  // SEO optimization - Requirements 7.1, 7.2
  useSEO(seoOptions);

  useEffect(() => {
    // Reset error boundary when key dependencies change
  }, [page, selectedTemplate, selectedFontId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';

    if (rawPath === '/' || rawPath === '') {
      return;
    }

    if (rawPath === '/terms') {
      setPage('terms');
      return;
    }

    if (rawPath === '/faq') {
      setPage('faq');
      return;
    }

    if (rawPath === '/about') {
      setPage('about');
      return;
    }

    if (rawPath === '/changelog') {
      setPage('changelog');
      return;
    }

    if (rawPath === '/blog') {
      setPage('blog');
      return;
    }

    if (rawPath.startsWith('/blog/')) {
      const slug = rawPath.split('/').filter(Boolean).pop() || null;
      if (slug && blogPosts.some(post => post.slug === slug)) {
        setCurrentPostSlug(slug);
        setPage('blogPost');
        return;
      }
      setPage('blog');
    }
  }, []);

  useEffect(() => {
    if (!hasStartedUsing && generatedImages.length > 0) {
      setHasStartedUsing(true);
    }
  }, [generatedImages, hasStartedUsing]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const targetPath = getPathForPage(page, currentPostSlug);
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [page, currentPostSlug]);

  useEffect(() => {
    if (!hasStartedUsing || feedbackDismissed || showFeedbackDialog) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (feedbackTimerRef.current !== null) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setShowFeedbackDialog(true);
      feedbackTimerRef.current = null;
    }, FEEDBACK_DIALOG_DELAY_MS);

    feedbackTimerRef.current = timerId;

    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, [hasStartedUsing, feedbackDismissed, showFeedbackDialog]);

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
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    const element = paperVibeInnerRef.current;

    if (!isPaperVibeOpen) {
      setPaperVibeHeight(0);
      return;
    }

    if (!element) {
      return;
    }

    const updateHeight = () => {
      const measuredHeight = element.scrollHeight + 24;
      setPaperVibeHeight(measuredHeight);
    };

    const raf = requestAnimationFrame(updateHeight);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(element);
      return () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
      };
    }

    window.addEventListener('resize', updateHeight);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateHeight);
    };
  }, [isPaperVibeOpen, selectedTemplate]);

  useEffect(() => {
    setIsControlDockOpen(false);
  }, [page]);

  // Ensure Paper Vibe menu is open after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPaperVibeOpen(true);
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const ensureDefaultTemplateSelection = async () => {
      if (!templateProvider) {
        return;
      }

      try {
        const templates = await templateProvider.getAvailableTemplates();
        if (!isMounted || templates.length === 0) {
          return;
        }

        // Always select the first template when the page loads
        const [firstTemplate] = templates;
        if (!firstTemplate) {
          return;
        }

        setSelectedTemplate(firstTemplate.id);
        setCurrentPaperTemplate(firstTemplate);
      } catch (error) {
        console.warn('Failed to ensure default paper template selection:', error);
      }
    };

    void ensureDefaultTemplateSelection();

    return () => {
      isMounted = false;
    };
  }, [templateProvider]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!inkMenuRef.current) return;
      if (!inkMenuRef.current.contains(event.target as Node)) {
        setIsInkMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInkMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (page !== 'main') {
      setIsControlDockVisible(false);
      return;
    }

    let frameId: number | null = null;

    const evaluateDockVisibility = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }

      if (!presentRoseRef.current) {
        setIsControlDockVisible(prev => (prev === true ? prev : true));
        return;
      }

      const { bottom } = presentRoseRef.current.getBoundingClientRect();
      const shouldShowDock = bottom >= 0;

      setIsControlDockVisible(prev => (prev === shouldShowDock ? prev : shouldShowDock));

      if (!shouldShowDock) {
        setIsControlDockOpen(false);
      }
    };

    const scheduleEvaluation = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(evaluateDockVisibility);
    };

    evaluateDockVisibility();

    window.addEventListener('scroll', scheduleEvaluation, { passive: true });
    window.addEventListener('resize', scheduleEvaluation);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleEvaluation);
      window.removeEventListener('resize', scheduleEvaluation);
    };
  }, [page]);

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

  const closeFeedbackDialog = () => {
    if (typeof window !== 'undefined' && feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = null;
    setShowFeedbackDialog(false);
    setFeedbackDismissed(true);
  };

  const handleFeedbackEmail = () => {
    if (typeof window !== 'undefined') {
      const subject = encodeURIComponent('txttohandwriting.org feedback');
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    }
    closeFeedbackDialog();
  };

  const handleFeedbackShare = async () => {
    try {
      await handleShareSite();
    } finally {
      closeFeedbackDialog();
    }
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

    setHasStartedUsing(true);

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

  // Custom font upload handlers
  const handleCustomFontUpload = async (result: any) => {
    if (result.success && result.font && fontManager) {
      try {
        // Add the font to the font manager
        await fontManager.addCustomFont(result.font);
        
        // Optionally switch to the newly uploaded font
        setSelectedFontId(result.font.id);
        setFontFamily(result.font.family);
        
        // Force refresh the preview
        setPreviewRefreshToken(prev => prev + 1);
      } catch (error) {
        console.error('Failed to add custom font to font manager:', error);
      }
    } else {
      console.error('Custom font upload failed:', result.error);
    }
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
        return <TermsPage onGoBack={() => {
          setPage('main');
          setPreviewRefreshToken(token => token + 1);
        }} />;
      case 'faq':
        return <FaqPage onGoBack={() => {
          setPage('main');
          setPreviewRefreshToken(token => token + 1);
        }} />;
      case 'about':
        return <AboutPage onGoBack={() => {
          setPage('main');
          setPreviewRefreshToken(token => token + 1);
        }} />;
      case 'blog':
        return <BlogPage
          onGoBack={() => {
            setPage('main');
            setPreviewRefreshToken(token => token + 1);
          }}
          onSelectPost={(slug: string) => {
            setCurrentPostSlug(slug);
            setPage('blogPost');
          }}
        />;
      case 'blogPost':
        const post = blogPosts.find(p => p.slug === currentPostSlug);
        if (!post) {
          setPage('blog'); // or a 404 page
          return null;
        }
        return <BlogPostPage post={post} onGoBack={() => setPage('blog')} />;
      case 'changelog':
        return <ChangeLogPage onGoBack={() => {
          setPage('main');
          setPreviewRefreshToken(token => token + 1);
        }} />;
      case 'main':
      default:
        return (
          <>
            <MainPage
              text={text}
              onTextChange={setText}
                  fontManager={fontManager}
                  selectedFontId={selectedFontId}
                  onFontChange={handleFontChange}
              inkColors={inkColors}
              inkColor={inkColor}
              setInkColor={setInkColor}
              isInkMenuOpen={isInkMenuOpen}
              setIsInkMenuOpen={setIsInkMenuOpen}
              inkMenuRef={inkMenuRef}
                        templateProvider={templateProvider}
                        selectedTemplate={selectedTemplate}
                        onTemplateChange={handleTemplateChange}
              isPaperVibeOpen={isPaperVibeOpen}
              togglePaperVibe={() => setIsPaperVibeOpen(prev => !prev)}
              paperVibeInnerRef={paperVibeInnerRef}
              paperVibeHeight={paperVibeHeight}
                    customFontUploadManager={customFontUploadManager}
              currentCustomFontsCount={fontManager?.getCustomFonts()?.length || 0}
              onOpenCustomFontDialog={() => setShowCustomFontDialog(true)}
              onGenerateImages={handleGenerateImages}
              isGenerating={isGenerating}
              exportProgress={exportProgress}
              showPageLimitWarning={showPageLimitWarning}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
              inkColorResolved={resolvedInkColor}
              currentPaperTemplate={currentPaperTemplate}
                    textureManager={textureManager}
                    distortionProfile={distortionProfile}
              paperDistortionLevel={paperDistortionLevel}
                    isTemplateLoading={isTemplateLoading}
              previewRefreshToken={previewRefreshToken}
              generatedImages={generatedImages}
                    onFullscreenView={handleFullscreenView}
                    onRemoveImage={handleRemoveImage}
                    onBulkDownload={handleBulkDownload}
              presentRoseRef={presentRoseRef}
            />
            {!showGenerationOverlay && !isFullscreenOpen && !showCustomFontDialog && isControlDockVisible && (
              <BottomControlDock
                isOpen={isControlDockOpen}
                onToggle={() => setIsControlDockOpen(prev => !prev)}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                paperDistortionLevel={paperDistortionLevel}
                onPaperDistortionChange={(value: DistortionLevel) => setPaperDistortionLevel(value)}
                distortionProfile={{ description: distortionProfile.description }}
              />
            )}
          </>
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
          <Header
            theme={theme}
            setTheme={setTheme}
            onGoHome={() => {
              setPage('main');
              setPreviewRefreshToken(token => token + 1);
            }}
            onGoToBlog={() => setPage('blog')}
          />
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
        className="z-[100]"
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

      <CookieConsentBanner onOpenTerms={() => setPage('terms')} />

      <FeedbackDialog
        isOpen={showFeedbackDialog}
        supportEmail={SUPPORT_EMAIL}
        onClose={closeFeedbackDialog}
        onEmail={handleFeedbackEmail}
        onShare={handleFeedbackShare}
      />

      <DownloadIntentDialog
        intent={downloadIntent}
        countdown={downloadCountdown}
        onDismiss={handleDownloadIntentDismiss}
        onShare={handleShareSite}
        onPresentRose={handlePresentRose}
      />

      <GenerationLimitDialog
        dialog={generationLimitDialog}
        onClose={() => setGenerationLimitDialog(null)}
      />

      <AppFooter
        onAbout={() => setPage('about')}
        onBlog={() => setPage('blog')}
        onChangelog={() => setPage('changelog')}
        onTerms={() => setPage('terms')}
        onFaq={() => setPage('faq')}
      />
            </div>

      {/* Custom Font Upload Dialog */}
      <CustomFontUploadDialog
        isOpen={showCustomFontDialog}
        onClose={() => setShowCustomFontDialog(false)}
        onUpload={async (file: File) => {
          if (!customFontUploadManager) {
            return {
              success: false,
              error: {
                type: FontErrorType.FEATURE_UNAVAILABLE,
                message: 'Font upload manager not available',
                code: 'MANAGER_NOT_AVAILABLE',
                recoverable: false,
                severity: 'high' as const
              }
            };
          }

          const result = await customFontUploadManager.uploadFont(file);
          
          if (result.success) {
            await new Promise(resolve => setTimeout(resolve, MANDATORY_FONT_UPLOAD_DELAY_MS));
            await handleCustomFontUpload(result);
          }
          
          return result;
        }}
        onRemoveFont={async (fontId: string) => {
          if (!fontManager || !customFontUploadManager) {
            throw new Error('Font managers not available');
          }
          
          try {
            // Remove from upload manager first (this handles storage cleanup)
            await customFontUploadManager.removeCustomFont(fontId);
            
            // Remove from font manager (this handles UI state)
            await fontManager.removeCustomFont(fontId);
            
            // Force refresh the upload manager's font list to ensure duplicate detection works
            await customFontUploadManager.refreshCustomFonts();
            
            // Force refresh the preview
            setPreviewRefreshToken(prev => prev + 1);
            
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent('customFontRemoved', {
              detail: { fontId }
            }));
          } catch (error) {
            console.error('Failed to remove custom font:', error);
            throw error;
          }
        }}
        onReplaceFont={async (fontId: string, newFile: File) => {
          if (!customFontUploadManager) {
            throw new Error('Font upload manager not available');
          }
          
          const result = await customFontUploadManager.replaceFont(fontId, newFile);
          
          if (result.success) {
            await new Promise(resolve => setTimeout(resolve, MANDATORY_FONT_UPLOAD_DELAY_MS));
            await handleCustomFontUpload(result);
          } else {
            throw new Error(result.error?.message || 'Failed to replace font');
          }
        }}
        maxCustomFonts={2}
        currentCount={fontManager?.getCustomFonts()?.length || 0}
        customFonts={fontManager?.getCustomFonts() || []}
        disabled={!customFontUploadManager}
      />
    </ErrorBoundary>
  );
};

export default App;
