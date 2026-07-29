// 記事とは別に、単独ページとして置く実用ツール群。
//
// 共通の方針:
// - 全てブラウザ内で完結する。入力はどこにも送らない。
//   料金や契約内容という個人的な情報を扱うので、送らない作りにしておく。
// - 料金表を内蔵しない。値上げや改定のたびに嘘になり、
//   こちらが気づかないまま誤情報を出し続けることになるため。
//   金額は利用者自身の請求額を入れてもらう。
// - 依存パッケージなし。素のJSで書く。

// 共通スタイル。各ツールの<style>から使う。
export const TOOL_CSS = `
.tool { max-width: var(--wide); margin: 0 auto; }
.tool-note { color: var(--muted); font-size: 0.9rem; line-height: 1.8; }
.tool-card { border: 1px solid var(--border); border-radius: var(--r); padding: 1.25rem; background: var(--surface); }
.tool-row { display: grid; gap: 0.75rem; align-items: end; }
.tool-field { display: flex; flex-direction: column; gap: 0.35rem; }
.tool-field label { font-size: 0.85rem; color: var(--muted); }
.tool input[type="text"], .tool input[type="number"], .tool select, .tool textarea {
  font: inherit; color: var(--fg); background: var(--bg);
  border: 1px solid var(--border); border-radius: var(--r); padding: 0.55rem 0.65rem; width: 100%;
}
.tool textarea { min-height: 9rem; resize: vertical; line-height: 1.8; }
.tool input:focus, .tool select:focus, .tool textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.tool-btn {
  font: inherit; cursor: pointer; border-radius: var(--r);
  border: 1px solid var(--accent); background: var(--accent); color: var(--accent-fg);
  padding: 0.55rem 1.1rem;
}
.tool-btn.is-ghost { background: transparent; color: var(--accent); }
.tool-btn:disabled { opacity: 0.5; cursor: default; }
.tool-out { margin-top: 1.5rem; }
.tool-figure { margin: 1.25rem 0; }
.tool-figure svg { width: 100%; height: auto; display: block; }
.tool-total { font-size: 1.9rem; font-weight: 700; letter-spacing: -0.02em; }
.tool-flag { border-left: 3px solid var(--accent); background: var(--accent-soft); padding: 0.8rem 1rem; border-radius: var(--r); margin: 0.6rem 0; }
.tool-flag.is-quiet { border-left-color: var(--border); background: var(--code-bg); }
.tool-table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
.tool-table th, .tool-table td { border-bottom: 1px solid var(--border); padding: 0.6rem 0.5rem; text-align: left; }
.tool-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
.tool-scroll { overflow-x: auto; }
.tool-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.tool-tag { font-size: 0.8rem; border: 1px solid var(--border); border-radius: 999px; padding: 0.15rem 0.6rem; color: var(--muted); }
.tool-tag.is-on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.tool-del { font: inherit; cursor: pointer; background: none; border: none; color: var(--muted); padding: 0.4rem; }
.tool-del:hover { color: var(--fg); }
@media (min-width: 720px) { .tool-row { grid-template-columns: 2fr 1fr 1fr auto; } }
`;

// ---------------------------------------------------------------- 共通部品

// 機能タグ。重複の判定はこれを突き合わせて行う。
const CAPS = [
  ["text", "文章生成"],
  ["code", "コード"],
  ["image", "画像生成"],
  ["audio", "音声・文字起こし"],
  ["search", "調べもの"],
  ["slide", "資料作成"],
];

// ---------------------------------------------------------------- ① サブスク棚卸し表

