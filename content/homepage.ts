/**
 * Homepage Content Configuration
 * 
 * This file contains all content data for the homepage, including hero section,
 * features, use cases, tips, and testimonials. Content is organized in a
 * maintainable format with TypeScript interfaces for type safety.
 * 
 * SEO keywords are naturally integrated throughout the content.
 */

import { ReactNode } from 'react';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface HeroContent {
  headline: string;
  subheadline: string;
  cta: string;
  keywords: string[];
}

export interface Step {
  number: number;
  title: string;
  description: string;
  icon: string; // Icon name or identifier
}

export interface Feature {
  title: string;
  description: string;
  icon: string; // Icon name or identifier
  benefits: string[];
}

export interface UseCase {
  title: string;
  description: string;
  examples: string[];
  image?: string;
}

export interface Tip {
  title: string;
  description: string;
  icon: string; // Icon name or identifier
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

export interface SEOContent {
  title: string;
  description: string;
  keywords: string[];
  structuredData: any;
}

export interface HomePageContent {
  hero: HeroContent;
  howItWorks: Step[];
  features: Feature[];
  useCases: UseCase[];
  tips: Tip[];
  testimonials: Testimonial[];
  seo: SEOContent;
}

// ============================================================================
// Hero Section Content
// ============================================================================

export const heroContent: HeroContent = {
  headline: "Transform Text into Authentic Handwriting",
  subheadline: "Create realistic handwritten notes, assignments, and designs with our free online handwriting generator. No signup required, 100% private.",
  cta: "Start Creating Free",
  keywords: [
    "handwriting generator",
    "text to handwriting",
    "convert text to handwriting",
    "free handwriting tool"
  ]
};

// ============================================================================
// How It Works Section Content
// ============================================================================

export const howItWorksSteps: Step[] = [
  {
    number: 1,
    title: "Input Your Text",
    description: "Enter or paste the text you want to convert into handwriting. The handwriting generator supports extensive multi-page documents, automatically flowing your content across as many pages as needed, which makes it ideal for long academic assignments, detailed lecture notes, journal entries, and professional correspondence. A real-time preview renders every change as you type, so you keep full control over line breaks, spacing, and page layout before you export anything. You can edit, re-paste, or reorganize your text at any point without losing your chosen style.",
    icon: "edit"
  },
  {
    number: 2,
    title: "Personalize the Style",
    description: "Select from a curated library of handwriting fonts and high-resolution paper templates, including lined, grid, and blank options for academic, creative, and professional work. Refine the appearance further by adjusting ink color, stroke boldness, font size, and natural distortion so the result matches the exact pen and paper you have in mind. Prefer your own handwriting? Upload a custom TTF, OTF, or WOFF font and apply it instantly. Every adjustment is reflected live in the preview, letting you fine-tune realism before exporting.",
    icon: "palette"
  },
  {
    number: 3,
    title: "Generate and Export",
    description: "Produce high-quality handwritten pages instantly and download them in the format you need. Export individual pages as sharp PNG images for Studygram posts and design work, or compile an entire multi-page document into a single professional PDF ready for printing or submission. All rendering and export is performed locally within your browser, so your data never leaves your device and remains private and secure at every step. There is no signup, no watermark, and no limit on how many documents you create.",
    icon: "download"
  }
];

// ============================================================================
// Features Section Content
// ============================================================================

export const features: Feature[] = [
  {
    title: "Advanced Rendering Engine",
    description: "Our proprietary handwriting engine simulates the natural variations of real penmanship, including baseline jitter, variable letter slant, randomized spacing, and subtle ink pooling at stroke ends. Every character is rendered slightly differently, so no two letters look identical and no document ever appears computer-generated. The result is realistic handwritten text that holds up to close inspection, whether you are creating a single note or a multi-page assignment.",
    icon: "pen",
    benefits: [
      "Natural baseline alignment",
      "Dynamic letter variations",
      "Authentic ink simulation",
      "Realistic imperfections"
    ]
  },
  {
    title: "Professional Paper Templates",
    description: "Choose from a curated library of professional paper templates designed for different use cases. Use structured lined paper for academic essays and homework, dotted grids for bullet journaling and planning, or clean blank sheets for letters and creative work. Each template ships with high-resolution paper textures and accurate margins so your handwritten output looks authentic both on screen and when printed at full size.",
    icon: "template",
    benefits: [
      "Lined, Grid, and Blank options",
      "High-resolution textures",
      "Optimized for printing",
      "Multiple aesthetic styles"
    ]
  },
  {
    title: "Custom Typeface Support",
    description: "For a truly personal touch, upload your own handwriting font in TTF, OTF, or WOFF format and apply it instantly across every generated document. This lets you digitize your real writing style, a teacher's script, or a brand signature and reuse it consistently for notes, assignments, and designs. Fonts are stored locally in your browser, so your personal typeface never leaves your device and is ready the next time you visit.",
    icon: "upload",
    benefits: [
      "Upload personal fonts",
      "Supports standard formats",
      "Secure local storage",
      "Instant style application"
    ]
  },
  {
    title: "Privacy and Security",
    description: "We prioritize your data security through a fully client-side architecture. Every step, from text input to font rendering and final image export, happens locally inside your browser, so your text, uploaded fonts, and generated documents never reach our servers. There are no accounts, no tracking of your content, and no server-side storage. The handwriting generator is completely free, private by design, and requires no registration to start creating.",
    icon: "lock",
    benefits: [
      "No data collection",
      "Zero server-side storage",
      "Secure browser processing",
      "Fully private workflow"
    ]
  }
];

// ============================================================================
// Use Cases Section Content
// ============================================================================

export const useCases: UseCase[] = [
  {
    title: "Students & Educators",
    description: "Perfect for creating handwritten assignments, study notes, and practice worksheets. Generate authentic-looking handwritten submissions for online courses, create study guides with a personal touch, or prepare handwriting practice sheets for students learning cursive. Ideal for homework, essays, and educational materials that require a handwritten format.",
    examples: [
      "Homework assignments",
      "Study notes and summaries",
      "Practice worksheets",
      "Handwriting samples"
    ]
  },
  {
    title: "Content Creators & Designers",
    description: "Elevate your Studygram, bullet journal spreads, or design projects with authentic handwritten elements. Create eye-catching social media posts, design custom planners, or add handwritten touches to digital artwork. Perfect for aesthetic content that stands out. Transform your creative vision into beautiful handwritten designs that engage your audience.",
    examples: [
      "Studygram posts",
      "Bullet journal designs",
      "Social media content",
      "Digital planner pages"
    ]
  },
  {
    title: "Professionals & Businesses",
    description: "Add a personal touch to business communications, create handwritten-style thank you notes, design unique marketing materials, or generate handwritten signatures for documents. Ideal for businesses wanting to stand out with authentic, personal touches. Make your professional correspondence memorable with the warmth of handwritten text.",
    examples: [
      "Thank you notes",
      "Personal letters",
      "Marketing materials",
      "Signature generation"
    ]
  }
];

// ============================================================================
// Tips Section Content
// ============================================================================

export const tips: Tip[] = [
  {
    title: "Choose the Right Font",
    description: "Different fonts work better for different purposes. Use elegant script fonts for formal documents, casual fonts for personal notes, and clear fonts for readability. Preview your text before generating to ensure it matches your vision. Experiment with different handwriting styles to find the perfect match for your project.",
    icon: "font"
  },
  {
    title: "Adjust Ink Boldness",
    description: "Control the weight of your handwriting by adjusting ink boldness. Lighter settings create delicate, feminine writing, while bolder settings produce strong, confident strokes. Experiment to find your perfect style. The right ink weight can dramatically change the feel and readability of your handwritten text.",
    icon: "bold"
  },
  {
    title: "Select the Right Template",
    description: "Match your paper template to your content. Lined paper works best for structured notes and assignments, blank pages for creative freedom, and dotted grids for bullet journals and planning. The right template enhances readability and gives your handwritten text the perfect backdrop for any purpose.",
    icon: "template"
  },
  {
    title: "Preview Before Generating",
    description: "Use the live preview to check your text before generating. This saves time and ensures your content looks exactly how you want it. Adjust font size, spacing, and distortion levels until perfect. The preview feature lets you fine-tune every detail before committing to the final generation.",
    icon: "eye"
  },
  {
    title: "Use Bulk Download for Multiple Pages",
    description: "Generating multiple pages? Use the bulk download feature to save all your pages at once. Choose your preferred quality setting and download everything as a ZIP file or compile into a single PDF. Perfect for large projects like essays, reports, or multi-page assignments that need consistent formatting.",
    icon: "download"
  }
];

// ============================================================================
// Testimonials Section Content
// ============================================================================

export const testimonials: Testimonial[] = [
  {
    quote: "I used this for my history project and my teacher actually thought I wrote it by hand. The ink flow looks so natural!",
    author: "Sarah J.",
    role: "High School Student",
    avatar: "/avatars/avatar1.png"
  },
  {
    quote: "As a digital planner creator, this tool is a lifesaver. I can create handwritten-style stickers and inserts in seconds without needing an iPad.",
    author: "Mia Chen",
    role: "Digital Creator",
    avatar: "/avatars/avatar2.png"
  },
  {
    quote: "The best text-to-handwriting tool I've found. The ability to upload my own font and tweak the paper texture makes it incredibly versatile.",
    author: "Alex Rivera",
    role: "Graphic Designer",
    avatar: "/avatars/avatar3.png"
  },
  {
    quote: "I love how easy it is to use. I type out my study notes, print them, and they look beautiful. It makes studying so much more aesthetic.",
    author: "Emily Watson",
    role: "University Student",
    avatar: "/avatars/avatar4.png"
  },
  {
    quote: "Great for generating 'handwritten' letters for marketing campaigns. It adds a personal touch that printed text just doesn't have.",
    author: "David K.",
    role: "Marketing Specialist",
    avatar: "/avatars/avatar5.png"
  },
  {
    quote: "Finally, a generator that doesn't look fake. The jitter and ink variation features are game-changers for realism.",
    author: "Chris T.",
    role: "Software Developer",
    avatar: "/avatars/avatar6.png"
  }
];

// ============================================================================
// SEO Content
// ============================================================================

export const seoContent: SEOContent = {
  title: "Free Handwriting Generator - Convert Text to Handwriting Online",
  description: "Transform typed text into realistic handwriting with our free online handwriting generator. Create authentic handwritten notes, assignments, and designs. No signup required, 100% private.",
  keywords: [
    "handwriting generator",
    "text to handwriting",
    "convert text to handwriting",
    "free handwriting tool",
    "online handwriting generator",
    "handwriting converter",
    "text to handwritten notes",
    "realistic handwriting",
    "handwriting font generator"
  ],
  structuredData: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Text to Handwriting Generator",
    "description": "Free online tool to convert typed text into realistic handwriting",
    "url": "https://txttohandwriting.org",
    "applicationCategory": "UtilityApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Realistic handwriting variations",
      "Multiple paper templates",
      "Custom font upload",
      "Free and private"
    ]
  }
};

// ============================================================================
// Complete Homepage Content Export
// ============================================================================

export const homepageContent: HomePageContent = {
  hero: heroContent,
  howItWorks: howItWorksSteps,
  features: features,
  useCases: useCases,
  tips: tips,
  testimonials: testimonials,
  seo: seoContent
};

// Default export for convenience
export default homepageContent;
