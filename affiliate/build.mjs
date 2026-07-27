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
const STATIC_DIR = path.join(AFFILIATE_DIR, "static");
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
  siteName: "AIツールの透視図",
  baseUrl: "https://blitzendegen915-beep.github.io/petrichot",
  blogPath: "",
  author: "AIツールの透視図編集部",
  description: "AIツールの比較・レビュー・活用術を毎日更新",
});

const LINKS = readJson(path.join(AFFILIATE_DIR, "links.json"), {});

const SITE_ROOT_URL = `${CONFIG.baseUrl}/`;
const BLOG_INDEX_URL = `${CONFIG.baseUrl}${CONFIG.blogPath}/`;
const BLOG_OUT_DIR = path.join(DIST_DIR, ...CONFIG.blogPath.split("/").filter(Boolean));

function articleUrl(slug) {
  return `${CONFIG.baseUrl}${CONFIG.blogPath}/${slug}/`;
}

function tagUrl(tag) {
  return `${CONFIG.baseUrl}${CONFIG.blogPath}/tag/${encodeURIComponent(tag)}/`;
}

function categoryUrl(category) {
  return `${CONFIG.baseUrl}${CONFIG.blogPath}/category/${encodeURIComponent(category)}/`;
}

// If affiliate/static/ogp.png exists it is copied to dist/static/ogp.png and
// referenced as the default OGP image site-wide; otherwise pages fall back
// to the previous (image-less) meta behavior.
const HAS_OGP_IMAGE = fs.existsSync(path.join(STATIC_DIR, "ogp.png"));
const OGP_IMAGE_URL = HAS_OGP_IMAGE ? `${CONFIG.baseUrl}/static/ogp.png` : null;

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

// 記事内リンクは絶対URLで書かれているため、ホスト名で自サイトかどうかを判定する。
// 自サイトなら target="_blank" を付けない（同じタブで回遊できるようにする）。
const SITE_HOST = (() => {
  try {
    return new URL(CONFIG.baseUrl).host;
  } catch {
    return "";
  }
})();

function isExternalUrl(url) {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    return new URL(url).host !== SITE_HOST;
  } catch {
    return true;
  }
}

function renderInline(escapedText) {
  let out = escapedText;
  // inline code
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, txt) => `<strong>${txt}</strong>`);
  // links（自サイトへのリンクは同じタブで開く）
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const rel = isExternalUrl(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${url}"${rel}>${text}</a>`;
  });
  // affiliate placeholders embedded mid-paragraph
  out = out.replace(AFF_RE, (_m, id) => renderCta(id, false));
  return out;
}

// ```svg ブロックは図としてそのまま出力する。エスケープを外す唯一の経路なので、
// 使えるタグを図形要素だけに絞り、スクリプト実行につながる書き方はビルドを止める。
const SVG_ALLOWED_TAGS = new Set([
  "svg", "g", "defs", "title", "desc", "path", "rect", "circle", "ellipse",
  "line", "polyline", "polygon", "text", "tspan", "marker", "linearGradient",
  "radialGradient", "stop", "use", "symbol", "clipPath", "mask",
]);

function assertSafeSvg(svg) {
  if (!/^\s*<svg[\s>]/.test(svg)) {
    throw new Error("svgブロックは <svg> で始める必要があります");
  }
  if (/<\s*script/i.test(svg)) {
    throw new Error("svgブロックに <script> は書けません");
  }
  if (/\son[a-zA-Z]+\s*=/.test(svg)) {
    throw new Error("svgブロックにイベントハンドラ属性(onclick等)は書けません");
  }
  if (/javascript\s*:/i.test(svg)) {
    throw new Error("svgブロックに javascript: URL は書けません");
  }
  for (const m of svg.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9:_-]*)/g)) {
    if (!SVG_ALLOWED_TAGS.has(m[1])) {
      throw new Error(`svgブロックで使えないタグです: <${m[1]}>`);
    }
  }
}

function renderFigure(svg, caption) {
  assertSafeSvg(svg);
  const cap = caption
    ? `<figcaption>${renderInline(escapeHtml(caption))}</figcaption>`
    : "";
  return `<figure class="diagram">${svg}${cap}</figure>`;
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

    // fenced code block（```svg は図として出力）
    if (trimmed.startsWith("```")) {
      flush();
      const info = trimmed.slice(3).trim();
      const lang = info.split(/\s+/)[0].toLowerCase();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const rawBlock = codeLines.join("\n");
      if (lang === "svg") {
        htmlParts.push(renderFigure(rawBlock, info.slice(3).trim()));
        continue;
      }
      htmlParts.push(`<pre><code>${escapeHtml(rawBlock)}</code></pre>`);
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

    // GFM table: header row + separator row
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1].trim()) &&
      lines[i + 1].includes("-")
    ) {
      flush();
      const splitRow = (row) => {
        let cells = row.trim().split("|").map((c) => c.trim());
        if (cells.length && cells[0] === "") cells = cells.slice(1);
        if (cells.length && cells[cells.length - 1] === "") cells = cells.slice(0, -1);
        return cells;
      };
      const headers = splitRow(lines[i]);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const th = headers.map((h) => `<th>${renderInline(escapeHtml(h))}</th>`).join("");
      const trs = rows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(escapeHtml(c))}</td>`).join("")}</tr>`)
        .join("");
      htmlParts.push(
        `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`
      );
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
      const level = Math.max(headingMatch[1].length, 2); // body h1 demoted: page h1 is the frontmatter title
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
// Sources / references section styling
// ---------------------------------------------------------------------------
// Detects an "## 参考リンク" heading in the rendered article HTML and wraps
// that section (heading + everything after it) in <section class="sources">
// so it can be styled distinctly (smaller type, top border, external-link
// affordance). A small post-processing step on already-rendered HTML rather
// than a markdown-parser change, since the section is just a normal h2 + list.

function wrapSourcesSection(html) {
  const headingRe = /<h2>[\s\S]*?<\/h2>/g;
  let match;
  let sourcesStart = -1;
  while ((match = headingRe.exec(html))) {
    if (match[0].includes("参考リンク")) {
      sourcesStart = match.index;
      break;
    }
  }
  if (sourcesStart === -1) return html;
  const before = html.slice(0, sourcesStart);
  const after = html.slice(sourcesStart);
  return `${before}<section class="sources">\n${after}\n</section>`;
}