export const subscriptionTool = {
  slug: "subscription-check",
  title: "AIサブスク棚卸し表",
  description:
    "契約中のAIサービスと月額を入れると、年額に換算し、機能が重なっている組み合わせを指摘します。入力はブラウザから外に出ません。",
  lead: "解約すべきかを判断する材料は、合計額だけでは足りません。同じことができるサービスに二重で払っていないかを見ます。",
  render() {
    const capBtns = CAPS.map(
      ([id, label]) => `<button type="button" class="tool-tag" data-cap="${id}">${label}</button>`,
    ).join("");

    return `
<div class="tool" id="sub-tool">
  <div class="tool-card">
    <div class="tool-row" id="sub-input">
      <div class="tool-field">
        <label for="sub-name">サービス名</label>
        <input type="text" id="sub-name" placeholder="例: ChatGPT Plus" autocomplete="off">
      </div>
      <div class="tool-field">
        <label for="sub-price">金額（円）</label>
        <input type="number" id="sub-price" min="0" step="1" placeholder="3000" inputmode="numeric">
      </div>
      <div class="tool-field">
        <label for="sub-cycle">支払い</label>
        <select id="sub-cycle">
          <option value="12">毎月</option>
          <option value="1">年1回</option>
        </select>
      </div>
      <div class="tool-field">
        <button type="button" class="tool-btn" id="sub-add">追加</button>
      </div>
    </div>

    <div class="tool-field" style="margin-top:1rem;">
      <label>このサービスでできること（重複の判定に使います・複数可）</label>
      <div class="tool-tags" id="sub-caps">${capBtns}</div>
    </div>
  </div>

  <div class="tool-out" id="sub-out" hidden>
    <div class="tool-scroll">
      <table class="tool-table">
        <thead><tr><th>サービス</th><th>できること</th><th class="num">年額</th><th></th></tr></thead>
        <tbody id="sub-rows"></tbody>
      </table>
    </div>

    <p style="margin-top:1.25rem;">年間の支払い合計</p>
    <p class="tool-total" id="sub-total">0円</p>

    <div id="sub-flags"></div>

    <p style="margin-top:1.5rem;">
      <button type="button" class="tool-btn is-ghost" id="sub-clear">全部消す</button>
    </p>
  </div>

  <p class="tool-note" style="margin-top:1.5rem;">
    入力した内容はこのブラウザにのみ保存されます。こちらに送信されることはありません。
    金額は改定されるため、こちらで料金表は持たず、ご自身の請求額を入れていただく形にしています。
  </p>
</div>

<style>${TOOL_CSS}</style>
<script>
(function () {
  var CAPS = ${JSON.stringify(CAPS)};
  var KEY = "petrichot-subs";
  var items = [];
  var picked = {};

  var elName = document.getElementById("sub-name");
  var elPrice = document.getElementById("sub-price");
  var elCycle = document.getElementById("sub-cycle");
  var elRows = document.getElementById("sub-rows");
  var elOut = document.getElementById("sub-out");
  var elTotal = document.getElementById("sub-total");
  var elFlags = document.getElementById("sub-flags");

  function yen(n) { return n.toLocaleString("ja-JP") + "円"; }
  function capLabel(id) {
    for (var i = 0; i < CAPS.length; i++) if (CAPS[i][0] === id) return CAPS[i][1];
    return id;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) items = JSON.parse(raw) || [];
    } catch (e) { items = []; }
    if (!Array.isArray(items)) items = [];
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
  }

  function syncCapButtons() {
    var btns = document.querySelectorAll("#sub-caps .tool-tag");
    for (var i = 0; i < btns.length; i++) {
      var on = !!picked[btns[i].dataset.cap];
      btns[i].classList.toggle("is-on", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  // 同じ機能タグを2つ以上のサービスが持っていたら、重なりとして挙げる。
  function overlaps() {
    var byCap = {};
    items.forEach(function (it) {
      (it.caps || []).forEach(function (c) {
        (byCap[c] = byCap[c] || []).push(it);
      });
    });
    var out = [];
    Object.keys(byCap).forEach(function (c) {
      if (byCap[c].length >= 2) out.push({ cap: c, list: byCap[c] });
    });
    // 重なっている本数が多いものから見せる。
    out.sort(function (a, b) { return b.list.length - a.list.length; });
    return out;
  }

  // 解約しても、できることが1つも減らないサービスを探す。
  //
  // 「機能が重なっている」だけでは、いくら浮くかは言えない。
  // 重なりは用途ごとに出るので、用途ごとに金額を足すと同じ契約を
  // 何度も数えることになり、実際には浮かない額が出てしまう。
  // 言い切れるのは「このサービスが持つ機能が、全て他でも賄えている」場合だけ。
  function redundant() {
    return items.filter(function (it) {
      var caps = it.caps || [];
      if (!caps.length) return false;
      return caps.every(function (c) {
        return items.some(function (other) {
          return other !== it && (other.caps || []).indexOf(c) >= 0;
        });
      });
    });
  }

  function render() {
    elOut.hidden = items.length === 0;
    elRows.innerHTML = "";
    var total = 0;

    items.forEach(function (it, i) {
      total += it.yearly;
      var tr = document.createElement("tr");

      var td1 = document.createElement("td");
      td1.textContent = it.name;
      var td2 = document.createElement("td");
      td2.textContent = (it.caps || []).map(capLabel).join("・") || "—";
      var td3 = document.createElement("td");
      td3.className = "num";
      td3.textContent = yen(it.yearly);
      var td4 = document.createElement("td");
      var del = document.createElement("button");
      del.type = "button";
      del.className = "tool-del";
      del.textContent = "削除";
      del.setAttribute("aria-label", it.name + " を削除");
      del.addEventListener("click", function () {
        items.splice(i, 1); save(); render();
      });
      td4.appendChild(del);

      tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tr.appendChild(td4);
      elRows.appendChild(tr);
    });

    elTotal.textContent = yen(total);

    elFlags.innerHTML = "";
    var ov = overlaps();
    if (!items.length) return;

    if (!ov.length) {
      var ok = document.createElement("p");
      ok.className = "tool-flag is-quiet";
      ok.textContent = "機能の重なりは見つかりませんでした。";
      elFlags.appendChild(ok);
      return;
    }

    var h = document.createElement("p");
    h.style.marginTop = "1.5rem";
    h.textContent = "機能が重なっている組み合わせ";
    elFlags.appendChild(h);

    ov.forEach(function (o) {
      var names = o.list.map(function (x) { return x.name; });
      var p = document.createElement("div");
      p.className = "tool-flag is-quiet";
      p.appendChild(el("p", null,
        "「" + capLabel(o.cap) + "」が " + names.length + "つ重なっています: " + names.join(" / ")));
      elFlags.appendChild(p);
    });

    // ここだけは金額を出す。「解約しても機能が減らない」と言い切れる場合のみ。
    var red = redundant();
    if (red.length) {
      elFlags.appendChild(el("p", null, "解約しても、できることが減らないもの"));
      red.forEach(function (it) {
        var d = document.createElement("div");
        d.className = "tool-flag";
        d.appendChild(el("p", null, it.name + " — 年 " + yen(it.yearly)));
        d.appendChild(el("p", "tool-note",
          "このサービスの「" + (it.caps || []).map(capLabel).join("・") +
          "」は、いずれも他の契約で賄えています。"));
        elFlags.appendChild(d);
      });

      if (red.length >= 2) {
        elFlags.appendChild(el("p", "tool-note",
          "これは1つずつ見た結果です。" + red.length +
          "つを同時に解約すると、どちらにも頼っていた機能が抜けることがあります。解約は1つずつ試してください。"));
      }
    }

    elFlags.appendChild(el("p", "tool-note",
      "同じ用途でも、出力の質や使い勝手は違います。金額だけで決めず、実際に使う頻度が高いほうを残してください。"));
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  document.getElementById("sub-caps").addEventListener("click", function (e) {
    var b = e.target.closest(".tool-tag");
    if (!b) return;
    var c = b.dataset.cap;
    if (picked[c]) delete picked[c]; else picked[c] = true;
    syncCapButtons();
  });

  document.getElementById("sub-add").addEventListener("click", function () {
    var name = (elName.value || "").trim();
    var price = Number(elPrice.value);
    if (!name) { elName.focus(); return; }
    if (!isFinite(price) || price < 0) { elPrice.focus(); return; }

    items.push({
      name: name.slice(0, 40),
      yearly: Math.round(price * Number(elCycle.value)),
      caps: Object.keys(picked),
    });
    save();
    elName.value = ""; elPrice.value = "";
    picked = {}; syncCapButtons();
    render();
    elName.focus();
  });

  elPrice.addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("sub-add").click();
  });

  document.getElementById("sub-clear").addEventListener("click", function () {
    items = []; save(); render();
  });

  load();
  syncCapButtons();
  render();
})();
</script>`;
  },
};

