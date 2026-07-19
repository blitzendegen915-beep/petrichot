---
name: new-article
description: 「AIツールの透視図」に新規記事を1本追加してビルド・公開する。トピックを引数で指定可能
---

# new-article

`affiliate/content/` に記事を1本追加し、ビルド確認して公開する手順。引数でトピック指定があればそれを使い、なければ既存記事と重複しないトピックを選ぶ。

## 記事タイプの決定

1. `affiliate/content/*.md` の frontmatter を確認し、category「AIをはじめて学ぶ」の記事数を数える。
2. 教育記事が全体の1/3未満なら**教育記事**、以上なら**ツール紹介記事**を書く(引数指定があれば優先)。

- **ツール紹介記事**: AIツールの比較・使い方・活用術。`affiliate/links.json` の既存IDから1〜2個選び、`{{aff:ID}}` を紹介直後やまとめ前など自然な位置に**単独行**で挿入。category はツール比較/業務効率化/デザイン等。
- **教育記事**: 中高生向けAIリテラシー・学習活用・社会とAI。やさしい言葉、上から目線にならない口調。category: `AIをはじめて学ぶ`。`{{aff:ID}}` を1個、記事内容に合う自然な位置に挿入する(2026-07-19よりオーナー指示で全記事広告ありに変更)。

## frontmatter スキーマ(厳守)

```
---
title: 記事タイトル(30字前後)
description: メタディスクリプション(80〜110字)
slug: lowercase-ascii-hyphens
date: YYYY-MM-DD(今日)
category: カテゴリ名
tags: [タグ1, タグ2, タグ3]
---
```

## 本文ルール

- 1500〜2500字の自然な日本語。導入 → `##` 見出し数個 → 箇条書き活用 → `## まとめ`。
- **本文に `#`(h1)を書かない**(タイトルはテンプレートが出す。書いてもビルドが降格/除去するが、最初から書かない)。
- 比較にはGFM表(`| a | b |` + 区切り行)が使える(ビルドが変換)。
- 誇大表現・断定的な収益/効果保証は禁止。料金・モデル名などは断定を避け「2026年時点」等でぼかす。
- 記事末尾に必ず `## 参考リンク`(2〜4個)。**URLは承認済みリストのみ(捏造厳禁)**:
  openai.com/chatgpt/, claude.ai, gemini.google.com, www.notion.com/product/ai, www.canva.com, www.midjourney.com, github.com/features/copilot, www.perplexity.ai, openai.com, www.anthropic.com, blog.google/technology/ai/, www.soumu.go.jp/johotsusintokei/whitepaper/, www.mext.go.jp, www.ipa.go.jp

## ビルド・公開

1. `node affiliate/build.mjs` — エラー・警告ゼロ、記事数+1を確認。
2. **`git reset --hard` は使わない**(未pushの作業を破壊しうる)。`git add` は新規記事ファイルのみ。
3. commit(`auto: 新規記事「<タイトル>」を追加`)→ `git push origin main`。
4. push後1〜2分で `git ls-remote origin gh-pages` のハッシュが変わればデプロイ成功。