// ---------------------------------------------------------------------------
// Per-article generated eyecatch (inline SVG, deterministic, zero assets)
// ---------------------------------------------------------------------------
// Every article gets a decorative abstract SVG derived from its slug (seeds
// the geometry so each article looks different) and category (drives the
// color scheme, reusing the same hue families as categoryChipClass so it
// stays on-brand). Colors are emitted as CSS custom properties so the same
// markup adapts correctly to light/dark automatically. No runtime JS.

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const EYECATCH_PALETTE = {
  "chip-edu": { main: "var(--eye-edu)", soft: "var(--eye-edu-soft)" },
  "chip-a": { main: "var(--eye-a)", soft: "var(--eye-a-soft)" },
  "chip-b": { main: "var(--eye-b)", soft: "var(--eye-b-soft)" },
  "chip-c": { main: "var(--eye-c)", soft: "var(--eye-c-soft)" },
  "chip-d": { main: "var(--eye-d)", soft: "var(--eye-d-soft)" },
  "chip-e": { main: "var(--eye-e)", soft: "var(--eye-e-soft)" },
};

function eyecatchPalette(category) {
  const cls = categoryChipClass(category);
  return EYECATCH_PALETTE[cls] || { main: "var(--accent)", soft: "var(--accent-soft)" };
}

