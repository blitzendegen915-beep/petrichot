---
title: AIへの指示文(プロンプト)の書き方基本ガイド
description: ChatGPTやClaudeへの指示文(プロンプト)の書き方しだいで、回答の質は大きく変わります。目的・条件・形式を伝える基本の型と、すぐ使える改善テクニックを紹介します。
slug: prompt-no-kakikata-kihon
date: 2026-07-17
updated: 2026-07-27
category: 業務効率化
tags: [プロンプト, ChatGPT, Claude, 活用術]
---

ChatGPTやClaudeを使ってみたものの、「思ったような答えが返ってこない」と感じたことはありませんか?実は、AIの回答の質は「どう聞くか」で大きく変わります。AIへの指示文は「プロンプト」と呼ばれ、その書き方にはいくつかの基本的なコツがあります。

この記事では、特別な知識がなくても今日から使えるプロンプトの基本の型を紹介します。

## なぜプロンプトで結果が変わるのか

AIは、与えられた文章から「何を求められているか」を推測して回答を組み立てます。指示があいまいだと、AIは一般的で無難な回答を返しがちです。逆に、目的や条件がはっきりしていれば、それに沿った具体的な回答が返ってきやすくなります。

人に仕事を頼むときと同じで、「いい感じにやっておいて」より「誰向けに・何のために・どんな形で」を伝えたほうが、期待に近い結果になります。

## 基本の型: 目的・条件・形式

プロンプトに次の3要素を入れるだけで、回答の質は目に見えて変わります。

- **目的**: 何のために使うのか(例: 社内会議の案内メールを書きたい)
- **条件**: 前提や制約(例: 敬語で、300字以内で、金曜開催)
- **形式**: 出力してほしい形(例: 件名と本文を分けて、箇条書きで)

この3つが入っているかどうかで、AIがやることが変わります。

```svg 目的・条件・形式を入れると、AIが推測する部分が減る
<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>あいまいな指示と、目的・条件・形式を入れた指示の違い</title>
  <defs>
    <marker id="ppA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/>
    </marker>
  </defs>

  <rect x="6" y="6" width="300" height="236" rx="4" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="156" y="32" text-anchor="middle" font-size="14" fill="var(--fg)" class="dg-label">あいまいな指示</text>
  <rect x="66" y="48" width="180" height="36" rx="4" fill="var(--surface-2)" stroke="var(--border)" stroke-width="2"/>
  <text x="156" y="71" text-anchor="middle" font-size="14" fill="var(--fg)">「メールを書いて」</text>
  <line x1="156" y1="86" x2="156" y2="108" stroke="var(--muted)" stroke-width="2" marker-end="url(#ppA)"/>
  <rect x="42" y="112" width="228" height="36" rx="4" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="156" y="135" text-anchor="middle" font-size="13" fill="var(--fg)">AIが目的も形も推測する</text>
  <line x1="156" y1="150" x2="156" y2="172" stroke="var(--muted)" stroke-width="2" marker-end="url(#ppA)"/>
  <rect x="42" y="176" width="228" height="40" rx="4" fill="var(--surface-2)" stroke="var(--border)" stroke-width="2"/>
  <text x="156" y="201" text-anchor="middle" font-size="14" fill="var(--fg)">無難で一般的な答え</text>

  <rect x="334" y="6" width="300" height="236" rx="4" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="484" y="32" text-anchor="middle" font-size="14" fill="var(--fg)" class="dg-label">目的・条件・形式を入れた指示</text>
  <rect x="364" y="44" width="240" height="32" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="484" y="65" text-anchor="middle" font-size="13" fill="var(--fg)">目的：何のために使うか</text>
  <rect x="364" y="82" width="240" height="32" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="484" y="103" text-anchor="middle" font-size="13" fill="var(--fg)">条件：守ってほしいこと</text>
  <rect x="364" y="120" width="240" height="32" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="484" y="141" text-anchor="middle" font-size="13" fill="var(--fg)">形式：どんな形で出すか</text>
  <line x1="484" y1="154" x2="484" y2="172" stroke="var(--muted)" stroke-width="2" marker-end="url(#ppA)"/>
  <rect x="364" y="176" width="240" height="40" rx="4" fill="var(--accent)" stroke="var(--accent)" stroke-width="2"/>
  <text x="484" y="201" text-anchor="middle" font-size="14" fill="var(--accent-fg)">狙いに近い答え</text>
</svg>
```

悪い例と良い例を比べてみましょう。

