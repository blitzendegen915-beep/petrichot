---
title: AIってなに？小学生にもわかる図で説明します
description: AIとはどんなものなのか、小学生にもわかるように図を使って説明します。AIがどうやっておぼえるのか、なぜまちがえることがあるのか、使うときに気をつけることまで、やさしい言葉でまとめました。
slug: ai-toha-nani-shougakusei
date: 2026-07-25
category: AIをはじめて学ぶ
tags: [AI基礎, 小学生向け, 図解, 生成AI, 初心者向け]
---

「AI」という言葉を、テレビやおうちの人の話で聞いたことがあるでしょうか。なんだかすごいものらしい、でも何なのかはよくわからない。そう思っている人は多いと思います。

このページでは、AIがどんなものなのかを、図を使ってできるだけやさしく説明します。むずかしい言葉はなるべく使いません。

## AIは「たくさん見て、まねがうまくなった機械」

AIは、英語の「Artificial Intelligence」をみじかくした言葉です。日本語では「人工知能」といいます。かんたんにいうと、**人間の考えるまねをするコンピュータの技術**のことです。

では、どうやってまねをするのでしょうか。ポイントは「たくさん見る」ことです。

```svg AIは たくさんの れいを 見てから 答えられるようになる
<svg viewBox="0 0 640 168" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>AIが学習するしくみ</title>
  <defs>
    <marker id="dgA1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/>
    </marker>
  </defs>
  <rect x="30" y="48" width="122" height="62" rx="9" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <rect x="22" y="56" width="122" height="62" rx="9" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <rect x="14" y="64" width="122" height="62" rx="9" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="75" y="92" text-anchor="middle" font-size="15" fill="var(--fg)">ネコの</text>
  <text x="75" y="112" text-anchor="middle" font-size="15" fill="var(--fg)">しゃしん</text>
  <text x="75" y="150" text-anchor="middle" font-size="13" fill="var(--muted)">たくさん見せる</text>
  <line x1="150" y1="95" x2="222" y2="95" stroke="var(--muted)" stroke-width="2" marker-end="url(#dgA1)"/>
  <rect x="232" y="55" width="118" height="80" rx="11" fill="var(--accent)" stroke="var(--accent)" stroke-width="2"/>
  <text x="291" y="103" text-anchor="middle" font-size="26" fill="var(--accent-fg)" class="dg-label">AI</text>
  <line x1="364" y1="95" x2="436" y2="95" stroke="var(--muted)" stroke-width="2" marker-end="url(#dgA1)"/>
  <rect x="446" y="64" width="180" height="62" rx="9" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="536" y="102" text-anchor="middle" font-size="17" fill="var(--fg)">これは ネコ！</text>
  <text x="536" y="150" text-anchor="middle" font-size="13" fill="var(--muted)">はじめて見た写真でも</text>
</svg>
```

ネコの写真をたくさん見せると、AIは「ネコってこういう形をしているんだな」という**とくちょう**をつかみます。すると、いままで一度も見たことのない写真でも「これはネコだ」と答えられるようになります。

これを「学習」といいます。人が一つずつルールを教えるのではなく、たくさんのれいを見せて、AIが自分でとくちょうを見つけるのです。

## 「えらぶAI」と「つくるAI」

AIには、大きく分けて二つのタイプがあります。

```svg 答えを えらぶAI と、答えを つくるAI
<svg viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>えらぶAIとつくるAIのちがい</title>
  <defs>
    <marker id="dgA2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="300" height="234" rx="12" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="158" y="38" text-anchor="middle" font-size="17" fill="var(--fg)" class="dg-label">えらぶAI</text>
  <rect x="34" y="58" width="106" height="50" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="87" y="88" text-anchor="middle" font-size="14" fill="var(--fg)">しゃしん</text>
  <line x1="150" y1="83" x2="190" y2="83" stroke="var(--muted)" stroke-width="2" marker-end="url(#dgA2)"/>
  <rect x="196" y="58" width="88" height="50" rx="8" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="240" y="88" text-anchor="middle" font-size="14" fill="var(--fg)">ネコ</text>
  <text x="158" y="140" text-anchor="middle" font-size="13" fill="var(--muted)">用意された答えの中から</text>
  <text x="158" y="160" text-anchor="middle" font-size="13" fill="var(--muted)">正しいものをえらぶ</text>
  <text x="158" y="196" text-anchor="middle" font-size="13" fill="var(--muted)">れい：メールのめいわく判定、</text>
  <text x="158" y="216" text-anchor="middle" font-size="13" fill="var(--muted)">顔でロックを開ける機能</text>
  <rect x="332" y="8" width="300" height="234" rx="12" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="482" y="38" text-anchor="middle" font-size="17" fill="var(--fg)" class="dg-label">つくるAI</text>
  <rect x="358" y="58" width="106" height="50" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="411" y="88" text-anchor="middle" font-size="14" fill="var(--fg)">おねがい</text>
  <line x1="474" y1="83" x2="514" y2="83" stroke="var(--muted)" stroke-width="2" marker-end="url(#dgA2)"/>
  <rect x="520" y="58" width="88" height="50" rx="8" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="564" y="82" text-anchor="middle" font-size="14" fill="var(--fg)">文・絵</text>
  <text x="564" y="100" text-anchor="middle" font-size="14" fill="var(--fg)">など</text>
  <text x="482" y="140" text-anchor="middle" font-size="13" fill="var(--muted)">なかったものを</text>
  <text x="482" y="160" text-anchor="middle" font-size="13" fill="var(--muted)">あたらしくつくる</text>
  <text x="482" y="196" text-anchor="middle" font-size="13" fill="var(--muted)">れい：ChatGPT、Claude、</text>
  <text x="482" y="216" text-anchor="middle" font-size="13" fill="var(--muted)">絵をかくAI</text>
</svg>
```

