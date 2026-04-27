import { htmlEscape, stripHtmlTags } from './util.js';

const formatDate = (dateString, locale) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(parsed);
  } catch {
    return dateString;
  }
};

export const renderBlogListBody = (translate, lang, locale, posts) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const title = t('pages.blog.title', 'Educational Insights');
  const back = t('blog.backToLab', 'Back to Tool');
  const readMore = t('blog.readMore', 'Read Full Article');
  const byLabel = t('blog.by', 'Author:');
  const description = t(
    'pages.blog.description',
    'Guides, inspiration, and tips for turning typed text into aesthetic handwriting for Studygram, planners, and assignments.'
  );

  const itemsHtml = posts
    .map((post) => {
      const localizedTitle = htmlEscape(
        translate(lang, `blogPosts.${post.slug}.title`, post.title)
      );
      const localizedContent = translate(
        lang,
        `blogPosts.${post.slug}.content`,
        post.content
      );
      const excerpt = htmlEscape(stripHtmlTags(localizedContent).slice(0, 220) + '…');
      const author = htmlEscape(post.author);
      const dateText = htmlEscape(formatDate(post.date, locale));
      const slug = htmlEscape(post.slug);
      return `<article class="prerender-blog-card"><h2><a href="/blog/${slug}">${localizedTitle}</a></h2><p class="prerender-meta"><time datetime="${htmlEscape(post.date)}">${dateText}</time> · <span>${byLabel} ${author}</span></p><p>${excerpt}</p><p><a href="/blog/${slug}">${readMore} &rarr;</a></p></article>`;
    })
    .join('');

  return `
<main class="prerender-main">
  <article class="prerender-blog-list">
    <header>
      <p><a href="/" rel="nofollow">&larr; ${back}</a></p>
      <h1>${title}</h1>
      <p>${description}</p>
    </header>
    ${itemsHtml}
  </article>
</main>
`.trim();
};

export const renderBlogPostBody = (translate, lang, locale, post) => {
  const t = (key, fallback) => htmlEscape(translate(lang, key, fallback));
  const back = t('blog.backToAll', 'All Posts');
  const byLabel = t('blog.by', 'Author:');
  const localizedTitle = htmlEscape(
    translate(lang, `blogPosts.${post.slug}.title`, post.title)
  );
  const localizedContent = translate(
    lang,
    `blogPosts.${post.slug}.content`,
    post.content
  );
  const author = htmlEscape(post.author);
  const dateText = htmlEscape(formatDate(post.date, locale));

  return `
<main class="prerender-main">
  <article class="prerender-blog-post">
    <header>
      <p><a href="/blog" rel="nofollow">&larr; ${back}</a></p>
      <h1>${localizedTitle}</h1>
      <p class="prerender-meta"><time datetime="${htmlEscape(post.date)}">${dateText}</time> · <span>${byLabel} ${author}</span></p>
    </header>
    <div class="prerender-blog-body">
      ${localizedContent}
    </div>
  </article>
</main>
`.trim();
};
