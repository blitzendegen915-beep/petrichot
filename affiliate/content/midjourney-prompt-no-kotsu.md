---
title: Midjourneyプロンプトのコツ10選
description: Midjourneyで高品質な画像を生成するプロンプト作成のコツを10個紹介。初心者でも使える実践的なテクニックを詳しく解説します。
slug: midjourney-prompt-no-kotsu
date: 2026-08-03
category: デザイン
tags: [Midjourney, AI画像生成, プロンプト]
---

AI画像生成ツール「Midjourney」は、テキストの説明から驚くほどリアルで高品質な画像を生成できるツールとして、2026年時点で多くのデザイナーやクリエイターに使われています。しかし、単に「美しい風景画像を作って」と指示するだけでは、期待通りの画像は生成されません。

Midjourneyで高品質な画像を生成するには、**適切なプロンプト（指示文）の作成**が極めて重要です。この記事では、Midjourneyのプロンプト作成のコツを10個紹介したうえで、思った通りの画像が出ないときの直し方や、避けるべき指示の出し方まで解説します。

## Midjourneyプロンプトのコツ10選

コツを個別に見る前に、まず土台となる3つの原則を押さえておきましょう。

**より詳しく、より具体的に。**「美しい女性の肖像画」というシンプルな指示より、「30代の日本人女性、黒いロングヘア、柔らかい微笑み、自然光、背景は京都の古い寺院」という具体的な指示の方が、期待に近い画像が生成されます。**視点と構図を指定する。**「俯瞰図」「ローアングル」「クローズアップ」など、カメラアングルを明記することで画像の見栄えが大きく変わります。**スタイルと質感を明示する。**「油絵風」「アニメ風」「写真」「イラスト」など、出力されるべきアートスタイルを明確にすることが重要です。

この3原則を踏まえたうえで、実際に使える10のコツを見ていきます。

### 1. 被写体を明確に指定する

プロンプトの最初に、何を描きたいのかを最も重要な情報として配置します。

```
良い例：
/imagine prompt: A majestic golden retriever with flowing coat, sitting proudly in a sunlit garden
```

漠然とした指示より、具体的な被写体を最初に明記することで、AIが正確に解釈します。

### 2. 修飾語を効果的に使用

被写体の周囲に、それを飾る言葉を配置します。色、質感、雰囲気、感情など、多角的な修飾が効果的です。

```
例：
vibrant, cinematic, dramatic lighting, ultra-detailed, masterpiece, professional photography
```

これらの修飾語を組み合わせることで、出力の品質が大きく向上します。

### 3. アーティストやスタイルを参考に指定

特定のアーティストの名前や有名な映画、アニメなどを参考にすることで、Midjourneyはそのスタイルに沿った画像を生成します。

```
例：
in the style of Studio Ghibli, inspired by Van Gogh, cinematic style of Blade Runner
```