前からあったのは、左の「えらぶAI」です。写真がネコかイヌかを見分ける、メールがめいわくメールかどうかを判定する。用意された答えの中から正しいものをえらぶ仕事をします。

いま話題になっているのは、右の「つくるAI」です。「生成AI」とも呼ばれます。おねがいをすると、これまでなかった文章や絵を新しくつくってくれます。ChatGPTやClaudeがこのタイプです。

{{aff:chatgpt}}

## つくるAIは「つぎのことばを当てるゲーム」をしている

つくるAIが文章を書くしくみは、じつはとてもシンプルです。**つぎに来そうなことばを当てているだけ**なのです。

```svg つくるAIは 「つぎに来そうなことば」を えらんでいる
<svg viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>つぎのことばを予想するしくみ</title>
  <defs>
    <marker id="dgA3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/>
    </marker>
  </defs>
  <rect x="14" y="24" width="96" height="42" rx="8" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="62" y="51" text-anchor="middle" font-size="15" fill="var(--fg)">むかし</text>
  <rect x="122" y="24" width="96" height="42" rx="8" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="170" y="51" text-anchor="middle" font-size="15" fill="var(--fg)">むかし</text>
  <rect x="230" y="24" width="96" height="42" rx="8" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="278" y="51" text-anchor="middle" font-size="15" fill="var(--fg)">ある</text>
  <rect x="338" y="24" width="112" height="42" rx="8" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="394" y="51" text-anchor="middle" font-size="15" fill="var(--fg)">ところ に</text>
  <rect x="462" y="24" width="72" height="42" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="498" y="52" text-anchor="middle" font-size="19" fill="var(--fg)">？</text>
  <line x1="498" y1="74" x2="498" y2="112" stroke="var(--muted)" stroke-width="2" marker-end="url(#dgA3)"/>
  <text x="240" y="132" text-anchor="middle" font-size="14" fill="var(--muted)">ありそうな ことばを 予想する</text>
  <rect x="376" y="120" width="146" height="34" rx="7" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="449" y="143" text-anchor="middle" font-size="14" fill="var(--fg)">おじいさん</text>
  <rect x="376" y="162" width="146" height="34" rx="7" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="449" y="185" text-anchor="middle" font-size="14" fill="var(--muted)">冷蔵庫</text>
  <text x="540" y="143" font-size="13" fill="var(--edu)">ありそう</text>
  <text x="540" y="185" font-size="13" fill="var(--muted)">なさそう</text>
</svg>
```

「むかし むかし ある ところ に」と来たら、つぎは何が来そうでしょうか。「おじいさん」なら自然です。「冷蔵庫」だと変ですね。

AIはものすごくたくさんの文章を読んでいるので、「このならびのつぎは、これが来ることが多い」というのを知っています。そうやってことばを一つずつえらんでつないでいくと、文章になるのです。

## AIはまちがえることがある

ここがとても大事なところです。**AIは、書いてあることの意味をわかっているわけではありません。**

さっきのとおり、AIは「ありそうなことばのならび」をえらんでいます。だから、**まちがっていても、ありそうに聞こえる文**をつくってしまうことがあります。しかも、自信たっぷりに答えてくるので、正しいように見えてしまいます。

たとえば、ありもしない本の名前や、まちがった年をすらすら答えることがあります。うそをつこうとしているのではなく、しくみのうえでそうなってしまうのです。くわしい理由は[AIが事実でないことを言う理由](https://petrichot.com/ai-hallucination-naze/)でも説明しています。

だから、AIの答えは**そのまま信じないで、たしかめる**ことがひつようです。

{{aff:claude}}

## AIを使うときの3つのやくそく

AIはとても便利ですが、使い方にはコツがあります。次の3つをおぼえておきましょう。

1. **答えをたしかめる** — 大事なことは、本や公式のホームページでも調べてみましょう。AIの答えが正しいとはかぎりません
2. **自分や人のひみつを書かない** — 名前、住んでいるところ、学校名、電話番号などは入力しないようにしましょう。くわしくは[AIと個人情報の話](https://petrichot.com/ai-to-privacy-kojinjouhou/)を読んでみてください
3. **宿題は自分で考える** — 答えをうつすと、自分の力になりません。わからないところを説明してもらう、という使い方のほうが力がつきます

3つめは、とくに大事です。AIは、あなたのかわりに考えてくれる道具ではありません。**あなたが考えるのを手伝ってくれる道具**です。

## まとめ

このページで説明したことをまとめます。

- AIは、たくさんのれいを見て、とくちょうを自分で見つけておぼえる技術
- 「えらぶAI」と、文や絵を新しくつくる「つくるAI（生成AI）」がある
- つくるAIは、つぎに来そうなことばを予想して文章をつくっている
- 意味をわかっているわけではないので、まちがった答えをつくることがある
- 使うときは、たしかめる・ひみつを書かない・自分で考える

AIは、道具です。ハサミやえんぴつと同じように、使い方をおぼえるとできることが増えます。まずは、しくみを知ることからはじめてみてください。

もう少しくわしく知りたくなったら、[中高生向けのAI入門](https://petrichot.com/ai-toha-nani/)も読んでみてください。

## 参考リンク

- [ChatGPT](https://openai.com/chatgpt/)
- [Claude](https://claude.ai/)
- [文部科学省](https://www.mext.go.jp/)
