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
    title: "Enter Your Text",
    description: "Type or paste the text you want to convert into handwriting. Our tool supports up to 6 pages of content, perfect for assignments, notes, or creative projects. Simply enter your text in the input field and watch the magic happen in real-time. The intuitive interface makes it easy to get started, whether you're creating a single page or multiple pages of handwritten content. You can edit and refine your text at any time before generating the final output.",
    icon: "edit"
  },
  {
    number: 2,
    title: "Customize Your Style",
    description: "Choose from 9 handwriting fonts, select paper templates (blank, lined, or dotted), and adjust ink colors and boldness to match your aesthetic. Upload your own handwriting font for a truly personal touch. Customize every detail to create the perfect handwritten look. Adjust the ink weight to make your writing lighter or bolder, select from multiple ink colors including black, blue, red, and green, and fine-tune the distortion level to control how realistic your handwriting appears.",
    icon: "palette"
  },
  {
    number: 3,
    title: "Generate & Download",
    description: "Click generate to create your handwritten pages. Download as high-quality PNG images or compile into a PDF. All processing happens in your browser—completely private. No data ever leaves your device, ensuring your content stays secure and confidential. Choose your preferred image quality settings, download individual pages or use bulk download for multiple pages, and save your work in the format that works best for your needs. Everything is processed locally for maximum privacy and speed.",
    icon: "download"
  }
];

// ============================================================================
// Features Section Content
// ============================================================================

export const features: Feature[] = [
  {
    title: "Realistic Handwriting Variations",
    description: "Our advanced rendering engine creates authentic handwriting with natural variations in baseline, slant, and ink intensity. Each generation is unique, with subtle imperfections that make your text look genuinely handwritten, not computer-generated. Experience the difference with realistic baseline jitter, variable letter slant, and natural ink color variations.",
    icon: "pen",
    benefits: [
      "Natural baseline jitter",
      "Variable letter slant",
      "Ink color variations",
      "Micro-tilts and imperfections"
    ]
  },
  {
    title: "Multiple Paper Templates",
    description: "Choose from a variety of paper templates to match your needs. Blank pages for creative freedom, lined paper for structured notes, or dotted grids for bullet journals. Each template features authentic paper textures for added realism. Perfect for students, creators, and professionals who need the right paper for every project.",
    icon: "template",
    benefits: [
      "Blank, lined, and dotted options",
      "Authentic paper textures",
      "High-resolution templates",
      "Optimized for printing"
    ]
  },
  {
    title: "Custom Font Upload",
    description: "Make it truly yours by uploading your own handwriting font. Our tool supports TTF, OTF, and WOFF formats, allowing you to use your actual handwriting or any custom font you've created. Store up to 2 personal fonts for quick access. Transform your unique handwriting style into digital format and use it whenever you need.",
    icon: "upload",
    benefits: [
      "Upload your own handwriting",
      "Support for TTF, OTF, WOFF",
      "2 custom font slots",
      "Instant preview"
    ]
  },
  {
    title: "100% Free & Private",
    description: "No subscriptions, no hidden fees, no data collection. Everything runs in your browser—your text never touches our servers. Use it for personal projects, school assignments, or commercial work. No credit required, though always appreciated. Your privacy is our priority, with complete client-side processing ensuring your content stays yours.",
    icon: "lock",
    benefits: [
      "Completely free forever",
      "No signup required",
      "Client-side processing",
      "Commercial use allowed"
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
    quote: "Whenever I had to write stuff down, it looked like a total mess. This site seriously changed the game — now my notes look super cute, and the font styles? Absolute slay.",
    author: "Baddie Brown",
    role: "Aesthetic Queen",
    avatar: "/avatars/millie.png"
  },
  {
    quote: "Back in the day, I had to scribble notes by hand just so Jesse could keep up. Sloppy, messy — a real pain. This site cleaned it all up. The font variations? Let’s just say, they’re pure grade A.",
    author: "Heisenberg",
    role: "The Chemist",
    avatar: "/avatars/heisenberg.png"
  },
  {
    quote: "My handwriting was so shaky the dealer couldn’t even read my notes. This site fixed that — now my shopping lists look clean, and the font style? Let’s just say it hits harder than what I smoke.",
    author: "Plant Peter",
    role: "Local Botanist",
    avatar: "/avatars/peter.png"
  },
  {
    quote: "Handwriting should be more than just words — it should feel seductive. With this site, even my notes look irresistible, like a love letter on screen. Smooth, stylish, and impossible to ignore.",
    author: "Aggressive Armas",
    role: "Secret Agent",
    avatar: "/avatars/anadearmas.png"
  },
  {
    quote: "Listen… I tried writing a note after a few drinks, and let’s just say it looked like modern art. This site? Total lifesaver. Now my handwriting looks classy even when I can’t walk straight. Cheers to that!",
    author: "Drunk David",
    role: "Wine Enthusiast",
    avatar: "/avatars/david.png"
  },
  {
    quote: "My lyrics don’t always look pretty on paper. This site makes every note feel like a love song — simple, stylish, unforgettable.",
    author: "Swirl Swift",
    role: "Songwriter",
    avatar: "/avatars/taylor.png"
  },
  {
    quote: "Out in the field, I’ve scribbled notes in the dark, rain pouring down — damn near unreadable. This site? Makes my writing sharp and clear every time. That’s a bloody good tool.",
    author: "Captain Price",
    role: "Task Force 141",
    avatar: "/avatars/price.png"
  },
  {
    quote: "I’m always on the move, and my quick notes never look runway-ready. This site makes everything chic and flawless — like handwriting, but make it fashion.",
    author: "Jacked Jenner",
    role: "Model / Icon",
    avatar: "/avatars/kendall.png"
  },
  {
    quote: "I used to write assignments and get low grades — that’s why everyone calls me L. But I tasted a W using this site. My notes have never looked this precise.",
    author: "L",
    role: "Detective",
    avatar: "/avatars/L.png"
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
