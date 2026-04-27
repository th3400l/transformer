import { htmlEscape } from './util.js';

const PRIVACY_FALLBACKS = {
  intro:
    'At txttohandwriting.org, user privacy is paramount. This policy describes how we protect your data through local browser processing.',
  dataCollectionTitle: '1. Data Collection',
  dataCollectionContent:
    'We do not collect, store, or transmit the text you input. All generation occurs locally on your device.',
  localProcessingTitle: '2. Client-Side Security',
  localProcessingContent:
    'Our platform utilizes client-side JavaScript for all rendering, ensuring your personal documents remain secure and private.',
  cookiesTitle: '3. Cookies & Advertising',
  cookiesContent:
    "We use Google AdSense to serve ads. AdSense uses cookies to serve ads based on your visits to this and other websites. You may opt out of personalized advertising by visiting Google's Ad Settings.",
  analyticsTitle: '4. Analytics',
  analyticsContent:
    'We use anonymized analytics to monitor site performance and improve user experience. No personally identifiable information is collected.',
  advertisingTitle: '5. Advertising',
  advertisingContent:
    'Our service is supported by advertising. We use third-party advertising networks, including Google AdSense, that may use cookies and similar technologies to deliver advertisements relevant to you. These networks may collect information about your visits to this and other websites in order to provide advertisements about goods and services of interest. You can opt out of personalized advertising by visiting Google\'s Ad Settings or by managing the privacy preferences offered by your browser.',
  rightsTitle: '6. Your Rights',
  rightsContent:
    'You can control cookies, opt out of personalized advertising, and clear local storage at any time through your browser settings. Because we do not collect personal data on our servers, there is no account to delete. If you have used our cookie consent banner to accept analytics or advertising cookies, you can revisit it at any time to change your choice.',
  contactTitle: '7. Contact Information',
  contactContent:
    'For privacy-related questions, reach the team at nsa.tools@proton.me. We respond to most messages within two business days.',
  supportHeadline: 'Your Privacy Matters',
  supportDesc:
    'We are committed to maintaining the highest standards of data protection.'
};

const TERMS_FALLBACKS = {
  welcome:
    'By using txttohandwriting.org, you agree to comply with the following terms and conditions. If you do not agree, please discontinue use of the service.',
  section1Title: '1. Service Provision',
  section1Content:
    'The service is provided "as is" without warranties of any kind. We reserve the right to modify or discontinue features without notice.',
  section2Title: '2. User Conduct',
  section2Content:
    'Users are responsible for the legality of the content they convert. Use for deceptive or illegal purposes is strictly prohibited.',
  section3Title: '3. Intellectual Property',
  section3Content:
    'Users retain ownership of their input text. All original software, branding, and proprietary assets remain the property of txttohandwriting.org.',
  section4Title: '4. Privacy & Ads',
  section4Content:
    'We use Google AdSense to serve advertisements. These services may use cookies to provide relevant content. Please refer to our Privacy Policy for details.',
  supportHeadline: 'Legal Inquiries',
  supportDesc: 'For questions regarding our terms, please contact our legal team.'
};

