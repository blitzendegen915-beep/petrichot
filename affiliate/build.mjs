#!/usr/bin/env node
// affiliate/build.mjs
// Zero-dependency static site generator for the affiliate blog.
// Usage: node affiliate/build.mjs
// Reads affiliate/content/*.md and writes the full site into dist/.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const AFFILIATE_DIR = __dirname;
const CONTENT_DIR = path.join(AFFILIATE_DIR, "content");
const DIST_DIR = path.join(ROOT, "dist");

// ---------------------------------------------------------------------------
// Config / links
// ---------------------------------------------------------------------------

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[build] Could not read ${filePath}: ${err.message}`);
    return fallback;
  }
}

const CONFIG = readJson(path.join(AFFILIATE_DIR, "site.config.json"), {
  siteName: "AIツールナビ",
  baseUrl: "https://blitzendegen915-beep.github.io/petrichot",
  blogPath: "",
  author: "AIツールナビ編集部",
  description: "AIツールの比較・レビュー・活用術を毎日更新",
});

const LINKS = readJson(path.join(AFFILIATE_DIR, "links.json"), {});

const SITE_ROOT_URL = `${CONFIG.baseUrl}/`;
const BLOG_INDEX_URL = `${CONFIG.baseUrl}${CONFIG.blogPath}/`;
const BLOG_OUT_DIR = path.join(DIST_DIR, ...CONFIG.blogPath.split("/").filter(Boolean));

function articleUrl(slug) {
  return `${CONFIG.baseUrl}${CONFIG.blogPath}/${slug}/`;
}

const DISCLOSURE_TEXT =
  "※本記事にはプロモーション(アフィリエイト広告)が含まれています。";

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (YAML-lite, hand-rolled)
// ---------------------------------------------------------------------------

function stripQuotes(val) {
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseTags(raw) {
  if (raw === undefined || raw === null || raw === "") return [];
  const trimmed = String(raw).trim();
  if (trimmed.startsWith("[")) {
    try {
      const jsonish = trimmed.replace(/'/g, '"');
      const parsed = JSON.parse(jsonish);
      if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
    } catch (err) {
      // fall through to comma-list handling below
    }
    return trimmed
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((s) => stripQuotes(s.trim()))
      .filter(Boolean);
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: raw };
  }
  const [, yamlBlock, body] = match;
  const data = {};
  for (const line of yamlBlock.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    data[key] = val;
  }
  data.tags = parseTags(data.tags);
  return { data, body };
}

// ---------------------------------------------------------------------------
// Affiliate CTA rendering
// ---------------------------------------------------------------------------

function renderCta(id, standalone) {
  const link = LINKS[id];
  if (!link) {
    console.warn(`[build] Unknown affiliate id in {{aff:${id}}} — skipping.`);
    return "";
  }
  const href = link.url && link.url.trim() ? link.url : link.official;
  if (!href) {
    console.warn(`[build] Affiliate id "${id}" has no url or official fallback — skipping.`);
    return "";
  }
  const label = escapeHtml(link.label || id);
  const btn = `<a class="aff-btn" href="${escapeHtml(href)}" rel="sponsored nofollow noopener" target="_blank">${label}</a>`;
  return standalone ? `<div class="aff-cta">${btn}</div>` : btn;
}

const AFF_RE = /\{\{aff:([\w-]+)\}\}/g;
const AFF_STANDALONE_RE = /^\{\{aff:([\w-]+)\}\}$/;

// ---------------------------------------------------------------------------
// Minimal markdown renderer
// ---------------------------------------------------------------------------

function renderInline(escapedText) {
  let out = escapedText;
  // inline code
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, txt) => `<strong>${txt}</strong>`);
  // links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const external = /^https?:\/\//i.test(url);
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${url}"${rel}>${text}</a>`;
  });
  // affiliate placeholders embedded mid-paragraph
  out = out.replace(AFF_RE, (_m, id) => renderCta(id, false));
  return out;
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const htmlParts = [];
  let i = 0;

  function flushParagraph(buf) {
    if (!buf.length) return;
    const joined = buf.join("<br>");
    htmlParts.push(`<p>${renderInline(joined)}</p>`);
  }

  let paragraphBuf = [];

  function flush() {
    flushParagraph(paragraphBuf);
    paragraphBuf = [];
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // fenced code block
    if (trimmed.startsWith("```")) {
      flush();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      htmlParts.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    // standalone affiliate placeholder
    if (AFF_STANDALONE_RE.test(trimmed)) {
      flush();
      const id = trimmed.match(AFF_STANDALONE_RE)[1];
      htmlParts.push(renderCta(id, true));
      i++;
      continue;
    }

    // horizontal rule
    if (/^-{3,}$/.test(trimmed)) {
      flush();
      htmlParts.push("<hr>");
      i++;
      continue;
    }

    // headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${renderInline(escapeHtml(headingMatch[2]))}</h${level}>`);
      i++;
      continue;
    }

    // blockquote
    if (trimmed.startsWith("> ")) {
      flush();
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const inner = quoteLines.map((l) => renderInline(escapeHtml(l))).join("<br>");
      htmlParts.push(`<blockquote><p>${inner}</p></blockquote>`);
      continue;
    }

    // unordered list
    if (/^-\s+/.test(trimmed)) {
      flush();
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^-\s+/, ""));
        i++;
      }
      const li = items.map((it) => `<li>${renderInline(escapeHtml(it))}</li>`).join("");
      htmlParts.push(`<ul>${li}</ul>`);
      continue;
    }

    // ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      flush();
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      const li = items.map((it) => `<li>${renderInline(escapeHtml(it))}</li>`).join("");
      htmlParts.push(`<ol>${li}</ol>`);
      continue;
    }

    // blank line -> paragraph separator
    if (trimmed === "") {
      flush();
      i++;
      continue;
    }

    // plain paragraph line
    paragraphBuf.push(escapeHtml(line));
    i++;
  }

  flush();
  return htmlParts.join("\n");
}

