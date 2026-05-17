/**
 * IndexNow submitter.
 *
 * Pushes every canonical URL in public/sitemap.xml to the IndexNow API so
 * Bing, Yandex and participating engines (and, increasingly, Google's
 * discovery pipeline) re-crawl changed pages within minutes instead of days.
 *
 * Run AFTER the new build is live on production:
 *   SITE_URL=https://txttohandwriting.org node scripts/indexNow.js
 *
 * The public key file (public/<key>.txt) is deployed with the site so the
 * engines can verify ownership of the submitted host.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const INDEXNOW_KEY = '07c419ac5cd7b1f5ee717694aaf5465e';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10000;

const baseUrl = (process.env.SITE_URL || 'https://txttohandwriting.org').replace(/\/+$/, '');
const host = new URL(baseUrl).host;

const sitemapPath = path.join(repoRoot, 'public', 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error(`IndexNow: sitemap not found at ${sitemapPath}. Run "npm run generate:sitemap" first.`);
  process.exit(1);
}

const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const urlList = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g))
  .map((match) => match[1].trim())
  .filter((url, index, all) => url && all.indexOf(url) === index);

if (urlList.length === 0) {
  console.error('IndexNow: no <loc> URLs found in sitemap. Nothing to submit.');
  process.exit(1);
}

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const submit = async (urls) => {
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${baseUrl}/${INDEXNOW_KEY}.txt`,
    urlList: urls
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body)
  });

  // IndexNow returns 200 (accepted) or 202 (accepted, key validation pending).
  if (response.status === 200 || response.status === 202) {
    console.log(`IndexNow: submitted ${urls.length} URLs (HTTP ${response.status}).`);
    return;
  }

  const text = await response.text().catch(() => '');
  throw new Error(`IndexNow rejected the submission: HTTP ${response.status} ${text}`.trim());
};

try {
  for (const batch of chunk(urlList, MAX_URLS_PER_REQUEST)) {
    // eslint-disable-next-line no-await-in-loop
    await submit(batch);
  }
  console.log(`IndexNow: done. ${urlList.length} URLs pinged for ${host}.`);
} catch (error) {
  // Never fail a deploy because a third-party ping was unreachable.
  console.error(`IndexNow: submission failed (non-fatal): ${error.message}`);
  process.exit(0);
}
