export interface InkColorOption {
  name: string;
  value: string;
}

export const inkColors: InkColorOption[] = [
  { name: 'Black', value: 'var(--ink-black)' },
  { name: 'Blue', value: 'var(--ink-blue)' },
  { name: 'Red', value: 'var(--ink-red)' },
  { name: 'Green', value: 'var(--ink-green)' }
];

export type DistortionLevel = 1 | 2 | 3 | 4 | 5;

export interface DistortionProfile {
  baselineJitterRange: number;
  slantJitterRange: number;
  colorVariationIntensity: number;
  microTiltRange: number;
  description: string;
}

export interface QualityOverride {
  renderingQuality: number;
  textureQuality: number;
  compressionLevel: number;
  enableAntialiasing: boolean;
  enableBlending: boolean;
  enableProgressiveLoading: boolean;
  enableCanvasPooling: boolean;
}

export const DISTORTION_PROFILES: Record<DistortionLevel, DistortionProfile> = {
  1: {
    baselineJitterRange: 0.65,
    slantJitterRange: 0.42,
    colorVariationIntensity: 0.11,
    microTiltRange: 0.32,
    description: 'Ultra Realism – Heavy ink bleed and maximum analog noise for a raw, imperfect look.'
  },
  2: {
    baselineJitterRange: 0.65,
    slantJitterRange: 0.42,
    colorVariationIntensity: 0.11,
    microTiltRange: 0.32,
    description: 'Extreme Realism – Pronounced texture depth and natural ink pooling.'
  },
  3: {
    baselineJitterRange: 0.46,
    slantJitterRange: 0.32,
    colorVariationIntensity: 0.085,
    microTiltRange: 0.24,
    description: 'High Realism – Pronounced grain, softer contrast, and natural analog imperfections.'
  },
  4: {
    baselineJitterRange: 0.24,
    slantJitterRange: 0.18,
    colorVariationIntensity: 0.055,
    microTiltRange: 0.13,
    description: 'Medium Realism – Balanced ink-to-paper blend with gentle texture and subtle wear.'
  },
  5: {
    baselineJitterRange: 0.16,
    slantJitterRange: 0.12,
    colorVariationIntensity: 0.042,
    microTiltRange: 0.09,
    description: 'Low Realism – Clean finish with restrained texture and a polished digital look.'
  }
};

export const PAPER_QUALITY_OVERRIDES: Record<DistortionLevel, Partial<QualityOverride>> = {
  1: {
    renderingQuality: 0.72,
    textureQuality: 0.62,
    compressionLevel: 0.75,
    enableAntialiasing: false,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  },
  2: {
    renderingQuality: 0.80,
    textureQuality: 0.70,
    compressionLevel: 0.82,
    enableAntialiasing: true,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  },
  3: {
    renderingQuality: 0.88,
    textureQuality: 0.78,
    compressionLevel: 0.88,
    enableAntialiasing: true,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  },
  4: {
    renderingQuality: 0.96,
    textureQuality: 0.9,
    compressionLevel: 0.93,
    enableAntialiasing: true,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  },
  5: {
    renderingQuality: 1,
    textureQuality: 1,
    compressionLevel: 0.97,
    enableAntialiasing: true,
    enableBlending: true,
    enableProgressiveLoading: true,
    enableCanvasPooling: true
  }
};

export const MAX_PAGES_PER_RUN = 9999;
export const MAX_TOTAL_PAGES = 9999;
export const FEEDBACK_DIALOG_DELAY_MS = 90000;
export const DEFAULT_SITE_URL = 'https://txttohandwriting.org';
export const DEFAULT_SOCIAL_IMAGE = `${DEFAULT_SITE_URL}/app-screenshot.jpg`;
export const DEFAULT_KEYWORDS = 'handwriting generator, text to handwriting, custom fonts, realistic handwriting, handwritten text, paper templates, ink colors, study notes';

