// アクセス解析タグ(Cloudflare Web Analytics)を、3つのサイト(AI・Learning・Shopping)の
// 全ページに同じ形で入れるための共通部品。
//
// 設計上の判断:
// - Cookieや端末への保存を使わない解析を選んだ。同意バナーが要らず、
//   プライバシーポリシーの説明も単純に保てる。
// - トークンは analytics.config.json に置く。空のあいだはタグを一切出さない
//   (未設定のまま壊れたタグが公開されるのを防ぐ)。
// - トークンはページのHTMLにそのまま載る公開値なので、秘密情報ではない。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "analytics.config.json");

function loadToken() {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return "";
  }
  const token = String(cfg.cloudflareToken || "").trim();
  if (!token) return "";
  // 想定外の文字がHTML属性に入るのを防ぐ。形式が違えば公開せずにビルドを止める。
  if (!/^[0-9a-f]{32}$/i.test(token)) {
    throw new Error(`analytics.config.json の cloudflareToken の形式が不正です: ${token}`);
  }
  return token;
}

const TOKEN = loadToken();

export const ANALYTICS_ENABLED = Boolean(TOKEN);

export const ANALYTICS_TAG = TOKEN
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${TOKEN}"}'></script>\n`
  : "";
