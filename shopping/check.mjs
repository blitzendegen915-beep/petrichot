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
      "広告方針",
      "shopping-compare-hero-1600.webp"
    ]
  },
  {
    path: path.join(outputRoot, "carry-on-suitcase-1-3-nights", "index.html"),
    required: [
      'rel="canonical" href="https://petrichot.com/shopping/carry-on-suitcase-1-3-nights/"',
      "航空会社、路線、機材、運賃種別",
      "楽天市場で候補を確認",
      "本人が実際に使った条件と製品を確認できた段階",
      "現在は広告リンクではなく、楽天市場の通常検索へ移動します",
      "carry-on-measurement-guide-1200.webp"
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

  const editorialImages = [...html.matchAll(/<img\b[^>]*class=["'][^"']*editorial-image[^"']*["'][^>]*>/g)]
    .map((match) => match[0]);
  for (const image of editorialImages) {
    for (const attribute of ["alt", "width", "height", "loading", "decoding"]) {
      if (!new RegExp("\\b" + attribute + "=[\\\"'][^\\\"']+[\\\"']").test(image)) {
        throw new Error(file.path + ": 編集画像に " + attribute + " がありません: " + image);
      }
    }
  }

  const shoppingAssets = new Set(html.match(/\/static\/shopping\/[a-z0-9.-]+/g) || []);
  for (const asset of shoppingAssets) {
    const assetFile = path.resolve(outputRoot, "..", asset.slice(1));
    try {
      await readFile(assetFile);
    } catch {
      throw new Error(file.path + ": 参照画像がありません: " + asset);
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

// robots.txt が /shopping/sitemap.xml を指しているため、存在しないと404を晒すことになる。
// 生成ページ数とサイトマップの件数が一致しないと、記事の登録漏れに気づけないので突き合わせる。
const sitemapPath = path.join(outputRoot, "sitemap.xml");
let sitemapXml;
try {
  sitemapXml = await readFile(sitemapPath, "utf8");
} catch {
  throw new Error(
    `${sitemapPath}: sitemap.xml がありません。robots.txt が参照しているため404になります。`
  );
}
const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (locs.length !== checked) {
  throw new Error(
    `${sitemapPath}: 登録URLが${locs.length}件で、生成ページ${checked}件と一致しません。記事追加時はbuild.mjsのsitemapEntriesにも追加してください。`
  );
}
for (const required of [
  "https://petrichot.com/shopping/",
  "https://petrichot.com/shopping/carry-on-suitcase-1-3-nights/"
]) {
  if (!locs.includes(required)) {
    throw new Error(`${sitemapPath}: ${required} が登録されていません。`);
  }
}

console.log(`Petrichor Shopping check passed: ${checked} pages, sitemap ${locs.length} URLs`);
