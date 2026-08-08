export const recorderPath = "/shopping/ai-recorder-cost-check/";

export const recorderPageCss = `
.recorder-hero {
  padding-top: clamp(3rem, 7vw, 5.5rem);
}
.recorder-hero .hero-grid {
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
}
.recorder-hero-visual {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
}
.recorder-hero-visual img {
  width: 100%;
  height: auto;
}
.recorder-hero-visual figcaption {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.76rem;
  line-height: 1.6;
}
.diagnosis-wrap {
  position: relative;
  overflow: hidden;
  padding: clamp(1.2rem, 4vw, 2.5rem);
  border: 1px solid var(--line);
  border-top: 5px solid var(--cobalt);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
}
.diagnosis-wrap::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(26, 92, 229, 0.035) 1px, transparent 1px),
    linear-gradient(rgba(26, 92, 229, 0.035) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom right, transparent 20%, #000 100%);
}
.diagnosis-wrap > * { position: relative; z-index: 1; }
.diagnosis-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.5rem;
  align-items: start;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--line);
}
.diagnosis-intro h2 { margin: 0; }
.diagnosis-intro p { max-width: 650px; margin: 0.65rem 0 0; color: var(--muted); }
.privacy-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #b9cef9;
  border-radius: 999px;
  background: var(--cobalt-soft);
  color: var(--cobalt-dark);
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
.diagnosis-question {
  margin: 0;
  padding: 1.6rem 0;
  border: 0;
  border-bottom: 1px solid var(--line);
}
.diagnosis-question legend {
  width: 100%;
  padding: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.55;
}
.question-no {
  display: inline-block;
  min-width: 2.5rem;
  color: var(--warm-dark);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}
.question-help {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}
.answer-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.9rem;
}
.answer-grid.answer-grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.answer-option { position: relative; min-width: 0; }
.answer-option input {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  opacity: 0;
}
.answer-option span {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: #fff;
  color: var(--ink);
  text-align: center;
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.45;
  cursor: pointer;
}
.answer-option input:hover + span { border-color: var(--cobalt); background: var(--cobalt-soft); }
.answer-option input:focus-visible + span {
  outline: 3px solid var(--warm-dark);
  outline-offset: 3px;
}
.answer-option input:checked + span {
  border-color: var(--cobalt);
  background: var(--cobalt);
  color: #fff;
  box-shadow: inset 0 0 0 1px var(--cobalt);
}
.diagnosis-submit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem;
  padding-top: 1.5rem;
}
.diagnosis-submit button { cursor: pointer; }
.form-status {
  margin: 0;
  color: #8f2e1a;
  font-size: 0.82rem;
  font-weight: 700;
}
.diagnosis-result {
  margin-top: 1.6rem;
  padding: clamp(1.3rem, 4vw, 2.2rem);
  border-radius: var(--radius);
  color: #fff;
  background: var(--cobalt-dark);
}
.diagnosis-result .eyebrow { color: #b9cdfd; }
.diagnosis-result h3 {
  margin: 0;
  color: #fff;
  font-size: clamp(1.55rem, 3.4vw, 2.4rem);
}
.diagnosis-result > p { max-width: 720px; color: #dbe5ff; }
.result-reasons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 1.25rem 0;
  padding: 0;
  list-style: none;
}
.result-reasons li {
  padding: 0.85rem;
  border: 1px solid rgba(255,255,255,0.19);
  border-radius: 4px;
  background: rgba(255,255,255,0.06);
  color: #edf2ff;
  font-size: 0.82rem;
  line-height: 1.55;
}
.result-panel {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.2);
}
.result-panel h4 { margin: 0; font-family: var(--font-display); font-size: 1rem; }
.result-panel p { color: #dbe5ff; }
.result-panel a:not(.button) { color: #fff; }
.result-panel .link-status { color: #ced9f4; }
.result-panel .button-secondary { color: var(--cobalt-dark); }
.result-reset {
  min-height: 42px;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgba(255,255,255,0.45);
  border-radius: 4px;
  background: transparent;
  color: #fff;
  font: 700 0.82rem var(--font-display);
  cursor: pointer;
}
.result-reset:hover { background: rgba(255,255,255,0.09); }
.affiliate-nearby-disclosure {
  display: block;
  margin: 0 0 0.6rem;
  color: inherit;
  font-size: 0.72rem;
  line-height: 1.55;
}
.rakuten-affiliate-source {
  display: inline-block;
  padding: 0.65rem 0.8rem;
  border: 1px solid currentColor;
  border-radius: 4px;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
}
.rakuten-link-block + .rakuten-link-block { margin-top: 0.8rem; }
.cost-calculator {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
  gap: 1.5rem;
  margin-top: 1.75rem;
  padding: clamp(1.3rem, 4vw, 2rem);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: var(--shadow);
}
.calculator-fields { display: grid; gap: 0.9rem; }
.calculator-field label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
}
.calculator-field input,
.calculator-field select {
  width: 100%;
  min-height: 46px;
  padding: 0.55rem 0.7rem;
  border: 1px solid #bcc6d7;
  border-radius: 4px;
  background: #fff;
  color: var(--ink);
  font: inherit;
}
.calculator-field input:focus,
.calculator-field select:focus { border-color: var(--cobalt); outline: 3px solid var(--cobalt-soft); }
.calculator-note { margin: 0; color: var(--muted); font-size: 0.76rem; line-height: 1.55; }
.cost-result {
  min-height: 100%;
  padding: 1.4rem;
  border-radius: var(--radius);
  color: #fff;
  background: var(--cobalt-dark);
}
.cost-result-label {
  margin: 0;
  color: #b9cdfd;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.cost-result-total {
  margin: 0.25rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.6rem);
  font-weight: 700;
  line-height: 1.15;
}
.cost-result-monthly { margin: 0.35rem 0; color: #dbe5ff; }
.cost-formula {
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.2);
  color: #dbe5ff;
  font-size: 0.8rem;
}
.cost-budget { color: #fff; font-weight: 700; }
.source-note {
  margin: 1rem 0;
  padding: 1rem;
  border-left: 4px solid var(--warm);
  background: var(--warm-soft);
  color: #6f3515;
  font-size: 0.86rem;
}
.source-list {
  margin: 1rem 0 0;
  padding-left: 1.2rem;
  color: var(--muted);
  font-size: 0.84rem;
}
.source-list li + li { margin-top: 0.45rem; }
.source-list a { overflow-wrap: anywhere; }
[hidden] { display: none !important; }

@media (max-width: 900px) {
  .recorder-hero .hero-grid,
  .cost-calculator { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .diagnosis-intro { grid-template-columns: 1fr; }
  .privacy-chip { justify-self: start; white-space: normal; }
  .answer-grid,
  .answer-grid.answer-grid-4,
  .result-reasons { grid-template-columns: 1fr; }
  .answer-option span { min-height: 54px; justify-content: flex-start; text-align: left; }
}
`;

