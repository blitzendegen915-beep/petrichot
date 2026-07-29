// モードB: AI関連ニュースを1日1件、見出し・概要文・元記事リンクで紹介する。
//
// 設計上の判断:
//
// - 本文はフィードの見出しと概要文をそのまま使い、要約や論評は自動生成しない。
//   記事を読んでいない以上、こちらで書けるのは推測でしかなく、
//   それは「捏造しない」という運用方針に反する。出典が自分で書いた文を
//   そのまま引くなら、こちらが事実を作り出す余地がない。
//   概要文を切り詰めるときも、できるだけ句点で切る。文の途中で止めると
//   意味が変わることがあり(「万能ではない」→「万能では」)、
//   引用のつもりが結果的に歪曲になるため。
//
// - 対象は「前日(UTC)に公開された記事」だけに限る。1日1回の実行で
//   日付の箱が毎回ずれるので、状態ファイルを持たなくても同じ記事を
//   二度投稿しない。モードAと同じく、リポジトリへの書き戻しが不要。
//
// - フィードは公式配信のみ(news-feeds.json)。さらにリンク先ホストを
//   allowHosts で照合する。外部から取ってきた文字列をそのまま自分の
//   アカウントで発信する処理なので、どこを指してよいかは自分で決める。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { weightedLength, MAX_WEIGHTED, notify, postToX } from "./x-client.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FEEDS_PATH = path.join(HERE, "news-feeds.json");

const TAG = "x-news";
const FETCH_TIMEOUT_MS = 15000;
// フィードが異常に大きい場合に備えて上限を置く。
const MAX_FEED_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------- フィード解析

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " ",
};

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-zA-Z]+|#\d+);/g, (m, name) => (name in ENTITIES ? ENTITIES[name] : m));
}

// タグの中身を、CDATAだけ剥がして生のまま返す。
function rawTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : raw;
}

// タグの中身を取り出す。CDATAが使われていればその中身を返す。
function pickTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return decodeEntities((cdata ? cdata[1] : raw).replace(/<[^>]+>/g, "")).trim();
}

// Atomの <link href="..."/> と RSSの <link>...</link> の両方に対応する。
function pickLink(xml) {
  const atom = xml.match(/<link\b[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i)
    || xml.match(/<link\b[^>]*\bhref=["']([^"']+)["']/i);
  if (atom) return decodeEntities(atom[1]).trim();
  return pickTag(xml, "link");
}

const BOILERPLATE =
  /(続きを読む|続きはこちら|全文を読む|もっと見る|Read more|Continue reading|The post .+ appeared first on .+)[\s.。、]*$/i;

// フィードの概要文を1行に均す。
// 出典が書いた文章をそのまま使うので、語句の書き換えはしない。
// 落とすのは、投稿に載せると邪魔になるものだけ。
export function sanitizeSummary(raw) {
  let s = raw;
  // 実体参照でエスケープされたHTMLが入っていることがあるので、
  // 「タグを剥ぐ→実体参照を戻す」を2周する。
  for (let i = 0; i < 2; i++) s = decodeEntities(s.replace(/<[^>]+>/g, " "));
  s = s
    .replace(/https?:\/\/\S+/g, " ") // 「続きを読む」等のURL。リンクは末尾に別で置く
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 配信システムが末尾に付ける定型句を落とす。末尾に限定しているのは、
  // 本文中に同じ語が出てきたときに削ってしまわないため。
  for (let i = 0; i < 3 && BOILERPLATE.test(s); i++) s = s.replace(BOILERPLATE, "").trim();
  return s;
}

export function parseFeed(xml) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  const items = [];
  for (const b of blocks) {
    const title = pickTag(b, "title");
    const link = pickLink(b);
    const dateStr =
      pickTag(b, "pubDate") || pickTag(b, "published") || pickTag(b, "updated") || pickTag(b, "dc:date");
    const published = dateStr ? new Date(dateStr) : null;
    if (!title || !link || !published || Number.isNaN(published.getTime())) continue;

    // rawTag を使うのは、概要文だけはタグを剥ぐ前の状態から
    // sanitizeSummary に渡したいため(pickTagは先にタグを剥いでしまう)。
    const summary = sanitizeSummary(
      rawTag(b, "description") || rawTag(b, "summary") || rawTag(b, "content"),
    );
    items.push({ title, link, published, summary });
  }
  return items;
}

// ---------------------------------------------------------------- 取得と絞り込み

export function hostAllowed(urlStr, allowHosts) {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  return allowHosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "petrichot-news-bot (+https://petrichot.com)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  if (xml.length > MAX_FEED_BYTES) throw new Error("フィードが大きすぎます");
  return parseFeed(xml);
}

// 前日(UTC)の 00:00 〜 24:00 を対象にする。
export function dayWindow(now = new Date()) {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { start: end - 86400000, end };
}

export function selectItem(collected, window) {
  const inWindow = collected.filter(
    (it) => it.published.getTime() >= window.start && it.published.getTime() < window.end,
  );
  inWindow.sort((a, b) => b.published - a.published);
  return inWindow[0] || null;
}

