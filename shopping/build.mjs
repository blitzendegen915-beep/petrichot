import { cp, readFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAiRecorderPage,
  recorderPageCss,
  recorderPageScript,
  recorderPath
} from "./ai-recorder.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const outputRoot = path.join(projectRoot, "dist", "shopping");
const staticSource = path.join(here, "static");
const staticOutput = path.join(projectRoot, "dist", "static", "shopping");
const siteUrl = "https://petrichot.com";
const shoppingPath = "/shopping/";
const articlePath = "/shopping/carry-on-suitcase-1-3-nights/";
const aiGuidePath = "/";
const learningPath = "/learning/";
const privacyPath = "/privacy/";
const linksPath = path.join(here, "links.json");

const links = JSON.parse(await readFile(linksPath, "utf8"));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkFor(key) {
  const config = links[key];
  if (!config || typeof config !== "object") {
    throw new Error(`shopping/links.json に "${key}" の設定がありません。`);
  }

  const affiliateHtml = String(config.affiliateHtml || "").trim();
  const fallbackUrl = String(config.fallbackUrl || "").trim();
  const fallbackLabel = String(config.fallbackLabel || "").trim();

  if (affiliateHtml) {
    if (!/^<a\b[\s\S]*<\/a>$/i.test(affiliateHtml)) {
      throw new Error(`${key}.affiliateHtml は楽天が生成したテキストリンクのHTMLソース全体にしてください。`);
    }
    if (/<(?:script|iframe)\b|javascript:/i.test(affiliateHtml)) {
      throw new Error(`${key}.affiliateHtml に許可していないコードが含まれています。`);
    }
  }
  if (!fallbackUrl.startsWith("https://search.rakuten.co.jp/")) {
    throw new Error(`${key}.fallbackUrl は楽天市場の公式検索URLにしてください。`);
  }
  if (!fallbackLabel.includes("楽天市場") || fallbackLabel.length < 8) {
    throw new Error(`${key}.fallbackLabel は楽天市場と検索対象が分かる文言にしてください。`);
  }

  const isAffiliate = Boolean(affiliateHtml);
  return {
    affiliateHtml,
    fallbackUrl,
    fallbackLabel,
    isAffiliate,
  };
}

function cta(key, ctaPosition = "article_inline", extraClass = "") {
  const target = linkFor(key);
  const wrapperAttributes = `data-rakuten-wrapper data-is-affiliate="${target.isAffiliate}" data-link-id="${escapeHtml(key)}" data-cta-position="${escapeHtml(ctaPosition)}" data-destination-type="search"`;
  if (target.isAffiliate) {
    return `
      <div class="rakuten-link-block ${escapeHtml(extraClass)}" ${wrapperAttributes}>
        <span class="affiliate-nearby-disclosure">広告｜このリンクは楽天市場のアフィリエイトリンクです。価格・在庫・送料・返品条件は移動先でご確認ください。</span>
        <span class="rakuten-affiliate-source">${target.affiliateHtml}</span>
      </div>
    `;
  }
  return `
    <div class="rakuten-link-block ${escapeHtml(extraClass)}" ${wrapperAttributes}>
      <a class="button button-warm"
         href="${escapeHtml(target.fallbackUrl)}"
         rel="noopener"
         target="_blank"
         aria-label="${escapeHtml(`${target.fallbackLabel}（新しいタブで開きます）`)}">
         ${escapeHtml(target.fallbackLabel)}
         <span aria-hidden="true">↗</span>
      </a>
      <span class="link-status">現在は広告リンクではなく、楽天市場の通常検索へ移動します。</span>
    </div>
  `;
}