// ---------------------------------------------------------------- ② プロンプト添削

export const promptCheckTool = {
  slug: "prompt-check",
  title: "プロンプト添削ツール",
  description:
    "書いたプロンプトを貼ると、目的・相手・条件・形式のどれが欠けているか、曖昧な言い回しが残っていないかを指摘します。",
  lead: "AIの出力が思ったものにならないとき、原因の多くは指示の側にあります。何が足りていないかを機械的に洗い出します。",
  render() {
    return `
<div class="tool" id="pc-tool">
  <div class="tool-card">
    <div class="tool-field">
      <label for="pc-in">プロンプトを貼ってください</label>
      <textarea id="pc-in" placeholder="例: ブログ記事を書いて。AIについて。いい感じにお願いします。"></textarea>
    </div>
    <p style="margin-top:1rem;">
      <button type="button" class="tool-btn" id="pc-run">確認する</button>
      <button type="button" class="tool-btn is-ghost" id="pc-sample">見本を入れる</button>
    </p>
  </div>

  <div class="tool-out" id="pc-out" hidden></div>

  <p class="tool-note" style="margin-top:1.5rem;">
    判定はこのページの中だけで行っています。入力した文章が送信されることはありません。
    機械的な確認なので、指摘が出なくても良いプロンプトとは限りません。逆に、意図して省いている項目が指摘されることもあります。
  </p>
</div>

<style>${TOOL_CSS}</style>
<script>
(function () {
  var elIn = document.getElementById("pc-in");
  var elOut = document.getElementById("pc-out");

  // 4要素は「それらしい語が入っているか」で見る。文意までは判定しない。
  var AXES = [
    { key: "目的", re: /(したい|してほしい|ため|目的|向け|を作|を書|を要約|を翻訳|を修正|を提案|を比較)/,
      hint: "何をしてほしいのかを動詞で書く。「〜を3案出して」のように。" },
    { key: "相手", re: /(向け|読者|対象|顧客|上司|初心者|社内|取引先|学生|children|お客様|部下|同僚)/,
      hint: "誰が読むのかを書く。相手が変われば語彙と説明の深さが変わる。" },
    { key: "条件", re: /(ない|禁止|避け|除く|必ず|条件|前提|踏まえ|考慮|含め|使わ|注意)/,
      hint: "外してほしくないこと・避けたいことを書く。悪い例を1つ貼るのが効く。" },
    { key: "形式", re: /(字|文字|箇条書|表|見出し|形式|構成|段落|行|案|フォーマット|マークダウン|リスト|json)/i,
      hint: "分量と形を指定する。「箇条書きで5つ、各40字以内」のように。" }
  ];

  // 読み手によって解釈が変わる語。ここが残っていると出力が安定しない。
  var VAGUE = ["いい感じ", "よしなに", "適当に", "ちゃんと", "しっかり", "うまく",
               "分かりやすく", "きれいに", "それなり", "普通に", "なるべく", "できれば"];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function run() {
    var text = elIn.value || "";
    elOut.innerHTML = "";
    elOut.hidden = false;

    if (!text.trim()) {
      elOut.appendChild(el("p", "tool-flag is-quiet", "プロンプトが入力されていません。"));
      return;
    }

    var missing = AXES.filter(function (a) { return !a.re.test(text); });
    var vague = VAGUE.filter(function (v) { return text.indexOf(v) >= 0; });
    var len = text.replace(/\\s/g, "").length;

    var score = 4 - missing.length;
    var head = el("p");
    head.style.marginBottom = "0.75rem";
    head.appendChild(el("span", "tool-total", score + " / 4"));
    elOut.appendChild(head);
    elOut.appendChild(el("p", "tool-note", "目的・相手・条件・形式のうち、書かれていると判定できたのは" + score + "項目です。"));

    if (missing.length) {
      elOut.appendChild(el("p", null, "足りていない可能性がある項目"));
      missing.forEach(function (a) {
        var d = el("div", "tool-flag");
        d.appendChild(el("p", null, a.key));
        d.appendChild(el("p", "tool-note", a.hint));
        elOut.appendChild(d);
      });
    }

    if (vague.length) {
      var d = el("div", "tool-flag");
      d.appendChild(el("p", null, "解釈の幅が大きい言葉が " + vague.length + " 件あります: " + vague.join("、")));
      d.appendChild(el("p", "tool-note",
        "これらは読み手によって意味が変わります。「分かりやすく」なら「専門用語を使わず、中学生が読める語彙で」のように、条件に置き換えると出力が安定します。"));
      elOut.appendChild(d);
    }

    if (len < 20) {
      var s = el("div", "tool-flag");
      s.appendChild(el("p", null, "指示が短すぎます（" + len + "字）"));
      s.appendChild(el("p", "tool-note", "短い指示は一般論を招きます。こちらの状況を知らない相手だと思って、前提を書き足してください。"));
      elOut.appendChild(s);
    } else if (len > 1200) {
      var l = el("div", "tool-flag is-quiet");
      l.appendChild(el("p", null, "指示が長めです（" + len + "字）"));
      l.appendChild(el("p", "tool-note", "一度で完成させようとせず、まず構成案だけ出させて、確認してから本文に進むほうが手戻りが小さくなります。"));
      elOut.appendChild(l);
    }

    if (!missing.length && !vague.length && len >= 20 && len <= 1200) {
      elOut.appendChild(el("p", "tool-flag", "4要素が揃っていて、曖昧な言い回しも見つかりませんでした。あとは返ってきた出力を見て条件を足していく段階です。"));
    }
  }

  document.getElementById("pc-run").addEventListener("click", run);
  document.getElementById("pc-sample").addEventListener("click", function () {
    elIn.value = "ブログ記事を書いて。AIについて。いい感じにお願いします。";
    run();
  });
})();
</script>`;
  },
};

