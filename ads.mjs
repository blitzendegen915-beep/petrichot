// 第三者配信広告(Google AdSense の自動広告)を、サイトごとに出し分けるための共通部品。
//
// 設計上の判断:
// - AdSense の審査と配置は Google 側の「自動広告」に任せ、ページには読み込みタグ1行だけを入れる。
//   どの位置に広告を出すか・出さないかは、AdSense の管理画面でページ単位に調整できる。
// - パブリッシャーIDは ads.config.json に置く。空のあいだはタグも ads.txt も出さない
//   (未設定のまま壊れたタグが公開されるのを防ぐ)。IDはページに載る公開値で、秘密ではない。
// - サイトごとに出す・出さないを選べるようにする。Shopping は楽天リンクで収益を得る
//   「買う前の判断」ページなので、他社の商品広告で読者の注意をそらさないよう既定で出さない。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "ads.config.json");

function loadConfig() {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return { client: "", sites: {} };
  }
  const client = String(cfg.adsenseClient || "").trim();
  if (client && !/^ca-pub-\d{16}$/.test(client)) {
    throw new Error(`ads.config.json の adsenseClient の形式が不正です(ca-pub- と16桁の数字): ${client}`);
  }
  return { client, sites: cfg.sites || {} };
}

const CFG = loadConfig();

// site: "ai" | "learning" | "shopping"
export function adsEnabled(site) {
  return Boolean(CFG.client) && CFG.sites[site] === true;
}

// 1サイトでも有効なら、プライバシーポリシーの説明と ads.txt を出す。
export const ADS_ANY_ENABLED = Boolean(CFG.client) && Object.values(CFG.sites).some((v) => v === true);

export function adsHeadTag(site) {
  return adsEnabled(site)
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CFG.client}" crossorigin="anonymous"></script>\n`
    : "";
}

// ドメイン直下の ads.txt。AdSense の販売者確認に使われる。
export const ADS_TXT = ADS_ANY_ENABLED
  ? `google.com, ${CFG.client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
  : "";
