# Petrichor Shopping

`petrichot.com` 内で、買う前の失敗回避を支援する静的サイトです。ShoppingからAI解説、Petrichor Learningへ同じドメイン内で移動できます。

## ビルド

リポジトリのルートで実行します。

```powershell
rtk proxy node shopping/build.mjs
rtk proxy node shopping/check.mjs
```

既存の `dist` は削除せず、次の3ページだけを作成・更新します。

- `dist/shopping/index.html`
- `dist/shopping/ai-recorder-cost-check/index.html`
- `dist/shopping/carry-on-suitcase-1-3-nights/index.html`

`/shopping/sitemap.xml` も3URLで生成します。

## AIレコーダー診断

`/shopping/ai-recorder-cost-check/` は、次の5条件から購入前の次の行動を分けます。

1. 月間文字起こし時間
2. 対面・通話・ウェアラブルのどれが必要か
3. スマホ録音を試したか
4. 継続費用を許容できるか
5. 録音データの規定とAI学習条件

3年総額はブラウザ内で次の式により計算します。入力値は送信・保存しません。

```text
3年総額 = 本体価格 + 年額プラン × 3 + 3年間の追加費用
```

価格とプランの初期値は `shopping/ops/ai-recorder-source-ledger.md` の確認時点のものです。公開前と価格表示の更新時に、必ず公式ページで再確認します。

## 楽天リンクの設定

楽天公式ルールにより、生成されたアフィリエイトリンクのURLだけを抜き出したり、`a` タグの属性を追加・変更したりしてはいけません。

1. 楽天アフィリエイトで対象URLを開く
2. 計測ID `shopping` を選ぶ
3. リンクタイプを「テキストのみ」にする
4. 生成されたHTMLソース全体をコピーする
5. `shopping/links.json` の該当する `affiliateHtml` に、無改変で保存する

```json
{
  "plaudNote": {
    "affiliateHtml": "<a href=\"...\" target=\"_blank\" style=\"...\">...</a>",
    "fallbackUrl": "https://search.rakuten.co.jp/search/mall/PLAUD+Note/",
    "fallbackLabel": "楽天市場でPLAUD Noteを探す"
  }
}
```

- `affiliateHtml` が空なら、楽天市場の通常検索へ移動し、広告リンクではないと表示します。
- `affiliateHtml` がある場合、生成HTMLをそのまま出力します。`rel`、`target`、class、`aria-label`、内側要素を追加しません。
- 計測用の属性は楽天の `a` タグではなく、外側の要素に付けます。
- 商品画像は、楽天がアフィリエイト素材として生成したもの以外を無断転載しません。

## 計測の準備

診断ページは次のイベントを `window.dataLayer` と `petrichor:analytics` カスタムイベントへ出します。

- `recorder_diagnosis_start`
- `recorder_diagnosis_complete`
- `recorder_diagnosis_result`
- `rakuten_search_click`（通常検索時）
- `affiliate_outbound_click`（アフィリエイトHTML設定後）

現時点ではGA4タグを読み込まないため、外部送信・Cookie保存はしません。GA4を導入する前に、プライバシーポリシー更新、測定ID設定、カスタムディメンション登録、DebugView確認が必要です。

## 編集方針

- 実機未検証の精度、音質、使用感、順位を断定しません。
- 価格、在庫、送料、ポイント、プラン条件は変動情報として扱います。
- 録音前の同意、学校・勤務先の規定、保存先、AI学習条件を購入より先に確認します。
- 広告・PR表示はページ上部と楽天リンクの近くに残します。
- スマートフォンとデスクトップの両方で、診断、計算、キーボード操作、横スクロールを確認します。