export const recorderPageScript = String.raw`
(() => {
  const form = document.querySelector("#recorder-diagnosis");
  const result = document.querySelector("#diagnosis-result");
  const resultHeading = document.querySelector("#diagnosis-result-heading");
  const resultSummary = document.querySelector("#diagnosis-result-summary");
  const reasonNodes = [...document.querySelectorAll("[data-result-reason]")];
  const resultPanels = [...document.querySelectorAll("[data-result-panel]")];
  const formStatus = document.querySelector("#diagnosis-form-status");
  const resetButton = document.querySelector("#diagnosis-reset");
  const diagnosisVersion = "2026-08-08-v2";
  let currentResultId = "not_run";
  let startTracked = false;

  const track = (eventName, parameters = {}) => {
    const payload = Object.assign(
      { event: eventName, diagnosis_version: diagnosisVersion },
      parameters
    );
    try {
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push(payload);
      } else if (Object.isExtensible(window)) {
        window.dataLayer = [payload];
      }
    } catch {
      // 計測基盤が使えない環境でも、診断本体は止めない。
    }
    window.dispatchEvent(new CustomEvent("petrichor:analytics", { detail: payload }));
  };

  const selected = (name) => {
    const checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  };

  const resultCopy = {
    policy_first: {
      heading: "購入より先に、録音許可とデータ規定を確認",
      summary: "学校・勤務先・取引先・個人情報を含む音声は、端末選びだけでは安全性を判断できません。録音の同意と組織ルール、保存先、AI学習条件を確認してから候補を絞ります。",
      reasons: ["情報管理の条件が未確認", "録音には相手の同意が必要", "購入しても業務利用できない可能性"]
    },
    smartphone_first: {
      heading: "まずはスマホで試す",
      summary: "月5時間以内で、まだスマホ録音を試していないなら、専用端末の前に短い録音から始める方が失敗を減らせます。録音開始の手間と文字起こしの使い道を確認してください。",
      reasons: ["専用端末の必要性が未確認", "追加ハード費用は0円から試せる", "3分程度の短いテストで流れを確認"]
    },
    smartphone_continue: {
      heading: "いまのスマホ運用を続ける",
      summary: "すでにスマホで不足がないなら、専用端末を増やす理由は薄い状態です。録音開始の速さや通話録音など、明確な不便が出たときに再検討できます。",
      reasons: ["現状の手段で足りている", "端末代を追加しない", "不便が具体化してから比較できる"]
    },
    cost_first: {
      heading: "端末より先に、継続費用を確認",
      summary: "月5時間を超えて使い、月額・年額プランを避けたい場合、端末を買っても文字起こし枠が足りない可能性があります。下の計算機で3年間の費用を先に出してください。",
      reasons: ["無料枠を超える利用量", "有料プランを許容しない", "本体価格だけでは総額にならない"]
    },
    plaud_note: {
      heading: "PLAUD Noteを候補に、仕様とデータ条件を確認",
      summary: "通話または対面録音が必要で、音声認識学習への利用を避けたい条件です。公式情報上のデータ処理方針を確認しつつ、無料枠と3年間の費用を照合してください。",
      reasons: ["通話・対面の両モード", "公式はAI学習に使わないと案内", "月300分を超えると追加費用を確認"]
    },
    plaud_notepin: {
      heading: "PLAUD NotePinを候補に、装着方法を確認",
      summary: "身につけて対面録音したい条件です。NotePinは公式情報上、対面録音向けで通話録音には非対応です。装着位置と録音同意、月間利用時間を確認してください。",
      reasons: ["ハンズフリーの対面録音", "通話録音には使わない", "月300分を超えると追加費用を確認"]
    },
    card_compare: {
      heading: "カード型2機種を、用途とデータ条件で比較",
      summary: "スマホだけでは不足があり、通話または対面録音をすぐ始めたい条件です。PLAUD NoteとNotta Memoを、無料枠・継続費用・データ方針で比較してください。",
      reasons: ["専用端末の不便解消が具体的", "通話と対面の用途を確認", "価格ではなく3年総額で比較"]
    }
  };

  form.addEventListener("change", () => {
    if (!startTracked) {
      track("recorder_diagnosis_start");
      startTracked = true;
    }
    formStatus.textContent = "";
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = {
      minutes: selected("minutes"),
      mode: selected("mode"),
      smartphone: selected("smartphone"),
      subscription: selected("subscription"),
      dataPolicy: selected("data_policy")
    };
    if (Object.values(answers).some((value) => !value)) {
      formStatus.textContent = "5つすべて選ぶと判定できます。";
      formStatus.focus();
      return;
    }

    if (answers.dataPolicy === "unconfirmed") {
      currentResultId = "policy_first";
    } else if (answers.smartphone === "enough") {
      currentResultId = "smartphone_continue";
    } else if (answers.smartphone === "not_tried" && ["under120", "under300"].includes(answers.minutes)) {
      currentResultId = "smartphone_first";
    } else if (["under1200", "over1200"].includes(answers.minutes) && answers.subscription === "no") {
      currentResultId = "cost_first";
    } else if (answers.dataPolicy === "no_training") {
      currentResultId = answers.mode === "wearable" ? "plaud_notepin" : "plaud_note";
    } else if (answers.mode === "wearable") {
      currentResultId = "plaud_notepin";
    } else {
      currentResultId = "card_compare";
    }

    const copy = resultCopy[currentResultId];
    resultHeading.textContent = copy.heading;
    resultSummary.textContent = copy.summary;
    reasonNodes.forEach((node, index) => { node.textContent = copy.reasons[index] || ""; });
    resultPanels.forEach((panel) => {
      panel.hidden = panel.dataset.resultPanel !== currentResultId;
    });
    result.hidden = false;
    formStatus.textContent = "";
    track("recorder_diagnosis_complete", { question_count: 5 });
    track("recorder_diagnosis_result", { result_id: currentResultId });
    resultHeading.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  resetButton.addEventListener("click", () => {
    form.reset();
    result.hidden = true;
    formStatus.textContent = "";
    currentResultId = "not_run";
    startTracked = false;
    form.querySelector("input").focus();
  });

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    const wrapper = anchor && anchor.closest("[data-rakuten-wrapper]");
    if (!wrapper) return;
    const isAffiliate = wrapper.dataset.isAffiliate === "true";
    track(isAffiliate ? "affiliate_outbound_click" : "rakuten_search_click", {
      result_id: currentResultId,
      link_id: wrapper.dataset.linkId || "unknown",
      cta_position: wrapper.dataset.ctaPosition || "article_inline",
      affiliate_network: "rakuten",
      destination_type: wrapper.dataset.destinationType || "search"
    });
  });

  const preset = document.querySelector("#cost-preset");
  const deviceInput = document.querySelector("#device-price");
  const annualInput = document.querySelector("#annual-price");
  const extraInput = document.querySelector("#extra-cost");
  const budgetInput = document.querySelector("#cost-budget");
  const totalOutput = document.querySelector("#cost-total");
  const monthlyOutput = document.querySelector("#cost-monthly");
  const formulaOutput = document.querySelector("#cost-formula");
  const budgetOutput = document.querySelector("#cost-budget-result");
  const costError = document.querySelector("#cost-error");
  const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  const presets = {
    plaud_note_starter: [27500, 0, 0],
    plaud_note_pro: [27500, 16800, 0],
    plaud_notepin_starter: [27500, 0, 0],
    notta_memo_starter: [23500, 0, 0],
    notta_memo_premium: [23500, 14220, 0]
  };

  const calculateCost = () => {
    const values = [deviceInput, annualInput, extraInput].map((input) => Number(input.value));
    const budget = Number(budgetInput.value || 0);
    if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 10000000) || !Number.isFinite(budget) || budget < 0 || budget > 10000000) {
      costError.textContent = "0円以上、1,000万円以下の数字を入力してください。";
      return;
    }
    costError.textContent = "";
    const total = values[0] + values[1] * 3 + values[2];
    totalOutput.textContent = yen.format(total);
    monthlyOutput.textContent = "36か月で割ると、月あたり約 " + yen.format(Math.round(total / 36));
    formulaOutput.textContent = yen.format(values[0]) + " + " + yen.format(values[1]) + " × 3年 + " + yen.format(values[2]) + " = " + yen.format(total);
    if (budget > 0) {
      const difference = budget - total;
      budgetOutput.textContent = difference >= 0
        ? "予算内：" + yen.format(difference) + "の余裕"
        : "予算超過：" + yen.format(Math.abs(difference));
    } else {
      budgetOutput.textContent = "予算を入れると差額も表示します。";
    }
  };

  preset.addEventListener("change", () => {
    const values = presets[preset.value];
    if (values) {
      deviceInput.value = values[0];
      annualInput.value = values[1];
      extraInput.value = values[2];
    }
    calculateCost();
  });
  [deviceInput, annualInput, extraInput].forEach((input) => {
    input.addEventListener("input", () => {
      preset.value = "custom";
      calculateCost();
    });
  });
  budgetInput.addEventListener("input", calculateCost);
  calculateCost();
})();
`;