function generateEyecatch(slug, category) {
  const rand = mulberry32(hashStr(slug));
  const { main, soft } = eyecatchPalette(category);
  const W = 600;
  const H = 200;
  const shapes = [`<rect width="${W}" height="${H}" fill="${soft}"/>`];
  const variant = Math.floor(rand() * 4);

  if (variant === 0) {
    // Layered translucent circles.
    const n = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const cx = (rand() * W).toFixed(1);
      const cy = (rand() * H).toFixed(1);
      const r = (30 + rand() * 90).toFixed(1);
      const op = (0.12 + rand() * 0.22).toFixed(2);
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${main}" fill-opacity="${op}"/>`);
    }
  } else if (variant === 1) {
    // Diagonal stripes plus a faint ring accent.
    const n = 5 + Math.floor(rand() * 5);
    for (let i = 0; i < n; i++) {
      const x = (-100 + (i * (W + 200)) / n + rand() * 30).toFixed(1);
      const op = (0.08 + rand() * 0.18).toFixed(2);
      const sw = (6 + rand() * 18).toFixed(1);
      shapes.push(
        `<line x1="${x}" y1="-20" x2="${(Number(x) + 160).toFixed(1)}" y2="${H + 20}" stroke="${main}" stroke-width="${sw}" stroke-opacity="${op}"/>`
      );
    }
    const r = (70 + rand() * 60).toFixed(1);
    const cx = (rand() * W).toFixed(1);
    const cy = (rand() * H).toFixed(1);
    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${main}" stroke-width="3" stroke-opacity="0.35"/>`);
  } else if (variant === 2) {
    // Scattered dot grid plus a large soft ring.
    const cols = 8;
    const rows = 4;
    const gap = W / cols;
    for (let cxi = 0; cxi < cols; cxi++) {
      for (let ryi = 0; ryi < rows; ryi++) {
        if (rand() > 0.55) continue;
        const cx = (gap * cxi + gap / 2 + (rand() - 0.5) * 10).toFixed(1);
        const cy = ((H / rows) * ryi + H / rows / 2 + (rand() - 0.5) * 10).toFixed(1);
        const r = (3 + rand() * 5).toFixed(1);
        shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${main}" fill-opacity="0.4"/>`);
      }
    }
    const r = (60 + rand() * 50).toFixed(1);
    shapes.push(
      `<circle cx="${(W * 0.78).toFixed(1)}" cy="${(H * 0.5).toFixed(1)}" r="${r}" fill="none" stroke="${main}" stroke-width="10" stroke-opacity="0.18"/>`
    );
  } else {
    // Concentric arcs.
    const cx = (rand() * W).toFixed(1);
    const cy = (H / 2 + (rand() - 0.5) * 40).toFixed(1);
    const n = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const r = (20 + i * (18 + rand() * 10)).toFixed(1);
      const op = Math.max(0.08, 0.35 - i * 0.05).toFixed(2);
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${main}" stroke-width="2.5" stroke-opacity="${op}"/>`);
    }
  }

  // Occasional large decorative "AI" glyph tucked in a corner.
  if (rand() > 0.4) {
    const rightAligned = rand() > 0.5;
    const gx = rightAligned ? W - 34 : 34;
    const anchor = rightAligned ? "end" : "start";
    shapes.push(
      `<text x="${gx}" y="${H - 26}" text-anchor="${anchor}" font-family="'Space Grotesk','Zen Kaku Gothic New',sans-serif" font-weight="700" font-size="86" fill="${main}" fill-opacity="0.10">AI</text>`
    );
  }

  return `<svg class="eyecatch-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${shapes.join(
    ""
  )}</svg>`;
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
    const { data, body: rawBody } = parseFrontmatter(raw);
    const body = rawBody.replace(/^\s*# [^\n]*\r?\n/, "");

    if (!data.title || !data.slug) {
      console.warn(`[build] Skipping ${file}: missing required frontmatter (title/slug).`);
      continue;
    }
    if (seenSlugs.has(data.slug)) {
      console.warn(`[build] Skipping ${file}: duplicate slug "${data.slug}" (already used).`);
      continue;
    }
    seenSlugs.add(data.slug);

    const category = data.category || "AIツール";
    articles.push({
      title: data.title,
      description: data.description || "",
      slug: data.slug,
      date: data.date || "1970-01-01",
      // 記事を書き直したときだけ frontmatter に updated: を足す。
      // sitemap の lastmod と JSON-LD の dateModified に使う。
      updated: /^\d{4}-\d{2}-\d{2}$/.test(data.updated || "") ? data.updated : "",
      category,
      tags: data.tags || [],
      bodyHtml: wrapSourcesSection(renderMarkdown(body)),
      eyecatchSvg: generateEyecatch(data.slug, category),
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
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-2: #f0f1f3;
  --fg: #111318;
  --muted: #5f646e;
  --accent: #1a5ce5;
  --accent-fg: #ffffff;
  --accent-soft: #e9f0ff;
  --deep: #10287d;
  --deep-2: #1b3fbf;
  --edu: #1a5ce5;
  --edu-fg: #ffffff;
  --edu-soft: #e9f0ff;
  --border: #e1e3e8;
  --code-bg: #f4f5f7;
  --banner-bg: #f6f7f9;
  --banner-fg: #4a4f58;
  --banner-border: #e1e3e8;
  --header-bg: rgba(255, 255, 255, 0.9);
  --shadow: 0 12px 34px -18px rgba(17, 19, 24, 0.35);
  --r: 4px;
  --measure: 68ch;
  --wide: 960px;
  --eye-edu: var(--edu);
  --eye-edu-soft: var(--edu-soft);
  --eye-a: #1a5ce5;
  --eye-a-soft: #e9f0ff;
  --eye-b: #10287d;
  --eye-b-soft: #e3eaff;
  --eye-c: #3f77ff;
  --eye-c-soft: #eef3ff;
  --eye-d: #0d3fa8;
  --eye-d-soft: #e6edff;
  --eye-e: #5b8fff;
  --eye-e-soft: #f1f5ff;
  --font-display: "Space Grotesk", "Zen Kaku Gothic New", "Noto Sans JP", sans-serif;
  --font-body: "Zen Kaku Gothic New", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b0c0f;
    --surface: #13151a;
    --surface-2: #1a1d24;
    --fg: #f1f2f5;
    --muted: #99a0ac;
    --accent: #5b8fff;
    --accent-fg: #08132e;
    --accent-soft: #16244a;
    --deep: #0d1c4d;
    --deep-2: #16307f;
    --edu: #5b8fff;
    --edu-fg: #08132e;
    --edu-soft: #16244a;
    --border: #262a33;
    --code-bg: #171a20;
    --banner-bg: #14171d;
    --banner-fg: #99a0ac;
    --banner-border: #262a33;
    --header-bg: rgba(11, 12, 15, 0.88);
    --shadow: 0 12px 34px -14px rgba(0, 0, 0, 0.7);
    --eye-a: #5b8fff;
    --eye-a-soft: #16244a;
    --eye-b: #7aa5ff;
    --eye-b-soft: #101c3a;
    --eye-c: #4d86ff;
    --eye-c-soft: #14224a;
    --eye-d: #8fb4ff;
    --eye-d-soft: #0f1a35;
    --eye-e: #6d9bff;
    --eye-e-soft: #131f42;
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
  border-radius: 2px;
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
  border-radius: var(--r);
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
  border-radius: var(--r);
  border: 1px solid transparent;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}
.site-header nav a:hover,
.site-header nav a:focus-visible {
  color: var(--accent);
  border-color: var(--border);
  background: var(--surface);
}

.cat-nav {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.cat-nav .inner {
  max-width: var(--wide);
  margin: 0 auto;
  padding: 0.55rem 1.25rem;
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.cat-nav .inner::-webkit-scrollbar { display: none; }
.nav-cat {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4em;
  flex-shrink: 0;
  padding: 0.4rem 0.85rem;
  border-radius: var(--r);
  font-size: 0.83rem;
  font-weight: 600;
  color: var(--muted);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.nav-cat:hover { background: var(--surface-2); color: var(--fg); }
.nav-cat.is-active { background: var(--fg); color: var(--bg); }
.nav-cat-n {
  font-family: var(--font-display);
  font-size: 0.7rem;
  opacity: 0.6;
}

.disclosure-bar {
  background: var(--banner-bg);
  color: var(--banner-fg);
  border-bottom: 1px solid var(--banner-border);
}
.disclosure-bar .inner {
  max-width: var(--wide);
  margin: 0 auto;
  padding: 0.45rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.76rem;
  line-height: 1.6;
}

/* 濃紺の全幅ヒーロー。参照サイトと同じく色面に白文字を置く */
.hero-band {
  background-image: linear-gradient(135deg, var(--deep) 0%, var(--deep-2) 100%);
  color: #fff;
  margin-bottom: 3rem;
}
.hero-band .hero {
  border: none;
  margin: 0 auto;
  max-width: var(--wide);
  padding: 3.4rem 1.25rem 3.6rem;
}
.hero-band .hero-lead { color: rgba(255, 255, 255, 0.82); }
.hero-band .hero-en { color: rgba(255, 255, 255, 0.62); }
.hero-band .hero-count { color: rgba(255, 255, 255, 0.7); }
.hero-band .hero-btn { border-color: rgba(255, 255, 255, 0.5); color: #fff; }
.hero-band .hero-btn:hover, .hero-band .hero-btn:focus-visible {
  background: #fff;
  color: var(--deep);
}

.hero {
  padding: 2.6rem 0 1.8rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2.4rem;
}
.hero h1 { margin: 0 0 0.5rem; letter-spacing: -0.01em; }
.hero-en {
  margin: 0 0 1.1rem;
  font-family: var(--font-display);
  font-size: 0.86rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--accent);
}
.hero-lead {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.9;
  max-width: 62ch;
}
.hero-count {
  margin: 0.9rem 0 0;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.04em;
}
.hero-sub { padding-top: 2rem; }
.hero-actions { margin: 1.3rem 0 0; }
.hero-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--accent);
  border-radius: var(--r);
  color: var(--accent);
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.hero-btn:hover, .hero-btn:focus-visible {
  background: var(--accent);
  color: var(--accent-fg);
}
/* 日本語見出し + 小さい青の英字ラベル + 細い罫線(参照サイトの型) */
.section-head {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--fg);
  margin: 0 0 0.3rem;
  padding: 0;
  border: none;
}
.section-head::before { content: none; }
.section-en {
  font-family: var(--font-display);
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 0 0 1rem;
  padding-bottom: 1.1rem;
  border-bottom: 1px solid var(--border);
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
  border-radius: 0 var(--r) var(--r) 0;
  font-style: italic;
}
blockquote p { margin: 0; }
code {
  background: var(--code-bg);
  padding: 0.15em 0.4em;
  border-radius: var(--r);
  font-size: 0.9em;
}
.table-wrap {
  overflow-x: auto;
  margin: 1.4rem 0;
  border: 1px solid var(--border);
  border-radius: var(--r);
}
.table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  line-height: 1.7;
}
.table-wrap th, .table-wrap td {
  padding: 0.6rem 0.9rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.table-wrap td { white-space: normal; min-width: 8em; }
.table-wrap thead th {
  background: var(--card-bg);
  font-weight: 700;
  border-bottom: 2px solid var(--accent);
}
.table-wrap tbody tr:last-child td { border-bottom: none; }

.site-header nav { display: flex; align-items: center; gap: 0.2rem; flex-shrink: 0; }
.site-header nav a { margin-left: 0; }
.nav-cta {
  background: var(--accent);
  color: var(--accent-fg) !important;
  border-color: var(--accent) !important;
  white-space: nowrap;
}
/* 狭い画面ではロゴが記事一覧への導線を兼ねるので、文字リンクは隠す */
@media (max-width: 540px) {
  .site-header { padding: 0.7rem 1rem; }
  .site-header .inner { gap: 0.5rem; }
  .top-nav a:not(.nav-cta) { display: none; }
  .brand-text { font-size: 1rem; }
  .nav-cta { font-size: 0.8rem; padding: 0.42rem 0.8rem; }
}
.nav-cta:hover, .nav-cta:focus-visible {
  filter: brightness(1.06);
  background: var(--accent);
  color: var(--accent-fg) !important;
}

.sd, .sd-result { scroll-margin-top: 7rem; }
.sd { max-width: var(--measure); margin: 0 auto; }
.sd-bar {
  height: 4px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}
.sd-bar-fill {
  height: 100%;
  width: 0;
  background: var(--accent);
  transition: width 0.25s ease;
}
.sd-progress {
  margin: 0.6rem 0 1.6rem;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
}
.sd-step { border: none; margin: 0; padding: 0; }
.sd-q {
  display: block;
  padding: 0;
  font-size: 1.22rem;
  font-weight: 700;
  line-height: 1.6;
  margin-bottom: 1.2rem;
}
.sd-num {
  display: inline-block;
  margin-right: 0.6rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--accent);
}
.sd-opts { display: grid; gap: 0.6rem; }
.sd-opt {
  appearance: none;
  text-align: left;
  font: inherit;
  font-weight: 600;
  color: var(--fg);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 1rem 1.15rem;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
}
.sd-opt:hover, .sd-opt:focus-visible {
  border-color: var(--accent);
  background: var(--accent-soft);
  transform: translateY(-1px);
}
.sd-nav { margin-top: 1.6rem; }
.sd-back, .sd-again {
  appearance: none;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--muted);
  background: none;
  border: none;
  padding: 0.4rem 0;
  cursor: pointer;
}
.sd-back:hover, .sd-again:hover { color: var(--accent); }

.sd-result { max-width: var(--measure); margin: 0 auto; }
.sd-result-head {
  font-size: 1.3rem;
  padding-left: 0.85rem;
  border-left: 4px solid var(--accent);
  margin: 0 0 1.4rem;
}
.sd-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 1.3rem 1.4rem;
  margin-bottom: 1.1rem;
}
.sd-card.is-top { border-color: var(--accent); box-shadow: var(--shadow); }
.sd-card h3 { margin: 0.2rem 0 0.6rem; font-size: 1.25rem; }
.sd-card p { margin: 0 0 0.7rem; }
.sd-rank {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 !important;
}
.sd-card.is-top .sd-rank { color: var(--accent); }
/* 候補が3つ並ぶので、強いボタンは1件目だけにする */
.sd-card:not(.is-top) .aff-cta { margin: 1rem 0 0; text-align: left; }
.sd-card:not(.is-top) .aff-btn {
  background: none;
  color: var(--accent) !important;
  border: 1px solid var(--border);
  box-shadow: none;
  font-size: 0.9rem;
  padding: 0.6rem 1.2rem;
}
.sd-card:not(.is-top) .aff-btn:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: none;
}
.sd-more { font-size: 0.9rem; }
.sd-note {
  font-size: 0.82rem;
  line-height: 1.8;
  color: var(--muted);
  margin: 1.6rem 0;
}
.sd-again { margin-top: 0.4rem; }