const css = `
:root {
  color-scheme: light;
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-soft: #f5f7fb;
  --ink: #11182a;
  --muted: #5c667a;
  --line: #dfe5ef;
  --cobalt: #1a5ce5;
  --cobalt-dark: #10287d;
  --cobalt-soft: #eaf1ff;
  --warm: #e96b21;
  --warm-dark: #a9400c;
  --warm-soft: #fff1e7;
  --success: #146c53;
  --success-soft: #e9f8f2;
  --shadow: 0 18px 48px -30px rgba(16, 40, 125, 0.42);
  --radius: 6px;
  --wide: 1120px;
  --reading: 760px;
  --font-display: "Space Grotesk", "Zen Kaku Gothic New", "Noto Sans JP", sans-serif;
  --font-body: "Zen Kaku Gothic New", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.8;
  -webkit-font-smoothing: antialiased;
}
img, svg { display: block; max-width: 100%; }
a { color: var(--cobalt); text-underline-offset: 0.18em; }
a:hover { text-decoration-thickness: 2px; }
a:focus-visible, button:focus-visible {
  outline: 3px solid var(--warm-dark);
  outline-offset: 3px;
}
.skip-link {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 100;
  transform: translateY(-160%);
  background: var(--ink);
  color: #fff;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius);
}
.skip-link:focus { transform: translateY(0); }

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px) saturate(150%);
  border-bottom: 1px solid var(--line);
}
.header-inner {
  width: min(calc(100% - 2rem), var(--wide));
  min-height: 72px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.72rem;
  color: var(--ink);
  text-decoration: none;
  min-width: max-content;
}
.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 7px;
}
.brand-copy {
  display: grid;
  line-height: 1.05;
}
.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.015em;
}
.brand-section {
  color: var(--warm-dark);
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.umbrella-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
}
.umbrella-nav a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.48rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 4px;
}
.umbrella-nav a:hover,
.umbrella-nav a:focus-visible {
  color: var(--cobalt-dark);
  border-color: var(--line);
  background: var(--surface-soft);
}
.umbrella-nav a[aria-current="page"] {
  color: var(--warm-dark);
  background: var(--warm-soft);
  border-color: #f4c9ac;
}

.container {
  width: min(calc(100% - 2rem), var(--wide));
  margin: 0 auto;
}
.reading { width: min(calc(100% - 2rem), var(--reading)); margin: 0 auto; }
.eyebrow {
  margin: 0 0 0.65rem;
  color: var(--warm-dark);
  font-family: var(--font-display);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.crumbs {
  padding: 1rem 0 0;
  color: var(--muted);
  font-size: 0.8rem;
}
.crumbs ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.crumbs li:not(:last-child)::after { content: "/"; margin-left: 0.45rem; color: #a8afbd; }
.crumbs a { color: inherit; }

.disclosure {
  margin: 1rem 0 0;
  padding: 0.9rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  border: 1px solid #f1c9ab;
  border-left: 4px solid var(--warm);
  border-radius: var(--radius);
  background: var(--warm-soft);
  color: #6f3515;
  font-size: 0.88rem;
  line-height: 1.65;
}
.disclosure strong { flex: 0 0 auto; font-family: var(--font-display); }

.hero {
  position: relative;
  padding: clamp(4.4rem, 9vw, 7.2rem) 0 clamp(4rem, 7vw, 6rem);
  overflow: hidden;
  border-bottom: 1px solid var(--line);
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(26, 92, 229, 0.065) 1px, transparent 1px),
    linear-gradient(rgba(26, 92, 229, 0.065) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, #000, transparent 86%);
}
.hero-grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(290px, 0.65fr);
  gap: clamp(2rem, 6vw, 5rem);
  align-items: center;
}
h1, h2, h3 {
  font-family: var(--font-display);
  line-height: 1.28;
  letter-spacing: -0.025em;
}
h1 {
  max-width: 820px;
  margin: 0;
  font-size: clamp(2.25rem, 5.4vw, 4.75rem);
}
.article-hero h1 { font-size: clamp(2rem, 4.7vw, 4.15rem); }
.hero-lead {
  max-width: 700px;
  margin: 1.35rem 0 0;
  color: var(--muted);
  font-size: clamp(1.03rem, 2vw, 1.22rem);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
  margin-top: 1.8rem;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 48px;
  padding: 0.68rem 1rem;
  border: 1px solid transparent;
  border-radius: 4px;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: none;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
.button:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.button-primary { color: #fff; background: var(--cobalt); }
.button-secondary { color: var(--cobalt-dark); border-color: var(--line); background: #fff; }
.button-warm { color: #fff; background: var(--warm-dark); }
.link-status {
  display: block;
  max-width: 28rem;
  margin-top: 0.55rem;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.55;
}
.rakuten-link-block { margin-top: 0.8rem; }
.rakuten-link-block:first-child { margin-top: 0; }
.affiliate-nearby-disclosure {
  display: block;
  margin: 0 0 0.55rem;
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.55;
}
.rakuten-affiliate-source {
  display: inline-block;
  padding: 0.65rem 0.8rem;
  border: 1px solid currentColor;
  border-radius: 4px;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
}

.route-map {
  position: relative;
  min-height: 330px;
  display: grid;
  align-content: center;
  gap: 0.7rem;
}
.route-card {
  position: relative;
  display: block;
  padding: 1rem;
  border: 1px solid var(--line);
  border-left: 5px solid var(--cobalt);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.96);
  color: var(--ink);
  text-decoration: none;
  box-shadow: var(--shadow);
}
.route-card:hover,
.route-card:focus-visible { border-color: var(--cobalt); }
.route-card:first-child { border-left-color: var(--warm); transform: translateX(-1.5rem); }
.route-card:last-child { transform: translateX(1.5rem); }
.route-step {
  display: block;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.route-card strong { font-family: var(--font-display); font-size: 1rem; }
.route-card p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.82rem; line-height: 1.55; }

.section { padding: clamp(4rem, 8vw, 6.5rem) 0; }
.section-soft { background: var(--surface-soft); border-block: 1px solid var(--line); }
.section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
}
.section h2 { max-width: 700px; margin: 0; font-size: clamp(1.75rem, 3.5vw, 2.8rem); }
.section-intro { max-width: 620px; margin: 0.8rem 0 0; color: var(--muted); }
.text-link { font-weight: 700; white-space: nowrap; }

.feature {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(270px, 0.9fr);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
  box-shadow: var(--shadow);
}
.editorial-figure {
  margin: 0;
  background: #fff;
}
.editorial-figure picture,
.editorial-figure img {
  display: block;
  width: 100%;
}
.editorial-figure img {
  height: auto;
  object-fit: cover;
}
.editorial-figure figcaption {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.76rem;
  line-height: 1.65;
}
.feature-visual {
  grid-column: 1 / -1;
  border-bottom: 1px solid var(--line);
}
.feature-visual img { aspect-ratio: 16 / 10; }
.article-visual {
  margin: 2rem 0 2.5rem;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.article-visual img { aspect-ratio: 3 / 2; }
.feature-copy { padding: clamp(1.5rem, 4vw, 3rem); }
.feature-copy h3 { margin: 0; font-size: clamp(1.45rem, 3vw, 2.25rem); }
.feature-copy p { color: var(--muted); }
.decision-panel {
  min-height: 330px;
  padding: clamp(1.5rem, 4vw, 2.6rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
  background: var(--cobalt-dark);
}
.decision-panel > span {
  color: #b9cdfd;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.decision-panel > strong {
  margin-top: 0.55rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1.45;
}
.decision-panel ol {
  margin: 1.1rem 0 0;
  padding-left: 1.35rem;
}
.decision-panel li {
  margin-top: 0.35rem;
  color: #dbe5ff;
  font-size: 0.88rem;
}
.meta-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
.tag {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--muted);
  background: var(--surface-soft);
  font-size: 0.74rem;
  font-weight: 700;
}

.principles, .path-grid, .type-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.principle, .path-card, .type-card {
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}
.principle-no {
  display: block;
  color: var(--cobalt);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.principle h3, .path-card h3, .type-card h3 { margin: 0.55rem 0 0; font-size: 1.08rem; }
.principle p, .path-card p, .type-card p { margin: 0.55rem 0 0; color: var(--muted); font-size: 0.9rem; }
.path-card { position: relative; padding-top: 3.7rem; }
.path-label {
  position: absolute;
  top: 1.1rem;
  left: 1.1rem;
  color: var(--warm-dark);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.article-hero { padding-top: clamp(3rem, 7vw, 5.5rem); }
.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.2rem;
  margin-top: 1.15rem;
  color: var(--muted);
  font-size: 0.82rem;
}
.article-body { padding: clamp(3.5rem, 7vw, 5.5rem) 0; }
.article-body h2 { margin: 3.8rem 0 1rem; font-size: clamp(1.55rem, 3vw, 2.2rem); scroll-margin-top: 100px; }
.article-body h3 { margin: 2rem 0 0.6rem; font-size: 1.25rem; }
.article-body p { margin: 1rem 0; }
.article-body ul, .article-body ol { padding-left: 1.35rem; }
.article-body li + li { margin-top: 0.5rem; }
.lead-box, .note-box, .experience-box, .cross-link {
  margin: 1.5rem 0;
  padding: 1.25rem;
  border-radius: var(--radius);
}
.lead-box { border: 1px solid #bed1fa; border-left: 5px solid var(--cobalt); background: var(--cobalt-soft); }
.note-box { border: 1px solid var(--line); background: var(--surface-soft); }
.experience-box {
  border: 2px dashed #e3a57e;
  background: var(--warm-soft);
}
.experience-box strong { display: block; color: var(--warm-dark); font-family: var(--font-display); }
.experience-box p { margin-bottom: 0; }
.experience-placeholder {
  display: block;
  margin-top: 0.75rem;
  padding: 0.85rem;
  border: 1px solid #edc09f;
  background: #fff;
  color: #71360f;
  font-weight: 700;
}
.toc {
  margin: 2rem 0;
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.toc strong { font-family: var(--font-display); }
.toc ol { margin-bottom: 0; columns: 2; column-gap: 2rem; }
.toc li { break-inside: avoid; }

.comparison-wrap { margin: 1.5rem 0; overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
.comparison {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  background: #fff;
}
.comparison th, .comparison td { padding: 0.9rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
.comparison th { color: var(--cobalt-dark); background: var(--cobalt-soft); font-family: var(--font-display); font-size: 0.82rem; }
.comparison tr:last-child td { border-bottom: 0; }
.comparison td:first-child { font-weight: 700; }
.type-card.featured-type { border-top: 4px solid var(--warm); }
.type-card .button { width: 100%; margin-top: 1rem; }
.type-card .link-status { margin-inline: auto; }
.checklist {
  counter-reset: check;
  margin: 1.5rem 0;
  padding: 0;
  list-style: none;
}
.checklist li {
  position: relative;
  min-height: 54px;
  padding: 0.85rem 0.85rem 0.85rem 3.6rem;
  border-top: 1px solid var(--line);
}
.checklist li:last-child { border-bottom: 1px solid var(--line); }
.checklist li::before {
  counter-increment: check;
  content: counter(check, decimal-leading-zero);
  position: absolute;
  top: 0.78rem;
  left: 0;
  color: var(--warm-dark);
  font-family: var(--font-display);
  font-weight: 700;
}
.cross-link {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--line);
  background: #fff;
  box-shadow: var(--shadow);
}
.cross-link h3 { margin: 0; }
.cross-link p { margin: 0.35rem 0 0; color: var(--muted); font-size: 0.9rem; }
.cross-link .button { white-space: nowrap; }
.faq details { border-top: 1px solid var(--line); padding: 1rem 0; }
.faq details:last-child { border-bottom: 1px solid var(--line); }
.faq summary { cursor: pointer; font-family: var(--font-display); font-weight: 700; }
.faq details p { color: var(--muted); }

.site-footer {
  padding: 3rem 0;
  color: #c8d4ef;
  background: #0d1c4d;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: start;
}
.site-footer .brand { color: #fff; }
.site-footer p { max-width: 560px; margin: 0.9rem 0 0; color: #aebdde; font-size: 0.85rem; }
.footer-links { display: flex; flex-wrap: wrap; gap: 1rem; }
.footer-links a { color: #fff; font-size: 0.85rem; }
.copyright { margin-top: 2.2rem !important; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.16); }

@media (max-width: 820px) {
  .hero-grid, .feature { grid-template-columns: 1fr; }
  .route-map { min-height: auto; }
  .route-card:first-child, .route-card:last-child { transform: none; }
  .article-hero .route-map { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
  .article-hero .route-card { min-width: 0; padding: 0.75rem; }
  .article-hero .route-card p { display: none; }
  .article-hero .route-card strong { display: block; font-size: 0.78rem; line-height: 1.45; }
  .decision-panel { min-height: 260px; }
  .principles, .path-grid, .type-grid { grid-template-columns: 1fr; }
  .section-head { align-items: flex-start; flex-direction: column; }
  .toc ol { columns: 1; }
  .cross-link { grid-template-columns: 1fr; }
  .cross-link .button { justify-self: start; }
  .footer-grid { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .header-inner { align-items: flex-start; flex-direction: column; padding: 0.7rem 0; }
  .umbrella-nav { width: 100%; justify-content: flex-start; overflow-x: auto; }
}
@media (max-width: 520px) {
  .header-inner, .container, .reading { width: min(calc(100% - 1.25rem), var(--wide)); }
  .brand-section { display: none; }
  .umbrella-nav a { padding-inline: 0.6rem; }
  .hero-actions .button { width: 100%; }
  .disclosure { display: block; padding: 0.7rem 0.8rem; font-size: 0.8rem; line-height: 1.55; }
  .disclosure strong { display: block; margin-bottom: 0.25rem; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition-duration: 0.01ms !important; }
}
`;