// ---------------------------------------------------------------- 文面

// 毎日まったく同じ書き出しだと機械的に見えるので、日付で回す。
// どれも事実を主張しない言い回しにしてある(記事を読んでいないため)。
const LEADS = ["【AIニュース】", "今日のAI関連から1本。", "気になったAIのニュース。"];

// 概要文の引用はここまで。枠が余っていても、これ以上は載せない。
// 出典の文章をそのまま使う以上、引用は「元記事へ誘導するための最小限」に留める。
const MAX_SUMMARY_WEIGHTED = 110;
// これを下回るなら概要文は載せない。数文字の断片は情報にならないため。
const MIN_SUMMARY_WEIGHTED = 30;

// 予算内に収める。できれば句点で切り、無理なら文字単位で切って「…」を付ける。
//
// 句点を優先するのは、文の途中で切ると意味が変わる場合があるため。
// 「〜は万能ではない」を「〜は万能では」で止めるような切り方を避けたい。
// 出典の文章を歪めずに引用するには、文の切れ目で終わるのが一番安全。
export function clampText(text, budget) {
  if (weightedLength(text) <= budget) return text;

  let cut = text;
  while (weightedLength(cut + "…") > budget && cut.length > 0) cut = cut.slice(0, -1);
  if (!cut) return "";

  const lastStop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"));
  // 句点が極端に手前だと本文がほとんど残らないので、その場合は文字単位で切る。
  if (lastStop >= 0 && weightedLength(cut.slice(0, lastStop + 1)) >= budget * 0.6) {
    return cut.slice(0, lastStop + 1);
  }
  return cut + "…";
}

export function buildText(item, sourceName, now = new Date()) {
  const dayIndex = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
  const lead = LEADS[dayIndex % LEADS.length];
  const tail = `\n\n(${sourceName}) #AI\n${item.link}`;

  // 見出しが最優先。概要文は残った枠に入る分だけ載せる。
  const title = clampText(item.title, MAX_WEIGHTED - weightedLength(lead + tail));
  const head = lead + title;

  let summary = item.summary || "";
  // 概要文が見出しの繰り返しになっているフィードがある。その場合は載せない。
  if (summary && (summary === item.title || summary.startsWith(item.title))) summary = "";

  if (summary) {
    const room = MAX_WEIGHTED - weightedLength(head + "\n\n" + tail);
    summary = clampText(summary, Math.min(room, MAX_SUMMARY_WEIGHTED));
    if (weightedLength(summary) < MIN_SUMMARY_WEIGHTED) summary = "";
  }

  return summary ? `${head}\n\n${summary}${tail}` : head + tail;
}

// ---------------------------------------------------------------- 本体

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const cfg = JSON.parse(fs.readFileSync(FEEDS_PATH, "utf8"));
  const feeds = cfg.feeds || [];
  if (!feeds.length) throw new Error("news-feeds.json にフィードがありません");

  const collected = [];
  const failures = [];

  for (const feed of feeds) {
    try {
      const items = await fetchFeed(feed);
      const usable = items.filter((it) => {
        if (!hostAllowed(it.link, feed.allowHosts || [])) return false;
        if (feed.match && !new RegExp(feed.match, "i").test(it.title)) return false;
        return true;
      });
      console.log(`[${TAG}] ${feed.name}: ${items.length}件取得 / ${usable.length}件が対象`);
      for (const it of usable) collected.push({ ...it, source: feed.name });
    } catch (err) {
      // 1つのフィードが落ちても他で続行する。ニュースが出せないより軽い問題。
      console.warn(`[${TAG}] ${feed.name}: 取得に失敗しました (${err.message})`);
      failures.push(`${feed.name}: ${err.message}`);
    }
  }

  if (failures.length === feeds.length) {
    const msg = `すべてのフィードの取得に失敗しました。\n\n${failures.join("\n")}`;
    console.error(`[${TAG}] ${msg}`);
    await notify("AIニュースのフィードが全て取得できません", msg, TAG);
    process.exit(1);
  }

  const window = dayWindow();
  const item = selectItem(collected, window);
  if (!item) {
    // 前日に対象記事が無い日はある。異常ではないので成功として終わる。
    console.log(`[${TAG}] 前日(UTC)に公開された対象記事がありませんでした。今日は投稿しません。`);
    return;
  }

  const text = buildText(item, item.source);
  console.log(`[${TAG}] ${item.source} / ${item.published.toISOString()} (${weightedLength(text)}/${MAX_WEIGHTED})`);
  console.log(text);

  if (dryRun) {
    console.log(`[${TAG}] --dry-run のため送信しません。`);
    return;
  }

  const body = await postToX(text);
  console.log(`[${TAG}] 投稿しました: ${body}`);
}

// 直接実行されたときだけ動かす(テストから読み込めるようにするため)。
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`[${TAG}] ${err.message}`);
    process.exit(1);
  });
}
