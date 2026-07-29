// posts-*.json を1本のキューにまとめる。
//
// 同じ記事の投稿が近い日に続かないよう、記事をまたいで散らしてから並べる。
// 並びは固定シードで決めるので、実行するたびに順番が変わることはない。
// (順番が変わると post-to-x.mjs の「経過日数=インデックス」がずれる)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://petrichot.com";

const PINNED_FILE = "posts-pinned.json";

function loadParts() {
  const posts = [];
  for (const file of fs.readdirSync(HERE).sort()) {
    if (!/^posts-.*\.json$/.test(file)) continue;
    if (file === PINNED_FILE) continue; // 位置指定なので通常の並びには混ぜない
    const data = JSON.parse(fs.readFileSync(path.join(HERE, file), "utf8"));
    for (const p of data.posts) posts.push({ ...p, source: file });
  }
  return posts;
}

// 告知など、特定の日に出したい投稿。at で指定した位置に割り込ませる。
function loadPinned() {
  const file = path.join(HERE, PINNED_FILE);
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return (data.posts || []).map((p) => {
    if (!Number.isInteger(p.at) || p.at < 0) {
      throw new Error(`posts-pinned.json の at が不正です: ${JSON.stringify(p.at)}`);
    }
    if (!p.text) throw new Error("posts-pinned.json に text のない投稿があります");
    return p;
  });
}

// 決定的な擬似乱数(mulberry32)。並びを再現可能にするため。
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function main() {
  const posts = loadParts();
  if (!posts.length) throw new Error("posts-*.json が見つかりません");

  // slugごとにまとめ、各slugの中をシャッフル
  const bySlug = new Map();
  for (const p of posts) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, []);
    bySlug.get(p.slug).push(p);
  }

  const rand = rng(20260728);
  const buckets = [...bySlug.values()];
  for (const b of buckets) b.sort(() => rand() - 0.5);
  buckets.sort(() => rand() - 0.5);

  // 各slugから1件ずつ取り出すラウンドロビン。
  // これで同じ記事の2件目が出るのは、全記事を一周したあとになる。
  const ordered = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const b of buckets) {
      const item = b.shift();
      if (item) {
        ordered.push(item);
        remaining = true;
      }
    }
  }

  const seen = new Set();
  const queue = ordered.map((p, i) => {
    if (seen.has(p.text)) throw new Error(`投稿文が重複しています: ${p.text}`);
    seen.add(p.text);
    if (!p.slug || !p.text) throw new Error(`slug または text が空です (index ${i})`);
    return { text: p.text, url: `${BASE_URL}/${p.slug}/` };
  });

  // 位置指定の投稿を割り込ませる。atの小さい順に入れることで、
  // 複数あっても指定した位置がずれない。
  const pinned = loadPinned().sort((a, b) => a.at - b.at);
  for (const p of pinned) {
    if (p.at > queue.length) {
      throw new Error(`posts-pinned.json の at=${p.at} がキューの範囲外です(全${queue.length}件)`);
    }
    queue.splice(p.at, 0, { text: p.text, url: p.url || "" });
    console.log(`[build-queue] 位置${p.at}に告知を差し込みました`);
  }

  const out = path.join(HERE, "queue.json");
  fs.writeFileSync(out, JSON.stringify({ posts: queue }, null, 2) + "\n");
  console.log(`[build-queue] ${queue.length}件を書き出しました -> ${out}`);
  console.log(`[build-queue] 1日1件で約${Math.round(queue.length / 30)}か月分`);
}

main();
