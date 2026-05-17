import { htmlEscape } from './util.js';

const HOMEPAGE_STEPS = [
  {
    title: 'Enter Your Text',
    description:
      'Input or paste the text you want to convert into handwriting. The tool supports extensive multi-page content, automatically flowing across as many pages as needed — ideal for long academic assignments, lecture notes, and professional documents. A real-time preview renders every change as you type, so you keep full control over spacing and page layout before exporting.'
  },
  {
    title: 'Customize Your Style',
    description:
      'Select from professional handwriting fonts and high-resolution paper templates (blank, lined, or dotted) for academic, creative, and professional work. Adjust ink color, stroke boldness, font size, and natural distortion, or upload your own TTF, OTF, or WOFF font. Every adjustment is reflected live in the preview so you can fine-tune realism before exporting.'
  },
  {
    title: 'Export Your Document',
    description:
      'Generate and download your pages as sharp PNG images for Studygram and design work, or compile an entire multi-page document into a single professional PDF ready for printing or submission. All rendering and export is performed locally in your browser, so your data never leaves your device. No signup, no watermark, and no limit on how many documents you create.'
  }
];

const HOMEPAGE_FEATURES = [
  {
    title: 'Realistic Variations',
    description:
      'Our handwriting engine simulates the natural variations of real penmanship, including baseline jitter, variable letter slant, randomized spacing, and subtle ink pooling at stroke ends. Every character renders slightly differently, so no two letters look identical and no document ever appears computer-generated, even across long multi-page assignments.',
    benefits: [
      'Natural baseline alignment',
      'Variable letter slant',
      'Ink intensity variations',
      'Realistic imperfections'
    ]
  },
  {
    title: 'Professional Templates',
    description:
      'Choose from a curated library of high-resolution paper templates: structured lined paper for academic essays and homework, dotted grids for bullet journaling and planning, or clean blank sheets for letters and creative work. Each template ships with authentic paper textures and accurate margins so output looks realistic on screen and when printed at full size.',
    benefits: [
      'Lined and dotted options',
      'Authentic paper textures',
      'High-resolution output',
      'Optimized for printing'
    ]
  },
  {
    title: 'Custom Font Support',
    description:
      'Upload your own handwriting font in TTF, OTF, or WOFF format and apply it instantly across every generated document. Digitize your real writing style, a teacher’s script, or a brand signature and reuse it consistently for notes, assignments, and designs. Fonts are stored locally in your browser, so your personal typeface never leaves your device.',
    benefits: [
      'Digitize your handwriting',
      'Support for standard formats',
      'Multiple font slots',
      'Instant application'
    ]
  },
  {
    title: 'Secure and Private',
    description:
      'A fully client-side architecture keeps every step — text input, font rendering, and image export — inside your browser, so your text, uploaded fonts, and generated documents never reach our servers. There are no accounts, no content tracking, and no server-side storage. The handwriting generator is completely free and private by design.',
    benefits: [
      'Completely free service',
      'No registration required',
      'Client-side processing',
      'Commercial use allowed'
    ]
  }
];

const HOMEPAGE_USE_CASES = [
  {
    title: 'Students & Educators',
    description:
      'Create realistic handwritten assignments, study guides, and educational worksheets that retain the warmth of analog notes while staying inside your digital workflow.',
    examples: [
      'Homework assignments',
      'Study summaries',
      'Educational materials',
      'Handwriting practice'
    ]
  },
  {
    title: 'Creators & Designers',
    description:
      'Enhance digital journals, planners, and social media designs with authentic-looking handwriting elements that stand out from generic typography.',
    examples: [
      'Journaling designs',
      'Social media graphics',
      'Digital planner inserts',
      'Creative typography'
    ]
  },
  {
    title: 'Professional Use',
    description:
      'Add a personal touch to business correspondence, thank-you notes, and marketing materials. Stand out in inboxes that are saturated with system fonts.',
    examples: [
      'Business correspondence',
      'Thank-you notes',
      'Personalized marketing',
      'Document signatures'
    ]
  }
];

const HOMEPAGE_TIPS = [
  {
    title: 'Font Selection',
    description:
      'Choose a font that matches the tone of your document. Use formal scripts for letters and casual styles for personal notes.'
  },
  {
    title: 'Ink Weight Adjustment',
    description:
      'Fine-tune the boldness of your writing to match different pen types. Lighter settings simulate fine-tip pens.'
  },
  {
    title: 'Template Alignment',
    description:
      'Ensure your text aligns correctly with your chosen paper template (lined or grid) for maximum realism.'
  },
  {
    title: 'Final Preview',
    description:
      'Always review your document in the live preview before exporting to ensure formatting is correct.'
  }
];

const HOMEPAGE_TESTIMONIALS = [
  {
    quote:
      'The realism of the ink flow and baseline jitter is impressive. It significantly improved the quality of my study notes.',
    author: 'Sarah J.',
    role: 'University Student'
  },
  {
    quote:
      'A versatile tool for digital creators. The ability to upload custom fonts is a game-changer for personalized designs.',
    author: 'Mia Chen',
    role: 'Digital Artist'
  },
  {
    quote:
      'Highly effective for creating authentic-looking handwritten letters for outreach campaigns. Very professional results.',
    author: 'David K.',
    role: 'Marketing Consultant'
  }
];