function nav() {
  return `
    <a class="skip-link" href="#main">本文へ移動</a>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="${shoppingPath}" aria-label="Petrichor Shopping ホーム">
          <img class="brand-mark" src="/static/favicon.svg" alt="" width="28" height="28">
          <span class="brand-copy">
            <span class="brand-name">Petrichor</span>
            <span class="brand-section">Shopping Guide</span>
          </span>
        </a>
        <nav class="umbrella-nav" aria-label="Petrichor サービス">
          <a href="${shoppingPath}" aria-current="page">Shopping</a>
          <a href="${aiGuidePath}">AI解説</a>
          <a href="${learningPath}">Learning</a>
        </nav>
      </div>
    </header>
  `;
}

function disclosure({ hasAffiliateLink = false, hasRakutenButtons = false } = {}) {
  const label = hasAffiliateLink ? "広告・PR" : "広告方針";
  const disclosureText = hasAffiliateLink
    ? "本ページには楽天アフィリエイトの広告リンクが含まれます。リンク経由で購入されると、運営者に報酬が入る場合があります。"
    : hasRakutenButtons
      ? "現在の楽天ボタンは広告リンクではなく、楽天市場の通常検索へ移動します。広告リンクを設定した場合は、この位置で明示します。"
      : "当サイトは楽天アフィリエイトを利用します。広告リンクを含むページでは、最初に「広告・PR」と明示します。";
  return `
    <aside class="disclosure" aria-label="広告・PRについて">
      <strong>${label}</strong>
      <span>${escapeHtml(disclosureText)}</span>
    </aside>
  `;
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="${shoppingPath}">
              <img class="brand-mark" src="/static/favicon.svg" alt="" width="28" height="28">
              <span class="brand-name">Petrichor Shopping</span>
            </a>
            <p>比較軸と確認手順を先に示し、買う前の迷いを小さくするガイド。AI解説と学びのコンテンツも、同じPetrichorの中でつながっています。</p>
          </div>
          <nav class="footer-links" aria-label="フッターナビゲーション">
            <a href="${shoppingPath}">Shopping</a>
            <a href="${aiGuidePath}">AI解説</a>
            <a href="${learningPath}">Learning</a>
            <a href="${privacyPath}">プライバシー</a>
          </nav>
        </div>
        <p class="copyright">© ${new Date().getFullYear()} Petrichor. 商品条件は移動先の販売ページでご確認ください。</p>
      </div>
    </footer>
  `;
}

function shell({ title, description, canonical, body, jsonLd, pageCss = "", pageScript = "" }) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="Petrichor Shopping">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#10287d">
  <style>${css}${pageCss}</style>
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>
</head>
<body>
  ${nav()}
  ${body}
  ${footer()}
  ${pageScript ? `<script>${pageScript}</script>` : ""}
</body>
</html>
`;
}

