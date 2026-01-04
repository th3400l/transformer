/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useMemo } from 'react';
import {
  Theme,
  Page,
  DownloadIntent,
  GenerationLimitDialogState,
  DistortionLevel,
  THEME_STORAGE_KEY,
  inkColors,
  DEFAULT_SITE_URL
} from '../app/constants';
import { PaperTemplate } from '../types/core';
import { GeneratedImage } from '../types/gallery';
import { TourStep } from '../components/Tour';

export interface AppState {
  // Service initialization
  serviceContainer: any | null;
  servicesInitialized: boolean;
  initializationError: string | null;

  // URL and SEO
  canonicalBase: string;

  // Text and rendering
  text: string;
  selectedFontId: string;
  fontFamily: string;
  fontSize: number;

  // Appearance
  inkColor: string;
  inkBoldness: number;
  theme: Theme;
  paperDistortionLevel: DistortionLevel;

  // Template
  selectedTemplate: string;
  currentPaperTemplate: PaperTemplate | null;
  isTemplateLoading: boolean;

  // UI state
  isCopied: boolean;
  page: Page;
  currentPostSlug: string | null;
  missingPath: string | null;
  isControlDockOpen: boolean;
  isControlDockVisible: boolean;
  downloadQuality: 'high' | 'medium' | 'low';
  isInkMenuOpen: boolean;

  // Generation state
  isGenerating: boolean;
  showGenerationOverlay: boolean;
  exportProgress: string;
  showPageLimitWarning: boolean;
  generatedImages: GeneratedImage[];

  // Fullscreen viewer
  fullscreenImage: GeneratedImage | null;
  isFullscreenOpen: boolean;

  // Bulk download
  showDownloadModal: boolean;

  // Dialog state
  downloadIntent: DownloadIntent | null;
  downloadCountdown: number;
  overlayTipIndex: number;
  generationLimitDialog: GenerationLimitDialogState | null;
  hasStartedUsing: boolean;
  showFeedbackDialog: boolean;
  feedbackDismissed: boolean;
  showCustomFontDialog: boolean;

  // Tour state
  showTour: boolean;
  tourIndex: number;
  tourSteps: TourStep[];

  // Preview refresh
  previewRefreshToken: number;
}

