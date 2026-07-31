# Petrichor Shopping

`petrichot.com` の中に置く、買い物比較ガイドの静的ページです。既存の AI 解説と Petrichor Learning へ、同じ傘のナビゲーションから移動できます。

## ビルド

リポジトリのルートで実行します。

```powershell
rtk proxy node shopping/build.mjs
rtk proxy node shopping/check.mjs
```

既存の `dist` は削除しません。次の2ページだけを作成・更新します。

- `dist/shopping/index.html`
- `dist/shopping/carry-on-suitcase-1-3-nights/index.html`

公開時は、同一ドメイン上で `/shopping/` 以下がこの出力を配信するように設定してください。

## 楽天リンクの設定

`shopping/links.json` の各 `affiliateUrl` に、楽天アフィリエイトで発行した HTTPS URLを入れてから再ビルドします。

```json
{
  "featured": {
    "affiliateUrl": "https://...",
    "fallbackUrl": "https://search.rakuten.co.jp/..."
  }
}
```

- `affiliateUrl` が空の場合は、安全な楽天市場内の検索結果へ移動し、ボタンに「楽天市場で候補を確認」と表示します。
- `affiliateUrl` がある場合は、そのURLを優先し、リンクに `rel="sponsored nofollow noopener"` を付けます。
- `fallbackUrl` は `https://search.rakuten.co.jp/` で始まるURLだけを許可しています。
- 商品別リンクを入れる前に、商品ページ、販売状況、価格、送料、レビュー、仕様を必ず楽天市場上で確認してください。

## 編集方針

- 航空会社、運賃種別、路線、機材によって手荷物条件は変わるため、ページ内では一律の数値を断定していません。
- 商品の価格、売上、検索数、在庫、レビュー件数は掲載していません。
- 実体験を捏造しないため、記事中に運営者本人が記入する明示的な枠を設けています。
- 商品名や掲載順を追加する場合は、確認日時と選定根拠も記録してください。
- 広告・PR表示はページ上部と商品導線の近くに残してください。

## 公開前チェック

1. 実体験欄を本人の言葉で記入する。
2. 楽天リンクをクリックし、意図した商品または検索結果へ移動するか確認する。
3. 各航空会社の最新の公式手荷物条件への案内が誤解を招かないか確認する。
4. スマートフォンとデスクトップで見出し、表、ナビゲーション、フォーカス表示を確認する。
5. `https://petrichot.com/` と `https://petrichot.com/learning/` の導線を確認する。
