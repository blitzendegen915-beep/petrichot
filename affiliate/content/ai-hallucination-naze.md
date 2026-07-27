---
title: AIはなぜもっともらしい嘘をつくのか
description: AIが自信を持って誤った情報を答える理由と、その仕組み。ハルシネーション現象を中高生向けにやさしく解説し、信頼できる活用法を提案します。
slug: ai-hallucination-naze
date: 2026-07-25
category: AIをはじめて学ぶ
tags: [ハルシネーション, AIの仕組み, リテラシー, 注意点]
---

ChatGPT、Claude、Gemini などの生成AIを使っていると、時々「あれ、これ本当かな？」と思うような答えが返ってくることがあります。たとえば、存在しない人物の経歴を述べたり、正確でない引用を出したり、詳しい数字を自信たっぷりに言ったり。こうした現象を「ハルシネーション」（幻覚）と呼びます。

これは AIが「壊れている」わけではなく、その仕組み上、どうしても起きてしまうものです。中高生のみなさんがAIと付き合う際に知っておくべき話を、できるだけやさしく説明します。

## AIは「検索」ではなく「予測」で文章を作る

多くの人は、AIが質問されたときに「データベースから情報を取り出して、それを整形して答える」と想像しがちです。でも、実際はそうではありません。

AIが文章を作る仕組みはこうです。質問をもらった時、AIは「次に来そうな言葉」を1語ずつ選んで、文章を組み立てていきます。たとえば「日本の首都は」と入力されたら、学習した大量の文章から「この並びのあとには『東京』が来ることが多い」と分かっているので「東京」を選ぶ。それを1語ずつ繰り返して文章にしています。

つまり、AIは本当のデータベースを参照していません。訓練時に見た文章パターンから「この状況のあとは、このような言葉が来やすい」という確率を学んでいるだけなのです。

図にすると、こういう違いです。

```svg 検索は「探して返す」。生成AIは「次に来そうな語を1つずつ選ぶ」
<svg viewBox="0 0 640 306" xmlns="http://www.w3.org/2000/svg" role="img">
  <title>検索のしくみと生成AIのしくみの違い</title>
  <defs>
    <marker id="hlA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/>
    </marker>
  </defs>

  <rect x="6" y="6" width="300" height="228" rx="4" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="156" y="34" text-anchor="middle" font-size="15" fill="var(--fg)" class="dg-label">探して返すしくみ（検索）</text>
  <rect x="84" y="52" width="144" height="36" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="156" y="75" text-anchor="middle" font-size="14" fill="var(--fg)">質問する</text>
  <line x1="156" y1="90" x2="156" y2="110" stroke="var(--muted)" stroke-width="2" marker-end="url(#hlA)"/>
  <rect x="54" y="114" width="204" height="36" rx="4" fill="var(--surface-2)" stroke="var(--border)" stroke-width="2"/>
  <text x="156" y="137" text-anchor="middle" font-size="14" fill="var(--fg)">保存された中から探す</text>
  <line x1="156" y1="152" x2="156" y2="172" stroke="var(--muted)" stroke-width="2" marker-end="url(#hlA)"/>
  <rect x="54" y="176" width="204" height="36" rx="4" fill="var(--accent)" stroke="var(--accent)" stroke-width="2"/>
  <text x="156" y="199" text-anchor="middle" font-size="14" fill="var(--accent-fg)">見つかったものを返す</text>

  <rect x="334" y="6" width="300" height="228" rx="4" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
  <text x="484" y="34" text-anchor="middle" font-size="15" fill="var(--fg)" class="dg-label">次の1語を選ぶしくみ（生成AI）</text>
  <rect x="412" y="52" width="144" height="36" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
  <text x="484" y="75" text-anchor="middle" font-size="14" fill="var(--fg)">質問する</text>
  <line x1="484" y1="90" x2="484" y2="110" stroke="var(--muted)" stroke-width="2" marker-end="url(#hlA)"/>

  <rect x="352" y="114" width="62" height="36" rx="4" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="383" y="137" text-anchor="middle" font-size="13" fill="var(--fg)">次の語</text>
  <line x1="418" y1="132" x2="440" y2="132" stroke="var(--muted)" stroke-width="2" marker-end="url(#hlA)"/>
  <rect x="446" y="114" width="62" height="36" rx="4" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="477" y="137" text-anchor="middle" font-size="13" fill="var(--fg)">次の語</text>
  <line x1="512" y1="132" x2="534" y2="132" stroke="var(--muted)" stroke-width="2" marker-end="url(#hlA)"/>
  <rect x="540" y="114" width="62" height="36" rx="4" fill="var(--edu-soft)" stroke="var(--edu)" stroke-width="2"/>
  <text x="571" y="137" text-anchor="middle" font-size="13" fill="var(--fg)">次の語</text>
  <text x="484" y="168" text-anchor="middle" font-size="12" fill="var(--muted)">確率で次の語を選び続ける</text>

  <line x1="484" y1="176" x2="484" y2="192" stroke="var(--muted)" stroke-width="2" marker-end="url(#hlA)"/>
  <rect x="404" y="196" width="160" height="30" rx="4" fill="var(--accent)" stroke="var(--accent)" stroke-width="2"/>
  <text x="484" y="216" text-anchor="middle" font-size="14" fill="var(--accent-fg)">文章ができる</text>

  <text x="320" y="266" text-anchor="middle" font-size="14" fill="var(--fg)">生成AIは、正しい答えも事実でない答えも、まったく同じ手順で作る。</text>
  <text x="320" y="290" text-anchor="middle" font-size="14" fill="var(--fg)">だから、見た目では区別がつかない。</text>
</svg>
```

