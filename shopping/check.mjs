import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.resolve(here, "..", "dist", "shopping");
const files = [
  {
    path: path.join(outputRoot, "index.html"),
    required: [
      'rel="canonical" href="https://petrichot.com/shopping/"',
      'href="/"',
      'href="/learning/"',
      "広告方針"
    ]
  },
  {
    path: path.join(outputRoot, "carry-on-suitcase-1-3-nights", "index.html"),
    required: [
      'rel="canonical" href="https://petrichot.com/shopping/carry-on-suitcase-1-3-nights/"',
      "航空会社、路線、機材、運賃種別",
      "楽天市場で候補を確認",
      "本人が実際に使った条件と製品を確認できた段階",
      "現在は広告リンクではなく、楽天市場の通常検索へ移動します"
    ]
  }
];

let checked = 0;

for (const file of files) {
  const html = await readFile(file.path, "utf8");
  if (!html.startsWith("<!doctype html>")) {
    throw new Error(`${file.path}: doctype がありません。`);
  }
  for (const token of file.required) {
    if (!html.includes(token)) {
      throw new Error(`${file.path}: 必須要素がありません: ${token}`);
    }
  }
  for (const forbidden of ["【ここに", "追記待ち"]) {
    if (html.includes(forbidden)) {
      throw new Error(`${file.path}: 公開不可の内部プレースホルダーがあります: ${forbidden}`);
    }
  }

  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  if (!match) {
    throw new Error(`${file.path}: JSON-LD がありません。`);
  }
  const jsonLd = JSON.parse(match[1]);
  if (!Array.isArray(jsonLd) || jsonLd.length < 2) {
    throw new Error(`${file.path}: JSON-LD の構成が不足しています。`);
  }
  checked += 1;
}

console.log(`Petrichor Shopping check passed: ${checked} pages`);