- 悪い例: 「メールを書いて」
- 良い例: 「社内の定例会議の日程変更を知らせるメールを書いてください。宛先は部署のメンバー、来週金曜15時に変更、敬語で200字程度、件名も付けてください」

## すぐ使える改善テクニック

基本の型に慣れたら、次のテクニックも試してみてください。

- **役割を与える**: 「あなたはベテランの編集者です」のように前置きすると、回答の視点が安定します
- **例を見せる**: 「こんな雰囲気で」と見本を1つ貼ると、文体やフォーマットを合わせてくれます
- **段階を分ける**: 長い作業は「まず構成案だけ出して」と分割すると、軌道修正がしやすくなります
- **追加で直してもらう**: 一発で完璧を狙わず、「もっと短く」「専門用語を減らして」と会話で調整するのが近道です

ChatGPTもClaudeも、こうした基本の型は共通して有効です。まずは普段使っているツールで試してみてください。

{{aff:chatgpt}}

## 場面別に見る、悪い指示と良い指示

「目的・条件・形式」を意識すると言われても、具体的にどう変わるのかイメージしづらいこともあります。よくある場面で比べてみましょう。

| 場面 | 悪い指示の例 | 良い指示の例 |
| --- | --- | --- |
| 要約 | 「これ要約して」 | 「次の文章を、結論から先に書く形で、専門用語を避けて要約して」 |
| メール作成 | 「メール書いて」 | 「取引先への納期変更のお詫びメールを、丁寧な言葉遣いで、件名も添えて書いて」 |
| アイデア出し | 「アイデア出して」 | 「文化祭の出し物について、準備の手間が少ない案を、理由つきで挙げて」 |
| 言い換え | 「わかりやすくして」 | 「この文章を、専門知識がない人にも伝わる言葉に置き換えて。専門用語には簡単な説明を添えて」 |
| 調べ物の相談 | 「〇〇について教えて」 | 「〇〇について、初心者がまず知っておくべき順番で説明して」 |

どの例も、悪い指示は「何をしてほしいか」しか書かれていないのに対し、良い指示は「誰に向けて」「どんな形で」「何を避けてほしいか」まで含んでいるのがわかります。

## うまくいかないときの直し方

思った通りの答えが返ってこないときは、プロンプトを一から書き直す前に、次のような直し方を試してみてください。

- **回答が漠然としている** → 「目的」と「条件」をもう一段具体的にする。誰向けの文章か、何のために使うのかを言葉にして付け加える
- **回答が長すぎる・短すぎる** → 分量を数字で指定するより、「箇条書きで」「見出しを立てずに一段落で」のように、形で指定し直すと安定しやすい
- **話がずれていく** → 会話を続けるうちに前提が薄まることがあるので、最初の目的をもう一度書き直して伝え直す
- **専門用語が多くて読みにくい** → 「対象読者は〇〇です」と読み手を明示し、「専門用語には言い換えを添えて」と付け加える
- **毎回同じ言い直しをしている** → よく使う条件や役割設定はメモしておき、次の会話の最初に貼り付けると手間が減る

一度で完璧な指示を書こうとせず、返ってきた答えを見ながら少しずつ直していくのが、結果的に近道になります。

## やってはいけないこと

プロンプトの工夫と同時に、注意点も押さえておきましょう。

- 個人情報や社外秘の情報をそのまま入力しない
- AIの回答を鵜呑みにせず、重要な内容は必ず自分で確認する
- 「絶対に正しい答えを出して」と書いても正確性は保証されません。事実確認は人間の仕事です

## まとめ

プロンプトの上達に、特別な才能は必要ありません。「目的・条件・形式」の3点を意識して書き、返ってきた回答に追加の指示で磨きをかける — この繰り返しだけで、AIは日々の作業の頼れる相棒になります。

長文の資料を扱う作業や丁寧な文章の調整には、長い文脈の読解を得意とするClaudeを使い分けるのもおすすめです。

ここで身につけた「目的・条件・形式」の考え方は、目標を渡して自律的に動かす[AIエージェント](https://petrichot.com/ai-agent-toha-hajimekata/)にもそのまま応用できます。

{{aff:claude}}

なお、AIツールを活用する際はプライバシー面への配慮も大切です。[AIと個人情報｜入力していいこと・ダメなこと](https://petrichot.com/ai-to-privacy-kojinjouhou/)で、安全な使い方について詳しく解説しています。

## 参考リンク

- [ChatGPT 公式サイト](https://openai.com/chatgpt/)
- [Claude 公式サイト](https://claude.ai/)
- [Anthropic 公式サイト](https://www.anthropic.com/)