export interface AppStateSetters {
  setServiceContainer: (container: any) => void;
  setServicesInitialized: (initialized: boolean) => void;
  setInitializationError: (error: string | null) => void;
  setText: (text: string) => void;
  setSelectedFontId: (id: string) => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  setInkColor: (color: string) => void;
  setInkBoldness: (boldness: number) => void;
  setTheme: (theme: Theme) => void;
  setPaperDistortionLevel: (level: DistortionLevel) => void;
  setIsCopied: (copied: boolean) => void;
  setPage: (page: Page) => void;
  setCurrentPostSlug: (slug: string | null) => void;
  setMissingPath: (path: string | null) => void;
  setIsControlDockOpen: (open: boolean) => void;
  setIsControlDockVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  setDownloadQuality: (quality: 'high' | 'medium' | 'low') => void;
  setIsInkMenuOpen: (open: boolean) => void;
  setSelectedTemplate: (template: string) => void;
  setCurrentPaperTemplate: (template: PaperTemplate | null) => void;
  setIsTemplateLoading: (loading: boolean) => void;
  setExportProgress: (progress: string) => void;
  setShowPageLimitWarning: (show: boolean) => void;
  setGeneratedImages: (images: GeneratedImage[] | ((prev: GeneratedImage[]) => GeneratedImage[])) => void;
  setFullscreenImage: (image: GeneratedImage | null) => void;
  setIsFullscreenOpen: (open: boolean) => void;
  setShowDownloadModal: (show: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setShowGenerationOverlay: (show: boolean) => void;
  setDownloadIntent: (intent: DownloadIntent | null) => void;
  setDownloadCountdown: (countdown: number | ((prev: number) => number)) => void;
  setOverlayTipIndex: (index: number | ((prev: number) => number)) => void;
  setGenerationLimitDialog: (dialog: GenerationLimitDialogState | null) => void;
  setHasStartedUsing: (started: boolean) => void;
  setShowFeedbackDialog: (show: boolean) => void;
  setFeedbackDismissed: (dismissed: boolean) => void;
  setShowCustomFontDialog: (show: boolean) => void;
  setShowTour: (show: boolean) => void;
  setTourIndex: (index: number) => void;
  setPreviewRefreshToken: (token: number | ((prev: number) => number)) => void;
}

export interface AppRefs {
  hasClearedFontsRef: React.MutableRefObject<boolean>;
  inkMenuRef: React.RefObject<HTMLDivElement>;
  presentRoseRef: React.MutableRefObject<HTMLAnchorElement | null>;
  downloadTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  downloadTriggeredRef: React.MutableRefObject<boolean>;
  bodyOverflowRef: React.MutableRefObject<string | null>;
  feedbackTimerRef: React.MutableRefObject<number | null>;
}

export const useAppState = (): [AppState, AppStateSetters, AppRefs] => {
  // Service initialization
  const [serviceContainer, setServiceContainer] = useState<any>(null);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // URL and SEO
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

  // Text and rendering
  const [text, setText] = useState<string>("Got some tea to spill? Or just trying to make your essay look like you actually wrote it? \n\nDrop it here. Main character energy only.");
  const [selectedFontId, setSelectedFontId] = useState<string>('inkwell');
  const [fontFamily, setFontFamily] = useState<string>("'Caveat', cursive");
  const [fontSize, setFontSize] = useState<number>(24);

  // Appearance
  const [inkColor, setInkColor] = useState<string>(inkColors[0].value);
  const [inkBoldness, setInkBoldness] = useState<number>(0.5);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'nightlight' || storedTheme === 'dark' || storedTheme === 'feminine') {
        return storedTheme;
      }
    }
    return 'nightlight';
  });
  const [paperDistortionLevel, setPaperDistortionLevel] = useState<DistortionLevel>(5);

  // Template
  const defaultPaperTemplate: PaperTemplate = useMemo(() => ({
    id: 'blank-1',
    name: 'Default Blank',
    filename: 'blank-1.jpeg',
    type: 'blank'
  }), []);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank-1');
  const [currentPaperTemplate, setCurrentPaperTemplate] = useState<PaperTemplate | null>(defaultPaperTemplate);
  const [isTemplateLoading, setIsTemplateLoading] = useState<boolean>(false);

  // UI state
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [page, setPage] = useState<Page>('main');
  const [currentPostSlug, setCurrentPostSlug] = useState<string | null>(null);
  const [missingPath, setMissingPath] = useState<string | null>(null);
  const [isControlDockOpen, setIsControlDockOpen] = useState(false);
  const [isControlDockVisible, setIsControlDockVisible] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [isInkMenuOpen, setIsInkMenuOpen] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showGenerationOverlay, setShowGenerationOverlay] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [showPageLimitWarning, setShowPageLimitWarning] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // Fullscreen viewer
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);

  // Bulk download
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);

  // Dialog state
  const [downloadIntent, setDownloadIntent] = useState<DownloadIntent | null>(null);
  const [downloadCountdown, setDownloadCountdown] = useState<number>(5);
  const [overlayTipIndex, setOverlayTipIndex] = useState<number>(0);
  const [generationLimitDialog, setGenerationLimitDialog] = useState<GenerationLimitDialogState | null>(null);
  const [hasStartedUsing, setHasStartedUsing] = useState<boolean>(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState<boolean>(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState<boolean>(false);
  const [showCustomFontDialog, setShowCustomFontDialog] = useState<boolean>(false);

  // Tour state
  const [showTour, setShowTour] = useState<boolean>(false);
  const [tourIndex, setTourIndex] = useState<number>(0);
  const tourSteps: TourStep[] = useMemo(() => ([
    {
      selector: '[data-tour-id="font-selector"]',
      title: 'Choose Your Font',
      content: 'Pick a handwriting font that fits your vibe.'
    },
    {
      selector: '[data-tour-id="ink-selector"]',
      title: 'Select Ink Color',
      content: 'Black, blue, red, or green — all with paper-friendly blending.'
    },
    {
      selector: '[data-tour-id="template-selector"]',
      title: 'Paper Vibe',
      content: 'Choose the paper style. More lined templates are coming soon.'
    },
    {
      selector: '[data-tour-id="controls-button"]',
      title: 'Controls',
      content: 'Open Controls to adjust size, ink weight, and paper realism. You can drag this button side-to-side.'
    },
    {
      selector: '[data-tour-id="generate-button"]',
      title: 'Generate Images',
      content: 'Turn your text into realistic handwritten pages.'
    },
    {
      selector: '[data-tour-id="download-button"]',
      title: 'Download Options',
      content: 'Download all as PNG images or compile them into a single PDF.'
    }
  ]), []);

  // Preview refresh
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);

  // Refs
  const hasClearedFontsRef = useRef(false);
  const inkMenuRef = useRef<HTMLDivElement>(null);
  const presentRoseRef = useRef<HTMLAnchorElement | null>(null);
  const downloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const downloadTriggeredRef = useRef<boolean>(false);
  const bodyOverflowRef = useRef<string | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const state: AppState = {
    serviceContainer,
    servicesInitialized,
    initializationError,
    canonicalBase,
    text,
    selectedFontId,
    fontFamily,
    fontSize,
    inkColor,
    inkBoldness,
    theme,
    paperDistortionLevel,
    selectedTemplate,
    currentPaperTemplate,
    isTemplateLoading,
    isCopied,
    page,
    currentPostSlug,
    missingPath,
    isControlDockOpen,
    isControlDockVisible,
    downloadQuality,
    isInkMenuOpen,
    isGenerating,
    showGenerationOverlay,
    exportProgress,
    showPageLimitWarning,
    generatedImages,
    fullscreenImage,
    isFullscreenOpen,
    showDownloadModal,
    downloadIntent,
    downloadCountdown,
    overlayTipIndex,
    generationLimitDialog,
    hasStartedUsing,
    showFeedbackDialog,
    feedbackDismissed,
    showCustomFontDialog,
    showTour,
    tourIndex,
    tourSteps,
    previewRefreshToken
  };

  const setters: AppStateSetters = useMemo(() => ({
    setServiceContainer,
    setServicesInitialized,
    setInitializationError,
    setText,
    setSelectedFontId,
    setFontFamily,
    setFontSize,
    setInkColor,
    setInkBoldness,
    setTheme,
    setPaperDistortionLevel,
    setIsCopied,
    setPage,
    setCurrentPostSlug,
    setMissingPath,
    setIsControlDockOpen,
    setIsControlDockVisible,
    setDownloadQuality,
    setIsInkMenuOpen,
    setSelectedTemplate,
    setCurrentPaperTemplate,
    setIsTemplateLoading,
    setExportProgress,
    setShowPageLimitWarning,
    setGeneratedImages,
    setFullscreenImage,
    setIsFullscreenOpen,
    setShowDownloadModal,
    setIsGenerating,
    setShowGenerationOverlay,
    setDownloadIntent,
    setDownloadCountdown,
    setOverlayTipIndex,
    setGenerationLimitDialog,
    setHasStartedUsing,
    setShowFeedbackDialog,
    setFeedbackDismissed,
    setShowCustomFontDialog,
    setShowTour,
    setTourIndex,
    setPreviewRefreshToken
  }), []);

  const refs: AppRefs = useMemo(() => ({
    hasClearedFontsRef,
    inkMenuRef,
    presentRoseRef,
    downloadTimerRef,
    downloadTriggeredRef,
    bodyOverflowRef,
    feedbackTimerRef
  }), []);

  return [state, setters, refs];
};
