// 記事ごとのOGP画像(1200×630)を作る。
//
//   node affiliate/ogp.mjs            … 画像がまだ無い記事だけ作る(新しい記事を書いたあとはこれ)
//   node affiliate/ogp.mjs <slug>...  … 指定した記事を作り直す(タイトルを変えたとき)
//   node affiliate/ogp.mjs --all      … 全記事を作り直す(デザインを変えたとき)
//
// 設計上の判断:
// - 画像はリポジトリに入れて公開する(affiliate/static/ogp/<slug>.jpg)。
//   グラデーションと斜線の背景はPNGだと1枚500KBを超えるため、JPEGにしている。
//   デプロイのたびにブラウザを入れて生成すると、ビルドが遅く壊れやすくなる。
//   build.mjs は画像があればそれを使い、無ければ共通の ogp.png に戻るので、
//   ここを実行し忘れても公開は止まらない。
// - 描画にはPlaywright(Chromium)を使う。サイトの依存には入れず、
//   使える環境でだけ実行する。見つからなければ何もせずに理由を出して終わる。
// - フォントはサイトと同じGoogle Fontsを読み込む。読み込めなかったときは
//   見た目の違う画像を作らないよう、生成を中止する。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(HERE, "content");
const OUT_DIR = path.join(HERE, "static", "ogp");
const SITE_NAME = "AIツールの透視図";
const SITE_HOST = "petrichot.com";

const PLAYWRIGHT_CANDIDATES = [
  "playwright",
  process.env.PLAYWRIGHT_PATH,
  "/opt/node22/lib/node_modules/playwright/index.mjs",
].filter(Boolean);

async function loadPlaywright() {
  for (const spec of PLAYWRIGHT_CANDIDATES) {
    try {
      const target = spec.startsWith("/") ? pathToFileURL(spec).href : spec;
      const mod = await import(target);
      return mod.chromium ? mod : mod.default;
    } catch {
      // 次の候補を試す
    }
  }
  return null;
}

function readArticle(slug) {
  const src = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.md`), "utf8");
  const fm = src.match(/^---\n([\s\S]*?)\n---/);
  const field = (name) => (fm && fm[1].match(new RegExp(`^${name}:\\s*(.+)$`, "m")) || [])[1]?.trim() || "";
  return { slug, title: field("title"), category: field("category") };
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// 「主題｜補足」の形のタイトルは、補足を小さい副題に分ける。
function splitTitle(title) {
  const m = title.match(/^(.+?)\s*[｜|]\s*(.+)$/);
  return m ? { main: m[1], sub: m[2] } : { main: title, sub: "" };
}

function html({ title, category }) {
  const { main, sub } = splitTitle(title);
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Space+Grotesk:wght@600&display=block" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    position: relative; overflow: hidden;
    font-family: "Zen Kaku Gothic New", sans-serif; color: #fff;
    background: radial-gradient(circle at 80% 15%, #1f4ad1 0%, #10287d 42%, #06123a 100%);
  }
  .lines {
    position: absolute; inset: 0;
    background-image: repeating-linear-gradient(115deg, rgba(125, 175, 255, 0.08) 0 1px, transparent 1px 26px);
  }
  .slab {
    position: absolute; right: -120px; top: -60px; width: 560px; height: 760px;
    border: 2px solid rgba(125, 175, 255, 0.22);
    transform: skewX(-18deg);
  }
  .slab.inner { right: -60px; border-color: rgba(125, 175, 255, 0.12); }
  .bar {
    position: absolute; left: 64px; top: 72px; bottom: 72px; width: 8px;
    background: #6f9dff; box-shadow: 0 0 24px rgba(111, 157, 255, 0.9);
  }
  .cat {
    position: absolute; left: 104px; top: 72px;
    font-size: 26px; font-weight: 700; letter-spacing: 0.08em; color: #cfe0ff;
    padding: 8px 28px 8px 20px; background: rgba(111, 157, 255, 0.18);
    clip-path: polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%);
  }
  .title {
    position: absolute; left: 104px; right: 96px; top: 150px; height: 330px;
    display: flex; align-items: center;
  }
  .title h1 {
    font-weight: 900; line-height: 1.36; letter-spacing: 0.02em;
    text-shadow: 0 2px 18px rgba(4, 12, 40, 0.55);
    word-break: auto-phrase; line-break: strict;
  }
  .title .sub { margin-top: 18px; font-size: 34px; font-weight: 700; line-height: 1.4; color: #cfe0ff; }
  .title > div { width: 100%; }
  .foot {
    position: absolute; left: 104px; right: 96px; bottom: 64px;
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .site { font-size: 30px; font-weight: 700; letter-spacing: 0.06em; }
  .host { font-family: "Space Grotesk", sans-serif; font-size: 24px; color: #a9c3ff; letter-spacing: 0.04em; }
</style></head>
<body>
  <div class="lines"></div><div class="slab"></div><div class="slab inner"></div>
  <div class="bar"></div>
  ${category ? `<div class="cat">${escapeHtml(category)}</div>` : ""}
  <div class="title"><div><h1 id="t">${escapeHtml(main)}</h1>${sub ? `<p class="sub">${escapeHtml(sub)}</p>` : ""}</div></div>
  <div class="foot"><span class="site">${SITE_NAME}</span><span class="host">${SITE_HOST}</span></div>
</body></html>`;
}

// タイトルが枠(最大3行)に収まるまで文字を小さくする。
const FIT_SCRIPT = () => {
  const h = document.getElementById("t");
  const box = h.closest(".title");
  const block = h.parentElement;
  for (let size = 72; size >= 44; size -= 2) {
    h.style.fontSize = `${size}px`;
    const lines = Math.round(h.getBoundingClientRect().height / (size * 1.36));
    if (lines <= 3 && block.getBoundingClientRect().height <= box.clientHeight) return size;
  }
  return 44;
};

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const named = args.filter((a) => !a.startsWith("--"));

  const slugs = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort();
  for (const s of named) if (!slugs.includes(s)) throw new Error(`記事が見つかりません: ${s}`);

  const targets = named.length ? named : all ? slugs : slugs.filter((s) => !fs.existsSync(path.join(OUT_DIR, `${s}.jpg`)));
  if (!targets.length) {
    console.log("[ogp] 作る画像はありません(全記事に画像があります)。");
    return;
  }

  const pw = await loadPlaywright();
  if (!pw) {
    console.log("[ogp] Playwrightが見つからないため、画像を作れませんでした。共通のOGP画像のまま公開されます。");
    console.log(`[ogp] 未作成: ${targets.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await pw.chromium.launch(
    fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {},
  );
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    for (const slug of targets) {
      const a = readArticle(slug);
      if (!a.title) throw new Error(`${slug}: title が読めません`);
      await page.setContent(html(a), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const ok = await page.evaluate(() => document.fonts.check('900 60px "Zen Kaku Gothic New"', "あ"));
      if (!ok) throw new Error("フォント(Zen Kaku Gothic New)を読み込めませんでした。ネットワークを確認してください。");
      const size = await page.evaluate(FIT_SCRIPT);
      const out = path.join(OUT_DIR, `${slug}.jpg`);
      await page.screenshot({ path: out, type: "jpeg", quality: 90 });
      console.log(`[ogp] ${slug}.jpg (${size}px, ${Math.round(fs.statSync(out).size / 1024)}KB)`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`[ogp] ${err.message}`);
  process.exit(1);
});
