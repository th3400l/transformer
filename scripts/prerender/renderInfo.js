import { htmlEscape } from './util.js';

const ABOUT_FALLBACKS = {
  description1:
    'txttohandwriting.org was founded to bridge the gap between digital convenience and the authentic appeal of handwriting. Our mission is to provide an accessible, professional-grade tool for creating realistic handwritten documents online.',
  description2:
    'Our platform serves a diverse global community, including students, educators, and professionals. We utilize advanced browser-based rendering technology to simulate natural handwriting patterns, ensuring high-fidelity results while maintaining 100% user privacy.',
  community: 'Quality and Innovation',
  communityDesc:
    'We prioritize user feedback to continuously improve our rendering algorithms and feature set. Every release is shaped by the students, designers, and educators who rely on the tool every day.',
  supportHeadline: 'Contact Our Team',
  supportDesc:
    'We welcome your questions, feature suggestions, and professional feedback. Whether you are integrating the tool into a classroom or building a creative campaign, we want to hear from you.',
  madeBy: 'Developed by the Text to Handwriting Team'
};

const FAQ_FALLBACKS = [
  {
    question: 'Is this tool free to use?',
    answer:
      'Yes, the Handwriting Generator is completely free to use. We do not require any subscriptions or hidden fees. Our goal is to provide a valuable utility for students and professionals alike.'
  },
  {
    question: 'Can I use the output for commercial projects?',
    answer:
      'Yes, you are free to use the generated images and PDFs for personal, educational, or commercial projects. No attribution is required, though we appreciate it if you share the tool with others.'
  },
  {
    question: 'Is my data secure and private?',
    answer:
      'Your privacy is our priority. All text conversion and image generation happen locally in your web browser. We do not store or transmit your text to any external servers.'
  },
  {
    question: 'What file formats are supported for download?',
    answer:
      'Currently, you can download your handwritten pages as high-quality PNG images or compile them into a single PDF document.'
  },
  {
    question: 'Why does the font appearance vary across devices?',
    answer:
      'Handwriting rendering depends on browser font rendering engines. For the best and most consistent results, we recommend using a modern, updated browser like Chrome, Firefox, or Edge.'
  },
  {
    question: 'How can I print the generated pages?',
    answer:
      'After generating your pages, download them as a PDF. You can then print this PDF using your standard printer settings. For the most realistic look, we recommend using high-quality paper and a color printer.'
  },
  {
    question: 'Can I upload my own handwriting as a custom font?',
    answer:
      "Yes. Use the Custom Font upload area to add a TTF, OTF, or WOFF file. Tools like Calligraphr or Glyphr Studio can convert a scanned sample of your handwriting into one of these formats. Uploaded fonts stay in your browser's local storage and are never sent to our servers."
  },
  {
    question: 'Is there a limit on how much text I can convert at once?',
    answer:
      'There is no fixed character limit. The practical limit is the number of pages your browser can render before it slows down. Typical desktop browsers handle a 30-page document smoothly. For longer documents, generate in batches of 10 to 20 pages and use the bulk download option.'
  },
  {
    question: 'Does the tool work on mobile devices?',
    answer:
      'Yes. The interface is responsive and works on iOS Safari, Chrome on Android, and most other mobile browsers. For very long documents we recommend a desktop browser, since rendering many pages at once is faster on a larger device.'
  },
  {
    question: 'What paper templates are available?',
    answer:
      'We currently offer blank, lined, dotted, and grid templates, with additional aged and notebook variants. Each template is designed to mimic the texture of physical paper, including subtle ink absorption and grain.'
  },
  {
    question: 'How do I change the ink color or boldness of the writing?',
    answer:
      'The control panel includes ink color presets (black, blue, red, green) and a custom hex color picker. A separate boldness slider controls how heavily the ink is laid down on the page, which affects how realistic certain pen styles look.'
  },
  {
    question: 'Are the generated pages safe to use for school assignments and creative work?',
    answer:
      "You retain full ownership of any pages you generate, and the tool is widely used for note-taking, mock-ups, art projects, and creative writing. Always check your school's or client's specific guidelines on submitting machine-rendered handwriting."
  }
];