2026年時点で、多くのアーティスト名やメディア名がMidjourneyのデータベースに含まれており、参考指定が効果的に機能します。一般的な[AIへの指示文の書き方](https://petrichot.com/prompt-no-kakikata-kihon/)も参考にしながら、独自のスタイルを磨いてください。ただし、実在アーティストの画風を参考にする指定と、実在の作品そのものを模倣させる指定は別物です。この違いは後半の「やってはいけないこと」で詳しく説明します。

{{aff:midjourney}}

### 4. 照明条件を詳しく指定

画像の雰囲気は、照明で大きく変わります。照明条件を明記することで、より一貫性のある画像が生成されます。

```
例：
golden hour lighting, backlighting, neon lights, candlelit, harsh shadows, soft diffused light
```

### 5. 背景を明確に指定

被写体だけでなく、背景も詳しく記述することで、全体的な世界観が統一されます。

```
例：
background: futuristic city skyline, misty forest, abstract gradient, historical architecture
```

### 6. カメラ設定と構図を記述

写真的なリアリティを求める場合、カメラの設定を記述すると効果的です。

```
例：
shot on Canon 5D, 85mm lens, shallow depth of field, bokeh, wide-angle perspective
```

### 7. 色パレットを指定

生成する画像の色調を事前に指定することで、統一感のある出力が得られます。

```
例：
color palette: cool blues and cyans, warm earth tones, vibrant neons, monochromatic black and white
```

### 8. 解像度と品質指標を含める

Midjourneyに対して、出力の品質レベルを指示することで、より詳細で精密な画像を生成できます。

```
例：
8k resolution, ultra HD, highly detailed, intricate details, professional quality, sharp focus
```

### 9. 感情と雰囲気の言葉を活用

画像に込めたい感情や雰囲気を言語化することで、より深みのある画像が生成されます。

```
例：
serene and peaceful, dark and mysterious, vibrant and joyful, dramatic and intense
```

### 10. 否定的な指示（negative prompts）を活用

Midjourneyでは、「この要素は含めない」という指示も可能です。不要な要素を明示することで、より望ましい結果が得られます。

```
例：
--no watermark, --no text, --no distorted features, --no low quality
```

## 実践的なプロンプト例

10個のコツを組み合わせると、実際にはこのようなプロンプトになります。用途別に3パターン紹介するので、そのままコピーして単語を入れ替えて使ってください。

### 例1: ビジネスプロフィール写真

```
/imagine prompt: Professional Asian businesswoman, age 35, wearing navy blazer and white blouse, confident smile, studio lighting with white background, shot with 85mm lens, ultra-detailed, 8k resolution, corporate portrait style, perfect skin, hair salon quality
```

被写体（誰が）→服装・表情（どう見せるか）→照明・背景（雰囲気）→カメラ設定（画質）の順に並んでいるのがポイントです。

### 例2: ファンタジー風景

```
/imagine prompt: Enchanted forest with ancient ruins, bioluminescent plants glowing in the darkness, misty atmosphere, magical floating crystals, fantasy landscape art style, inspired by concept art, rich color palette of purples and greens, cinematic composition, ultra-detailed, 8k
```

被写体が「場所」の場合も、主役となる要素（遺跡や光る植物）を先に置き、雰囲気や色パレットを後ろに続けます。

### 例3: 製品デザイン

```
/imagine prompt: Modern sleek smartwatch, minimalist design, rose gold and titanium materials, bright minimalist white studio background, product photography, professional lighting, sharp focus, 3D rendering quality, --no hands, --no person
```

商品単体で撮りたいときは、末尾の `--no` 指定で人物や手が写り込むのを防げます。

## プロンプト作成時の注意点

### 曖昧さと矛盾を避ける

「かっこいい」「きれい」など曖昧な言葉より、「minimalist and geometric」「classical and elegant」など、より具体的な表現を使用します。また「リアリスティックなアニメ風」のような相反する指示は避けるべきです。複数のスタイルを組み合わせたい場合は、その順序と重要度を明確にします。

### 過度に長いプロンプトを避け、段階的に改善する

目安として300語を超えるプロンプトは、かえってAIの理解を阻害することがあります。重要な要素に絞ったコンパクトなプロンプトが効果的です。最初のプロンプトで完璧な結果は期待できないので、生成結果を見ながら段階的に改善する「反復的アプローチ」を前提にしましょう。

### よく使う設定オプション

構図やスタイルは、プロンプト末尾のオプションでも調整できます。

```
--ar 16:9        （横長）/ --ar 1:1（正方形）/ --ar 9:16（縦長）
--style raw      （より自然なスタイル）
--style niji     （アニメ風）
--quality 2      （通常、デフォルト）/ --quality 1（高速処理）
--hd             （より詳細）
```

### 思った通りの画像が出ないときの直し方

狙った画像にならないときは、プロンプト全体を書き直す前に、原因を1つに絞って直すのが近道です。

| 症状 | 考えられる原因 | 直し方 |
|---|---|---|
| 被写体があいまいに描かれる | 主語が埋もれている | 被写体の説明をプロンプトの先頭に置き直す |
| 雰囲気が思っていたのと違う | 照明・色調の言葉が不足 | golden hour lighting のような照明の単語を1つ追加する |
| 毎回同じ構図になる | 視点の指定がない | close-up や wide-angle など視点・距離の単語を変える |
| 余計なもの（透かし・文字など）が写り込む | negative promptがない | `--no watermark` `--no text` などで明示的に除外する |
| 画風が中途半端 | スタイル指定が複数競合している | style や inspired by の指定を1つに絞る |

原則は「**1回の修正で1箇所だけ変える**」ことです。一度に何箇所も直すと、何が効いたのか分からなくなり、かえって遠回りになります。良くなった変更は残し、次の1箇所を試す、を繰り返すのが結局いちばん早く狙った画像にたどり着けます。

## 初心者向けのコツ

まだ慣れないうちは、ゼロから文章を組み立てるより、次の3つの方法を使うと早く上達します。

**既存画像を参考にする。**Midjourneyは、URLで指定した画像をスタイル参考として利用できます。自分が目指すスタイルの画像をまず探し、それをプロンプトに組み込むことで、初心者でも高品質な結果が得られます。**段階的に詳細化する。**最初はシンプルなプロンプトから始めて、結果を見ながら要素を追加していくアプローチもおすすめです。いきなり完璧な1文を作ろうとしなくて構いません。**コミュニティの例を参考にする。**Midjourneyのコミュニティフォーラムでは、様々なプロンプト例が共有されています。成功例を参考にしながら自分のバリエーションを作成することで、学習が加速します。

2026年時点で、Midjourneyは継続的にアップデートされており、より自然で高度な画像生成が可能になっています。新しいスタイル指定オプションも定期的に追加されているので、慣れてきたらMidjourneyの公式ドキュメントやコミュニティチャネルで最新のオプションを確認する習慣をつけましょう。生成した画像を[Canvaなどのデザインツール](https://petrichot.com/canva-ai-design-nyumon/)に読み込んでさらに調整すると、そのまま使える完成度に仕上げやすくなります。

## やってはいけないこと

Midjourneyは自由度が高いぶん、指示の出し方によっては権利や規約のトラブルにつながるおそれがあります。特に次の3つは避けたほうがよい指示です。

まず、**実在する著名人の顔をそのまま似せようとする指示**です。名前を指定して特定の人物にそっくりな顔を生成させることは、肖像権やプライバシーの問題に触れるおそれがあります。次に、**実在の作品そのものを模倣する指示**です。特定のアーティストの「画風」を参考にすること自体は前述のとおり一般的な使い方ですが、既存の作品を丸ごと再現させるような指示は別問題です。最後に、**既存の版権キャラクターを再現する指示**です。アニメや映画のキャラクター名を直接指定して生成することも、著作権の扱いという点で注意が必要です。

これらはMidjourney側の利用規約や、生成した画像を公開・商用利用する場面での著作権の扱いに関わる部分なので、断定的な判断はできません。心配な指示を使う前には、Midjourneyの公式ドキュメントで規約や著作権の扱いを確認してから使うことをおすすめします。

## まとめ

Midjourneyで高品質な画像を生成するには、適切で詳細なプロンプト作成が不可欠です。10個のコツを実践し、思った通りにならないときは1箇所ずつ直していくことで、あなたのビジョンに沿った画像を効率的に生成できるようになります。

最初のうちは完璧なプロンプトを作成することは難しいかもしれません。しかし、試行錯誤を重ねることで、Midjourneyとの「対話スキル」は少しずつ向上していきます。避けるべき指示だけ押さえたうえで、ぜひこれらのコツを活用してAIアート制作の世界を楽しんでください。

プロンプトのコツを押さえたら、他のツールとの使い分けも含めて[AI画像生成ガイド](/ai-gazou-seisei-matome-guide/)で全体像を確認しておくと迷いにくくなります。

## 参考リンク

- [Midjourney公式サイト](https://www.midjourney.com/)
- [Anthropic Claude](https://claude.ai/)
- [Canva - デザインツール](https://www.canva.com/)
- [GitHub Copilot](https://github.com/features/copilot)