// ---------------------------------------------------------------------------
// Content loading
// ---------------------------------------------------------------------------

function loadArticles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`[build] Content directory not found (${CONTENT_DIR}); building with 0 articles.`);
    return [];
  }
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .sort();

  if (files.length === 0) {
    console.warn(`[build] No markdown files found in ${CONTENT_DIR}; building with 0 articles.`);
  }

  const articles = [];
  const seenSlugs = new Set();

  for (const file of files) {
    const fullPath = path.join(CONTENT_DIR, file);
    let raw;
    try {
      raw = fs.readFileSync(fullPath, "utf8");
    } catch (err) {
      console.warn(`[build] Skipping ${file}: could not read file (${err.message})`);
      continue;
    }
    const { data, body } = parseFrontmatter(raw);

    if (!data.title || !data.slug) {
      console.warn(`[build] Skipping ${file}: missing required frontmatter (title/slug).`);
      continue;
    }
    if (seenSlugs.has(data.slug)) {
      console.warn(`[build] Skipping ${file}: duplicate slug "${data.slug}" (already used).`);
      continue;
    }
    seenSlugs.add(data.slug);

    articles.push({
      title: data.title,
      description: data.description || "",
      slug: data.slug,
      date: data.date || "1970-01-01",
      category: data.category || "AIツール",
      tags: data.tags || [],
      bodyHtml: renderMarkdown(body),
      sourceFile: file,
    });
  }

  articles.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return articles;
}

// ---------------------------------------------------------------------------
// HTML page shell (shared CSS, OGP, JSON-LD)
// ---------------------------------------------------------------------------

