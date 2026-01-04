/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, lazy, Suspense, useCallback } from 'react';
import Header from './components/Header';
import { blogPosts } from './services/blogPosts';
import { GENERATION_TIPS } from './components/GenerationTips';
import ErrorNotificationPanel from './components/ErrorNotificationPanel';
import { DEFAULT_RENDERING_CONFIG } from './types/index';
import { GeneratedImage } from './types/gallery';
import { useBulkDownload } from './hooks/useBulkDownload';
import { useSEO } from './hooks/useSEO';
import { ErrorBoundary } from './components/ErrorBoundary';
import { globalErrorHandler } from './services/errorHandler';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import { LoadingOverlay } from './components/LoadingOverlay';
import { RoseSpinner } from './components/Spinner';
import { computeHandwritingLayoutMetrics } from './services/layoutMetrics';
import { embedDigitalSignature } from './services/imageSignature';
import CookieConsentBanner from './components/CookieConsentBanner';
import { SUPPORT_EMAIL } from './components/SupportCTA';
import { AppFooter } from './components/app/AppFooter';
import { AppDialogs } from './components/app/AppDialogs';
import PageLoadingFallback from './components/PageLoadingFallback';

// Lazy load page components (route-based code splitting)
const TermsPage = lazy(() => import('./components/TermsPage'));
const FaqPage = lazy(() => import('./components/FaqPage'));
const BlogPage = lazy(() => import('./components/BlogPage'));
const BlogPostPage = lazy(() => import('./components/BlogPostPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const ChangeLogPage = lazy(() => import('./components/ChangeLogPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const MainPage = lazy(() => import('./components/app/MainPage'));
const StartScreen = lazy(() => import('./components/StartScreen'));

// Lazy load heavy components
const FullscreenViewer = lazy(() => import('./components/FullscreenViewer'));
const Tour = lazy(() => import('./components/Tour'));
import { useAppState } from './hooks/useAppState';
import { useAppServices } from './hooks/useAppServices';
import { useAppEffects } from './hooks/useAppEffects';
import { usePerformantFontLoader } from './hooks/usePerformantFontLoader';
import {
  inkColors,
  DISTORTION_PROFILES,
  PAPER_QUALITY_OVERRIDES,
  MAX_PAGES_PER_RUN,
  MAX_TOTAL_PAGES,
  DEFAULT_SITE_URL,
  DEFAULT_KEYWORDS,
  INK_HEX_MAP,
  DistortionLevel
} from './app/constants';
import {
  stripHtmlTags,
  createFaqStructuredData,
  createTipsFaqStructuredData,
  createTermsStructuredData,
  createAboutStructuredData,
  createBlogStructuredData,
  createBlogPostStructuredData,
  createChangelogStructuredData,
  createBreadcrumbStructuredData,
  validateStructuredData,
  getPathForPage
} from './app/seo';
import { tips } from './content/homepage';

const GENERATION_DELAY_MS = 3000;

import InteractiveBackground from './components/InteractiveBackground';

const App: React.FC = () => {
  // Use custom hooks for state, services, and effects
  const [state, setters, refs] = useAppState();
  const services = useAppServices(
    useCallback((container) => {
      setters.setServiceContainer(container);
      setters.setServicesInitialized(true);
    }, [setters]),
    useCallback((error) => {
      setters.setInitializationError(error);
    }, [setters])
  );

  // Apply effects
  useAppEffects(state, setters, refs, services);

  // Performant font loading - Requirements: 4.2, 4.3, 6.2, 6.3
  const fontLoader = usePerformantFontLoader();

  // Bulk download hook
  const bulkDownload = useBulkDownload();

  // Computed values
  const distortionProfile = useMemo(
    () => DISTORTION_PROFILES[state.paperDistortionLevel],
    [state.paperDistortionLevel]
  );

  const layoutMetrics = useMemo(
    () => computeHandwritingLayoutMetrics({
      canvasWidth: 800,
      canvasHeight: 1000,
      fontSize: state.fontSize,
      baselineJitterRange: distortionProfile.baselineJitterRange,
      distortionLevel: state.paperDistortionLevel
    }),
    [state.fontSize, distortionProfile.baselineJitterRange, state.paperDistortionLevel]
  );

  const resolvedInkColor = useMemo(() => {
    return INK_HEX_MAP[state.inkColor] || INK_HEX_MAP['var(--ink-black)'];
  }, [state.inkColor]);

  const baseRenderConfig = useMemo(() => ({
    ...DEFAULT_RENDERING_CONFIG,
    baselineJitterRange: distortionProfile.baselineJitterRange,
    slantJitterRange: distortionProfile.slantJitterRange,
    colorVariationIntensity: distortionProfile.colorVariationIntensity,
    microTiltRange: distortionProfile.microTiltRange,
    baseInkColor: resolvedInkColor,
    inkBoldness: state.inkBoldness,
    wordsPerPage: layoutMetrics.wordsPerPage,
    distortionLevel: state.paperDistortionLevel
  }), [distortionProfile, resolvedInkColor, state.inkBoldness, layoutMetrics.wordsPerPage, state.paperDistortionLevel]);

  const normalizedCanonicalBase = useMemo(() => state.canonicalBase.replace(/\/+$/, ''), [state.canonicalBase]);
  const socialImageUrl = useMemo(() => `${normalizedCanonicalBase}/app-screenshot.jpg`, [normalizedCanonicalBase]);

  // Calculate cutoff snippet for text over limit
  const textCutoffSnippet = useMemo(() => {
    if (!services.pageSplitter || !layoutMetrics.wordsPerPage || !state.text?.trim()) {
      return null;
    }

    try {
      // Check for overflow beyond allowed pages per run
      const splitResult = services.pageSplitter.splitTextIntoPages(state.text, {
        wordsPerPage: layoutMetrics.wordsPerPage,
        maxPages: MAX_PAGES_PER_RUN + 1, // Look ahead one page to detect overflow start
        shouldTruncate: true
      });

      // If we got a 3rd page (index 2), that's the start of the overflow
      if (splitResult.pages.length > MAX_PAGES_PER_RUN) {
        const overflowPage = splitResult.pages[MAX_PAGES_PER_RUN];
        if (overflowPage) {
          const words = overflowPage.trim().split(/\s+/);
          const snippet = words.slice(0, 4).join(' ');
          return snippet ? `"${snippet}..."` : null;
        }
      }
    } catch (error) {
      // Silently fail for non-critical UI hint
      return null;
    }
    return null;
  }, [state.text, services.pageSplitter, layoutMetrics.wordsPerPage]);

  // SEO options
  const seoOptions = useMemo(() => {
    const defaultTitle = 'Handwriting Generator - Convert Text to Realistic Handwriting';
    const defaultDescription = 'Generate realistic handwritten text with customizable fonts, templates, and ink colors. Perfect for creating authentic handwriting samples with multiple paper templates.';
    const canonicalPath = state.page === 'notFound' && state.missingPath
      ? state.missingPath
      : getPathForPage(state.page, state.currentPostSlug);
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
    const customMetaTags: any[] = [];
    const structuredData: any[] = [];

    const activeBlogPost = state.currentPostSlug ? blogPosts.find(post => post.slug === state.currentPostSlug) : undefined;

    switch (state.page) {
      case 'faq':
        title = 'Handwriting Generator FAQ | txttohandwriting.org';
        description = 'Answers to the most common questions about txttohandwriting.org — pricing, privacy, downloads, and usage rights.';
        keywords = `${DEFAULT_KEYWORDS}, handwriting generator faq, handwriting tool support`;
        structuredData.push(createFaqStructuredData());
        structuredData.push(createBreadcrumbStructuredData(normalizedCanonicalBase, [
          { name: 'Home', path: '/' },
          { name: 'FAQ', path: '/faq' }
        ]));
        break;
      case 'terms':
        title = 'Terms & Conditions | txttohandwriting.org';
        description = 'Review the official terms of service, usage policies, and consent details for txttohandwriting.org.';
        keywords = `${DEFAULT_KEYWORDS}, handwriting generator terms, txttohandwriting terms of service`;
        structuredData.push(createTermsStructuredData(canonicalUrl));
        structuredData.push(createBreadcrumbStructuredData(normalizedCanonicalBase, [
          { name: 'Home', path: '/' },
          { name: 'Terms & Conditions', path: '/terms' }
        ]));
        break;
      case 'about':
        title = 'About txttohandwriting.org | Meet the Team and Mission';
        description = 'Get to know the people and purpose behind txttohandwriting.org — a handwriting generator built for students, creators, and storytellers.';
        keywords = `${DEFAULT_KEYWORDS}, about txttohandwriting, handwriting generator mission`;
        structuredData.push(createAboutStructuredData(canonicalUrl));
        structuredData.push(createBreadcrumbStructuredData(normalizedCanonicalBase, [
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' }
        ]));
        break;
      case 'blog':
        title = 'Handwriting Inspiration Blog | txttohandwriting.org';
        description = 'Guides, inspiration, and tips for turning typed text into aesthetic handwriting for Studygram, planners, and assignments.';
        keywords = `${DEFAULT_KEYWORDS}, handwriting blog, studygram handwriting tips`;
        structuredData.push(createBlogStructuredData(normalizedCanonicalBase, blogPosts));
        structuredData.push(createBreadcrumbStructuredData(normalizedCanonicalBase, [
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' }
        ]));
        break;
      case 'blogPost':
        if (activeBlogPost) {
          const articleBody = stripHtmlTags(activeBlogPost.content);
          const snippet = articleBody.slice(0, 155);
          title = `${activeBlogPost.title} | txttohandwriting.org`;
          description = snippet.length === articleBody.length ? snippet : `${snippet}…`;
          keywords = `${DEFAULT_KEYWORDS}, handwriting blog, ${activeBlogPost.title.toLowerCase()}`;
          structuredData.push(createBlogPostStructuredData(normalizedCanonicalBase, activeBlogPost, socialImageUrl));
          structuredData.push(createBreadcrumbStructuredData(normalizedCanonicalBase, [
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: activeBlogPost.title, path: `/blog/${activeBlogPost.slug}` }
          ]));
          customMetaTags.push({ property: 'og:type', content: 'article' });
        } else {
          title = 'Handwriting Inspiration Blog | txttohandwriting.org';
          description = 'Guides, inspiration, and tips for turning typed text into aesthetic handwriting for Studygram, planners, and assignments.';
          keywords = `${DEFAULT_KEYWORDS}, handwriting blog, studygram handwriting tips`;
          structuredData.push(createBlogStructuredData(normalizedCanonicalBase, blogPosts));
          structuredData.push(createBreadcrumbStructuredData(normalizedCanonicalBase, [
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' }
          ]));
        }
        break;
      case 'changelog':
        title = 'Changelog | txttohandwriting.org';
        description = 'Follow every release of txttohandwriting.org, from launch day to the latest glow-up.';
        keywords = `${DEFAULT_KEYWORDS}, product updates, txttohandwriting changelog`;
        structuredData.push(createChangelogStructuredData(canonicalUrl));
        structuredData.push(createBreadcrumbStructuredData(normalizedCanonicalBase, [
          { name: 'Home', path: '/' },
          { name: 'Changelog', path: '/changelog' }
        ]));
        break;
      case 'notFound':
        title = 'Page Not Found | txttohandwriting.org';
        description = 'We could not find the page you were looking for. Head back to the handwriting lab to keep creating.';
        keywords = `${DEFAULT_KEYWORDS}, handwriting generator 404`;
        twitterCard = 'summary';
        noindex = true;
        break;
      default:
        title = defaultTitle;
        description = defaultDescription;
        keywords = DEFAULT_KEYWORDS;
        // Add Tips FAQ structured data for homepage
        structuredData.push(createTipsFaqStructuredData(tips));
    }

    if (customMetaTags.length === 0) {
      customMetaTags.push({ property: 'og:type', content: 'website' });
    }

    // Validate structured data before returning
    const validatedStructuredData = structuredData.filter(data => {
      const isValid = validateStructuredData(data);
      if (!isValid && process.env.NODE_ENV === 'development') {
        console.warn('Invalid structured data detected:', data);
      }
      return isValid;
    });

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
      structuredData: validatedStructuredData.length ? validatedStructuredData : undefined
    };
  }, [state.page, state.currentPostSlug, normalizedCanonicalBase, socialImageUrl, state.missingPath]);

  useSEO(seoOptions);

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitoring({
    enableAutoReporting: process.env.NODE_ENV === 'production',
    reportInterval: 60000,
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

  // Event handlers
  const handleFontChange = async (fontId: string, fontFamily: string) => {
    // Lazy load font if not already loaded - Requirements: 4.2, 4.3, 6.2, 6.3
    if (!fontLoader.isFontLoaded(fontId)) {
      const result = await fontLoader.loadFont(fontId);
      if (!result.success) {
        console.warn(`Font ${fontId} failed to load, using fallback`);
      }
    }

    setters.setSelectedFontId(fontId);
    setters.setFontFamily(fontFamily);
  };

  const handleBoldnessChange = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setters.setInkBoldness(clamped);
  };

  const handleFullscreenView = (image: GeneratedImage) => {
    setters.setFullscreenImage(image);
    setters.setIsFullscreenOpen(true);
  };

  const handleFullscreenClose = () => {
    setters.setIsFullscreenOpen(false);
    setters.setFullscreenImage(null);
  };

  const handleRemoveImage = (imageId: string) => {
    setters.setGeneratedImages(prevImages => {
      const imageToRemove = prevImages.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prevImages.filter(img => img.id !== imageId);
    });
  };

  const handleFullscreenNext = () => {
    if (!state.fullscreenImage) return;
    const currentIndex = state.generatedImages.findIndex(img => img.id === state.fullscreenImage?.id);
    const nextIndex = (currentIndex + 1) % state.generatedImages.length;
    setters.setFullscreenImage(state.generatedImages[nextIndex]);
  };

  const handleFullscreenPrevious = () => {
    if (!state.fullscreenImage) return;
    const currentIndex = state.generatedImages.findIndex(img => img.id === state.fullscreenImage?.id);
    const prevIndex = (currentIndex - 1 + state.generatedImages.length) % state.generatedImages.length;
    setters.setFullscreenImage(state.generatedImages[prevIndex]);
  };

  const handleImageDownloadRequest = (image: GeneratedImage) => {
    if (!image || state.downloadIntent) {
      return;
    }

    setters.setDownloadIntent({
      id: `download-${Date.now()}`,
      mode: 'single',
      label: 'Download Image',
      start: async () => {
        try {
          const link = document.createElement('a');
          link.href = image.url;
          link.download = `handwriting-${image.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Download failed:', error);
          alert('Download failed. Please try again.');
        }
      }
    });
  };

  const handleDownloadIntentDismiss = () => {
    setters.setDownloadIntent(null);
  };

  const handleShareSite = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const shareData = {
      title: 'txttohandwriting.org',
      text: 'Turn your text into realistic handwriting with txttohandwriting.org',
      url: window.location.origin
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Clipboard write failed:', error);
      }
    }
  };

  const handlePresentRose = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.open('https://buymeacoffee.com/txttohandwriting', '_blank', 'noopener,noreferrer');
  };

  const handleDownloadAllPdf = async () => {
    try {
      if (state.generatedImages.length === 0) return;

      const { createPdfFromImages } = await import('./services/pdfExporter');
      const pdfItems = state.generatedImages.map(img => ({
        blob: img.blob,
        width: img.metadata.width,
        height: img.metadata.height
      }));
      const pdfBlob = await createPdfFromImages(pdfItems, 'high');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `handwriting-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again.');
    }
  };

  const closeFeedbackDialog = () => {
    if (typeof window !== 'undefined' && refs.feedbackTimerRef.current !== null) {
      window.clearTimeout(refs.feedbackTimerRef.current);
    }
    refs.feedbackTimerRef.current = null;
    setters.setShowFeedbackDialog(false);
    setters.setFeedbackDismissed(true);
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

  const handleBulkDownload = () => {
    if (state.generatedImages.length === 0) {
      alert('No images to download. Please generate some handwriting first.');
      return;
    }

    setters.setDownloadIntent({
      id: `bulk-download-${Date.now()}`,
      mode: 'bulk',
      label: 'Bulk Download',
      start: async () => {
        try {
          setters.setShowDownloadModal(true);
          const { applyDownloadQuality } = await import('./services/imageCompression');
          const processedImages = await applyDownloadQuality(state.generatedImages, state.downloadQuality);
          await bulkDownload.startDownload(processedImages);
        } catch (error) {
          console.error('Bulk download failed:', error);
          alert('Download failed. Please try again.');
          setters.setShowDownloadModal(false);
        }
      }
    });
  };

  const handleDownloadModalClose = () => {
    if (!bulkDownload.isDownloading) {
      setters.setShowDownloadModal(false);
      bulkDownload.clearState();
    }
  };

  const handleGenerateImages = async () => {
    if (!state.currentPaperTemplate || !services.canvasRenderer || !services.imageExportSystem) {
      alert('System not ready. Please wait a moment and try again.');
      return;
    }

    if (!state.text.trim()) {
      alert('Please enter some text to generate handwriting.');
      return;
    }

    if (!services.pageSplitter) {
      alert('Page splitter not initialized. Please refresh the page.');
      return;
    }

    const splitResult = services.pageSplitter.splitTextIntoPages(state.text, { wordsPerPage: layoutMetrics.wordsPerPage });
    const pages = splitResult.pages;
    const estimatedPages = pages.length;

    if (estimatedPages > MAX_TOTAL_PAGES) {
      setters.setGenerationLimitDialog({ type: 'total', attempted: estimatedPages, allowed: MAX_TOTAL_PAGES });
      return;
    }

    if (estimatedPages > MAX_PAGES_PER_RUN) {
      setters.setGenerationLimitDialog({ type: 'per-run', attempted: estimatedPages, allowed: MAX_PAGES_PER_RUN });
      return;
    }

    const existingCount = state.generatedImages.length;
    const pagesToAdd = estimatedPages;

    if (existingCount >= MAX_TOTAL_PAGES) {
      const remove = Math.min(pagesToAdd, existingCount - MAX_TOTAL_PAGES + pagesToAdd);
      setters.setGenerationLimitDialog({ type: 'gallery', attempted: existingCount, allowed: MAX_TOTAL_PAGES, remove });
      return;
    }

    if (existingCount + pagesToAdd > MAX_TOTAL_PAGES) {
      const remove = existingCount + pagesToAdd - MAX_TOTAL_PAGES;
      setters.setGenerationLimitDialog({ type: 'gallery', attempted: existingCount + pagesToAdd, allowed: MAX_TOTAL_PAGES, remove });
      return;
    }

    setters.setIsGenerating(true);
    setters.setShowGenerationOverlay(true);
    setters.setExportProgress('Preparing your handwritten magic...');
    setters.setShowPageLimitWarning(estimatedPages > 5);

    try {
      // Artificial delay to simulate processing time (Requirement: Time limit with loading screen)
      await new Promise(resolve => setTimeout(resolve, GENERATION_DELAY_MS));

      const pageResults = await renderPages(pages);
      const newImages: GeneratedImage[] = [];

      for (let i = 0; i < pageResults.length; i++) {
        setters.setExportProgress(`Exporting page ${i + 1} of ${pageResults.length}...`);
        const { canvas, text: pageText } = pageResults[i];
        const blob = await services.imageExportSystem.exportSinglePage(canvas, { format: 'png', quality: 1.0 });
        const digitalId = `${state.selectedFontId}-${Date.now()}`;
        const signedBlob = await embedDigitalSignature(blob, digitalId, 'png');
        const url = URL.createObjectURL(signedBlob);
        const metadata = {
          text: pageText,
          fontId: state.selectedFontId,
          fontSize: state.fontSize,
          inkColor: state.inkColor,
          template: state.selectedTemplate,
          timestamp: Date.now(),
          width: canvas.width,
          height: canvas.height,
          format: 'png' as const,
          size: blob.size,
          textContent: pageText
        };
        newImages.push({
          id: `${Date.now()}-${i}`,
          url,
          blob: signedBlob,
          metadata,
          timestamp: new Date(),
          sequenceNumber: i
        });
      }

      setters.setGeneratedImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setters.setIsGenerating(false);
      setters.setShowGenerationOverlay(false);
      setters.setExportProgress('');
      setters.setShowPageLimitWarning(false);
    }
  };

  const renderPages = async (pages: string[]) => {
    if (!services.canvasRenderer || !services.textureManager || !state.currentPaperTemplate) {
      throw new Error('Required services not available');
    }

    const pageResults: Array<{ canvas: HTMLCanvasElement; text: string }> = [];

    for (let i = 0; i < pages.length; i++) {
      const pageConfig = {
        ...baseRenderConfig,
        text: pages[i],
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        paperTemplate: state.currentPaperTemplate
      };

      const pageCanvas = await services.canvasRenderer.render(pageConfig);
      pageResults.push({ canvas: pageCanvas, text: pages[i] });
    }

    return pageResults;
  };

  const handleTemplateChange = (templateId: string) => {
    setters.setSelectedTemplate(templateId);
  };

  const handleCustomFontUpload = async (result: any) => {
    if (result.success && result.font && services.fontManager) {
      try {
        await services.fontManager.addCustomFont(result.font);
        setters.setPreviewRefreshToken(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('customFontAdded', {
          detail: { font: result.font }
        }));
      } catch (error) {
        console.error('Failed to add custom font to font manager:', error);
      }
    }
  };

  if (state.initializationError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{state.initializationError}</div>
      </div>
    );
  }

  if (!state.servicesInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-color)]">
        <div className="flex flex-col items-center gap-4 text-[var(--text-muted)]">
          <RoseSpinner size={72} label="Initializing services" />
          <span className="text-sm uppercase tracking-wide">Initializing services...</span>
        </div>
      </div>
    );
  }

  // Loading fallback for lazy-loaded components
  const PageLoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-[var(--text-muted)]">
        <RoseSpinner size={48} label="Loading page" />
        <span className="text-sm uppercase tracking-wide">Loading...</span>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (state.page) {
      case 'terms':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <TermsPage onGoBack={() => {
              setters.setPage('main');
              setters.setPreviewRefreshToken(token => token + 1);
            }} />
          </Suspense>
        );
      case 'faq':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <FaqPage onGoBack={() => {
              setters.setPage('main');
              setters.setPreviewRefreshToken(token => token + 1);
            }} />
          </Suspense>
        );
      case 'about':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <AboutPage onGoBack={() => {
              setters.setPage('main');
              setters.setPreviewRefreshToken(token => token + 1);
            }} />
          </Suspense>
        );
      case 'blog':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <BlogPage
              onGoBack={() => {
                setters.setPage('main');
                setters.setPreviewRefreshToken(token => token + 1);
              }}
              onSelectPost={(slug: string) => {
                setters.setCurrentPostSlug(slug);
                setters.setPage('blogPost');
              }}
            />
          </Suspense>
        );
      case 'blogPost': {
        const post = blogPosts.find(p => p.slug === state.currentPostSlug);
        if (!post) {
          if (state.currentPostSlug) {
            setters.setMissingPath(`/blog/${state.currentPostSlug}`);
          }
          setters.setPage('notFound');
          return null;
        }
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <BlogPostPage post={post} onGoBack={() => setters.setPage('blog')} />
          </Suspense>
        );
      }
      case 'changelog':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <ChangeLogPage onGoBack={() => {
              setters.setPage('main');
              setters.setPreviewRefreshToken(token => token + 1);
            }} />
          </Suspense>
        );
      case 'notFound':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <NotFoundPage
              requestedPath={state.missingPath || undefined}
              onGoHome={() => {
                setters.setMissingPath(null);
                setters.setCurrentPostSlug(null);
                setters.setPage('main');
                setters.setPreviewRefreshToken(token => token + 1);
              }}
            />
          </Suspense>
        );
      case 'main':
      default:
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <StartScreen
              text={state.text}
              canvasRenderer={services.canvasRenderer}
              onTextChange={setters.setText}
              fontManager={services.fontManager}
              selectedFontId={state.selectedFontId}
              onFontChange={handleFontChange}
              inkColors={inkColors}
              inkColor={state.inkColor}
              setInkColor={setters.setInkColor}
              inkBoldness={state.inkBoldness}
              setInkBoldness={setters.setInkBoldness}
              isInkMenuOpen={state.isInkMenuOpen}
              setIsInkMenuOpen={setters.setIsInkMenuOpen}
              inkMenuRef={refs.inkMenuRef}
              templateProvider={services.templateProvider}
              selectedTemplate={state.selectedTemplate}
              onTemplateChange={handleTemplateChange}
              customFontUploadManager={services.customFontUploadManager}
              currentCustomFontsCount={services.fontManager?.getCustomFonts()?.length || 0}
              onOpenCustomFontDialog={() => setters.setShowCustomFontDialog(true)}
              onGenerateImages={handleGenerateImages}
              isGenerating={state.isGenerating}
              exportProgress={state.exportProgress}
              showPageLimitWarning={state.showPageLimitWarning}
              fontFamily={state.fontFamily}
              fontSize={state.fontSize}
              inkColorResolved={resolvedInkColor}
              wordsPerPage={layoutMetrics.wordsPerPage}
              currentPaperTemplate={state.currentPaperTemplate}
              textureManager={services.textureManager}
              distortionProfile={distortionProfile}
              paperDistortionLevel={state.paperDistortionLevel}
              isTemplateLoading={state.isTemplateLoading}
              previewRefreshToken={state.previewRefreshToken}
              generatedImages={state.generatedImages}
              onFullscreenView={handleFullscreenView}
              onRemoveImage={handleRemoveImage}
              onBulkDownload={handleBulkDownload}
              onDownloadPdf={handleDownloadAllPdf}
              downloadQuality={state.downloadQuality}
              onDownloadQualityChange={setters.setDownloadQuality}
              presentRoseRef={refs.presentRoseRef}
              // Advanced controls moved from BottomControlDock
              onFontSizeChange={setters.setFontSize}
              onPaperDistortionChange={(value: DistortionLevel) => setters.setPaperDistortionLevel(value)}
              textCutoffSnippet={textCutoffSnippet}
            />
          </Suspense>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
        <InteractiveBackground />
        <Header
          theme={state.theme}
          setTheme={setters.setTheme}
          onNavigate={(page) => {
            setters.setPage(page);
            setters.setPreviewRefreshToken(token => token + 1);
          }}
          currentPage={state.page}
        />

        {renderPage()}

        <AppFooter
          onNavigate={(page) => {
            setters.setPage(page);
            setters.setPreviewRefreshToken(token => token + 1);
          }}
          onPresentRose={handlePresentRose}
        />

        {state.isFullscreenOpen && state.fullscreenImage && (
          <Suspense fallback={null}>
            <FullscreenViewer
              image={state.fullscreenImage}
              isOpen={true}
              onClose={handleFullscreenClose}
              onNext={state.generatedImages.length > 1 ? handleFullscreenNext : undefined}
              onPrevious={state.generatedImages.length > 1 ? handleFullscreenPrevious : undefined}
            />
          </Suspense>
        )}

        <AppDialogs
          showFeedbackDialog={state.showFeedbackDialog}
          supportEmail={SUPPORT_EMAIL}
          onCloseFeedbackDialog={closeFeedbackDialog}
          onFeedbackEmail={handleFeedbackEmail}
          onFeedbackShare={handleFeedbackShare}
          downloadIntent={state.downloadIntent}
          downloadCountdown={state.downloadCountdown}
          onCloseDownloadIntent={handleDownloadIntentDismiss}
          onShareSite={handleShareSite}
          onPresentRose={handlePresentRose}
          generationLimitDialog={state.generationLimitDialog}
          onCloseGenerationLimitDialog={() => setters.setGenerationLimitDialog(null)}
          showCustomFontDialog={state.showCustomFontDialog}
          customFontUploadManager={services.customFontUploadManager}
          fontManager={services.fontManager}
          onCloseCustomFontDialog={() => setters.setShowCustomFontDialog(false)}
          showDownloadModal={state.showDownloadModal}
          bulkDownloadStatus={bulkDownload.status}
          bulkDownloadProgress={bulkDownload.progress}
          bulkDownloadResult={bulkDownload.result}
          onCloseDownloadModal={handleDownloadModalClose}
        />

        <LoadingOverlay
          isVisible={state.showGenerationOverlay}
          message={state.exportProgress || 'Generating...'}
        />

        <CookieConsentBanner />
      </div>
    </ErrorBoundary>
  );
};

export default App;
