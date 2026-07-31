# Petrichor Learning

`https://petrichot.com/learning/` で公開する、AI・プログラミング学習向けの静的サイトです。

## ビルド

リポジトリのルートで実行します。

```powershell
rtk proxy node learning/build.mjs
```

生成先は `dist/learning/` です。ビルド時に削除・再生成するのは `dist/learning/` だけで、同じ `dist/` にあるトップページや `shopping/` など、ほかのセクションには触れません。

生成される主なページ:

- `dist/learning/index.html` — 記事一覧
- `dist/learning/<slug>/index.html` — 学習記事
- `dist/learning/course/index.html` — 講座一覧
- `dist/learning/course/<slug>/index.html` — 各レッスン
- `dist/learning/about/index.html` — 運営者情報
- `dist/learning/contact/index.html` — お問い合わせ
- `dist/learning/privacy/index.html` — プライバシーポリシー
- `dist/learning/feed.xml` — RSS
- `dist/learning/sitemap.xml` — Learning専用サイトマップ
- `dist/learning/robots.txt` — Learning専用robots設定
- `dist/learning/static/` — OGP画像・ファビコン

## コンテンツ

- 記事: `learning/content/*.md`
- 講座: `learning/course/*.md`
- 講座の順序と章構成: `learning/course.json`
- 外部・アフィリエイトリンク: `learning/links.json`
- サイト名と公開URL: `learning/site.config.json`

記事を追加・修正したら、ビルド前に機械チェックを実行します。

```powershell
rtk proxy node learning/lint.mjs
```

`links.json` の `url` が空の場合は `official` の公式URLへフォールバックします。提携リンクを設定するときは、取得済みの正しいURLだけを入れてください。

## 同一ドメイン内の導線

全ページのヘッダーとフッターから次の3セクションへ移動できます。

- AI解説: `https://petrichot.com/`
- Shopping: `https://petrichot.com/shopping/`
- Learning: `https://petrichot.com/learning/`

Learning内の記事、講座、ポリシーページ、静的アセット、RSS、サイトマップのURLは、すべて `/learning/` 配下になります。