const SITE_CSS = `
:root {
  color-scheme: light dark;
  --bg: #f7f3ea;
  --surface: #ffffff;
  --surface-2: #efe8d8;
  --fg: #18140f;
  --muted: #6b6357;
  --accent: #ff4d23;
  --accent-fg: #17130d;
  --accent-soft: #ffe1d2;
  --edu: #0f8f72;
  --edu-fg: #ffffff;
  --edu-soft: #d7f2e9;
  --border: #e6dfcf;
  --code-bg: #efe7d6;
  --banner-bg: #fff1cf;
  --banner-fg: #6b4a00;
  --banner-border: #ecd79a;
  --header-bg: rgba(247, 243, 234, 0.86);
  --shadow: 0 10px 30px -12px rgba(24, 20, 15, 0.28);
  --measure: 68ch;
  --wide: 960px;
  --font-display: "Space Grotesk", "Zen Kaku Gothic New", "Noto Sans JP", sans-serif;
  --font-body: "Zen Kaku Gothic New", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0d0b;
    --surface: #17191a;
    --surface-2: #1f2221;
    --fg: #f2ede2;
    --muted: #a29a8b;
    --accent: #ff7a4a;
    --accent-fg: #0c0d0b;
    --accent-soft: #3a2015;
    --edu: #2fe3ac;
    --edu-fg: #06231a;
    --edu-soft: #123328;
    --border: #2a2c2a;
    --code-bg: #1c1e1d;
    --banner-bg: #2c2308;
    --banner-fg: #f2d886;
    --banner-border: #4c3d10;
    --header-bg: rgba(12, 13, 11, 0.82);
    --shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6);
  }
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  line-height: 1.9;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
::selection { background: var(--accent); color: #fff; }
a { color: var(--accent); }
a:focus-visible, button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 3px;
}
img { max-width: 100%; height: auto; display: block; }

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--header-bg);
  backdrop-filter: saturate(160%) blur(14px);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
  border-bottom: 1px solid var(--border);
  padding: 0.9rem 1.25rem;
}
.site-header .inner {
  max-width: var(--wide);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--fg);
  min-width: 0;
}
.brand-mark {
  flex-shrink: 0;
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--edu) 100%);
  transform: rotate(-8deg);
  box-shadow: var(--shadow);
}
.brand-text {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.18rem;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.site-header nav a {
  display: inline-block;
  text-decoration: none;
  color: var(--muted);
  margin-left: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.42rem 0.95rem;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}
.site-header nav a:hover,
.site-header nav a:focus-visible {
  color: var(--accent);
  border-color: var(--border);
  background: var(--surface);
}

.disclosure-banner {
  max-width: var(--wide);
  margin: 1rem auto 0;
  padding: 0.65rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: var(--banner-bg);
  color: var(--banner-fg);
  border: 1px solid var(--banner-border);
  border-radius: 10px;
  font-size: 0.82rem;
  line-height: 1.7;
}
.disclosure-badge {
  flex-shrink: 0;
  font-family: var(--font-display);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: var(--banner-fg);
  color: var(--banner-bg);
  margin-top: 0.1rem;
}

main {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
main.wide { max-width: var(--wide); }

h1 {
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 1.2rem + 1.4vw, 2.15rem);
  line-height: 1.45;
  font-weight: 700;
  letter-spacing: 0.005em;
  margin: 0.6rem 0 1.1rem;
}
article { counter-reset: h2count; }
h2 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.5;
  margin: 2.75rem 0 1.15rem;
  padding-left: 0.85rem;
  border-left: 4px solid var(--accent);
}
article h2::before {
  counter-increment: h2count;
  content: counter(h2count, decimal-leading-zero) " / ";
  color: var(--accent);
  opacity: 0.6;
  font-size: 0.75em;
  letter-spacing: 0.03em;
}
h3 {
  font-family: var(--font-display);
  font-size: 1.12rem;
  font-weight: 700;
  margin-top: 1.8rem;
}
p { margin: 0 0 1.15rem; }
ul, ol { margin: 0 0 1.2rem; padding-left: 1.5rem; }
li { margin-bottom: 0.5rem; }
ul > li::marker { color: var(--accent); }
ol > li::marker { color: var(--accent); font-family: var(--font-display); font-weight: 700; }
blockquote {
  position: relative;
  margin: 1.6rem 0;
  padding: 0.9rem 1.2rem 0.9rem 1.4rem;
  border-left: 4px solid var(--edu);
  color: var(--muted);
  background: var(--surface);
  border-radius: 0 10px 10px 0;
  font-style: italic;
}
blockquote p { margin: 0; }
code {
  background: var(--code-bg);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}
pre {
  background: var(--code-bg);
  padding: 1rem;
  border-radius: 10px;
  overflow-x: auto;
}
pre code { background: none; padding: 0; }
hr { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  line-height: 1.4;
  white-space: nowrap;
}
.chip-tag { background: var(--surface-2); color: var(--muted); }
.chip-cat { font-weight: 700; }
.chip-edu { background: var(--edu-soft); color: var(--edu); }
.chip-a { background: #dff0ff; color: #0b5e8c; }
.chip-b { background: #fff0cf; color: #7a5400; }
.chip-c { background: #ffe1e6; color: #a3213f; }
.chip-d { background: #e6efd2; color: #4c6a1f; }
.chip-e { background: #f0ded0; color: #7a4420; }
@media (prefers-color-scheme: dark) {
  .chip-a { background: #10314a; color: #7ecbff; }
  .chip-b { background: #3a2c05; color: #ffd873; }
  .chip-c { background: #3a1420; color: #ff9db3; }
  .chip-d { background: #26310f; color: #b7d67f; }
  .chip-e { background: #3a2818; color: #e3b98a; }
}

.article-meta {
  color: var(--muted);
  font-size: 0.85rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.article-meta time { font-family: var(--font-display); font-weight: 600; }

.aff-cta {
  margin: 2rem 0;
  text-align: center;
}
.aff-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: var(--accent);
  color: var(--accent-fg) !important;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.02rem;
  letter-spacing: 0.01em;
  text-decoration: none;
  padding: 1rem 2.25rem;
  border-radius: 999px;
  box-shadow: var(--shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}
.aff-btn::after { content: "\\2192"; transition: transform 0.18s ease; }
.aff-btn:hover, .aff-btn:focus-visible {
  transform: translateY(-3px);
  filter: brightness(1.05);
  box-shadow: 0 18px 34px -14px var(--accent);
}
.aff-btn:hover::after { transform: translateX(3px); }
.aff-btn:active { transform: translateY(-1px); }

.article-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
@media (min-width: 700px) {
  .article-grid { grid-template-columns: 1fr 1fr; }
}
.article-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  overflow: hidden;
}
.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: var(--accent);
}
.article-card .card-link {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.35rem 1.4rem 1.5rem;
  text-decoration: none;
  color: var(--fg);
  height: 100%;
}
.article-card .card-top {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}
.article-card .card-date {
  font-family: var(--font-display);
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 600;
}
.article-card h2 {
  font-size: 1.15rem;
  border: none;
  padding: 0;
  margin: 0.2rem 0 0;
  line-height: 1.55;
}
.article-card h2::before { content: none; }
.article-card .desc {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.75;
  margin: 0;
}
.empty-state {
  grid-column: 1 / -1;
  color: var(--muted);
  padding: 2rem 0;
}

.site-footer {
  border-top: 1px solid var(--border);
  margin-top: 4rem;
  padding: 2rem 1.25rem;
  color: var(--muted);
  font-size: 0.78rem;
}
.site-footer .inner { max-width: var(--wide); margin: 0 auto; }
.site-footer p { margin: 0.35rem 0; }
.site-footer .footer-disclosure {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--fg);
}
`;