export interface FaqEntry {
  question: string;
  answer: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: 'Is this tool completely free?',
    answer: 'Yes, it is 100% free to use. We do not require any subscriptions, credit cards, or sign-ups. We support the project through non-intrusive ads.'
  },
  {
    question: 'Can I use the generated images for commercial projects?',
    answer: 'Absolutely. You own the content you create. Feel free to use the handwritten images for your business, social media, or any commercial purpose without attribution.'
  },
  {
    question: 'Is my text data private?',
    answer: 'Yes. This is a client-side application, which means all processing happens directly in your browser. We do not store, view, or save any of the text you type.'
  },
  {
    question: 'What file formats can I download?',
    answer: "Currently, you can download your work as high-quality PNG images. We also offer a 'Bulk Download' feature that bundles multiple pages into a ZIP file, and a PDF export option."
  },
  {
    question: 'The font looks distorted or blurry, how do I fix it?',
    answer: 'This can happen due to browser rendering scaling. Try ensuring your browser zoom is at 100%. If you are on a mobile device, try switching to a desktop for higher resolution generation.'
  },
  {
    question: 'How do I print these to look real?',
    answer: "For best results, download the high-quality version. When printing, choose 'Actual Size' or 'Scale to 100%' in your printer settings to avoid stretching."
  }
];

export const INK_HEX_MAP: Record<string, string> = {
  'var(--ink-black)': '#2a2620',
  'var(--ink-blue)': '#2f4a92',
  'var(--ink-red)': '#b13535',
  'var(--ink-green)': '#2f6a52'
};

export interface ChangelogEntry {
  version: string;
  date: string;
  tagline: string;
  highlights: string[];
  mood?: string;
  changeType?: 'new-year' | 'major' | 'minor' | 'launch-2025'; // Added for custom styling
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '1.4.1',
    date: 'January 2026',
    tagline: 'Refining the core experience and global accessibility.',
    highlights: [
      'Implemented critical bug fixes and stability improvements.',
      'Expanded multi-language support to reach a broader international audience.'
    ],
    mood: 'Stable Release'
  },
  {
    version: '1.4',
    date: 'January 2026',
    tagline: 'Enhanced realism engine and interface overhaul.',
    highlights: [
      'Redesigned the user interface for improved workflow and accessibility.',
      'Upgraded the rendering engine for higher fidelity ink textures and better realism.',
      'Optimized the live preview system for lower latency and smoother interactions.'
    ],
    mood: 'Major Update',
    changeType: 'major'
  },
  {
    version: '1.3',
    date: 'October 2025',
    tagline: 'Enhanced control features and professional export options.',
    highlights: [
      'Introduced ink weight controls for precise customization of handwriting styles.',
      'Added PDF export functionality for streamlined document compilation.',
      'Implemented image quality settings to optimize for either file size or resolution.'
    ],
    mood: 'Performance Focus'
  },
  {
    version: '1.2',
    date: 'September 2025',
    tagline: 'Interface optimization and custom typeface support.',
    highlights: [
      'Optimized the responsive layout for a seamless experience across all device types.',
      'Launched the custom font manager, allowing users to upload and use their own handwriting fonts.',
      'Improved cross-browser compatibility and rendering performance.'
    ],
    mood: 'Feature Expansion'
  },
  {
    version: '1.0',
    date: 'September 2025',
    tagline: 'Initial release of the professional handwriting simulation platform.',
    highlights: [
      'Launched the core handwriting engine with real-time preview and customization sliders.',
      'Introduced professional paper templates including lined, dotted, and blank options.',
      'Implemented a high-resolution gallery and export system for seamless workflow.'
    ],
    mood: 'Public Launch',
    changeType: 'launch-2025'
  }
];

export type Page = 'main' | 'terms' | 'faq' | 'blog' | 'blogPost' | 'about' | 'changelog' | 'notFound' | 'privacy';
export type Theme = 'nightlight' | 'dark' | 'feminine';
export const THEME_STORAGE_KEY = 'texttohandwriting-theme';

export type DownloadIntentMode = 'bulk' | 'single';

export interface DownloadIntent {
  id: string;
  mode: DownloadIntentMode;
  label: string;
  start: () => Promise<void> | void;
}

export type GenerationLimitDialogState =
  | { type: 'per-run'; attempted: number; allowed: number }
  | { type: 'total'; attempted: number; allowed: number }
  | { type: 'gallery'; attempted: number; allowed: number; remove: number };