---
name: orchestrate
description: 実作業をsonnet/haikuサブエージェントに委任する手順。トークン節約のため指示役が最初に読む
---

# orchestrate

オーナー指示: **Opusは指示役。実作業はsonnet/haiku。トークン節約を最優先。**

## 委任のテンプレート

Agentツールで `subagent_type: general-purpose`、`model` を下表から選び、`run_in_background: true`(複数なら1メッセージで並列spawn)。

**原則haiku**(2026-07-25オーナー指示)。トークン単価が安く、規約をファイルから読ませる方式なら品質は十分。

| 作業 | model |
|---|---|
| 通常の記事執筆・定型作業・一括置換・調査・集計 | **haiku**(デフォルト) |
| 事実の正確性が重要な記事(新モデル解説・料金比較など、捏造したら信頼を損なうもの) | sonnet |

haikuに任せる場合、**確定した事実は指示役がプロンプトに書いて渡す**(調べさせない)。文章化だけをhaikuの仕事にする。

プロンプトに規約全文を貼らないこと。代わりに:

```
リポジトリ /workspace/petrichot で作業。
まず `.claude/skills/<スキル名>/SKILL.md` と `CLAUDE.md` を読み、その規約に厳密に従うこと。

【タスク】
<具体的な指示。ファイルパス・slug・使う{{aff:ID}}・カテゴリなど確定情報のみ書く>

【禁止事項】
- git commit / git push はしない(指示役が行う)
- `git add -A` / `git add .` は使わない
- `affiliate/build.mjs` は触らない(レビュー待ちの未pushの変更がある)
- `git reset --hard` 禁止
- 参考リンクのURL捏造は厳禁(承認済みリストのみ)

【完了条件】
`node affiliate/build.mjs` がエラーなく通り、記事数が+1されること。
作成したファイルパスと結果を報告して終了。
```

## 指示役がやること(委任しない)

1. **事前調査は最小限に**: 既存記事の重複確認は `grep -m1 '^title:' affiliate/content/*.md` 等の1コマンドで済ませる。ファイル通読はしない
2. **成果物のレビュー**: 生成された記事は必ず読む(捏造URL・誇大表現・広告漏れの確認)
3. **ビルド検証**: `node affiliate/build.mjs`
4. **commit/push**: `git add` は対象ファイルを個別指定。commitは慣例のtrailer付き
5. **デプロイ確認**: Actions の結論を確認

## 節約のコツ

- `mcp__github__actions_list` は出力が巨大。`list_workflow_jobs` に run_id を渡して1件だけ取るか、保存されたファイルをpythonでパースする
- 同じ内容の記事を複数書くときは、1エージェントに複数ファイルを任せるより**並列spawn**のほうが速い(文脈が混ざらない)
- サブエージェントの報告は要約のみ受け取り、詳細な中間出力は追わない