// ---------------------------------------------------------------- ④ 損益分岐シミュレーター

export const breakevenTool = {
  slug: "breakeven",
  title: "定額プランと従量課金の損益分岐",
  description:
    "月額プランとAPIの従量課金、どちらが安く済むかを使用回数から計算します。乗り換えの分かれ目がどこにあるかが分かります。",
  lead: "料金を並べただけでは判断できません。自分の使用量だと、どちらがいくら安いのかを出します。",
  render() {
    return `
<div class="tool" id="be-tool">
  <div class="tool-card">
    <div class="tool-row" style="grid-template-columns:1fr;">
      <div class="tool-field">
        <label for="be-flat">定額プランの月額（円）</label>
        <input type="number" id="be-flat" min="0" step="1" value="3000" inputmode="numeric">
      </div>
      <div class="tool-field">
        <label for="be-unit">従量課金の1回あたり（円）</label>
        <input type="number" id="be-unit" min="0" step="0.1" value="15" inputmode="decimal">
      </div>
      <div class="tool-field">
        <label for="be-uses">1か月に使う回数</label>
        <input type="number" id="be-uses" min="0" step="1" value="120" inputmode="numeric">
      </div>
    </div>
  </div>

  <div class="tool-out" id="be-out"></div>

  <p class="tool-note" style="margin-top:1.5rem;">
    1回あたりの単価は、扱う文章の長さによって変わります。正確に出したいときは、
    実際の請求額を使用回数で割った値を入れてください。為替や改定でも変わるため、目安として使ってください。
  </p>
</div>

<style>${TOOL_CSS}</style>
<script>
(function () {
  var f = document.getElementById("be-flat");
  var u = document.getElementById("be-unit");
  var n = document.getElementById("be-uses");
  var out = document.getElementById("be-out");

  function yen(v) { return Math.round(v).toLocaleString("ja-JP") + "円"; }

  function chart(flat, unit, uses, be) {
    var W = 640, H = 260, PAD = 44;
    // 分岐点と現在地の両方が入る範囲にする。
    var maxX = Math.max(uses * 1.4, (isFinite(be) ? be : 0) * 1.6, 10);
    var maxY = Math.max(flat, unit * maxX, 1) * 1.15;
    var x = function (v) { return PAD + (v / maxX) * (W - PAD - 16); };
    var y = function (v) { return H - PAD - (v / maxY) * (H - PAD - 16); };

    var parts = [];
    parts.push('<line x1="' + PAD + '" y1="' + y(0) + '" x2="' + (W - 16) + '" y2="' + y(0) + '" stroke="var(--border)" stroke-width="1"/>');
    parts.push('<line x1="' + PAD + '" y1="16" x2="' + PAD + '" y2="' + y(0) + '" stroke="var(--border)" stroke-width="1"/>');
    // 定額(水平線)
    parts.push('<line x1="' + x(0) + '" y1="' + y(flat) + '" x2="' + x(maxX) + '" y2="' + y(flat) + '" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 4"/>');
    // 従量(原点からの直線)
    parts.push('<line x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(maxX) + '" y2="' + y(unit * maxX) + '" stroke="var(--accent)" stroke-width="2"/>');

    if (isFinite(be) && be > 0 && be <= maxX) {
      parts.push('<line x1="' + x(be) + '" y1="' + y(0) + '" x2="' + x(be) + '" y2="' + y(flat) + '" stroke="var(--border)" stroke-width="1" stroke-dasharray="3 3"/>');
      parts.push('<circle cx="' + x(be) + '" cy="' + y(flat) + '" r="5" fill="var(--accent)"/>');
      parts.push('<text x="' + x(be) + '" y="' + (y(flat) - 12) + '" text-anchor="middle" font-size="12" fill="var(--fg)">分岐 ' + Math.ceil(be) + '回</text>');
    }
    // 現在地
    parts.push('<circle cx="' + x(uses) + '" cy="' + y(Math.min(unit * uses, maxY)) + '" r="4" fill="var(--fg)"/>');
    parts.push('<text x="' + x(uses) + '" y="' + (H - PAD + 18) + '" text-anchor="middle" font-size="12" fill="var(--muted)">今 ' + uses + '回</text>');

    parts.push('<text x="' + (W - 16) + '" y="' + (y(flat) - 8) + '" text-anchor="end" font-size="12" fill="var(--muted)">定額</text>');
    parts.push('<text x="' + (W - 16) + '" y="' + Math.max(y(unit * maxX) + 16, 26) + '" text-anchor="end" font-size="12" fill="var(--accent)">従量</text>');
    parts.push('<text x="4" y="20" font-size="12" fill="var(--muted)">円/月</text>');

    return '<figure class="tool-figure"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" xmlns="http://www.w3.org/2000/svg"><title>定額と従量課金の費用比較</title>' + parts.join("") + '</svg></figure>';
  }

  function render() {
    var flat = Math.max(0, Number(f.value) || 0);
    var unit = Math.max(0, Number(u.value) || 0);
    var uses = Math.max(0, Math.round(Number(n.value) || 0));

    var meter = unit * uses;
    var be = unit > 0 ? flat / unit : Infinity;
    var diff = Math.abs(meter - flat);

    out.innerHTML = chart(flat, unit, uses, be);

    var verdict = document.createElement("div");
    verdict.className = "tool-flag";
    var p1 = document.createElement("p");
    var p2 = document.createElement("p");
    p2.className = "tool-note";
    p2.style.marginTop = "0.4rem";

    if (unit === 0) {
      p1.textContent = "従量課金の単価が0円なので比較できません。";
      p2.textContent = "1回あたりの金額を入れてください。";
    } else if (Math.round(meter) === Math.round(flat)) {
      p1.textContent = "ちょうど分岐点です。";
      p2.textContent = "この使用量ではどちらも同額です。今後増えるなら定額、減るなら従量が有利になります。";
    } else if (meter < flat) {
      p1.textContent = "従量課金のほうが月 " + yen(diff) + " 安い";
      p2.textContent = "月 " + Math.ceil(be) + " 回を超えると定額のほうが安くなります。今は " + uses + " 回なので、あと " + Math.max(0, Math.ceil(be) - uses) + " 回ぶんの余裕があります。";
    } else {
      p1.textContent = "定額プランのほうが月 " + yen(diff) + " 安い";
      p2.textContent = "分岐点は月 " + Math.ceil(be) + " 回です。使用が " + Math.ceil(be) + " 回を下回る月が続くようなら、従量に戻すほうが安くなります。";
    }
    verdict.appendChild(p1); verdict.appendChild(p2);
    out.appendChild(verdict);

    var year = document.createElement("p");
    year.className = "tool-note";
    year.textContent = "年額に直すと、定額 " + yen(flat * 12) + " / 従量 " + yen(meter * 12) + "（今の使用量が続いた場合）。";
    out.appendChild(year);
  }

  [f, u, n].forEach(function (e) { e.addEventListener("input", render); });
  render();
})();
</script>`;
  },
};