## 「正しい情報」と「もっともらしい情報」は同じ滑らかさで作られる

ここが重要な落とし穴です。

正しい答えを書くときも、事実でない答えを書くときも、AIの中で起きていることは同じです。どちらも「この流れなら次はこの言葉が来やすい」という計算の結果でしかありません。**事実かどうかを判定する仕組みが別にあるわけではない**のです。

だから、事実でない内容も、正しい内容とまったく同じ滑らかな日本語で出てきます。ここが厄介な点です。文章が下手だったり、しどろもどろだったりすれば「怪しいぞ」と気づけますが、AIの誤りは堂々とした文章でやってきます。**文章の自然さは、内容が正しい証拠にはなりません。**

## AIは「知らない」と気づくことができない

人間なら、知らないことは「知りません」と答えられます。でも、AIにはその判断ができません。

AIが出した答えが本当かどうかを内部で照合する仕組みは、基本的に備わっていません。そして質問を受ければ、何らかの文章を返そうとします。その過程で「自分はこれを知らないかもしれない」と立ち止まる仕組みがないため、知らないことも同じ調子で答えてしまうのです。

だから、知らないはずの人物の歴史や、実在しない法律、聞いたことのない企業の詳細も、自信たっぷりに述べてしまいます。このような特性は、実生活でのフェイク情報の見分け方と密接に関係しており、[AI時代のフェイク情報への向き合い方](https://petrichot.com/ai-fake-joho-mimawake/)について知ることは、AIとの安全な付き合い方に欠かせません。

## 間違いやすい場面

ハルシネーションは特に、以下のような話題で起きやすいです。

- **実在の人物の経歴や業績**：有名人でも、年齢や出身地、具体的な作品名などは間違えやすい
- **具体的な数値や日付**：会社の売上、法律の施行日、スポーツの記録など
- **法律や制度の詳細**：「いつからこの決まりになった」「このルールは法律で決まっている」という細かい情報
- **本や論文の題名・内容・引用**：特に、著者や発行年のような細部で間違える
- **URL やリンク**：実在のサイトそっくりだが、微妙に異なるURLを生成することもある
- **マイナーな固有名詞**：著名でない地名、企業名、人物名、製品名など

## どう向き合うか

ハルシネーションと付き合うための心がけを、4つ紹介します。AIと安全に付き合うための基礎的な知識については、[AIリテラシーについての記事](https://petrichot.com/ai-riteracy-nyuumon/)に詳しくまとめられており、そちらも参考になります。

**1. 重要なことは必ず一次情報で確認する**

学校のレポートや、人生に関わる決定に使う情報は、必ず「そのことを発表している公式な場所」を確認してください。大学の募集要項なら大学のホームサイト、法律の内容なら法律の原文や官庁のページ。AIの答えは出発点に過ぎません。

**2. 出典を見るタイプのAIを使う**

Perplexity など、検索連動型のAIツールなら、どのウェブページから情報を取ってきたか見えます。その場合、AIの答えだけでなく、引用元のページそのものを読むことで、より確実な確認ができます。

{{aff:perplexity}}

**3. 前置きをする**

「もし分からなければ『分かりません』と答えてください」「確実な情報だけ答えてください」という指示をAIに出すことで、やや改善します。完全ではありませんが、AIも少し慎重になります。

**4. 数字と固有名詞を疑う癖**

特に「〇〇年〇月」「〇〇人の著名人」「〇〇という法律」「〇〇というサイト」など、具体的な数字や名前が出てきたら、「これは本当かな」と一呼吸置いて確認する習慣をつけましょう。

## まとめ

AIがもっともらしい嘘をつくのは、AIが「壊れている」からではなく、**仕組み上そうなるから**です。AIは事実を検索しているのではなく、確率に基づいて「次に来そうな言葉」を選んでいる。知らないことも知らないと判断できない。だからこそ、使う側が情報の正確性を確認する責任があります。

AIは非常に便利なツールですが、「便利 = 絶対正確」ではありません。むしろ、その性質を理解した上で「確認する前提で使う」という姿勢が、AIとの正しい付き合い方だと思います。また、[AIに個人情報を入力するときの注意点](https://petrichot.com/ai-to-privacy-kojinjouhou/)についても、合わせて理解しておくと、AIを安全かつ効果的に活用できるようになります。

## 参考リンク

- [IPA(情報処理推進機構)](https://www.ipa.go.jp/)
- [文部科学省](https://www.mext.go.jp/)
- [Perplexity 公式サイト](https://www.perplexity.ai/)
- [Anthropic 公式サイト](https://www.anthropic.com/)