const CATEGORY_CHIP_PALETTE = ["chip-a", "chip-b", "chip-c", "chip-d", "chip-e"];

function categoryChipClass(category) {
  if (category === "AIをはじめて学ぶ") return "chip-edu";
  let hash = 0;
  for (let i = 0; i < String(category).length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_CHIP_PALETTE[hash % CATEGORY_CHIP_PALETTE.length];
}

function pageShell({ title, description, canonical, ogType = "article", bodyHtml, jsonLd, showDisclosure = true }) {
  const fullTitle = `${title} | ${CONFIG.siteName}`;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${escapeHtml(CONFIG.siteName)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>${SITE_CSS}</style>
</head>
<body>
<header class="site-header">
  <div class="inner">
    <a class="brand" href="${BLOG_INDEX_URL}">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-text">${escapeHtml(CONFIG.siteName)}</span>
    </a>
    <nav>
      <a href="${BLOG_INDEX_URL}">記事一覧</a>
    </nav>
  </div>
</header>
${showDisclosure ? `<div class="disclosure-banner"><span class="disclosure-badge">PR</span><span>${DISCLOSURE_TEXT}</span></div>` : ""}
${bodyHtml}
<footer class="site-footer">
  <div class="inner">
    ${showDisclosure ? `<p class="footer-disclosure"><span class="disclosure-badge">PR</span><span>${DISCLOSURE_TEXT}</span></p>` : ""}
    <p>本サイトの情報は正確性に努めていますが、内容を保証するものではありません。掲載の商品・サービスの詳細は必ず公式サイトでご確認ください。</p>
    <p>&copy; ${new Date().getFullYear()} ${escapeHtml(CONFIG.siteName)}</p>
  </div>
</footer>
</body>
</html>
`;
}

function formatDateJa(dateStr) {
  return dateStr;
}

function renderArticlePage(article) {
  const url = articleUrl(article.slug);
  const tagsHtml = article.tags.length
    ? article.tags.map((t) => `<span class="chip chip-tag">${escapeHtml(t)}</span>`).join("")
    : "";
  const body = `
<main>
  <article>
    <h1>${escapeHtml(article.title)}</h1>
    <div class="article-meta">
      <time datetime="${escapeHtml(article.date)}">${escapeHtml(formatDateJa(article.date))}</time>
      <span class="chip chip-cat ${categoryChipClass(article.category)}">${escapeHtml(article.category)}</span>
      ${tagsHtml}
    </div>
    ${article.bodyHtml}
  </article>
</main>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { "@type": "Organization", name: CONFIG.author },
    publisher: { "@type": "Organization", name: CONFIG.siteName },
    mainEntityOfPage: url,
  };

  return pageShell({
    title: article.title,
    description: article.description,
    canonical: url,
    ogType: "article",
    bodyHtml: body,
    jsonLd,
    showDisclosure: article.bodyHtml.includes("aff-btn"),
  });
}

function renderBlogIndex(articles) {
  const items = articles.length
    ? articles
        .map(
          (a) => `<li class="article-card">
        <a class="card-link" href="${articleUrl(a.slug)}">
          <div class="card-top">
            <span class="chip chip-cat ${categoryChipClass(a.category)}">${escapeHtml(a.category)}</span>
            <time class="card-date" datetime="${escapeHtml(a.date)}">${escapeHtml(a.date)}</time>
          </div>
          <h2>${escapeHtml(a.title)}</h2>
          <p class="desc">${escapeHtml(a.description)}</p>
        </a>
      </li>`
        )
        .join("\n")
    : `<li class="empty-state">まだ記事がありません。近日公開予定です。</li>`;

  const body = `
<main class="wide">
  <h1>記事一覧</h1>
  <ul class="article-grid">
    ${items}
  </ul>
</main>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: CONFIG.siteName,
    url: BLOG_INDEX_URL,
    description: CONFIG.description,
  };

  return pageShell({
    title: "記事一覧",
    description: CONFIG.description,
    canonical: BLOG_INDEX_URL,
    ogType: "website",
    bodyHtml: body,
    jsonLd,
  });
}

// ---------------------------------------------------------------------------
// RSS / sitemap / robots
// ---------------------------------------------------------------------------

function toRfc822(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderFeed(articles) {
  const items = articles
    .map(
      (a) => `  <item>
    <title>${xmlEscape(a.title)}</title>
    <link>${xmlEscape(articleUrl(a.slug))}</link>
    <guid isPermaLink="true">${xmlEscape(articleUrl(a.slug))}</guid>
    <pubDate>${toRfc822(a.date)}</pubDate>
    <description>${xmlEscape(a.description)}</description>
    <category>${xmlEscape(a.category)}</category>
  </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${xmlEscape(CONFIG.siteName)}</title>
  <link>${xmlEscape(BLOG_INDEX_URL)}</link>
  <description>${xmlEscape(CONFIG.description)}</description>
  <language>ja</language>
${items}
</channel>
</rss>
`;
}

function renderSitemap(articles) {
  const urls = [
    { loc: SITE_ROOT_URL },
    ...(BLOG_INDEX_URL !== SITE_ROOT_URL ? [{ loc: BLOG_INDEX_URL }] : []),
    ...articles.map((a) => ({ loc: articleUrl(a.slug), lastmod: a.date })),
  ];
  const entries = urls
    .map((u) => {
      const lastmod = u.lastmod ? `\n    <lastmod>${xmlEscape(u.lastmod)}</lastmod>` : "";
      return `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${CONFIG.baseUrl}/sitemap.xml
`;
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

function build() {
  rmrf(DIST_DIR);
  ensureDir(DIST_DIR);

  const articles = loadArticles();

  for (const article of articles) {
    const outPath = path.join(BLOG_OUT_DIR, article.slug, "index.html");
    writeFile(outPath, renderArticlePage(article));
  }

  writeFile(path.join(BLOG_OUT_DIR, "index.html"), renderBlogIndex(articles));
  writeFile(path.join(BLOG_OUT_DIR, "feed.xml"), renderFeed(articles));
  writeFile(path.join(DIST_DIR, "sitemap.xml"), renderSitemap(articles));
  writeFile(path.join(DIST_DIR, "robots.txt"), renderRobots());

  console.log(`[build] Done. ${articles.length} article(s) built. Output: ${DIST_DIR}`);
}

build();
