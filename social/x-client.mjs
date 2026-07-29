// X APIへの投稿と、運用通知の共通処理。
// モードA(post-to-x.mjs: 事前レビュー済みの宣伝投稿)と
// モードB(post-news.mjs: AIニュースの紹介)の両方から使う。
//
// 必要な環境変数(GitHub Secrets):
//   X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET

import crypto from "node:crypto";

const ENDPOINT = "https://api.x.com/2/tweets";

function pctEncode(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

// OAuth 1.0a (HMAC-SHA1)。bodyがJSONのときは署名対象に含めない。
export function buildAuthHeader({ method, url, consumerKey, consumerSecret, token, tokenSecret }) {
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

// Xの文字数は日本語1文字=2、URLは長さに関係なく23として数えられる。
export function weightedLength(text) {
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

export const MAX_WEIGHTED = 280;

// 通知はGitHubのIssueで行う。SMTPの認証情報を増やさずに済み、
// Issueの作成はリポジトリの購読者(オーナー)にメールで届く。
// ローカル実行時やトークンが無いときは、黙って何もしない。
export async function notify(title, body, tag = "x-post") {
  const token = (process.env.GITHUB_TOKEN || "").trim();
  const repo = (process.env.GITHUB_REPOSITORY || "").trim();
  if (!token || !repo) {
    console.log(`[${tag}] (通知はGitHub Actions上でのみ送られます)`);
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: `[${tag}] ${title}`, body }),
    });
    if (!res.ok) {
      console.warn(`[${tag}] 通知の作成に失敗しました (HTTP ${res.status})`);
      return;
    }
    console.log(`[${tag}] 通知用のIssueを作成しました。`);
  } catch (err) {
    // 通知の失敗で投稿処理まで巻き添えにしない。
    console.warn(`[${tag}] 通知に失敗しました: ${err.message}`);
  }
}

// Secretsに貼り付けるとき、末尾に改行や空白が混入しやすい。
// 署名に使う値がずれると原因の分かりにくい401になるので、ここで落とす。
function credentials() {
  const cred = (name) => (process.env[name] || "").trim();
  const c = {
    consumerKey: cred("X_API_KEY"),
    consumerSecret: cred("X_API_SECRET"),
    token: cred("X_ACCESS_TOKEN"),
    tokenSecret: cred("X_ACCESS_TOKEN_SECRET"),
  };
  if (!c.consumerKey || !c.consumerSecret || !c.token || !c.tokenSecret) {
    throw new Error("X APIの認証情報(環境変数)が設定されていません。");
  }
  return c;
}

export async function postToX(text) {
  const c = credentials();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader({ method: "POST", url: ENDPOINT, ...c }),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`投稿に失敗しました (HTTP ${res.status}): ${bodyText}`);
  }
  return bodyText;
}
