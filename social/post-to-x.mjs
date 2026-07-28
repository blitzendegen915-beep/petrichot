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
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = path.join(HERE, "queue.json");
const CONFIG_PATH = path.join(HERE, "config.json");

const ENDPOINT = "https://api.x.com/2/tweets";

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

function pctEncode(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

// OAuth 1.0a (HMAC-SHA1)。bodyがJSONのときは署名対象に含めない。
function buildAuthHeader({ method, url, consumerKey, consumerSecret, token, tokenSecret }) {
  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(oauth)
    .sort()
    .map((k) => `${pctEncode(k)}=${pctEncode(oauth[k])}`)
    .join("&");

  const baseString = [method.toUpperCase(), pctEncode(url), pctEncode(paramString)].join("&");
  const signingKey = `${pctEncode(consumerSecret)}&${pctEncode(tokenSecret)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${pctEncode(k)}="${pctEncode(oauth[k])}"`)
      .join(", ")
  );
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) {
    throw new Error(`キューが見つかりません: ${QUEUE_PATH}`);
  }
  const data = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  if (!Array.isArray(data.posts)) throw new Error("queue.json の posts が配列ではありません");
  return data.posts;
}

// Xの文字数は日本語1文字=2、URLは長さに関係なく23として数えられる。
function weightedLength(text) {
  const withoutUrls = text.replace(/https?:\/\/\S+/g, "");
  const urlCount = (text.match(/https?:\/\/\S+/g) || []).length;
  let n = 0;
  for (const ch of withoutUrls) {
    const c = ch.codePointAt(0);
    // 半角英数・記号は1、それ以外(日本語など)は2
    n += (c >= 0x0000 && c <= 0x10ff) || (c >= 0x2000 && c <= 0x200a) ? 1 : 2;
  }
  return n + urlCount * 23;
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
  if (idx >= posts.length) {
    console.warn(
      `[x-post] キューを使い切りました(${posts.length}件)。social/queue.json に投稿を追加してください。`,
    );
    return;
  }

  const post = posts[idx];
  const text = post.url ? `${post.text}\n${post.url}` : post.text;
  const len = weightedLength(text);

  console.log(`[x-post] #${idx + 1}/${posts.length} (${len}/280)`);
  console.log(text);

  if (len > 280) {
    throw new Error(`文字数超過: ${len}/280`);
  }
  if (dryRun) {
    console.log("[x-post] --dry-run のため送信しません。");
    return;
  }

  // Secretsに貼り付けるとき、末尾に改行や空白が混入しやすい。
  // 署名に使う値がずれると原因の分かりにくい401になるので、ここで落とす。
  const cred = (name) => (process.env[name] || "").trim();
  const consumerKey = cred("X_API_KEY");
  const consumerSecret = cred("X_API_SECRET");
  const token = cred("X_ACCESS_TOKEN");
  const tokenSecret = cred("X_ACCESS_TOKEN_SECRET");
  if (!consumerKey || !consumerSecret || !token || !tokenSecret) {
    throw new Error("X APIの認証情報(環境変数)が設定されていません。");
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader({
        method: "POST",
        url: ENDPOINT,
        consumerKey,
        consumerSecret,
        token,
        tokenSecret,
      }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`投稿に失敗しました (HTTP ${res.status}): ${bodyText}`);
  }
  console.log(`[x-post] 投稿しました: ${bodyText}`);
}

main().catch((err) => {
  console.error(`[x-post] ${err.message}`);
  process.exit(1);
});
