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

export const MAX_PAGES_PER_RUN = 2;
export const MAX_TOTAL_PAGES = 6;
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
    question: 'Is this actually free?',
    answer: "Fr fr, it's free. No cap. We're not about that subscription life. Go wild (just don't break anything)."
  },
  {
    question: 'Can I use this for my side hustle?',
    answer: 'Totally. Make your memes, brand your Depop, whatever. Go get that bread. No credit needed, but a shoutout would be iconic.'
  },
  {
    question: 'Are you reading my unhinged thoughts?',
    answer: "Nah, we can't see a thing. We don't need your data. Our servers are like stones anyway. Your secrets are safe with us, bestie."
  },
  {
    question: "What's the deal with downloads?",
    answer: "Right now it's just PNGs. It's giving high quality. We'll add more formats later if the vibes are right."
  },
  {
    question: 'Why does the font look kinda off?',
    answer: "It's probably your browser. Try updating it. If it's still looking sus, it might just be your OS doing its thing."
  },
  {
    question: 'My faculty asks for hardcopies, what should I do?',
    answer: 'We linked a video walkthrough that keeps things on the low — check the FAQ link for the exact steps.'
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
  changeType?: 'new-year' | 'major' | 'minor'; // Added for custom styling
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '1.4',
    date: 'January 2026',
    tagline: 'Next level realism and performance.',
    highlights: [
      'New UI overhaul with a cleaner, modern design system.',
      'Improved generation of images with higher fidelity and better ink textures.',
      'Improved live image rendering to the next level for instant feedback.',
      'Optimized the engine for faster processing and smoother interactions.'
    ],
    mood: 'Fresh start, new year, new notes.',
    changeType: 'new-year'
  },
  {
    version: '1.3',
    date: 'October 2025',
    tagline: 'More control, higher quality, and a smoother experience.',
    highlights: [
      'UI design revisit for a more intuitive and aesthetically pleasing experience.',
      'Added Ink weight control option for finer control over the handwriting appearance.',
      'Added the option to download all generated images as a single PDF file.',
      'Added image quality option (High, Medium, Low) to balance quality and file size.',
      'Fixed various known bugs to improve stability and performance.'
    ],
    mood: 'Feeling powerful and polished.'
  },
  {
    version: '1.2',
    date: 'Septemeber 2025',
    tagline: 'A fresh glow-up with new creative freedom.',
    highlights: [
      'Major redesign of the lab so controls, preview, and gallery flow together on every screen size.',
      'Custom font upload manager with step-by-step guidance and two personal slots for your handwriting.',
      'Performance tune-up across Chrome, Safari, Firefox, and Edge so pages render faster and feel smoother.'
    ],
    mood: 'Today feels like a brand-new planner spread.'
  },
  {
    version: '1.0',
    date: 'Septemeber 2025',
    tagline: 'The day txttohandwriting.org went public.',
    highlights: [
      'Launched the handwriting lab with instant preview, ink colours, and realism sliders.',
      'Introduced the Paper Vibe shelf with blank, dotted, and lined templates ready to download as PNGs.',
      'Opened the image gallery with full-screen view, sequence labels, and one-click downloads.'
    ],
    mood: 'First-day-of-school butterflies, but for stationery nerds.'
  }
];

export type Page = 'main' | 'terms' | 'faq' | 'blog' | 'blogPost' | 'about' | 'changelog' | 'notFound';
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