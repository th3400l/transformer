import fs from 'node:fs';
import path from 'node:path';

export const parseBlogPosts = (repoRoot) => {
  const blogPath = path.join(repoRoot, 'services', 'blogPosts.ts');
  if (!fs.existsSync(blogPath)) {
    return [];
  }

  const source = fs.readFileSync(blogPath, 'utf8');
  const regex = /{\s*slug:\s*'([^']+)',\s*title:\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"),\s*date:\s*'([^']+)',\s*author:\s*'([^']+)',\s*content:\s*`([\s\S]*?)`\s*,?\s*}/g;
  const posts = [];
  let match;
  const unquote = (raw) => {
    const inner = raw.slice(1, -1);
    return raw.startsWith('"') ? inner.replace(/\\"/g, '"') : inner.replace(/\\'/g, "'");
  };
  while ((match = regex.exec(source)) !== null) {
    posts.push({
      slug: match[1],
      title: unquote(match[2]),
      date: match[3],
      author: match[4],
      content: match[5]
    });
  }
  return posts;
};

export const parseFaqEntries = (repoRoot) => {
  const constantsPath = path.join(repoRoot, 'app', 'constants.ts');
  if (!fs.existsSync(constantsPath)) {
    return [];
  }
  const source = fs.readFileSync(constantsPath, 'utf8');
  const blockMatch = source.match(/FAQ_ENTRIES:\s*FaqEntry\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (!blockMatch) {
    return [];
  }
  const block = blockMatch[1];
  const entryRegex = /question:\s*'([^']*(?:\\'[^']*)*)',\s*answer:\s*("[^"]*(?:\\"[^"]*)*"|'[^']*(?:\\'[^']*)*')/g;
  const entries = [];
  let match;
  while ((match = entryRegex.exec(block)) !== null) {
    const question = match[1].replace(/\\'/g, "'");
    let raw = match[2];
    if (raw.startsWith('"')) {
      raw = raw.slice(1, -1).replace(/\\"/g, '"');
    } else {
      raw = raw.slice(1, -1).replace(/\\'/g, "'");
    }
    entries.push({ question, answer: raw });
  }
  return entries;
};

export const parseChangelogEntries = (repoRoot) => {
  const constantsPath = path.join(repoRoot, 'app', 'constants.ts');
  if (!fs.existsSync(constantsPath)) {
    return [];
  }
  const source = fs.readFileSync(constantsPath, 'utf8');
  const blockMatch = source.match(/CHANGELOG_ENTRIES:\s*ChangelogEntry\[\]\s*=\s*\[([\s\S]*?)\n\];/);
  if (!blockMatch) {
    return [];
  }
  const block = blockMatch[1];
  const entryRegex = /\{\s*version:\s*'([^']+)',\s*date:\s*'([^']+)',\s*tagline:\s*'([^']+)',\s*highlights:\s*\[([\s\S]*?)\](?:,\s*mood:\s*'([^']+)')?(?:,\s*changeType:\s*'([^']+)')?\s*\}/g;
  const entries = [];
  let match;
  while ((match = entryRegex.exec(block)) !== null) {
    const highlights = Array.from(match[4].matchAll(/'((?:[^'\\]|\\.)*)'/g)).map((m) =>
      m[1].replace(/\\'/g, "'")
    );
    entries.push({
      version: match[1],
      date: match[2],
      tagline: match[3],
      highlights,
      mood: match[5] || undefined,
      changeType: match[6] || undefined
    });
  }
  return entries;
};
