// モードB: AI関連ニュースを1日1件、見出しと元記事リンクだけ紹介する。
//
// 設計上の判断:
//
// - 本文はフィードの見出しをそのまま使い、要約や論評は自動生成しない。
//   記事を読んでいない以上、こちらで書けるのは推測でしかなく、
//   それは「捏造しない」という運用方針に反する。見出し+リンクなら、
//   間違いようがないうえ、読者は元記事に飛べる。
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
    items.push({ title, link, published });
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

export function buildText(item, sourceName, now = new Date()) {
  const dayIndex = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
  const lead = LEADS[dayIndex % LEADS.length];
  const tail = `\n\n(${sourceName}) #AI\n${item.link}`;

  let title = item.title;
  // 収まらないときは見出しを削る。文の途中で切れるので明示的に「…」を付ける。
  while (weightedLength(lead + title + tail) > MAX_WEIGHTED && title.length > 1) {
    title = title.slice(0, -1);
  }
  if (title !== item.title) title = title.slice(0, -1) + "…";

  return lead + title + tail;
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