const hubCanonical = `${siteUrl}/shopping/`;
const articleCanonical = `${siteUrl}/shopping/carry-on-suitcase-1-3-nights/`;
const articleHasAffiliateLink = ["featured", "lightweight", "expandable"]
  .some((key) => linkFor(key).isAffiliate);
const recorderHasAffiliateLink = ["aiRecorder", "plaudNote", "plaudNotePin", "nottaMemo"]
  .some((key) => linkFor(key).isAffiliate);
const recorderPage = createAiRecorderPage({
  siteUrl,
  shoppingPath,
  aiGuidePath,
  learningPath,
  disclosureHtml: disclosure({
    hasAffiliateLink: recorderHasAffiliateLink,
    hasRakutenButtons: true
  }),
  ctas: {
    aiRecorder: cta("aiRecorder", "result_primary"),
    plaudNote: cta("plaudNote", "result_primary"),
    plaudNotePin: cta("plaudNotePin", "result_primary"),
    nottaMemo: cta("nottaMemo", "result_secondary")
  }
});

const hubBody = `
  <main id="main">
    <div class="container">
      ${disclosure()}
    </div>
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <p class="eyebrow">Petrichor Shopping Guide</p>
          <h1>買う前に、<br>「必要か」を確かめる。</h1>
          <p class="hero-lead">仕事と学びのデジタル道具を、ランキングではなく失敗回避から考えるガイド。費用、使う場面、データ条件を先に整理します。</p>
          <div class="hero-actions">
            <a class="button button-primary" href="${recorderPath}">AIレコーダーを1分診断 <span aria-hidden="true">→</span></a>
            <a class="button button-secondary" href="${aiGuidePath}">AI解説を読む <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div class="route-map" aria-label="Petrichor内の導線">
          <a class="route-card" href="${shoppingPath}">
            <span class="route-step">01 / CHOOSE</span>
            <strong>Shopping</strong>
            <p>必要性と総費用を確かめ、買わない選択も残す。</p>
          </a>
          <a class="route-card" href="${aiGuidePath}">
            <span class="route-step">02 / UNDERSTAND</span>
            <strong>AI解説</strong>
            <p>AIの仕組みと使いどころを、平易な言葉で理解する。</p>
          </a>
          <a class="route-card" href="${learningPath}">
            <span class="route-step">03 / PRACTICE</span>
            <strong>Petrichor Learning</strong>
            <p>理解したことを、仕事や学びで使える形にする。</p>
          </a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Featured guide</p>
            <h2>AIレコーダー、本当に必要？</h2>
            <p class="section-intro">5つの条件と3年間の費用から、「買う」「スマホで試す」「規定を先に確認」を分ける購入前診断です。</p>
          </div>
          <a class="text-link" href="${recorderPath}">1分診断へ →</a>
        </div>
        <article class="feature">
          <figure class="editorial-figure feature-visual">
            <picture>
              <source type="image/avif" srcset="/static/shopping/ai-recorder-decision-640.avif 640w, /static/shopping/ai-recorder-decision-960.avif 960w, /static/shopping/ai-recorder-decision-1536.avif 1536w" sizes="(max-width: 760px) calc(100vw - 2rem), 1200px">
              <source type="image/webp" srcset="/static/shopping/ai-recorder-decision-640.webp 640w, /static/shopping/ai-recorder-decision-960.webp 960w, /static/shopping/ai-recorder-decision-1536.webp 1536w" sizes="(max-width: 760px) calc(100vw - 2rem), 1200px">
              <img class="editorial-image" src="/static/shopping/ai-recorder-decision-1536.webp" alt="録音、文字起こし、情報管理、費用確認から購入判断へ進む流れのイメージ図" width="1536" height="983" loading="lazy" decoding="async">
            </picture>
            <figcaption>特定の商品・順位を示さず、録音から費用・情報管理の確認までを表した編集用イメージです。</figcaption>
          </figure>
          <div class="feature-copy">
            <div class="meta-row">
              <span class="tag">1分診断</span>
              <span class="tag">3年総額</span>
              <span class="tag">データ条件</span>
            </div>
            <h3>AIレコーダー必要度・3年総額診断</h3>
            <p>月間利用量、通話・対面・装着、スマホでの代替、継続費用、AI学習条件を順に確認。実機未検証の精度ランキングはしません。</p>
            <div class="hero-actions">
              <a class="button button-primary" href="${recorderPath}">5つの条件で判定する <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <aside class="decision-panel" aria-label="このガイドで確認する順序">
            <span>BUY OR NOT</span>
            <strong>買う理由がなければ、買わない。</strong>
            <ol>
              <li>月に何分使うか</li>
              <li>スマホでは何が不足か</li>
              <li>3年間でいくらかかるか</li>
              <li>録音許可とデータ条件</li>
            </ol>
          </aside>
        </article>
        <aside class="cross-link" style="margin-top:1.25rem">
          <div>
            <h3>旅行用品の既存ガイドも残しています</h3>
            <p>1〜3泊向けスーツケースを、航空会社の条件・外寸・重さ・使う場面から確認します。</p>
          </div>
          <a class="button button-secondary" href="${articlePath}">スーツケース比較へ <span aria-hidden="true">→</span></a>
        </aside>
      </div>
    </section>

    <section class="section section-soft">
      <div class="container">
        <p class="eyebrow">Editorial promise</p>
        <h2>数字を盛らず、確認できることから書く。</h2>
        <p class="section-intro">価格やプランは動き、AI機能のデータ条件もサービスごとに違います。変わりやすい事実を断定せず、読者が公式情報で確かめられる順序を大切にします。</p>
        <div class="principles" style="margin-top:2rem">
          <article class="principle">
            <span class="principle-no">01 / SOURCE</span>
            <h3>最新条件は公式で確認</h3>
            <p>メーカー、料金ページ、販売ページの最新情報を、購入直前の判断材料にします。</p>
          </article>
          <article class="principle">
            <span class="principle-no">02 / AXIS</span>
            <h3>比較軸を先に示す</h3>
            <p>商品名の羅列ではなく、用途ごとに見るポイントを整理します。</p>
          </article>
          <article class="principle">
            <span class="principle-no">03 / HONESTY</span>
            <h3>体験は本人の言葉だけ</h3>
            <p>使っていないものを使ったように書かず、未確認事項は明示します。</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <p class="eyebrow">One domain, three paths</p>
        <h2>買い物の先に、理解と学びを。</h2>
        <div class="path-grid" style="margin-top:2rem">
          <article class="path-card">
            <span class="path-label">SHOPPING</span>
            <h3>必要性を診断する</h3>
            <p>仕事や学びの道具を、費用と使う条件から選びます。</p>
            <p><a class="text-link" href="${recorderPath}">AIレコーダー診断へ →</a></p>
          </article>
          <article class="path-card">
            <span class="path-label">AI GUIDE</span>
            <h3>AIを理解する</h3>
            <p>話題の言葉を、初めての人にもわかる形でほどきます。</p>
            <p><a class="text-link" href="${aiGuidePath}">AI解説へ →</a></p>
          </article>
          <article class="path-card">
            <span class="path-label">LEARNING</span>
            <h3>手を動かして学ぶ</h3>
            <p>知識を仕事や学習で使えるスキルへつなげます。</p>
            <p><a class="text-link" href="${learningPath}">Learningへ →</a></p>
          </article>
        </div>
      </div>
    </section>
  </main>
`;

const hubJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Petrichor Shopping",
    url: hubCanonical,
    description: "必要性、総費用、データ条件から失敗を避ける、Petrichorの買い物ガイド。"
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Petrichor", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shopping", item: hubCanonical }
    ]
  }
];

const articleBody = `
  <main id="main">
    <div class="container">
      <nav class="crumbs" aria-label="パンくず">
        <ol>
          <li><a href="${aiGuidePath}">Petrichor</a></li>
          <li><a href="${shoppingPath}">Shopping</a></li>
          <li aria-current="page">1〜3泊向けスーツケース</li>
        </ol>
      </nav>
      ${disclosure({ hasAffiliateLink: articleHasAffiliateLink, hasRakutenButtons: true })}
    </div>

    <header class="hero article-hero">
      <div class="container hero-grid">
        <div>
          <p class="eyebrow">Carry-on suitcase guide</p>
          <h1>1〜3泊向け<br>機内持ち込み対応<br>スーツケースの選び方</h1>
          <p class="hero-lead">「対応」と書いてあるだけでは決めない。航空会社の条件、外寸、重さ、開き方を順番に確認するための比較ガイドです。</p>
          <div class="article-meta">
            <span>選定テーマ：短期旅行・出張</span>
            <span>価格・在庫：移動先で要確認</span>
            <span>実体験：未掲載・未確認の体験は断定しません</span>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" href="#types">3タイプを比較する</a>
            <a class="button button-secondary" href="#steps">購入前チェックを見る</a>
          </div>
        </div>
        <div class="route-map" aria-hidden="true">
          <div class="route-card">
            <span class="route-step">CHECK 01</span>
            <strong>航空会社の最新条件</strong>
            <p>路線・機材・運賃種別も確認。</p>
          </div>
          <div class="route-card">
            <span class="route-step">CHECK 02</span>
            <strong>外寸と重量</strong>
            <p>キャスターや持ち手を含む表記を見る。</p>
          </div>
          <div class="route-card">
            <span class="route-step">CHECK 03</span>
            <strong>使う場面</strong>
            <p>移動中に何を取り出すかで機能を選ぶ。</p>
          </div>
        </div>
      </div>
    </header>

    <article class="article-body">
      <div class="reading">
        <div class="lead-box">
          <strong>先に結論：</strong>
          機内持ち込みの可否を商品名だけで判断せず、利用する航空会社の公式条件と、購入候補の外寸・重量を照合してください。そのうえで、移動中にPCや書類を出すならフロントオープン、荷物量の余裕を優先するなら拡張機能、取り回しを優先するなら軽さを比較します。
        </div>

        <nav class="toc" aria-label="目次">
          <strong>この記事で確認すること</strong>
          <ol>
            <li><a href="#why-check">「対応」だけで決められない理由</a></li>
            <li><a href="#axes">4つの比較軸</a></li>
            <li><a href="#types">3タイプの違い</a></li>
            <li><a href="#steps">購入前の確認手順</a></li>
            <li><a href="#experience">実体験の掲載方針</a></li>
            <li><a href="#candidates">楽天市場で候補を探す</a></li>
          </ol>
        </nav>

        <h2 id="why-check">「機内持ち込み対応」だけで決められない理由</h2>
        <p>手荷物の条件は、航空会社だけでなく、路線、機材、運賃種別などで変わる場合があります。さらに、スーツケースのサイズ表記が本体だけなのか、キャスターやハンドルを含む外寸なのかも確認が必要です。</p>
        <p>拡張機能付きなら、通常時には条件内でも、拡張した状態では外れる可能性があります。購入前には「使う便の公式条件」と「実際に持ち込む状態の外寸・重量」を組み合わせて判断するのが安全です。</p>
        <aside class="note-box">
          <strong>このガイドの役割</strong>
          <p>特定の航空会社に共通する上限値を断定するものではありません。搭乗前には、利用する航空会社の公式サイトで最新情報を確認してください。</p>
        </aside>

        <figure class="editorial-figure article-visual">
          <picture>
            <source type="image/avif" srcset="/static/shopping/carry-on-measurement-guide-640.avif 640w, /static/shopping/carry-on-measurement-guide-960.avif 960w, /static/shopping/carry-on-measurement-guide-1200.avif 1200w" sizes="(max-width: 760px) calc(100vw - 2rem), 760px">
            <source type="image/webp" srcset="/static/shopping/carry-on-measurement-guide-640.webp 640w, /static/shopping/carry-on-measurement-guide-960.webp 960w, /static/shopping/carry-on-measurement-guide-1200.webp 1200w" sizes="(max-width: 760px) calc(100vw - 2rem), 760px">
            <img class="editorial-image" src="/static/shopping/carry-on-measurement-guide-1200.webp" alt="一般的なスーツケースの外寸測定位置と、通常時・拡張時を分けて確認する方法のイメージ図" width="1200" height="800" loading="lazy" decoding="async">
          </picture>
          <figcaption>イメージ図。外寸はキャスター・ハンドルを含むか、拡張前後で変わるかを確認し、利用便の公式条件と照合してください。</figcaption>
        </figure>

        <h2 id="axes">迷いを減らす4つの比較軸</h2>
        <h3>1. 外寸は「移動時の状態」で見る</h3>
        <p>キャスター、固定されたハンドル、ポケットなどを含む外寸かを商品ページで確かめます。拡張できる場合は、通常時と拡張時の両方を確認します。</p>
        <h3>2. 本体重量は荷物の余白になる</h3>
        <p>同じ大きさでも本体重量は異なります。持ち込める総重量に条件がある場合、本体が重いほど中に入れられる荷物の余白は小さくなります。</p>
        <h3>3. 開き方は「どこで取り出すか」で選ぶ</h3>
        <p>フロントオープンは、移動中にPCや書類へアクセスしたい場面と相性があります。一方で、収納部の構成や開口部の広さは商品ごとに違うため、写真と寸法を確認します。</p>
        <h3>4. ストッパーや拡張は使う場面で判断する</h3>
        <p>電車移動が多いならキャスターストッパー、帰りの荷物が増えやすいなら拡張機能が候補になります。ただし、機構の追加による重量や、拡張後の外寸も合わせて見ます。</p>

        <div class="comparison-wrap" role="region" aria-label="スーツケース機能の比較表" tabindex="0">
          <table class="comparison">
            <thead>
              <tr>
                <th scope="col">比較タイプ</th>
                <th scope="col">向きやすい場面</th>
                <th scope="col">確認したい点</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>フロントオープン＋ストッパー</td>
                <td>PCを取り出す、電車で移動する</td>
                <td>収納部の形、機構を含む重量、操作位置</td>
              </tr>
              <tr>
                <td>軽量スタンダード</td>
                <td>階段や乗り換えが多い、重量の余白を残したい</td>
                <td>耐久性に関する仕様、持ち手、キャスター</td>
              </tr>
              <tr>
                <td>拡張機能付き</td>
                <td>帰りに荷物が増えやすい</td>
                <td>拡張後の外寸、持ち込み条件、ファスナー部</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="types">用途から選ぶ3タイプ</h2>
      </div>

      <div class="container">
        <div class="type-grid">
          <article class="type-card featured-type">
            <span class="tag">移動中の出し入れ重視</span>
            <h3>フロントオープン＋ストッパー</h3>
            <p>PCや書類を開きやすく、電車内で転がりにくい機能を探す人向け。機構を含む重量と、内部の仕切り方まで確認します。</p>
            ${cta("featured")}
          </article>
          <article class="type-card">
            <span class="tag">取り回し重視</span>
            <h3>軽量スタンダード</h3>
            <p>階段や長い乗り換えを想定し、本体の軽さを優先したい人向け。軽さだけでなく、持ち手やキャスターの仕様も見ます。</p>
            ${cta("lightweight")}
          </article>
          <article class="type-card">
            <span class="tag">荷物の増加に備える</span>
            <h3>拡張機能付き</h3>
            <p>帰りの荷物が増えやすい人向け。拡張後の状態が機内持ち込み条件から外れないか、必ず別に確認します。</p>
            ${cta("expandable")}
          </article>
        </div>
      </div>

      <div class="reading">
        <h2 id="steps">購入前の確認手順</h2>
        <ol class="checklist">
          <li><strong>使う便を決める。</strong><br>航空会社、路線、機材、運賃種別がわかる範囲で整理します。</li>
          <li><strong>公式の手荷物条件を見る。</strong><br>サイズだけでなく、個数と重量、注意事項も確認します。</li>
          <li><strong>候補の外寸と本体重量を照合する。</strong><br>キャスターや持ち手を含むか、拡張時はどうなるかを見ます。</li>
          <li><strong>移動中に出すものを決める。</strong><br>PC、書類、充電器などを出すなら、開口部と収納場所を確認します。</li>
          <li><strong>販売条件を購入直前に再確認する。</strong><br>価格、送料、納期、在庫、返品条件は楽天市場の商品ページを優先します。</li>
        </ol>

        <section class="experience-box" id="experience" aria-labelledby="experience-title">
          <strong id="experience-title">実体験の掲載について</strong>
          <p>この記事では、運営者が確認していない使用感を「使った感想」として掲載しません。本人が実際に使った条件と製品を確認できた段階で、便利だった点と困った点を追記します。</p>
        </section>

        <h2 id="candidates">楽天市場で候補を探す</h2>
        <p>この時点では、特定商品を順位づけしていません。まず自分に必要なタイプを決め、移動先の商品ページで最新の仕様と販売条件を確認してください。</p>
        <div class="lead-box">
          <strong>最初の候補：</strong>
          短期の出張や旅行でPCを持ち歩き、電車移動も多いなら、フロントオープンとキャスターストッパーを軸に探せます。
          <div class="hero-actions">
            ${cta("featured")}
          </div>
        </div>

        <h2>買い物の次に、AIを理解する</h2>
        <p>比較や検索にAIを使うなら、「AIがもっともらしく間違えることがある」という前提も大切です。PetrichorのAI解説とLearningで、情報を確かめながら使う考え方を続けて学べます。</p>
        <aside class="cross-link">
          <div>
            <h3>AIの仕組みをやさしく読む</h3>
            <p>言葉の意味から、できること・できないことまで。</p>
          </div>
          <a class="button button-primary" href="${aiGuidePath}">AI解説へ <span aria-hidden="true">→</span></a>
        </aside>
        <aside class="cross-link">
          <div>
            <h3>Petrichor Learningで手を動かす</h3>
            <p>情報の確かめ方を、実践できる学びに変える。</p>
          </div>
          <a class="button button-secondary" href="${learningPath}">Learningへ <span aria-hidden="true">→</span></a>
        </aside>

        <section class="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">よくある確認</h2>
          <details>
            <summary>「機内持ち込み対応」なら、どの便でも持ち込めますか？</summary>
            <p>一律には言えません。航空会社、路線、機材、運賃種別などで条件が変わる場合があります。搭乗する便について、航空会社の公式情報を確認してください。</p>
          </details>
          <details>
            <summary>拡張機能を使っても機内持ち込みできますか？</summary>
            <p>拡張すると外寸が変わるため、通常時と同じ扱いになるとは限りません。拡張後の外寸と、利用する便の条件を照合してください。</p>
          </details>
          <details>
            <summary>このページの商品は実際に使って比較していますか？</summary>
            <p>現段階では運営者の実体験は未記入です。使っていない商品を使ったようには書かず、本人が確認できた体験だけを上の専用欄へ追記します。</p>
          </details>
        </section>
      </div>
    </article>
  </main>
`;