export const renderAboutBody = (translate, lang) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const back = t('pages.about.back', 'Back to Tool');
  const title = t('pages.about.title', 'About Our Platform');
  const description1 = t('pages.about.description1', ABOUT_FALLBACKS.description1);
  const description2 = t('pages.about.description2', ABOUT_FALLBACKS.description2);
  const community = t('pages.about.community', ABOUT_FALLBACKS.community);
  const communityDesc = t('pages.about.communityDesc', ABOUT_FALLBACKS.communityDesc);
  const supportHeadline = t('pages.about.supportHeadline', ABOUT_FALLBACKS.supportHeadline);
  const supportDesc = t('pages.about.supportDesc', ABOUT_FALLBACKS.supportDesc);
  const madeBy = t('pages.about.madeBy', ABOUT_FALLBACKS.madeBy);
  const donateBtc = t('pages.about.donateBtc', 'Contact Us');
  const donateBtcDesc = t(
    'pages.about.donateBtcDesc',
    'For inquiries regarding support or development, please reach out via email.'
  );

  return `
<main class="prerender-main">
  <article class="prerender-about">
    <header>
      <p><a href="/" rel="nofollow">&larr; ${back}</a></p>
      <h1>${title}</h1>
    </header>
    <section>
      <p>${description1}</p>
      <p>${description2}</p>
    </section>
    <section>
      <h2>${community}</h2>
      <p>${communityDesc}</p>
    </section>
    <section>
      <h2>${donateBtc}</h2>
      <p>${donateBtcDesc}</p>
    </section>
    <section>
      <h2>${supportHeadline}</h2>
      <p>${supportDesc}</p>
    </section>
    <footer>
      <p><em>${madeBy}</em></p>
    </footer>
  </article>
</main>
`.trim();
};

export const renderFaqBody = (translate, lang) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const title = t('pages.faq.title', 'Frequently Asked Questions');
  const back = t('pages.faq.back', 'Back to Tool');
  const supportHeadline = t('pages.faq.supportHeadline', 'Need Further Assistance?');
  const supportDesc = t(
    'pages.faq.supportDesc',
    'If you have technical questions or require support, please contact our team.'
  );

  const itemsHtml = FAQ_FALLBACKS.map((item, index) => {
    const num = index + 1;
    const question = t(`pages.faq.q${num}`, item.question);
    const answer = t(`pages.faq.a${num}`, item.answer);
    return `<section class="prerender-faq-item"><h2>${question}</h2><p>${answer}</p></section>`;
  }).join('');

  return `
<main class="prerender-main">
  <article class="prerender-faq">
    <header>
      <p><a href="/" rel="nofollow">&larr; ${back}</a></p>
      <h1>${title}</h1>
    </header>
    ${itemsHtml}
    <footer>
      <h2>${supportHeadline}</h2>
      <p>${supportDesc}</p>
    </footer>
  </article>
</main>
`.trim();
};

export const renderFaqEntries = () =>
  FAQ_FALLBACKS.map((item) => ({ question: item.question, answer: item.answer }));

