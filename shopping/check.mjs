import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = path.resolve(here, "..", "dist", "shopping");
const links = JSON.parse(await readFile(path.join(here, "links.json"), "utf8"));

const files = [
  {
    path: path.join(outputRoot, "index.html"),
    required: [
      'rel="canonical" href="https://petrichot.com/shopping/"',
      'href="/"',
      'href="/learning/"',
      'href="/shopping/ai-recorder-cost-check/"',
      "AIレコーダーを1分診断",
      "ai-recorder-decision-1536.webp"
    ],
    linkKeys: []
  },
  {
    path: path.join(outputRoot, "ai-recorder-cost-check", "index.html"),
    required: [
      'rel="canonical" href="https://petrichot.com/shopping/ai-recorder-cost-check/"',
      'id="recorder-diagnosis"',
      'id="diagnosis-result" aria-live="polite"',
      'id="cost-preset"',
      "3年間の総額",
      "recorder_diagnosis_start",
      "recorder_diagnosis_complete",
      "recorder_diagnosis_result",
      "affiliate_outbound_click",
      "入力内容は送信・保存しません",
      "実機レビューではなく",
      "2026年8月8日",
      "ai-recorder-decision-960.webp"
    ],
    linkKeys: ["aiRecorder", "plaudNote", "plaudNotePin", "nottaMemo"]
  },
  {
    path: path.join(outputRoot, "carry-on-suitcase-1-3-nights", "index.html"),
    required: [
      'rel="canonical" href="https://petrichot.com/shopping/carry-on-suitcase-1-3-nights/"',
      "航空会社、路線、機材、運賃種別",
      "楽天市場で候補を探す",
      "本人が実際に使った条件と製品を確認できた段階",
      "carry-on-measurement-guide-1200.webp"
    ],
    linkKeys: ["featured", "lightweight", "expandable"]
  }
];

function assertLinkConfiguration(html, file) {
  for (const key of file.linkKeys) {
    const config = links[key];
    if (!config) {
      throw new Error(`${file.path}: links.json に ${key} がありません。`);
    }
    if (Object.hasOwn(config, "affiliateUrl")) {
      throw new Error(`${file.path}: ${key}.affiliateUrl は使用禁止です。楽天生成HTML全体を affiliateHtml に保存してください。`);
    }
    const affiliateHtml = String(config.affiliateHtml || "").trim();
    if (affiliateHtml) {
      if (!html.includes(affiliateHtml)) {
        throw new Error(`${file.path}: ${key} の楽天生成HTMLが無改変で出力されていません。`);
      }
      if (!html.includes("広告・PR") || !html.includes("このリンクは楽天市場のアフィリエイトリンクです")) {
        throw new Error(`${file.path}: ${key} の広告表示が不足しています。`);
      }
    } else {
      const fallbackUrl = String(config.fallbackUrl || "");
      const fallbackLabel = String(config.fallbackLabel || "");
      if (!fallbackUrl.startsWith("https://search.rakuten.co.jp/")) {
        throw new Error(`${file.path}: ${key} の通常検索URLが不正です。`);
      }
      if (!fallbackLabel.includes("楽天市場")) {
        throw new Error(`${file.path}: ${key} のリンク先が楽天市場だと分かりません。`);
      }
      if (!html.includes(fallbackUrl) || !html.includes(fallbackLabel)) {
        throw new Error(`${file.path}: ${key} の通常検索リンクが出力されていません。`);
      }
      if (!html.includes("現在は広告リンクではなく、楽天市場の通常検索へ移動します")) {
        throw new Error(`${file.path}: 通常検索であることの表示がありません。`);
      }
    }
  }
}

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
  for (const forbidden of ["【ここに", "追記予定", "精度No.1", "最もおすすめ"]) {
    if (html.includes(forbidden)) {
      throw new Error(`${file.path}: 公開不可の表現があります: ${forbidden}`);
    }
  }

  assertLinkConfiguration(html, file);

  const editorialImages = [...html.matchAll(/<img\b[^>]*class=["'][^"']*editorial-image[^"']*["'][^>]*>/g)]
    .map((match) => match[0]);
  for (const image of editorialImages) {
    for (const attribute of ["alt", "width", "height", "loading", "decoding"]) {
      if (!new RegExp("\\b" + attribute + "=[\\\"'][^\\\"']+[\\\"']").test(image)) {
        throw new Error(`${file.path}: 編集画像に ${attribute} がありません: ${image}`);
      }
    }
  }

  const shoppingAssets = new Set(html.match(/\/static\/shopping\/[a-z0-9.-]+/g) || []);
  for (const asset of shoppingAssets) {
    const assetFile = path.resolve(outputRoot, "..", asset.slice(1));
    try {
      await readFile(assetFile);
    } catch {
      throw new Error(`${file.path}: 参照画像がありません: ${asset}`);
    }
  }

  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`${file.path}: JSON-LD がありません。`);
  }
  const jsonLd = JSON.parse(match[1]);
  if (!Array.isArray(jsonLd) || jsonLd.length < 2) {
    throw new Error(`${file.path}: JSON-LD の構成が不足しています。`);
  }
  checked += 1;
}