const renderList = (items, ordered = false) => {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</${tag}>`;
};

export const renderHomeBody = (translate, lang) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));

  const heroHeadline = t('hero.headline', 'Transform Text into Authentic Handwriting');
  const heroSub = t(
    'hero.subheadline',
    'Create realistic handwritten notes, assignments, and designs with our free online handwriting generator. Professional quality, 100% private.'
  );
  const heroCta = t('hero.cta', 'Start Creating Free');

  const howItWorksHeading = t('howItWorks.heading', 'How It Works');
  const howItWorksSub = t(
    'howItWorks.subheading',
    'Generate professional handwritten text in three simple steps'
  );
  const howItWorksContext = t(
    'howItWorks.context',
    'Our handwriting generator provides a seamless workflow for creating realistic handwritten text. Ideal for students, educators, and professionals seeking a personal touch in their digital documents.'
  );

  const featuresHeading = t('features.heading', 'Advanced Features');
  const featuresSub = t(
    'features.subheading',
    'High-quality tools designed for authentic handwriting simulation'
  );

  const useCasesHeading = t('useCases.heading', 'Who Uses Our Tool?');
  const useCasesSub = t(
    'useCases.subheading',
    'Versatile solutions for academic, creative, and professional needs'
  );

  const tipsHeading = t('tips.heading', 'Usage Tips');
  const tipsSub = t(
    'tips.subheading',
    'Get the best results with these optimization strategies'
  );

  const testimonialsHeading = t('testimonials.heading', 'User Feedback');

  const stepsHtml = HOMEPAGE_STEPS.map((step, index) => {
    const title = htmlEscape(translate(lang, `howItWorks.steps.${index}.title`, step.title));
    const description = htmlEscape(
      translate(lang, `howItWorks.steps.${index}.description`, step.description)
    );
    return `<article class="prerender-step"><h3>${index + 1}. ${title}</h3><p>${description}</p></article>`;
  }).join('');

  const featuresHtml = HOMEPAGE_FEATURES.map((feature, index) => {
    const title = htmlEscape(translate(lang, `features.items.${index}.title`, feature.title));
    const description = htmlEscape(
      translate(lang, `features.items.${index}.description`, feature.description)
    );
    const benefits = feature.benefits.map((benefit, bIdx) =>
      translate(lang, `features.items.${index}.benefits.${bIdx}`, benefit)
    );
    return `<article class="prerender-feature"><h3>${title}</h3><p>${description}</p>${renderList(benefits)}</article>`;
  }).join('');

  const useCasesHtml = HOMEPAGE_USE_CASES.map((useCase, index) => {
    const title = htmlEscape(translate(lang, `useCases.items.${index}.title`, useCase.title));
    const description = htmlEscape(
      translate(lang, `useCases.items.${index}.description`, useCase.description)
    );
    const examples = useCase.examples.map((example, eIdx) =>
      translate(lang, `useCases.items.${index}.examples.${eIdx}`, example)
    );
    const examplesLabel = htmlEscape(
      translate(lang, `useCases.items.${index}.examplesLabel`, 'Ideal For:')
    );
    return `<article class="prerender-usecase"><h3>${title}</h3><p>${description}</p><p><strong>${examplesLabel}</strong></p>${renderList(examples)}</article>`;
  }).join('');

  const tipsHtml = HOMEPAGE_TIPS.map((tip, index) => {
    const title = htmlEscape(translate(lang, `tips.items.${index}.title`, tip.title));
    const description = htmlEscape(
      translate(lang, `tips.items.${index}.description`, tip.description)
    );
    return `<article class="prerender-tip"><h3>${title}</h3><p>${description}</p></article>`;
  }).join('');

  const testimonialsHtml = HOMEPAGE_TESTIMONIALS.map((item, index) => {
    const quote = htmlEscape(translate(lang, `testimonials.items.${index}.quote`, item.quote));
    const author = htmlEscape(translate(lang, `testimonials.items.${index}.author`, item.author));
    const role = htmlEscape(translate(lang, `testimonials.items.${index}.role`, item.role));
    return `<figure class="prerender-testimonial"><blockquote>${quote}</blockquote><figcaption>${author} — ${role}</figcaption></figure>`;
  }).join('');

  return `
<main class="prerender-main">
  <section class="prerender-hero">
    <h1>${heroHeadline}</h1>
    <p class="prerender-subheadline">${heroSub}</p>
    <p><a href="#start" class="prerender-cta">${heroCta}</a></p>
  </section>
  <section class="prerender-section" id="how-it-works">
    <h2>${howItWorksHeading}</h2>
    <p class="prerender-section-sub">${howItWorksSub}</p>
    ${stepsHtml}
    <p class="prerender-context">${howItWorksContext}</p>
  </section>
  <section class="prerender-section" id="features">
    <h2>${featuresHeading}</h2>
    <p class="prerender-section-sub">${featuresSub}</p>
    ${featuresHtml}
  </section>
  <section class="prerender-section" id="use-cases">
    <h2>${useCasesHeading}</h2>
    <p class="prerender-section-sub">${useCasesSub}</p>
    ${useCasesHtml}
  </section>
  <section class="prerender-section" id="tips">
    <h2>${tipsHeading}</h2>
    <p class="prerender-section-sub">${tipsSub}</p>
    ${tipsHtml}
  </section>
  <section class="prerender-section" id="testimonials">
    <h2>${testimonialsHeading}</h2>
    ${testimonialsHtml}
  </section>
</main>
`.trim();
};
