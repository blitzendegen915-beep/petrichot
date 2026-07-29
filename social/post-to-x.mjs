// X(Twitter)への自動投稿。
//
// 設計上の判断:
// - 投稿文は事前に人がレビューしたものを queue.json に貯めておき、
//   このスクリプトは「配信」だけを行う。文面の自動生成はしない。
//   同じ内容の繰り返しはXのスパム判定対象になるため。
// - どの投稿を出すかは開始日からの経過日数で決める。状態ファイルを
//   書き戻さないので、ワークフローがリポジトリにcommitする必要がなく、
//   同じ投稿が二度出ることもない。
// - キューを使い切ったら黙って終了せず、明示的に警告して終わる。
//
// 必要な環境変数(GitHub Secrets):
//   X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { weightedLength, MAX_WEIGHTED, notify, postToX } from "./x-client.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = path.join(HERE, "queue.json");
const CONFIG_PATH = path.join(HERE, "config.json");


// 運用開始日。config.json の startDate が null のあいだは何も投稿しない。
// 開始日を起点に、1日1件ずつキューを進める。
function loadStartDate() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const d = cfg.startDate;
  if (d === null || d === undefined || d === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`config.json の startDate の形式が不正です: ${d}`);
  }
  return d;
}

function daysSince(startISO) {
  const start = Date.UTC(...startISO.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))));
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((todayUTC - start) / 86400000);
}

// 残りがこの件数になったら補充を促す。
const REFILL_WARN_AT = 7;

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) {
    throw new Error(`キューが見つかりません: ${QUEUE_PATH}`);
  }
  const data = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  if (!Array.isArray(data.posts)) throw new Error("queue.json の posts が配列ではありません");
  return data.posts;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const startDate = loadStartDate();
  if (!startDate) {
    console.log(
      "[x-post] 未開始です。運用を始めるときに social/config.json の startDate に開始日を入れてください。",
    );
    return;
  }

  const posts = loadQueue();
  const idx = daysSince(startDate);
  if (idx < 0) {
    console.log(`[x-post] 開始日(${startDate})前のため何もしません。`);
    return;
  }
  const remaining = posts.length - idx;

  if (idx >= posts.length) {
    const msg = `キューを使い切りました(全${posts.length}件)。social/posts-*.json に投稿を追加し、node social/build-queue.mjs を実行してください。`;
    console.error(`[x-post] ${msg}`);
    await notify("Xの投稿キューが尽きました", msg);
    // 失敗として終わらせる。GitHubがワークフロー失敗をメール通知するため、
    // 気づかないまま投稿が止まり続けるのを防げる。
    process.exit(1);
  }

  // 補充の猶予を作るため、尽きる前に一度だけ知らせる。
  if (remaining === REFILL_WARN_AT) {
    const msg = `残り${remaining}件です。social/posts-*.json に追記し、node social/build-queue.mjs を実行してください。`;
    console.warn(`[x-post] ${msg}`);
    await notify("Xの投稿キューが残りわずかです", msg);
  }

  const post = posts[idx];
  const text = post.url ? `${post.text}\n${post.url}` : post.text;
  const len = weightedLength(text);

  console.log(`[x-post] #${idx + 1}/${posts.length} (${len}/280)`);
  console.log(text);

  if (len > MAX_WEIGHTED) {
    throw new Error(`文字数超過: ${len}/${MAX_WEIGHTED}`);
  }
  if (dryRun) {
    console.log("[x-post] --dry-run のため送信しません。");
    return;
  }

  const bodyText = await postToX(text);
  console.log(`[x-post] 投稿しました: ${bodyText}`);
}

main().catch((err) => {
  console.error(`[x-post] ${err.message}`);
  process.exit(1);
});
