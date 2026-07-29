// assets-inbox/ に置かれたファイルを検査する。
//
// 外部のエージェント(Codex等)が置いたものを、そのままサイトに載せないための門。
// 検査対象は3つ:
//   1. 素性 — manifest.json に出典とライセンスが書かれているか
//   2. 中身 — SVGにスクリプトが混ざっていないか
//   3. 形    — 形式・容量・ファイル名が想定どおりか
//
// 使い方: node affiliate/check-assets.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INBOX = path.join(HERE, "..", "assets-inbox");
const MANIFEST = path.join(INBOX, "manifest.json");

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const MAX_BYTES = 500 * 1024;
const SAFE_NAME = /^[A-Za-z0-9._-]+$/;
// manifest本体と説明書は検査対象外。
const SKIP = new Set(["manifest.json", "manifest.example.json", "README.md"]);

// affiliate/build.mjs の assertSafeSvg と同じ基準。
// 受け取った時点で弾きたいので、ここにも同じ検査を置いている。
const SVG_ALLOWED_TAGS = new Set([
  "svg", "g", "defs", "title", "desc", "path", "rect", "circle", "ellipse",
  "line", "polyline", "polygon", "text", "tspan", "marker", "linearGradient",
  "radialGradient", "stop", "use", "symbol", "clipPath", "mask",
]);

function checkSvg(svg, errors, name) {
  if (/<\s*script/i.test(svg)) errors.push(`${name}: <script> が含まれています`);
  if (/\son[a-zA-Z]+\s*=/.test(svg)) errors.push(`${name}: イベントハンドラ属性(onclick等)が含まれています`);
  if (/javascript\s*:/i.test(svg)) errors.push(`${name}: javascript: URL が含まれています`);
  if (/<\s*foreignObject/i.test(svg)) errors.push(`${name}: <foreignObject> は使えません`);
  for (const m of svg.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9:_-]*)/g)) {
    if (!SVG_ALLOWED_TAGS.has(m[1])) {
      errors.push(`${name}: 図形以外のタグが含まれています <${m[1]}>`);
      break;
    }
  }
}

function main() {
  if (!fs.existsSync(INBOX)) {
    console.log("[check-assets] assets-inbox がありません。何もしません。");
    return;
  }

  const files = fs.readdirSync(INBOX).filter((f) => !SKIP.has(f) && !f.startsWith("."));
  if (!files.length) {
    console.log("[check-assets] 受け取ったファイルはありません。");
    return;
  }

  const errors = [];

  if (!fs.existsSync(MANIFEST)) {
    console.error(`[check-assets] manifest.json がありません(ファイルは${files.length}件あります)。`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch (err) {
    console.error(`[check-assets] manifest.json が読めません: ${err.message}`);
    process.exit(1);
  }

  const entries = manifest.assets || [];
  const byFile = new Map();
  for (const e of entries) {
    if (!e.file) { errors.push("manifest: file のない項目があります"); continue; }
    if (byFile.has(e.file)) errors.push(`manifest: ${e.file} が重複しています`);
    byFile.set(e.file, e);
  }

  // manifestにあるのに実体がない
  for (const name of byFile.keys()) {
    if (!files.includes(name)) errors.push(`manifest にあるファイルが見つかりません: ${name}`);
  }

  for (const name of files) {
    const full = path.join(INBOX, name);
    if (fs.statSync(full).isDirectory()) {
      errors.push(`${name}: ディレクトリは受け取れません`);
      continue;
    }

    if (!SAFE_NAME.test(name)) errors.push(`${name}: 使えない文字がファイル名に含まれています`);

    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) errors.push(`${name}: 対応していない形式です(${ext || "拡張子なし"})`);

    const size = fs.statSync(full).size;
    if (size > MAX_BYTES) {
      errors.push(`${name}: 容量超過 ${(size / 1024).toFixed(0)}KB (上限 ${MAX_BYTES / 1024}KB)`);
    }

    const entry = byFile.get(name);
    if (!entry) {
      errors.push(`${name}: manifest.json に記載がありません`);
    } else {
      for (const key of ["source", "license", "alt"]) {
        if (!String(entry[key] || "").trim()) errors.push(`${name}: manifest の ${key} が空です`);
      }
    }

    if (ext === ".svg") checkSvg(fs.readFileSync(full, "utf8"), errors, name);
  }

  console.log(`[check-assets] ${files.length}件を検査しました。`);
  if (errors.length) {
    console.error(`\n[check-assets] ${errors.length}件の問題があります:`);
    for (const e of errors) console.error(`  ERROR  ${e}`);
    process.exit(1);
  }
  console.log("[check-assets] 問題ありません。affiliate/static/ へ移せます。");
}

main();