const faqEntities = [
  {
    "@type": "Question",
    name: "「機内持ち込み対応」なら、どの便でも持ち込めますか？",
    acceptedAnswer: {
      "@type": "Answer",
      text: "一律には言えません。航空会社、路線、機材、運賃種別などで条件が変わる場合があります。搭乗する便について、航空会社の公式情報を確認してください。"
    }
  },
  {
    "@type": "Question",
    name: "拡張機能を使っても機内持ち込みできますか？",
    acceptedAnswer: {
      "@type": "Answer",
      text: "拡張すると外寸が変わるため、通常時と同じ扱いになるとは限りません。拡張後の外寸と、利用する便の条件を照合してください。"
    }
  },
  {
    "@type": "Question",
    name: "このページの商品は実際に使って比較していますか？",
    acceptedAnswer: {
      "@type": "Answer",
      text: "現段階では運営者の実体験は未記入です。使っていない商品を使ったようには書かず、本人が確認できた体験だけを専用欄へ追記します。"
    }
  }
];

const articleJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "1〜3泊向け機内持ち込み対応スーツケースの選び方",
    description: "航空会社の条件、外寸、重量、開き方から、短期旅行向けスーツケースの比較軸を整理するガイド。",
    mainEntityOfPage: articleCanonical,
    author: { "@type": "Organization", name: "Petrichor" },
    publisher: { "@type": "Organization", name: "Petrichor", url: siteUrl },
    isPartOf: { "@type": "WebSite", name: "Petrichor Shopping", url: hubCanonical }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Petrichor", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shopping", item: hubCanonical },
      { "@type": "ListItem", position: 3, name: "1〜3泊向けスーツケース", item: articleCanonical }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntities
  }
];

