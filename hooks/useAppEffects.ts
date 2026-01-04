/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { AppState, AppStateSetters, AppRefs } from './useAppState';
import { AppServices } from './useAppServices';
import { getQualityManager } from '../services/qualityManager';
import { PAPER_QUALITY_OVERRIDES, FEEDBACK_DIALOG_DELAY_MS } from '../app/constants';
import { GENERATION_TIPS } from '../components/GenerationTips';
import { getPathForPage } from '../app/seo';
import { blogPosts } from '../services/blogPosts';

export const useAppEffects = (
  state: AppState,
  setters: AppStateSetters,
  refs: AppRefs,
  services: AppServices
): void => {
  const {
    page,
    currentPostSlug,
    missingPath,
    hasStartedUsing,
    feedbackDismissed,
    showFeedbackDialog,
    generatedImages,
    theme,
    paperDistortionLevel,
    downloadIntent,
    downloadCountdown,
    showGenerationOverlay,
    fontManager,
    customFontUploadManager,
    templateProvider,
    selectedTemplate
  } = { ...state, ...services };

  const {
    setPage,
    setCurrentPostSlug,
    setMissingPath,
    setHasStartedUsing,
    setShowFeedbackDialog,
    setIsControlDockOpen,
    setIsControlDockVisible,
    setDownloadIntent,
    setDownloadCountdown,
    setOverlayTipIndex,
    setShowTour,
    setSelectedTemplate,
    setCurrentPaperTemplate,
    setPreviewRefreshToken,
    setIsTemplateLoading
  } = setters;

  const {
    feedbackTimerRef,
    downloadTimerRef,
    downloadTriggeredRef,
    bodyOverflowRef,
    hasClearedFontsRef,
    presentRoseRef
  } = refs;

  // Update current paper template when selectedTemplate changes
  useEffect(() => {
    if (!templateProvider || !selectedTemplate) return;

    const updateTemplate = async () => {
      try {
        setIsTemplateLoading(true);
        const template = await templateProvider.getTemplate(selectedTemplate);
        if (template) {
          setCurrentPaperTemplate(template);
        }
      } catch (error) {
        console.error('Failed to update paper template:', error);
      } finally {
        setIsTemplateLoading(false);
      }
    };

    void updateTemplate();
  }, [selectedTemplate, templateProvider, setCurrentPaperTemplate, setIsTemplateLoading]);

  // URL routing effect
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';

    if (rawPath === '/' || rawPath === '') {
      setMissingPath(null);
      return;
    }

    const setPageAndClear = (nextPage: typeof page) => {
      setMissingPath(null);
      setPage(nextPage);
    };

    if (rawPath === '/terms') {
      setPageAndClear('terms');
      return;
    }

    if (rawPath === '/faq') {
      setPageAndClear('faq');
      return;
    }

    if (rawPath === '/about') {
      setPageAndClear('about');
      return;
    }

    if (rawPath === '/changelog') {
      setPageAndClear('changelog');
      return;
    }

    if (rawPath === '/blog') {
      setCurrentPostSlug(null);
      setPageAndClear('blog');
      return;
    }

    if (rawPath.startsWith('/blog/')) {
      const slug = rawPath.split('/').filter(Boolean).pop() || null;
      if (slug && blogPosts.some(post => post.slug === slug)) {
        setMissingPath(null);
        setCurrentPostSlug(slug);
        setPage('blogPost');
        return;
      }
      setCurrentPostSlug(null);
      setMissingPath(rawPath);
      setPage('notFound');
      return;
    }

    setCurrentPostSlug(null);
    setMissingPath(rawPath);
    setPage('notFound');
  }, []);

  // Update browser URL when page changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (page === 'notFound') {
      return;
    }

    const targetPath = getPathForPage(page, currentPostSlug);
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [page, currentPostSlug]);

  // Clear missing path when page changes
  useEffect(() => {
    if (page !== 'notFound' && missingPath !== null) {
      setMissingPath(null);
    }
  }, [page, missingPath, setMissingPath]);

  // Feedback dialog timing
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
  }, [hasStartedUsing, feedbackDismissed, showFeedbackDialog, feedbackTimerRef, setShowFeedbackDialog]);

  // Track when user starts using the app
  useEffect(() => {
    if (!hasStartedUsing && generatedImages.length > 0) {
      setHasStartedUsing(true);
    }
  }, [generatedImages, hasStartedUsing, setHasStartedUsing]);

  // Theme management
  useEffect(() => {
    document.documentElement.classList.remove('midnight', 'feminine', 'nightlight');
    // All current themes are dark-mode based
    document.documentElement.classList.add('dark');

    if (theme === 'dark') {
      document.documentElement.classList.add('midnight');
    } else if (theme === 'feminine') {
      document.documentElement.classList.add('feminine');
    } else {
      document.documentElement.classList.add('nightlight');
    }
  }, [theme]);

  // Persist theme to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('tth-theme', theme);
  }, [theme]);

  // Scroll to top on page change
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.scrollTo(0, 0);
  }, [page]);

  // Close control dock on page change
  useEffect(() => {
    setIsControlDockOpen(false);
  }, [page, setIsControlDockOpen]);

  // Paper quality override based on distortion level
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const qualityManager = getQualityManager();
    qualityManager.resetToOptimal();
    qualityManager.overrideSettings(PAPER_QUALITY_OVERRIDES[paperDistortionLevel]);
  }, [paperDistortionLevel]);

  // Download intent countdown timer
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
  }, [downloadIntent, downloadTimerRef, downloadTriggeredRef, setDownloadCountdown]);

  // Trigger download when countdown reaches zero
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
    }
  }, [downloadCountdown, downloadIntent, downloadTriggeredRef]);

  // Download intent keyboard handler
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
  }, [downloadIntent, setDownloadIntent]);

  // Generation overlay body scroll lock
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
  }, [showGenerationOverlay, bodyOverflowRef]);

  // Generation tips rotation
  useEffect(() => {
    if (!showGenerationOverlay || GENERATION_TIPS.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setOverlayTipIndex((prev) => (prev + 1) % GENERATION_TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [showGenerationOverlay, setOverlayTipIndex]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      generatedImages.forEach(image => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  // Clear custom fonts on mount
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
  }, [fontManager, customFontUploadManager, hasClearedFontsRef, setPreviewRefreshToken]);

  // Listen for custom font events
  useEffect(() => {
    const handleCustomFontEvent = () => {
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
  }, [setPreviewRefreshToken]);

  // Ensure default template selection
  useEffect(() => {
    // If template is already selected, do nothing
    if (state.selectedTemplate) {
      return;
    }

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
  }, [templateProvider, state.selectedTemplate]);

  // Ink menu click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!refs.inkMenuRef.current) return;
      if (!refs.inkMenuRef.current.contains(event.target as Node)) {
        setters.setIsInkMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setters.setIsInkMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [refs.inkMenuRef, setters]);

  // Control dock visibility based on scroll
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
  }, [page, presentRoseRef, setIsControlDockVisible, setIsControlDockOpen]);

  // Show tour on first visit
  useEffect(() => {
    if (page !== 'main') return;
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem('tth-tour-seen');
    if (!seen) {
      const t = window.setTimeout(() => setShowTour(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [page, setShowTour]);
};