export const renderContactBody = (translate, lang, supportEmail) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const title = t('pages.contact.title', 'Contact Us');
  const back = t('pages.contact.back', 'Back to Tool');
  const intro = t(
    'pages.contact.intro',
    'We love hearing from the people who use txttohandwriting.org. Whether you have a feature request, a bug report, a partnership inquiry, or feedback about a specific blog post, this page is the fastest way to reach the team.'
  );
  const supportTitle = t('pages.contact.supportTitle', 'Support & Bug Reports');
  const supportDesc = t(
    'pages.contact.supportDesc',
    'For technical issues — broken downloads, font rendering problems, paper templates that fail to load — email us with the browser and operating system you are using. We respond to most messages within two business days.'
  );
  const businessTitle = t('pages.contact.businessTitle', 'Business & Partnership Inquiries');
  const businessDesc = t(
    'pages.contact.businessDesc',
    'For sponsorships, integrations, content collaborations, and licensing questions, please include the nature of your project and the audience or scale you are working with so we can route you to the right person.'
  );
  const editorialTitle = t('pages.contact.editorialTitle', 'Editorial & Guest Contributions');
  const editorialDesc = t(
    'pages.contact.editorialDesc',
    'Want to contribute a guest article on note-taking, calligraphy, or learning techniques? Send a short pitch with your background and a few topic ideas. We consider every submission.'
  );
  const responseTitle = t('pages.contact.responseTitle', 'Response Times');
  const responseDesc = t(
    'pages.contact.responseDesc',
    'Most emails receive a reply within 1–2 business days. Complex bug reports may take longer while we reproduce the issue. We do not use auto-responders or chatbots — every message is read by a human.'
  );
  const githubTitle = t('pages.contact.githubTitle', 'Public Issues');
  const githubDesc = t(
    'pages.contact.githubDesc',
    'For reproducible bugs and feature discussions you would like the community to see, you can also open a GitHub issue. Public issues are great for tracking — private email is better for confidential concerns.'
  );
  const emailLabel = t('pages.contact.emailLabel', 'Email us at');
  const subjectHelper = t(
    'pages.contact.subjectHelper',
    'Tip: include "[support]", "[business]", or "[editorial]" in your subject line so we can route your message faster.'
  );
  const escapedEmail = htmlEscape(supportEmail);

  return `
<main class="prerender-main">
  <article class="prerender-contact">
    <header>
      <p><a href="/" rel="nofollow">&larr; ${back}</a></p>
      <h1>${title}</h1>
      <p class="prerender-lead">${intro}</p>
    </header>
    <section class="prerender-contact-email">
      <p><strong>${emailLabel}:</strong> <a href="mailto:${escapedEmail}">${escapedEmail}</a></p>
      <p>${subjectHelper}</p>
    </section>
    <section>
      <h2>${supportTitle}</h2>
      <p>${supportDesc}</p>
    </section>
    <section>
      <h2>${businessTitle}</h2>
      <p>${businessDesc}</p>
    </section>
    <section>
      <h2>${editorialTitle}</h2>
      <p>${editorialDesc}</p>
    </section>
    <section>
      <h2>${responseTitle}</h2>
      <p>${responseDesc}</p>
    </section>
    <section>
      <h2>${githubTitle}</h2>
      <p>${githubDesc}</p>
    </section>
  </article>
</main>
`.trim();
};

export const renderChangelogBody = (translate, lang, entries) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const title = t('pages.changelog.title', 'Product Updates');
  const back = t('pages.changelog.back', 'Back to Tool');
  const description = t(
    'pages.changelog.description',
    'Stay informed about the latest improvements and features added to our platform.'
  );
  const moodLabel = t('pages.changelog.mood', 'Status');

  const entriesHtml = entries
    .map((entry) => {
      const versionKey = `v${entry.version.replace(/\./g, '-')}`;
      const tagline = t(`pages.changelog.entries.${versionKey}.tagline`, entry.tagline);
      const mood = t(`pages.changelog.entries.${versionKey}.mood`, entry.mood || '');
      const highlights = (entry.highlights || []).map((highlight, index) =>
        t(`pages.changelog.entries.${versionKey}.highlights.${index}`, highlight)
      );
      const date = htmlEscape(entry.date);
      const moodBlock = mood ? `<p class="prerender-mood"><strong>${moodLabel}:</strong> ${mood}</p>` : '';
      const highlightsBlock = highlights.length
        ? `<ul>${highlights.map((h) => `<li>${h}</li>`).join('')}</ul>`
        : '';
      return `<section class="prerender-changelog-entry" id="v${entry.version.replace(/\./g, '-')}"><h2>v${htmlEscape(entry.version)} <small>(${date})</small></h2><p>${tagline}</p>${moodBlock}${highlightsBlock}</section>`;
    })
    .join('');

  return `
<main class="prerender-main">
  <article class="prerender-changelog">
    <header>
      <p><a href="/" rel="nofollow">&larr; ${back}</a></p>
      <h1>${title}</h1>
      <p>${description}</p>
    </header>
    ${entriesHtml}
  </article>
</main>
`.trim();
};
