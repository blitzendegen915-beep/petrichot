# 下書きフォルダ(AIサイト)

公開前の記事の下書きです。`build.mjs`・`lint.mjs`(引数なし)・デプロイ・IndexNowの対象外で、サイトには出ません。

## 公開するときの手順
1. 下書きの1行目 `<!-- 要確認: ... -->` を読み、書かれた点を公式情報などで確認する(確認後にコメントを削除)
2. `date:` を公開日に直す(下書きは仮の `2026-11-04`)
3. 内部リンクの文字が、公開済み記事の title と一字一句同じか確認する(`grep -m1 '^title:' affiliate/content/<slug>.md`)
4. 広告 `{{aff:ID}}` を決める(下書きに広告IDが無いものは、lintが「広告が1つもない」と警告する)
5. `affiliate/drafts/<slug>.md` を `affiliate/content/<slug>.md` へ移し、`node affiliate/lint.mjs` を通す
6. `node affiliate/ogp.mjs <slug>` でOGP画像を作り、`node affiliate/build.mjs` で確認してコミット・push

製品の機能・料金・数値は意図的に書いていません。
