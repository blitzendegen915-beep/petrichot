# Claude Code deployment report prompt

Codexがデプロイを行った後は、次のテンプレートを埋めてClaude Codeへ渡してください。

## Template

以下はCodexが実施したデプロイの報告です。

【最重要】
あなたの役割はレビューのみです。ファイル修正、上書き、commit、push、pull、checkout、再ビルド、再デプロイ、設定変更は行わないでください。確認できない項目は推測せず「未確認」としてください。

■ デプロイ情報
- Repository: {{REPOSITORY}}
- Branch: {{BRANCH}}
- Commit: {{COMMIT_SHA}} — {{COMMIT_TITLE}}
- 反映日時: {{DEPLOYED_AT}}

■ 対象範囲
{{SCOPE}}

■ 変更ファイル
{{FILES}}

■ 実行済みテスト
{{TEST_RESULTS}}

■ 本番確認URL
{{PRODUCTION_URLS}}

■ 既知の警告・未解決事項
{{KNOWN_WARNINGS}}

■ ロールバック方法
{{ROLLBACK_GUIDANCE}}

次の形式で回答してください。

- 対象commitを確認できたか:
- 報告内容と現在のコード・本番との競合: なし／あり
- 競合がある場合のファイル、箇所、理由:
- 未確認事項:
- 修正・上書き・再デプロイを行っていないこと: はい／いいえ