const hubHtml = shell({
  title: "Petrichor Shopping｜買う前に必要性と総費用を診断",
  description: "仕事と学びのデジタル道具を、ランキングではなく失敗回避から考えるPetrichorの買い物ガイド。AIレコーダーの必要度と3年総額を診断できます。",
  canonical: hubCanonical,
  body: hubBody,
  jsonLd: hubJsonLd
});

const articleHtml = shell({
  title: "1〜3泊向け機内持ち込み対応スーツケースの選び方｜Petrichor Shopping",
  description: "機内持ち込み対応の表示だけで決めず、航空会社の条件、外寸、重量、フロントオープンやストッパーを比較する短期旅行向けガイド。",
  canonical: articleCanonical,
  body: articleBody,
  jsonLd: articleJsonLd
});

const recorderHtml = shell({
  title: recorderPage.title,
  description: recorderPage.description,
  canonical: recorderPage.canonical,
  body: recorderPage.body,
  jsonLd: recorderPage.jsonLd,
  pageCss: recorderPageCss,
  pageScript: recorderPageScript
});

const articleOutput = path.join(outputRoot, "carry-on-suitcase-1-3-nights");
const recorderOutput = path.join(outputRoot, "ai-recorder-cost-check");
await rm(staticOutput, { recursive: true, force: true });
await mkdir(path.dirname(staticOutput), { recursive: true });
await cp(staticSource, staticOutput, { recursive: true });
await mkdir(outputRoot, { recursive: true });
await mkdir(articleOutput, { recursive: true });
await mkdir(recorderOutput, { recursive: true });
await writeFile(path.join(outputRoot, "index.html"), hubHtml, "utf8");
await writeFile(path.join(articleOutput, "index.html"), articleHtml, "utf8");
await writeFile(path.join(recorderOutput, "index.html"), recorderHtml, "utf8");

// robots.txt が /shopping/sitemap.xml を指しているので、必ずここで生成する。
// 記事を追加したらこの配列に足すこと(足し忘れは check.mjs が検出する)。
const sitemapEntries = [
  { loc: hubCanonical, priority: "0.9" },
  { loc: recorderPage.canonical, priority: "0.9" },
  { loc: articleCanonical, priority: "0.8" }
];
const lastmod = new Date().toISOString().slice(0, 10);
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
await writeFile(path.join(outputRoot, "sitemap.xml"), sitemapXml, "utf8");

console.log("Petrichor Shopping built:");
console.log(`- ${path.join(outputRoot, "index.html")}`);
console.log(`- ${path.join(recorderOutput, "index.html")}`);
console.log(`- ${path.join(articleOutput, "index.html")}`);
console.log(`- ${path.join(outputRoot, "sitemap.xml")} (${sitemapEntries.length} URLs)`);