figure.diagram {
  margin: 1.8rem 0;
  padding: 1.1rem 1rem 0.9rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  overflow-x: auto;
}
figure.diagram svg {
  display: block;
  width: 100%;
  max-width: 640px;
  height: auto;
  margin: 0 auto;
}
figure.diagram figcaption {
  margin-top: 0.85rem;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--muted);
  text-align: center;
}
figure.diagram .dg-label { font-weight: 700; }
figure.diagram text { font-family: inherit; }

pre {
  background: var(--code-bg);
  padding: 1rem;
  border-radius: var(--r);
  overflow-x: auto;
}
pre code { background: none; padding: 0; }
hr { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }

.related {
  margin: 3.5rem auto 0;
  max-width: var(--measure);
  border-top: 1px solid var(--border);
  padding-top: 1.5rem;
}
.related h2 {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin: 0 0 1rem;
  padding-left: 0;
  border-left: none;
}
.related ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
.related a {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.related a:hover { border-color: var(--accent); transform: translateY(-1px); }
.related .related-title { font-weight: 700; line-height: 1.5; }
.related .related-cat {
  font-family: var(--font-display);
  font-size: 0.72rem;
  color: var(--muted);
}

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
  text-decoration: none;
  color: inherit;
}
a.chip { cursor: pointer; transition: filter 0.15s ease, transform 0.15s ease; }
a.chip:hover { filter: brightness(0.94); transform: translateY(-1px); }
@media (prefers-color-scheme: dark) {
  a.chip:hover { filter: brightness(1.2); }
}
.chip-tag { border: 1px solid var(--border); color: var(--muted); }
.chip-cat {
  font-weight: 700;
  border: 1px solid var(--accent);
  color: var(--accent);
}
.chip-edu, .chip-a, .chip-b, .chip-c, .chip-d, .chip-e {
  border: 1px solid var(--accent);
  color: var(--accent);
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
.article-meta .meta-updated { color: var(--accent); }

.eyecatch-hero {
  width: 100%;
  height: clamp(120px, 26vw, 220px);
  max-height: 220px;
  overflow: hidden;
  border-radius: var(--r);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  margin: 0 0 2.2rem;
}

.sources {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--muted);
}
.sources h2 {
  font-size: 1.05rem;
  margin: 0 0 1rem;
}
.sources ul { padding-left: 1.3rem; }
.sources li { margin-bottom: 0.5rem; }
.sources a {
  color: var(--muted);
  text-decoration: underline;
  text-decoration-color: var(--border);
  text-underline-offset: 0.15em;
}
.sources a:hover, .sources a:focus-visible { color: var(--accent); }
.sources a[target="_blank"]::after {
  content: "\\2197";
  display: inline-block;
  margin-left: 0.3em;
  font-size: 0.85em;
  opacity: 0.65;
}

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
  border-radius: var(--r);
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
  border-radius: var(--r);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  overflow: hidden;
}
.article-card:hover {
  box-shadow: var(--shadow);
  border-color: var(--accent);
}
/* カード右下に青い丸の矢印(参照サイトのニュース一覧と同じ役割) */
.card-body { position: relative; }
.card-arrow {
  position: absolute;
  right: 1.15rem;
  bottom: 1.15rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  line-height: 1;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.article-card:hover .card-arrow,
.card-link:focus-visible .card-arrow { opacity: 1; transform: none; }
@media (hover: none) {
  .card-arrow { opacity: 1; transform: none; }
}
.article-card .card-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: var(--fg);
  height: 100%;
}
.card-eyecatch {
  width: 100%;
  height: 104px;
  overflow: hidden;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.card-eyecatch .eyecatch-svg,
.eyecatch-hero .eyecatch-svg {
  display: block;
  width: 100%;
  height: 100%;
}
.article-card:hover .card-eyecatch .eyecatch-svg { transform: scale(1.03); }
.card-eyecatch .eyecatch-svg { transition: transform 0.3s ease; }
.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.95rem 1.15rem 1.15rem;
  flex: 1;
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
  font-size: 0.87rem;
  line-height: 1.72;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
.site-footer a { color: var(--muted); }
.site-footer a:hover { color: var(--accent); }

.policy-page { max-width: 720px; margin: 0 auto; padding: 2rem 0 4rem; }
.policy-page h1 { margin-bottom: 1.5rem; }
.policy-page h2 { margin-top: 2.2rem; font-size: 1.15rem; }
.policy-page p { color: var(--muted); line-height: 1.9; }
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

// ヘッダーのカテゴリナビは全ページ共通。記事を書き出す前に確定させる。
let NAV_CATEGORIES = [];
function setNavCategories(list) {
  NAV_CATEGORIES = list.slice().sort((a, b) => b.count - a.count);
}

function renderCategoryNav(currentCategory) {
  if (!NAV_CATEGORIES.length) return "";
  const items = NAV_CATEGORIES.map(({ name, count }) => {
    const active = name === currentCategory ? " is-active" : "";
    return `<a class="nav-cat${active}" href="${categoryUrl(name)}">${escapeHtml(name)}<span class="nav-cat-n">${count}</span></a>`;
  }).join("");
  return `<nav class="cat-nav" aria-label="カテゴリ"><div class="inner">${items}</div></nav>`;
}

const DISCLOSURE_SITE_TEXT = "当サイトはアフィリエイト広告を利用しています。";

// jsonLd は単体でも配列でも受け取る。</script> による早期終了を避けるため
// スラッシュをエスケープしてから埋め込む。
function renderJsonLd(jsonLd) {
  const list = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean);
  return list
    .map(
      (o) =>
        `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n");
}

function pageShell({
  title,
  description,
  canonical,
  ogType = "article",
  bodyHtml,
  jsonLd,
  showDisclosure = true,
  disclosureScope = "article",
  currentCategory = null,
}) {
  const fullTitle = `${title} | ${CONFIG.siteName}`;
  const disclosureText = disclosureScope === "site" ? DISCLOSURE_SITE_TEXT : DISCLOSURE_TEXT;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="google-site-verification" content="dYzGQSnnAOvz22dxCHsSp4tyrnp8HakA7AbveSFE2-M" />
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${escapeHtml(CONFIG.siteName)}">
${OGP_IMAGE_URL ? `<meta property="og:image" content="${OGP_IMAGE_URL}">\n` : ""}<meta name="twitter:card" content="${OGP_IMAGE_URL ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${OGP_IMAGE_URL ? `<meta name="twitter:image" content="${OGP_IMAGE_URL}">\n` : ""}${renderJsonLd(jsonLd)}
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
    <nav class="top-nav">
      <a href="${BLOG_INDEX_URL}">記事一覧</a>
      <a class="nav-cta" href="${SHINDAN_URL}">ツール診断</a>
    </nav>
  </div>
</header>
${renderCategoryNav(currentCategory)}
${showDisclosure ? `<div class="disclosure-bar"><div class="inner"><span class="disclosure-badge">PR</span><span>${disclosureText}</span></div></div>` : ""}
${bodyHtml}
<footer class="site-footer">
  <div class="inner">
    ${showDisclosure ? `<p class="footer-disclosure"><span class="disclosure-badge">PR</span><span>${disclosureText}</span></p>` : ""}
    <p>本サイトの情報は正確性に努めていますが、内容を保証するものではありません。掲載の商品・サービスの詳細は必ず公式サイトでご確認ください。</p>
    <p><a href="${PRIVACY_URL}">プライバシーポリシー</a></p>
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

// 同じカテゴリ(重み3)と共通タグ(1つにつき1)でスコアを付け、関連度の高い記事を返す。
// 記事同士の内部リンクを増やすことでクローラーの巡回を助け、読者の回遊も促す。
function findRelatedArticles(article, allArticles, limit = 3) {
  const others = allArticles.filter((a) => a.slug !== article.slug);
  const matched = others
    .map((a) => {
      let score = a.category === article.category ? 3 : 0;
      score += a.tags.filter((t) => article.tags.includes(t)).length;
      return { article: a, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.article.date < b.article.date ? 1 : -1))
    .map((x) => x.article);

  // カテゴリもタグも重ならない記事を孤立させないため、足りない分は新着で埋める
  if (matched.length < limit) {
    const picked = new Set(matched.map((a) => a.slug));
    for (const a of others) {
      if (matched.length >= limit) break;
      if (!picked.has(a.slug)) {
        matched.push(a);
        picked.add(a.slug);
      }
    }
  }
  return matched.slice(0, limit);
}

function renderRelatedHtml(article, allArticles) {
  const related = findRelatedArticles(article, allArticles);
  if (!related.length) return "";
  const items = related
    .map(
      (a) => `<li>
        <a href="${articleUrl(a.slug)}">
          <span class="related-title">${escapeHtml(a.title)}</span>
          <span class="related-cat">${escapeHtml(a.category)}</span>
        </a>
      </li>`
    )
    .join("\n");
  return `
  <nav class="related" aria-label="関連記事">
    <h2 class="section-head">関連記事</h2>
    <p class="section-en">Related</p>
    <ul>
      ${items}
    </ul>
  </nav>`;
}

function renderArticlePage(article, allArticles = []) {
  const url = articleUrl(article.slug);
  const tagsHtml = article.tags.length
    ? article.tags
        .map((t) => `<a class="chip chip-tag" href="${tagUrl(t)}">${escapeHtml(t)}</a>`)
        .join("")
    : "";
  const body = `
<main>
  <article>
    <h1>${escapeHtml(article.title)}</h1>
    <div class="article-meta">
      <time datetime="${escapeHtml(article.date)}">${escapeHtml(formatDateJa(article.date))}</time>
      ${article.updated ? `<time class="meta-updated" datetime="${escapeHtml(article.updated)}">${escapeHtml(formatDateJa(article.updated))}更新</time>` : ""}
      <a class="chip chip-cat ${categoryChipClass(article.category)}" href="${categoryUrl(article.category)}">${escapeHtml(article.category)}</a>
      ${tagsHtml}
    </div>
    <div class="eyecatch-hero">${article.eyecatchSvg}</div>
    ${article.bodyHtml}
  </article>
${renderRelatedHtml(article, allArticles)}
</main>`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.updated || article.date,
    author: { "@type": "Organization", name: CONFIG.author },
    publisher: { "@type": "Organization", name: CONFIG.siteName },
    mainEntityOfPage: url,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: CONFIG.siteName, item: `${CONFIG.baseUrl}/` },
      { "@type": "ListItem", position: 2, name: article.category, item: categoryUrl(article.category) },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };

  return pageShell({
    title: article.title,
    description: article.description,
    canonical: url,
    ogType: "article",
    bodyHtml: body,
    jsonLd: [articleJsonLd, breadcrumbJsonLd],
    showDisclosure: article.bodyHtml.includes("aff-btn"),
  });
}

function renderArticleGrid(articles, emptyText) {
  return articles.length
    ? articles
        .map(
          (a) => `<li class="article-card">
        <a class="card-link" href="${articleUrl(a.slug)}">
          <div class="card-eyecatch">${a.eyecatchSvg}</div>
          <div class="card-body">
            <div class="card-top">
              <span class="chip chip-cat ${categoryChipClass(a.category)}">${escapeHtml(a.category)}</span>
              <time class="card-date" datetime="${escapeHtml(a.date)}">${escapeHtml(a.date)}</time>
            </div>
            <h2>${escapeHtml(a.title)}</h2>
            <p class="desc">${escapeHtml(a.description)}</p>
            <span class="card-arrow" aria-hidden="true">→</span>
          </div>
        </a>
      </li>`
        )
        .join("\n")
    : `<li class="empty-state">${escapeHtml(emptyText || "まだ記事がありません。近日公開予定です。")}</li>`;
}

function renderBlogIndex(articles) {
  const body = `
<div class="hero-band">
  <section class="hero">
    <h1>${escapeHtml(CONFIG.siteName)}</h1>
    <p class="hero-en">AI Tools, Explained</p>
    <p class="hero-lead">${escapeHtml(CONFIG.description)}</p>
    <p class="hero-count">${articles.length}本の記事を公開中</p>
    <p class="hero-actions"><a class="hero-btn" href="${SHINDAN_URL}">どれを使うか迷ったら → AIツール診断</a></p>
  </section>
</div>
<main class="wide">
  <h2 class="section-head">新着記事</h2>
  <p class="section-en">Latest</p>
  <ul class="article-grid">
    ${renderArticleGrid(articles)}
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
    disclosureScope: "site",
  });
}

