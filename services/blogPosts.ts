/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { TFunction } from 'i18next';
import { getLanguageInfo } from './languageConfig';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'benefits-of-handwritten-notes',
    title: 'Cognitive Benefits of Handwritten Notes: Why Analog Matters',
    date: '2025-09-17',
    author: 'Editorial Team',
    content: `
        <p>
          In an era dominated by rapid digital typing, the traditional practice of writing by hand remains a powerful tool for cognitive development and memory retention. Research consistently shows that the act of handwriting engages the brain in ways that typing cannot replicate.
        </p>
        <h2>The Science of Memory Retention</h2>
        <p>
          When you write by hand, your brain is forced to process information more deeply. Unlike typing, which is a repetitive mechanical motion, handwriting involves complex strokes for each letter. This "haptic" engagement creates a stronger motor memory in the brain, making it easier to recall information during exams or meetings.
        </p>
        <h2>Digital-to-Analog Workflows</h2>
        <p>
          Our <strong>text-to-handwriting converter</strong> serves as a bridge for those who prefer the speed of typing but desire the visual and cognitive advantages of handwritten text. By converting your digital notes into a realistic handwritten format, you can create study materials that are more engaging and easier for the brain to process visually.
        </p>
        <h2>Enhancing Focus and Reducing Distraction</h2>
        <p>
          Working with handwritten-style documents can also help reduce the "digital fatigue" associated with standard sans-serif fonts. The natural variations in our <strong>free handwriting tool</strong> provide a more organic reading experience, which can lead to better focus and longer attention spans during study sessions.
        </p>
      `,
  },
  {
    slug: 'effective-study-materials',
    title: 'Creating Effective Study Materials with Handwriting Tools',
    date: '2025-09-17',
    author: 'Educational Specialist',
    content: `
        <p>
          Creating effective study guides is an art form. While digital tools have made information gathering easier, the presentation of that information is key to successful learning. Here is how you can use an <strong>online handwriting converter</strong> to elevate your educational materials.
        </p>
        <h2>Visual Hierarchy in Notes</h2>
        <p>
          Use different handwriting styles to distinguish between headings, key definitions, and supporting details. Our tool offers 9 unique handwriting fonts, allowing you to create a clear visual hierarchy. This makes it easier for your eyes to scan the page and find critical information quickly.
        </p>
        <h2>The Power of Customization</h2>
        <p>
          A high-quality <strong>text to handwriting online tool</strong> should allow for deep customization. By adjusting ink color (blue ink is often cited as better for memory) and paper templates, you can tailor your notes to your specific learning style. Whether you prefer lined paper for structure or blank pages for mind-mapping, the right backdrop matters.
        </p>
        <p>
          Incorporating these "handwritten" elements into your digital workflow allows you to maintain the organization of a computer while gaining the aesthetic and mnemonic benefits of a traditional notebook. This is particularly useful for students preparing for high-stakes examinations where retention is paramount.
        </p>
      `,
  },
  {
    slug: 'create-your-own-handwriting-font',
    title: 'Technical Guide: Creating Your Own Handwriting Font',
    date: '2025-09-26',
    author: 'Type Design Team',
    content: `
        <p>
          Personalization is at the heart of our platform. By uploading your actual handwriting as a font, you can maintain your unique identity in digital documents. This guide explains the technical steps required to create a compatible font file for <strong>txttohandwriting.org</strong>.
        </p>
        <h2>Step 1: Capturing High-Quality Samples</h2>
        <p>
          To create a realistic font, you must start with a clean sample. We recommend using a dark ink pen on bright white paper. Ensure that you write each character clearly, including uppercase, lowercase, numerals, and common punctuation marks. Consistency in baseline and x-height is crucial for a professional-looking result.
        </p>
        <ul>
          <li><strong>Digital Capture:</strong> Use a scanner at 300 DPI or a high-resolution camera in a well-lit environment.</li>
          <li><strong>Software Tools:</strong> Services like Calligraphr or Glyphr Studio can help you convert your scanned images into TTF or OTF files.</li>
        </ul>
        <h2>Step 2: Refining the Typeface</h2>
        <p>
          Once you have converted your samples, use a font editor to adjust the kerning (the space between letters) and the line height. Proper kerning prevents letters from overlapping awkwardly and ensures a natural flow, which is a hallmark of authentic handwriting.
        </p>
        <h2>Step 3: Implementation</h2>
        <p>
          After exporting your font in TTF, OTF, or WOFF format, head to our <strong>Custom Upload</strong> section. Our generator supports these formats natively, allowing you to see your personal writing style applied to any text instantly. This feature is widely used by professionals to add a "signed" feel to digital correspondence and by students who wish to submit digital assignments that reflect their personal work.
        </p>
      `,
  },
  {
    slug: 'science-of-paper-textures',
    title: 'Psychology of Paper Texture in Digital Learning',
    date: '2026-01-01',
    author: 'Design Researcher',
    content: `
        <p>
          Why do we feel more connected to information on a textured page than on a sterile white screen? The answer lies in environmental psychology. Our brains are evolved to interact with the physical world, and textures provide sensory cues that enhance our engagement with content.
        </p>
        <h2>Simulating Realism</h2>
        <p>
          Our handwriting generator doesn't just change the font; it simulates the <strong>micro-details</strong> of ink absorption on various paper types. Whether it's the slight "bleed" on a lined notebook page or the crisp edges on a premium template, these details signal to the brain that the content is "real" and therefore worth more attention.
        </p>
        <h2>Template Selection for Different Tasks</h2>
        <p>
          Choosing the right template is about more than just aesthetics. <strong>Grid paper</strong> is statistically shown to aid in the organization of mathematical and scientific data, while <strong>blank textured paper</strong> encourages more divergent, creative thinking. By matching your task to the correct template, you can optimize your mental performance.
        </p>
      `,
  },
];

const buildBlogTranslationKey = (slug: string, field: 'title' | 'content'): string =>
  `blogPosts.${slug}.${field}`;

export const getLocalizedBlogPost = (t: TFunction, slug: string): BlogPost | undefined => {
  const post = blogPosts.find((entry) => entry.slug === slug);
  if (!post) {
    return undefined;
  }

  return {
    ...post,
    title: t(buildBlogTranslationKey(post.slug, 'title'), post.title),
    content: t(buildBlogTranslationKey(post.slug, 'content'), post.content)
  };
};

export const getLocalizedBlogPosts = (t: TFunction): BlogPost[] =>
  blogPosts.map((post) => ({
    ...post,
    title: t(buildBlogTranslationKey(post.slug, 'title'), post.title),
    content: t(buildBlogTranslationKey(post.slug, 'content'), post.content)
  }));

export const formatBlogDate = (date: string, languageCode?: string | null): string => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  const locale = getLanguageInfo(languageCode)?.locale || 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(parsed);
  } catch {
    return date;
  }
};