const recorderHtml = await readFile(
  path.join(outputRoot, "ai-recorder-cost-check", "index.html"),
  "utf8"
);
const cardCompareStart = recorderHtml.indexOf('data-result-panel="card_compare"');
const cardCompareEnd = recorderHtml.indexOf('id="diagnosis-reset"', cardCompareStart);
const cardCompareHtml = recorderHtml.slice(cardCompareStart, cardCompareEnd);
if (!String(links.aiRecorder.affiliateHtml || "").trim()) {
  throw new Error("AIレコーダー診断: 最初の楽天アフィリエイトリンクが未設定です。");
}
const cardCompareLinkOrder = [
  String(links.aiRecorder.affiliateHtml || "").trim(),
  links.plaudNote.fallbackUrl,
  links.nottaMemo.fallbackUrl
].map((value) => cardCompareHtml.indexOf(value));
if (cardCompareStart < 0 || cardCompareEnd < 0 || cardCompareLinkOrder.some((index) => index < 0)) {
  throw new Error("AIレコーダー診断: 比較結果に3つの楽天導線が揃っていません。");
}
if (!(cardCompareLinkOrder[0] < cardCompareLinkOrder[1] && cardCompareLinkOrder[1] < cardCompareLinkOrder[2])) {
  throw new Error("AIレコーダー診断: 正式なアフィリエイトリンクを比較結果の先頭に置いてください。");
}
if ((recorderHtml.match(/event\.preventDefault\(\)/g) || []).length !== 1) {
  throw new Error("AIレコーダー診断: preventDefault はフォーム送信の1箇所だけにしてください。楽天リンクの遷移を妨げてはいけません。");
}
if (recorderHtml.includes("googletagmanager.com") || recorderHtml.includes("google-analytics.com")) {
  throw new Error("AIレコーダー診断: プライバシーポリシー更新前にGAを読み込んではいけません。");
}

const sitemapPath = path.join(outputRoot, "sitemap.xml");
let sitemapXml;
try {
  sitemapXml = await readFile(sitemapPath, "utf8");
} catch {
  throw new Error(`${sitemapPath}: sitemap.xml がありません。robots.txt が参照しているため404になります。`);
}
const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (locs.length !== checked) {
  throw new Error(`${sitemapPath}: 登録URLが${locs.length}件で、生成ページ${checked}件と一致しません。`);
}
for (const required of [
  "https://petrichot.com/shopping/",
  "https://petrichot.com/shopping/ai-recorder-cost-check/",
  "https://petrichot.com/shopping/carry-on-suitcase-1-3-nights/"
]) {
  if (!locs.includes(required)) {
    throw new Error(`${sitemapPath}: ${required} が登録されていません。`);
  }
}

console.log(`Petrichor Shopping check passed: ${checked} pages, sitemap ${locs.length} URLs`);