const CATEGORY_EN = {
  "AIをはじめて学ぶ": "Basics",
  "業務効率化": "Productivity",
  "ツール比較": "Compare",
  "デザイン": "Design",
  "AI企業を知る": "Companies",
};

const SHINDAN_URL = `${CONFIG.baseUrl}${CONFIG.blogPath}/shindan/`;
const PRIVACY_URL = `${CONFIG.baseUrl}${CONFIG.blogPath}/privacy/`;

function renderPrivacyPage() {
  const body = `
<main>
  <article class="policy-page">
    <h1>プライバシーポリシー</h1>
    <p>${escapeHtml(CONFIG.siteName)}（以下「当サイト」）における、個人情報および利用者情報の取り扱いについて説明します。</p>

    <h2>アフィリエイトプログラムについて</h2>
    <p>当サイトは、A8.net等のアフィリエイトサービスプロバイダ(ASP)が提供する成果報酬型広告プログラムに参加しています。当サイトに掲載しているリンクの一部には、ASPを経由した広告リンクが含まれます。これらのリンクを利用者がクリックした場合、ASPおよび提携先企業によってCookie等を用いた計測が行われることがあります。</p>

    <h2>Cookieの利用について</h2>
    <p>Cookieとは、ウェブサイトが利用者のブラウザに送信し、端末に保存される情報です。当サイトでは、上記アフィリエイトプログラムの成果計測のためにCookieが利用される場合があります。また、将来的にアクセス解析ツール(Google Analytics等)や第三者配信の広告サービス(Google AdSense等)を導入する場合、これらのサービス提供者によってもCookieが利用されることがあります。その場合、収集される情報に個人を特定できる情報は含まれません。</p>
    <p>Cookieの利用を望まない場合は、ブラウザの設定で無効化することができます。無効化した場合、当サイトの一部機能が正しく動作しない可能性があります。</p>

    <h2>外部サービスの利用について</h2>
    <p>当サイトは、フォント表示のためにGoogle Fonts(Google社が提供するサービス)を利用しています。このサービスの利用にともない、利用者の端末からGoogle社のサーバーへ通信が行われます。</p>

    <h2>アクセス解析・広告配信サービスについて</h2>
    <p>当サイトは、将来的にGoogle Analyticsによるアクセス解析や、Google AdSense等の第三者配信広告サービスを導入する場合があります。これらのサービスは、利用者の興味に応じた広告を表示するためにCookieを使用し、当サイトや他サイトへのアクセス情報に基づいて広告を配信することがあります。Cookieを無効にする方法や、これらのサービスにおけるCookieの取り扱いについては、各サービス提供者が公開している情報をご確認ください。</p>

    <h2>免責事項</h2>
    <p>当サイトの記事内容については正確性の確保に努めていますが、内容の正確性・完全性を保証するものではありません。掲載している商品・サービスの料金・仕様等は変更される場合があるため、利用の際は必ず公式サイトで最新の情報をご確認ください。当サイトの情報を利用したことによって生じた損害について、当サイトは一切の責任を負いません。</p>

    <h2>著作権について</h2>
    <p>当サイトに掲載している文章・画像等の著作権は、特に断りのない限り当サイトに帰属します。無断での転載・複製はお控えください。</p>

    <h2>プライバシーポリシーの変更について</h2>
    <p>当サイトは、法令の変更や運営方針の変更等にともない、本ポリシーの内容を予告なく変更することがあります。変更後の内容は、当ページに掲載した時点から効力を持つものとします。</p>
  </article>
</main>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "プライバシーポリシー",
    url: PRIVACY_URL,
  };

  return pageShell({
    title: "プライバシーポリシー",
    description: `${CONFIG.siteName}のプライバシーポリシーです。Cookieの利用、アフィリエイトプログラム、外部サービスの利用について説明しています。`,
    canonical: PRIVACY_URL,
    ogType: "website",
    bodyHtml: body,
    jsonLd,
    showDisclosure: false,
    disclosureScope: "site",
  });
}

// 診断ページ。結果に出す広告ボタンはビルド時に組み立てておき、
// ブラウザ側では組み立て済みのHTMLを差し込むだけにする。
function renderShindanPage() {
  const data = readJson(path.join(AFFILIATE_DIR, "shindan.json"), null);
  if (!data) return null;

  const tools = {};
  for (const [id, t] of Object.entries(data.tools)) {
    tools[id] = {
      name: t.name,
      blurb: t.blurb,
      url: articleUrl(t.slug),
      cta: t.aff ? renderCta(t.aff, true) : "",
    };
  }

  const payload = JSON.stringify({ questions: data.questions, tools }).replace(/</g, "\\u003c");

  const steps = data.questions
    .map(
      (q, i) => `<fieldset class="sd-step" data-step="${i}"${i ? " hidden" : ""}>
      <legend class="sd-q"><span class="sd-num">Q${i + 1}</span>${escapeHtml(q.q)}</legend>
      <div class="sd-opts">
        ${q.options
          .map(
            (o, j) =>
              `<button type="button" class="sd-opt" data-q="${i}" data-o="${j}">${escapeHtml(o.label)}</button>`
          )
          .join("\n        ")}
      </div>
    </fieldset>`
    )
    .join("\n    ");

  const body = `
<main>
  <section class="hero hero-sub">
    <h1>${escapeHtml(data.title)}</h1>
    <p class="hero-en">Find Your Tool</p>
    <p class="hero-lead">${escapeHtml(data.lead.replace("{n}", String(data.questions.length)))}</p>
  </section>

  <div class="sd" id="sd">
    <div class="sd-bar"><div class="sd-bar-fill" id="sd-bar"></div></div>
    <p class="sd-progress" id="sd-progress">1 / ${data.questions.length}</p>
    ${steps}
    <div class="sd-nav">
      <button type="button" class="sd-back" id="sd-back" hidden>← 前の質問へ</button>
    </div>
  </div>

  <div class="sd-result" id="sd-result" hidden>
    <h2 class="section-head">診断結果</h2>
    <p class="section-en">Result</p>
    <div id="sd-out"></div>
    <p class="sd-note">この結果は、選んだ回答に近い用途のツールを並べたものです。実際に合うかどうかは使い方によって変わります。料金や機能は変更されることがあるため、必ず公式サイトで確認してください。</p>
    <button type="button" class="sd-again" id="sd-again">もう一度診断する</button>
  </div>

  <noscript><p class="sd-note">この診断はJavaScriptを有効にすると利用できます。<a href="${BLOG_INDEX_URL}">記事一覧</a>からお探しください。</p></noscript>
</main>
<script>
(function () {
  var D = ${payload};
  var total = D.questions.length, cur = 0, picks = [];
  var root = document.getElementById("sd"),
      out = document.getElementById("sd-out"),
      result = document.getElementById("sd-result"),
      bar = document.getElementById("sd-bar"),
      prog = document.getElementById("sd-progress"),
      back = document.getElementById("sd-back");

  function show(i) {
    cur = i;
    var steps = root.querySelectorAll(".sd-step");
    for (var k = 0; k < steps.length; k++) steps[k].hidden = k !== i;
    bar.style.width = ((i / total) * 100) + "%";
    prog.textContent = (i + 1) + " / " + total;
    back.hidden = i === 0;
  }

  function finish() {
    var score = {};
    for (var i = 0; i < picks.length; i++) {
      var s = D.questions[i].options[picks[i]].scores;
      for (var id in s) score[id] = (score[id] || 0) + s[id];
    }
    var ranked = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 3);
    var html = "";
    for (var r = 0; r < ranked.length; r++) {
      var t = D.tools[ranked[r]];
      if (!t) continue;
      html +=
        '<div class="sd-card' + (r === 0 ? " is-top" : "") + '">' +
        '<p class="sd-rank">' + (r === 0 ? "もっとも近い" : "こちらも候補") + "</p>" +
        "<h3>" + t.name + "</h3>" +
        "<p>" + t.blurb + "</p>" +
        '<p class="sd-more"><a href="' + t.url + '">' + t.name + "の解説を読む</a></p>" +
        t.cta +
        "</div>";
    }
    out.innerHTML = html;
    root.hidden = true;
    result.hidden = false;
    result.scrollIntoView({ block: "start" });
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest(".sd-opt");
    if (!b) return;
    picks[+b.dataset.q] = +b.dataset.o;
    if (cur + 1 < total) show(cur + 1); else finish();
  });
  back.addEventListener("click", function () { if (cur > 0) show(cur - 1); });
  document.getElementById("sd-again").addEventListener("click", function () {
    picks = []; result.hidden = true; root.hidden = false; show(0);
    root.scrollIntoView({ block: "start" });
  });
  show(0);
})();
</script>`;

  return pageShell({
    title: data.title,
    description:
      "4つの質問に答えるだけで、用途に合ったAIツールを絞り込めます。文章作成・議事録・資料作り・画像生成・調べものなど、目的別に候補を提示します。",
    canonical: SHINDAN_URL,
    ogType: "website",
    bodyHtml: body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: data.title,
      url: SHINDAN_URL,
    },
    disclosureScope: "site",
  });
}

function renderTaxonomyPage({ heading, description, canonical, articles, currentCategory = null, enLabel = null }) {
  const body = `
