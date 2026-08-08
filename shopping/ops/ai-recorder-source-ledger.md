# AI recorder source ledger

Checked: 2026-08-08 JST  
Scope: `/shopping/ai-recorder-cost-check/`

Prices, plans, stock, campaigns, product specifications, and data-processing terms are volatile. Recheck immediately before publishing and whenever the displayed checked date changes.

## PLAUD

### PLAUD Note

- Source: https://jp.plaud.ai/products/plaud-note-ai-voice-recorder
- Checked facts used:
  - Current product-page display: ¥27,500 tax included
  - Face-to-face and phone-call recording modes
  - Up to 30 hours continuous recording and 64 GB storage
  - Starter transcription allowance: 300 minutes per month
- Editorial limit: The 20% sale display checked on 2026-08-05 had ended by 2026-08-08. The calculator uses the current regular-price display and tells readers to overwrite it on the purchase date.

### PLAUD NotePin

- Source: https://jp.plaud.ai/products/notepin
- Checked facts used:
  - Current product-page display: ¥27,500 tax included
  - Wearable, face-to-face recording use
  - Phone-call recording is not supported
  - Up to 20 hours continuous recording and 64 GB storage

### PLAUD AI plans and data handling

- Sources:
  - https://jp.plaud.ai/pages/plaud-ai-plan-pricing
  - https://support.plaud.ai/hc/ja/articles/57744162858009-AI-%E5%87%A6%E7%90%86%E3%81%A7%E3%81%AE%E3%83%87%E3%83%BC%E3%82%BF%E3%81%AE%E4%BD%BF%E3%82%8F%E3%82%8C%E6%96%B9
- Checked facts used:
  - Pro annual plan display: ¥16,800 tax included
  - PLAUD states that audio and transcription data used for AI processing are not used to train AI models
- Editorial limit: Do not generalize this to every storage, sync, or organization-policy requirement. Readers must check the current official terms.

## Notta

### Notta Memo

- Sources:
  - https://shop.notta.ai/ja-jp/products/notta-memo-jp
  - https://support.notta.ai/hc/ja/articles/38283709733787-%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%83%97%E3%83%A9%E3%83%B3%E3%81%A8%E3%81%AF
- Checked facts used:
  - Product-page display: ¥23,500 tax included
  - Face-to-face and phone-call recording
  - Starter allowance: 300 minutes per month while the device remains linked to the account
  - Starter entitlement ends when the device is unlinked

### Notta plans and AI-learning conditions

- Sources:
  - https://www.notta.ai/pricing
  - https://support.notta.ai/hc/ja/articles/25948519611291-AI%E5%AD%A6%E7%BF%92%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
- Checked facts used:
  - Free plan: 120 minutes per month, maximum three minutes per recording
  - Premium annual display: ¥14,220 tax included, 1,800 minutes per month
  - Official FAQ updated 2026-07-27 says a domestic third-party speech engine may randomly select audio and recognition-result data for speech-recognition training
  - The FAQ identifies Enterprise and Business Plus as plans offering an environment without AI learning
- Editorial limit: The Notta Memo sales page also uses a broad no-training-without-permission statement. Because the plan FAQ is more specific, the article tells readers to verify the latest plan-level condition instead of declaring a blanket safety ranking.

## Smartphone alternatives

- Apple Voice Memos transcription:
  - https://support.apple.com/ja-jp/guide/iphone/iph00953a982/ios
- Google Pixel Recorder transcription:
  - https://support.google.com/pixelphone/answer/16267698?hl=ja
- Editorial use: Only as official examples that a dedicated recorder is not always the first step. Compatibility and language availability must be checked on the reader's device.

## Rakuten affiliate implementation

- Sources:
  - https://affiliate.rakuten.co.jp/guides/rule/
  - https://affiliate.rakuten.co.jp/guides/link/
- Rules implemented:
  - Do not extract only the affiliate URL from generated HTML
  - Do not add, remove, or change attributes on the generated `a` element
  - Store and output the full text-link HTML source unchanged
  - Put analytics attributes on the outer wrapper
  - Make the destination recognizable as Rakuten Ichiba and identify the product or search subject

## Claims intentionally excluded

- Transcription accuracy ranking
- Audio-quality ranking
- Comfort, durability, or ease-of-use claims from unverified first-hand experience
- Search volume, sales, conversion rate, stock, review counts, or popularity ranking
- A universal legal conclusion about recording consent or organization policy