export function createAiRecorderPage({
  siteUrl,
  shoppingPath,
  aiGuidePath,
  learningPath,
  disclosureHtml,
  ctas
}) {
  const canonical = `${siteUrl}${recorderPath}`;
  const body = `
  <main id="main">
    <div class="container">
      <nav class="crumbs" aria-label="パンくず">
        <ol>
          <li><a href="${aiGuidePath}">Petrichor</a></li>
          <li><a href="${shoppingPath}">Shopping</a></li>
          <li aria-current="page">AIレコーダー必要度診断</li>
        </ol>
      </nav>
      ${disclosureHtml}
    </div>

    <header class="hero recorder-hero">
      <div class="container hero-grid">
        <div>
          <p class="eyebrow">AI recorder decision check</p>
          <h1>AIレコーダー、<br>本当に必要？</h1>
          <p class="hero-lead">5つの条件と3年間の費用から、「買う」「スマホで試す」「規定を先に確認」を分けます。実機レビューではなく、公式情報を照合する購入前チェックです。</p>
          <div class="article-meta">
            <span>所要時間：約1分</span>
            <span>入力：端末内だけで処理</span>
            <span>公式情報確認：2026年8月8日</span>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" href="#diagnosis">5つの条件で判定する</a>
            <a class="button button-secondary" href="#cost">3年総額を計算する</a>
          </div>
        </div>
        <figure class="recorder-hero-visual">
          <picture>
            <source type="image/avif" srcset="/static/shopping/ai-recorder-decision-640.avif 640w, /static/shopping/ai-recorder-decision-960.avif 960w, /static/shopping/ai-recorder-decision-1536.avif 1536w" sizes="(max-width: 900px) calc(100vw - 2rem), 520px">
            <source type="image/webp" srcset="/static/shopping/ai-recorder-decision-640.webp 640w, /static/shopping/ai-recorder-decision-960.webp 960w, /static/shopping/ai-recorder-decision-1536.webp 1536w" sizes="(max-width: 900px) calc(100vw - 2rem), 520px">
            <img class="editorial-image" src="/static/shopping/ai-recorder-decision-960.webp" alt="録音、文字起こし、情報管理、費用確認から購入判断へ進む流れのイメージ図" width="960" height="614" loading="eager" decoding="async">
          </picture>
          <figcaption>特定の商品を再現した画像ではありません。録音から費用・情報管理の確認までを示す編集用イメージです。</figcaption>
        </figure>
      </div>
    </header>

    <section class="section" id="diagnosis" aria-labelledby="diagnosis-title">
      <div class="container">
        <div class="diagnosis-wrap">
          <div class="diagnosis-intro">
            <div>
              <p class="eyebrow">Step 1 / Need check</p>
              <h2 id="diagnosis-title">5つの条件を選ぶ</h2>
              <p>判定は優劣ランキングではありません。専用端末を買わない結果も、同じ重さで出します。</p>
            </div>
            <span class="privacy-chip">入力内容は送信・保存しません</span>
          </div>

          <form id="recorder-diagnosis" novalidate>
            <fieldset class="diagnosis-question">
              <legend><span class="question-no">01</span>月に何分くらい文字起こししますか？</legend>
              <p class="question-help">無料枠に収まるか、有料プランが必要かを見る基準です。</p>
              <div class="answer-grid answer-grid-4">
                <label class="answer-option"><input type="radio" name="minutes" value="under120"><span>120分以下</span></label>
                <label class="answer-option"><input type="radio" name="minutes" value="under300"><span>121〜300分</span></label>
                <label class="answer-option"><input type="radio" name="minutes" value="under1200"><span>301〜1,200分</span></label>
                <label class="answer-option"><input type="radio" name="minutes" value="over1200"><span>1,200分超</span></label>
              </div>
            </fieldset>

            <fieldset class="diagnosis-question">
              <legend><span class="question-no">02</span>いちばん必要な録音方法は？</legend>
              <div class="answer-grid">
                <label class="answer-option"><input type="radio" name="mode" value="meeting"><span>机に置く対面録音</span></label>
                <label class="answer-option"><input type="radio" name="mode" value="call"><span>スマホ通話も録音</span></label>
                <label class="answer-option"><input type="radio" name="mode" value="wearable"><span>身につけて対面録音</span></label>
              </div>
            </fieldset>

            <fieldset class="diagnosis-question">
              <legend><span class="question-no">03</span>スマホ録音は、もう試しましたか？</legend>
              <div class="answer-grid">
                <label class="answer-option"><input type="radio" name="smartphone" value="not_tried"><span>まだ試していない</span></label>
                <label class="answer-option"><input type="radio" name="smartphone" value="insufficient"><span>試したが不便がある</span></label>
                <label class="answer-option"><input type="radio" name="smartphone" value="enough"><span>スマホで足りている</span></label>
              </div>
            </fieldset>

            <fieldset class="diagnosis-question">
              <legend><span class="question-no">04</span>文字起こしの月額・年額費用を許容できますか？</legend>
              <div class="answer-grid">
                <label class="answer-option"><input type="radio" name="subscription" value="yes"><span>必要なら許容できる</span></label>
                <label class="answer-option"><input type="radio" name="subscription" value="no"><span>継続費用は避けたい</span></label>
                <label class="answer-option"><input type="radio" name="subscription" value="unknown"><span>総額を見て決める</span></label>
              </div>
            </fieldset>

            <fieldset class="diagnosis-question">
              <legend><span class="question-no">05</span>録音データの扱いで、外せない条件は？</legend>
              <div class="answer-grid">
                <label class="answer-option"><input type="radio" name="data_policy" value="standard"><span>一般的な個人利用</span></label>
                <label class="answer-option"><input type="radio" name="data_policy" value="no_training"><span>音声認識学習への利用不可</span></label>
                <label class="answer-option"><input type="radio" name="data_policy" value="unconfirmed"><span>学校・会社の規定が未確認</span></label>
              </div>
            </fieldset>

            <div class="diagnosis-submit">
              <button class="button button-primary" type="submit">判定結果を見る</button>
              <a class="text-link" href="#comparison">比較条件を先に確認 →</a>
              <p class="form-status" id="diagnosis-form-status" tabindex="-1" aria-live="polite"></p>
            </div>
          </form>

          <section class="diagnosis-result" id="diagnosis-result" aria-live="polite" aria-labelledby="diagnosis-result-heading" hidden>
            <p class="eyebrow">判定結果</p>
            <h3 id="diagnosis-result-heading" tabindex="-1"></h3>
            <p id="diagnosis-result-summary"></p>
            <ul class="result-reasons" aria-label="判定理由">
              <li data-result-reason></li>
              <li data-result-reason></li>
              <li data-result-reason></li>
            </ul>

            <div class="result-panel" data-result-panel="policy_first" hidden>
              <h4>次にすること</h4>
              <p>録音相手の同意、学校・勤務先の規定、クラウド保存とAI学習条件を確認してください。条件が決まるまで購入リンクは表示しません。</p>
              <a href="#data-policy">公式データ条件を確認する →</a>
            </div>
            <div class="result-panel" data-result-panel="smartphone_first" hidden>
              <h4>3分のテストから始める</h4>
              <p>Notta Freeは公式上、月120分ですが1回3分までです。iPhone 12以降のボイスメモや対応Pixelの標準レコーダーも候補です。</p>
              <a href="#smartphone-options">スマホの公式情報を見る →</a>
            </div>
            <div class="result-panel" data-result-panel="smartphone_continue" hidden>
              <h4>買わない判断</h4>
              <p>専用端末でしか解決できない不便が出るまでは、現在の方法を続ける方が総額も機器管理も増えません。</p>
            </div>
            <div class="result-panel" data-result-panel="cost_first" hidden>
              <h4>3年間の総額を先に出す</h4>
              <p>本体だけでなく有料プランを含めてから、予算内か判断します。</p>
              <a href="#cost">総額計算へ移動する →</a>
            </div>
            <div class="result-panel" data-result-panel="plaud_note" hidden>
              <h4>購入前に公式仕様を再確認</h4>
              <p>PLAUD Noteは通話・対面の両モード。価格、無料枠、データ処理条件は購入日に公式ページと販売ページで照合してください。</p>
              ${ctas.plaudNote}
            </div>
            <div class="result-panel" data-result-panel="plaud_notepin" hidden>
              <h4>購入前に公式仕様を再確認</h4>
              <p>PLAUD NotePinはウェアラブルの対面録音向けで、公式上は通話録音非対応です。</p>
              ${ctas.plaudNotePin}
            </div>
            <div class="result-panel" data-result-panel="card_compare" hidden>
              <h4>カード型2機種の候補を探す</h4>
              <p>楽天市場では価格・在庫・販売者・返品条件を確認し、公式仕様と一致するか照合してください。</p>
              ${ctas.aiRecorder}
              ${ctas.plaudNote}
              ${ctas.nottaMemo}
            </div>
            <button class="result-reset" id="diagnosis-reset" type="button">条件を変えて再判定</button>
          </section>
        </div>
      </div>
    </section>

    <section class="section section-soft" id="cost" aria-labelledby="cost-title">
      <div class="container">
        <p class="eyebrow">Step 2 / Three-year cost</p>
        <h2 id="cost-title">3年間の総費用を比べる</h2>
        <p class="section-intro">本体価格だけではなく、年額プランと追加費用を同じ式に入れます。初期値は2026年8月8日の公式表示です。購入前に必ず上書きしてください。</p>

        <div class="cost-calculator">
          <div class="calculator-fields">
            <div class="calculator-field">
              <label for="cost-preset">公式表示の初期値</label>
              <select id="cost-preset">
                <option value="plaud_note_starter">PLAUD Note＋Starter（月300分）</option>
                <option value="plaud_note_pro">PLAUD Note＋Pro年額</option>
                <option value="plaud_notepin_starter">PLAUD NotePin＋Starter（月300分）</option>
                <option value="notta_memo_starter">Notta Memo＋Starter（月300分）</option>
                <option value="notta_memo_premium">Notta Memo＋Premium年額</option>
                <option value="custom">自分で入力</option>
              </select>
            </div>
            <div class="calculator-field">
              <label for="device-price">本体価格（税込・円）</label>
              <input id="device-price" type="number" min="0" max="10000000" step="1" value="27500" inputmode="numeric">
            </div>
            <div class="calculator-field">
              <label for="annual-price">年額プラン（税込・円）</label>
              <input id="annual-price" type="number" min="0" max="10000000" step="1" value="0" inputmode="numeric">
            </div>
            <div class="calculator-field">
              <label for="extra-cost">3年間の追加費用（アクセサリー等・円）</label>
              <input id="extra-cost" type="number" min="0" max="10000000" step="1" value="0" inputmode="numeric">
            </div>
            <div class="calculator-field">
              <label for="cost-budget">3年間の予算（任意・円）</label>
              <input id="cost-budget" type="number" min="0" max="10000000" step="1" placeholder="例：50000" inputmode="numeric">
            </div>
            <p class="calculator-note">計算式：本体価格＋年額プラン×3年＋追加費用。通信費、端末の買い替え、価格改定は含みません。</p>
            <p class="form-status" id="cost-error" aria-live="polite"></p>
          </div>
          <div class="cost-result" aria-live="polite">
            <p class="cost-result-label">3年間の総額</p>
            <p class="cost-result-total" id="cost-total">¥27,500</p>
            <p class="cost-result-monthly" id="cost-monthly"></p>
            <p class="cost-formula" id="cost-formula"></p>
            <p class="cost-budget" id="cost-budget-result"></p>
          </div>
        </div>
      </div>
    </section>

    <article class="article-body" id="comparison">
      <div class="reading">
        <p class="eyebrow">Step 3 / Official facts</p>
        <h2>公式情報で比較できること</h2>
        <p>ここでは実機の音質や精度を順位づけしません。価格、録音方法、無料枠、有料プラン、データ方針のように、一次情報で照合できる条件だけを扱います。</p>
        <div class="comparison-wrap" role="region" aria-label="AIレコーダーとスマホ録音の公式条件比較" tabindex="0">
          <table class="comparison">
            <thead>
              <tr>
                <th scope="col">候補</th>
                <th scope="col">公式表示の価格・無料枠</th>
                <th scope="col">録音方法</th>
                <th scope="col">購入前の注意</th>
              </tr>
            </thead>
            <tbody>
              <tr id="smartphone-options">
                <td>スマホだけ</td>
                <td>既存端末なら追加ハード0円。Notta Freeは月120分、1回3分まで</td>
                <td>端末・アプリによる</td>
                <td>まず短い録音で、開始操作と出力の使い道を確認</td>
              </tr>
              <tr>
                <td>PLAUD Note</td>
                <td>27,500円（通常価格表示）・Starter月300分。Pro年額16,800円</td>
                <td>対面＋スマホ通話</td>
                <td>セール価格は変動。月300分を超えるならプラン費用を追加</td>
              </tr>
              <tr>
                <td>PLAUD NotePin</td>
                <td>27,500円（通常価格表示）・Starter月300分</td>
                <td>身につける対面録音</td>
                <td>公式上、通話録音には非対応</td>
              </tr>
              <tr>
                <td>Notta Memo</td>
                <td>23,500円・端末紐付け中はStarter月300分。Premium年額14,220円</td>
                <td>対面＋スマホ通話</td>
                <td>Starterは端末の紐付け解除で失効。データ条件をプラン別に確認</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 id="data-policy">録音とデータ管理を先に決める</h2>
        <div class="source-note"><strong>録音前に相手へ伝え、同意を得る。</strong><br>学校、勤務先、取引先、医療・相談などの音声は、所属組織の規定と保存場所も確認してください。</div>
        <p>PLAUDは公式サポートで、AI処理時の音声・文字起こしデータをAIモデル学習に使わないと案内しています。一方、Nottaの公式FAQは、通常の音声認識で音声と認識結果がランダムに抽出され学習に使われる場合があり、「AI学習なし」はEnterpriseとBusiness Plusで提供すると案内しています。用途に合う最新条件を、契約前に確認してください。</p>

        <h2>このページで断定しないこと</h2>
        <ul class="checklist">
          <li><strong>文字起こし精度の順位。</strong><br>同じ音声・同じ環境で実測していないため、No.1や最も正確とは書きません。</li>
          <li><strong>音質や装着感。</strong><br>運営者の実機体験がないため、使用感を作りません。</li>
          <li><strong>価格・在庫の継続。</strong><br>表示価格は確認日のスナップショットです。購入日の販売ページを優先します。</li>
        </ul>

        <h2>確認した公式情報</h2>
        <p>確認日：2026年8月8日。価格・プランは変動します。</p>
        <ul class="source-list">
          <li><a href="https://jp.plaud.ai/products/plaud-note-ai-voice-recorder" target="_blank" rel="noopener">PLAUD Note 公式商品ページ</a></li>
          <li><a href="https://jp.plaud.ai/products/notepin" target="_blank" rel="noopener">PLAUD NotePin 公式商品ページ</a></li>
          <li><a href="https://jp.plaud.ai/pages/plaud-ai-plan-pricing" target="_blank" rel="noopener">PLAUD AI メンバーシップ料金</a></li>
          <li><a href="https://support.plaud.ai/hc/ja/articles/57744162858009-AI-%E5%87%A6%E7%90%86%E3%81%A7%E3%81%AE%E3%83%87%E3%83%BC%E3%82%BF%E3%81%AE%E4%BD%BF%E3%82%8F%E3%82%8C%E6%96%B9" target="_blank" rel="noopener">PLAUD AI処理時のデータ利用</a></li>
          <li><a href="https://shop.notta.ai/ja-jp/products/notta-memo-jp" target="_blank" rel="noopener">Notta Memo 公式販売ページ</a></li>
          <li><a href="https://www.notta.ai/pricing" target="_blank" rel="noopener">Notta 公式料金ページ</a></li>
          <li><a href="https://support.notta.ai/hc/ja/articles/38283709733787-%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%83%97%E3%83%A9%E3%83%B3%E3%81%A8%E3%81%AF" target="_blank" rel="noopener">Notta Starterの適用条件</a></li>
          <li><a href="https://support.notta.ai/hc/ja/articles/25948519611291-AI%E5%AD%A6%E7%BF%92%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6" target="_blank" rel="noopener">Notta 音声認識のAI学習条件</a></li>
          <li><a href="https://support.apple.com/ja-jp/guide/iphone/iph00953a982/ios" target="_blank" rel="noopener">Apple iPhone ボイスメモの文字起こし</a></li>
          <li><a href="https://support.google.com/pixelphone/answer/16267698?hl=ja" target="_blank" rel="noopener">Google Pixel レコーダーの文字起こし</a></li>
        </ul>

        <h2>比較の次に、AIの扱い方を学ぶ</h2>
        <p>文字起こしや要約は、録音できれば終わりではありません。出力を確認し、誤りを直し、必要な範囲だけ共有する運用が必要です。</p>
        <aside class="cross-link">
          <div>
            <h3>AIの仕組みをやさしく読む</h3>
            <p>文字起こしや生成AIの得意・不得意を理解する。</p>
          </div>
          <a class="button button-primary" href="${aiGuidePath}">AI解説へ <span aria-hidden="true">→</span></a>
        </aside>
        <aside class="cross-link">
          <div>
            <h3>Petrichor Learningで実践する</h3>
            <p>確認と編集の手順を、仕事や学びで使える形にする。</p>
          </div>
          <a class="button button-secondary" href="${learningPath}">Learningへ <span aria-hidden="true">→</span></a>
        </aside>
      </div>
    </article>
  </main>
  `;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AIレコーダー必要度・3年総額診断",
      description: "5つの条件と3年間の総費用から、AIレコーダーを買う前の判断材料を整理する無料診断。",
      url: canonical,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web browser",
      isAccessibleForFree: true,
      browserRequirements: "JavaScript"
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Petrichor", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Shopping", item: `${siteUrl}${shoppingPath}` },
        { "@type": "ListItem", position: 3, name: "AIレコーダー必要度診断", item: canonical }
      ]
    }
  ];

  return {
    canonical,
    title: "AIレコーダーは必要？3年総額と用途で診断｜Petrichor Shopping",
    description: "AIレコーダーを買う前に、月間利用量、録音方法、スマホでの代替、継続費用、データ条件を確認。3年間の総額もブラウザ内で計算できます。",
    body,
    jsonLd
  };
}