<main class="wide">
  <section class="hero hero-sub">
    <h1>${escapeHtml(heading)}</h1>
    ${enLabel ? `<p class="hero-en">${escapeHtml(enLabel)}</p>` : ""}
    <p class="hero-lead">${escapeHtml(description)}</p>
    <p class="hero-count">${articles.length}本</p>
  </section>
  <ul class="article-grid">
    ${renderArticleGrid(articles, "該当する記事がまだありません。")}
  </ul>
</main>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: heading,
    url: canonical,
  };

  return pageShell({
    title: heading,
    description,
    canonical,
    ogType: "website",
    bodyHtml: body,
    jsonLd,
    disclosureScope: "site",
    currentCategory,
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

function renderSitemap(articles, tagNames, categoryNames) {
  const urls = [
    { loc: SITE_ROOT_URL },
    ...(BLOG_INDEX_URL !== SITE_ROOT_URL ? [{ loc: BLOG_INDEX_URL }] : []),
    { loc: SHINDAN_URL },
    { loc: PRIVACY_URL },
    ...articles.map((a) => ({ loc: articleUrl(a.slug), lastmod: a.updated || a.date })),
    ...(tagNames || []).map((t) => ({ loc: tagUrl(t) })),
    ...(categoryNames || []).map((c) => ({ loc: categoryUrl(c) })),
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

function copyStaticFiles() {
  if (!fs.existsSync(STATIC_DIR)) return;
  const dest = path.join(DIST_DIR, "static");
  ensureDir(dest);
  fs.cpSync(STATIC_DIR, dest, { recursive: true });
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

  const tagMap = new Map();
  const categoryMap = new Map();
  for (const a of articles) {
    for (const t of a.tags) {
      if (!tagMap.has(t)) tagMap.set(t, []);
      tagMap.get(t).push(a);
    }
    if (!categoryMap.has(a.category)) categoryMap.set(a.category, []);
    categoryMap.get(a.category).push(a);
  }

  // ヘッダーのカテゴリナビは全ページに出すので、記事の書き出しより先に確定させる
  setNavCategories([...categoryMap].map(([name, list]) => ({ name, count: list.length })));

  for (const article of articles) {
    const outPath = path.join(BLOG_OUT_DIR, article.slug, "index.html");
    writeFile(outPath, renderArticlePage(article, articles));
  }
  for (const [tag, list] of tagMap) {
    const outPath = path.join(BLOG_OUT_DIR, "tag", tag, "index.html");
    writeFile(
      outPath,
      renderTaxonomyPage({
        heading: `タグ: ${tag}`,
        description: `「${tag}」に関する記事一覧`,
        canonical: tagUrl(tag),
        articles: list,
      })
    );
  }
  for (const [category, list] of categoryMap) {
    const outPath = path.join(BLOG_OUT_DIR, "category", category, "index.html");
    writeFile(
      outPath,
      renderTaxonomyPage({
        heading: category,
        description: `「${category}」の記事をまとめています。`,
        canonical: categoryUrl(category),
        articles: list,
        currentCategory: category,
        enLabel: CATEGORY_EN[category] || null,
      })
    );
  }

  writeFile(path.join(BLOG_OUT_DIR, "index.html"), renderBlogIndex(articles));

  const shindanHtml = renderShindanPage();
  if (shindanHtml) writeFile(path.join(BLOG_OUT_DIR, "shindan", "index.html"), shindanHtml);
  writeFile(path.join(BLOG_OUT_DIR, "privacy", "index.html"), renderPrivacyPage());
  writeFile(path.join(BLOG_OUT_DIR, "feed.xml"), renderFeed(articles));
  writeFile(
    path.join(DIST_DIR, "sitemap.xml"),
    renderSitemap(articles, [...tagMap.keys()], [...categoryMap.keys()])
  );
  writeFile(path.join(DIST_DIR, "robots.txt"), renderRobots());
  copyStaticFiles();

  console.log(
    `[build] Done. ${articles.length} article(s) built, ${tagMap.size} tag page(s), ${categoryMap.size} category page(s). Output: ${DIST_DIR}`
  );
}

build();