// ---------------------------------------------------------------- ③ 社内AIルール生成

export const policyTool = {
  slug: "policy-draft",
  title: "社内AI利用ルールのたたき台",
  description:
    "業種と扱う情報、用途を選ぶと、社内で配る生成AI利用ルールの草案を作ります。そのままコピーして手を入れられます。",
  lead: "ゼロから書くのが一番大変です。条件を選んで出た草案に、自社の事情を足していく形にしてください。",
  render() {
    return `
<div class="tool" id="pol-tool">
  <div class="tool-card">
    <div class="tool-row" style="grid-template-columns:1fr;">
      <div class="tool-field">
        <label for="pol-org">組織の種類</label>
        <select id="pol-org">
          <option value="company">一般企業</option>
          <option value="school">学校・教育機関</option>
          <option value="medical">医療・福祉</option>
          <option value="public">自治体・公的機関</option>
        </select>
      </div>
      <div class="tool-field">
        <label for="pol-data">扱う情報でいちばん重いもの</label>
        <select id="pol-data">
          <option value="public">公開情報が中心</option>
          <option value="internal">社内限りの情報を扱う</option>
          <option value="personal">個人情報を扱う</option>
          <option value="secret">機微情報・機密を扱う</option>
        </select>
      </div>
      <div class="tool-field">
        <label for="pol-use">主な用途</label>
        <select id="pol-use">
          <option value="text">文章作成・要約</option>
          <option value="research">調べもの</option>
          <option value="code">プログラム</option>
          <option value="image">画像・資料作成</option>
        </select>
      </div>
    </div>
    <p style="margin-top:1rem;">
      <button type="button" class="tool-btn" id="pol-run">草案を作る</button>
      <button type="button" class="tool-btn is-ghost" id="pol-copy" disabled>コピー</button>
      <span class="tool-note" id="pol-copied" hidden>コピーしました</span>
    </p>
  </div>

  <div class="tool-out" id="pol-out" hidden>
    <div class="tool-field">
      <textarea id="pol-text" style="min-height:26rem;" readonly></textarea>
    </div>
  </div>

  <p class="tool-note" style="margin-top:1.5rem;">
    これは<strong>たたき台</strong>です。法令や業界の規制、所属先の既存規程が優先されます。
    そのまま配らず、必ず責任者の確認を通してください。個人情報や機微情報を扱う場合は、
    法務・情報システム部門と、必要に応じて専門家への相談をお勧めします。
  </p>
</div>

<style>${TOOL_CSS}</style>
<script>
(function () {
  var ORG = {
    company: { name: "当社", who: "従業員", extra: "" },
    school:  { name: "本校", who: "教職員および児童生徒",
      extra: "・児童生徒が利用する場合は、各サービスの利用規約が定める年齢条件を必ず確認する。\\n・課題や評価に関わる利用は、担当教員の指示に従う。" },
    medical: { name: "当法人", who: "職員",
      extra: "・患者・利用者に関する情報は、匿名化した場合でも入力しない。\\n・診断や治療方針の判断に、生成AIの出力をそのまま用いない。" },
    public:  { name: "本市", who: "職員",
      extra: "・住民に関する情報は入力しない。\\n・公文書に用いる場合は、決裁の過程で人による確認を経る。" }
  };

  var DATA = {
    public:   ["公開情報が中心のため、入力できる範囲は比較的広い。", "・すでに公開されている情報は入力してよい。\\n・公開前の情報は、公開予定であっても入力しない。"],
    internal: ["社内限りの情報を扱うため、入力の可否を個別に判断する。", "・社外に出せない情報は入力しない。判断に迷うものは入力しない。\\n・取引先から受け取った情報は、相手の同意がない限り入力しない。"],
    personal: ["個人情報を扱うため、入力は原則禁止とする。", "・氏名、連絡先、所属、その他個人を特定できる情報は入力しない。\\n・匿名化したつもりでも、組み合わせで特定できる場合があるため入力しない。\\n・やむを得ず利用する場合は、事前に管理部門の承認を得る。"],
    secret:   ["機微情報・機密を扱うため、外部サービスの利用を原則禁止とする。", "・機密指定された情報は、いかなる形でも入力しない。\\n・利用は、契約により学習に使われないことが確認できたサービスに限る。\\n・利用可能なサービスの一覧は管理部門が定め、それ以外は使用しない。"]
  };

  var USE = {
    text: "・生成された文章は、そのまま提出しない。事実関係と数値を確認したうえで用いる。\\n・社外に出す文書は、必ず担当者が全文を読んでから送る。",
    research: "・生成AIの回答を出典として用いない。必ず一次情報に当たり、その一次情報を出典として記載する。\\n・URLや統計は実在しないことがあるため、開いて内容を確認する。",
    code: "・生成されたコードは、レビューを経てから取り込む。\\n・ライセンスが不明なコードは使用しない。\\n・認証情報や社内のURLを含むコードは入力しない。",
    image: "・実在の人物、既存のキャラクター、企業ロゴに似た画像を生成しない。\\n・生成した画像を社外に出す場合は、利用規約で商用利用が認められているか確認する。"
  };

  var elOut = document.getElementById("pol-out");
  var elText = document.getElementById("pol-text");
  var elCopy = document.getElementById("pol-copy");
  var elCopied = document.getElementById("pol-copied");

  function build() {
    var org = ORG[document.getElementById("pol-org").value];
    var dataKey = document.getElementById("pol-data").value;
    var data = DATA[dataKey];
    var use = USE[document.getElementById("pol-use").value];
    var today = new Date();
    var stamp = today.getFullYear() + "年" + (today.getMonth() + 1) + "月" + today.getDate() + "日";

    var L = [];
    L.push("生成AI利用ルール（案）");
    L.push("");
    L.push("作成日: " + stamp);
    L.push("対象: " + org.name + "の" + org.who);
    L.push("");
    L.push("1. 目的");
    L.push("　このルールは、" + org.name + "における生成AIの利用について、守るべき事項を定めるものである。");
    L.push("　利用を禁じることが目的ではなく、安全に使える範囲を明らかにすることが目的である。");
    L.push("");
    L.push("2. 入力してよい情報の範囲");
    L.push("　" + data[0]);
    L.push(data[1]);
    L.push("");
    L.push("3. 出力の取り扱い");
    L.push("　生成AIの出力は下書きであり、完成物ではない。誤りが含まれることを前提に扱う。");
    L.push(use);
    L.push("　・生成AIを使ったことを理由に、内容の誤りの責任が免れることはない。");
    L.push("");
    L.push("4. 使ってはならない場面");
    L.push("　・人事評価、採用の合否、懲戒など、人の処遇を決める判断に単独で用いること。");
    L.push("　・法令、契約、安全に関わる最終判断を、確認なしに委ねること。");
    if (org.extra) L.push(org.extra);
    L.push("");
    L.push("5. 記録と相談");
    L.push("　・業務で継続的に利用する場合は、どのサービスを何に使っているかを所属長に届け出る。");
    L.push("　・判断に迷った場合は、入力する前に相談する。迷ったまま入力しないこと。");
    L.push("");
    L.push("6. 見直し");
    L.push("　生成AIのサービス内容と規約は頻繁に変わるため、本ルールは定期的に見直す。");
    L.push("");
    L.push("――――――");
    L.push("※この文書はたたき台です。法令、業界規制、既存の社内規程が優先されます。");
    L.push("　配布前に責任者の確認を受けてください。");

    return L.join("\\n");
  }

  function run() {
    elText.value = build();
    elOut.hidden = false;
    elCopy.disabled = false;
    elCopied.hidden = true;
  }

  document.getElementById("pol-run").addEventListener("click", run);
  elCopy.addEventListener("click", function () {
    elText.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    if (navigator.clipboard && !ok) navigator.clipboard.writeText(elText.value);
    elCopied.hidden = false;
    window.getSelection().removeAllRanges();
  });
})();
</script>`;
  },
};

export const TOOLS = [subscriptionTool, promptCheckTool, breakevenTool, policyTool];