export const renderPrivacyBody = (translate, lang) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const title = t('pages.privacy.title', 'Privacy Policy');
  const back = t('pages.privacy.back', 'Back to Tool');
  const lastUpdatedLabel = t('pages.privacy.lastUpdated', 'Last updated');
  const intro = t('pages.privacy.intro', PRIVACY_FALLBACKS.intro);

  const sections = [
    { titleKey: 'pages.privacy.dataCollectionTitle', contentKey: 'pages.privacy.dataCollectionContent', titleFallback: PRIVACY_FALLBACKS.dataCollectionTitle, contentFallback: PRIVACY_FALLBACKS.dataCollectionContent },
    { titleKey: 'pages.privacy.localProcessingTitle', contentKey: 'pages.privacy.localProcessingContent', titleFallback: PRIVACY_FALLBACKS.localProcessingTitle, contentFallback: PRIVACY_FALLBACKS.localProcessingContent },
    { titleKey: 'pages.privacy.cookiesTitle', contentKey: 'pages.privacy.cookiesContent', titleFallback: PRIVACY_FALLBACKS.cookiesTitle, contentFallback: PRIVACY_FALLBACKS.cookiesContent },
    { titleKey: 'pages.privacy.analyticsTitle', contentKey: 'pages.privacy.analyticsContent', titleFallback: PRIVACY_FALLBACKS.analyticsTitle, contentFallback: PRIVACY_FALLBACKS.analyticsContent },
    { titleKey: 'pages.privacy.advertisingTitle', contentKey: 'pages.privacy.advertisingContent', titleFallback: PRIVACY_FALLBACKS.advertisingTitle, contentFallback: PRIVACY_FALLBACKS.advertisingContent },
    { titleKey: 'pages.privacy.rightsTitle', contentKey: 'pages.privacy.rightsContent', titleFallback: PRIVACY_FALLBACKS.rightsTitle, contentFallback: PRIVACY_FALLBACKS.rightsContent },
    { titleKey: 'pages.privacy.contactTitle', contentKey: 'pages.privacy.contactContent', titleFallback: PRIVACY_FALLBACKS.contactTitle, contentFallback: PRIVACY_FALLBACKS.contactContent }
  ];

  const sectionsHtml = sections
    .map((section) => {
      const sectionTitle = t(section.titleKey, section.titleFallback);
      const sectionContent = t(section.contentKey, section.contentFallback);
      return `<section><h2>${sectionTitle}</h2><p>${sectionContent}</p></section>`;
    })
    .join('');

  const supportHeadline = t('pages.privacy.supportHeadline', PRIVACY_FALLBACKS.supportHeadline);
  const supportDesc = t('pages.privacy.supportDesc', PRIVACY_FALLBACKS.supportDesc);
  const lastUpdated = '2026-04-01';

  return `
<main class="prerender-main">
  <article class="prerender-legal">
    <header>
      <p><a href="/" rel="nofollow">&larr; ${back}</a></p>
      <h1>${title}</h1>
      <p class="prerender-meta"><strong>${lastUpdatedLabel}:</strong> ${lastUpdated}</p>
      <p>${intro}</p>
    </header>
    ${sectionsHtml}
    <footer>
      <h2>${supportHeadline}</h2>
      <p>${supportDesc}</p>
    </footer>
  </article>
</main>
`.trim();
};

export const renderTermsBody = (translate, lang) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const title = t('pages.terms.title', 'Terms of Service');
  const back = t('pages.terms.back', 'Back to Tool');
  const lastUpdatedLabel = t('pages.terms.lastUpdated', 'Last updated');
  const welcome = t('pages.terms.welcome', TERMS_FALLBACKS.welcome);

  const sections = [
    { titleKey: 'pages.terms.section1Title', contentKey: 'pages.terms.section1Content', titleFallback: TERMS_FALLBACKS.section1Title, contentFallback: TERMS_FALLBACKS.section1Content },
    { titleKey: 'pages.terms.section2Title', contentKey: 'pages.terms.section2Content', titleFallback: TERMS_FALLBACKS.section2Title, contentFallback: TERMS_FALLBACKS.section2Content },
    { titleKey: 'pages.terms.section3Title', contentKey: 'pages.terms.section3Content', titleFallback: TERMS_FALLBACKS.section3Title, contentFallback: TERMS_FALLBACKS.section3Content },
    { titleKey: 'pages.terms.section4Title', contentKey: 'pages.terms.section4Content', titleFallback: TERMS_FALLBACKS.section4Title, contentFallback: TERMS_FALLBACKS.section4Content }
  ];

  const sectionsHtml = sections
    .map((section) => {
      const sectionTitle = t(section.titleKey, section.titleFallback);
      const sectionContent = t(section.contentKey, section.contentFallback);
      return `<section><h2>${sectionTitle}</h2><p>${sectionContent}</p></section>`;
    })
    .join('');

  const supportHeadline = t('pages.terms.supportHeadline', TERMS_FALLBACKS.supportHeadline);
  const supportDesc = t('pages.terms.supportDesc', TERMS_FALLBACKS.supportDesc);
  const lastUpdated = '2026-04-01';

  return `
<main class="prerender-main">
  <article class="prerender-legal">
    <header>
      <p><a href="/" rel="nofollow">&larr; ${back}</a></p>
      <h1>${title}</h1>
      <p class="prerender-meta"><strong>${lastUpdatedLabel}:</strong> ${lastUpdated}</p>
      <p>${welcome}</p>
    </header>
    ${sectionsHtml}
    <footer>
      <h2>${supportHeadline}</h2>
      <p>${supportDesc}</p>
    </footer>
  </article>
</main>
`.trim();
};
