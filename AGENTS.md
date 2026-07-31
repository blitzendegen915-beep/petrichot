# Petrichor repository rules

This repository publishes three connected sections on one domain:

- `/shopping/` — product-comparison guides
- `/` — AI tool explainers
- `/learning/` — practical learning articles and courses

## Non-negotiable editorial rules

- Never invent search volume, sales, conversion rate, price, stock, review counts, rankings, or product specifications.
- Never invent first-hand experience. If the experience database does not contain it, write `【ここに占部さんの実体験を追加】`.
- Prefer manufacturer, retailer, public-body, and other primary sources. Record source URLs and the time checked.
- Treat prices, stock, points, coupons, review counts, and rankings as volatile.
- Treat reviews as subjective reports, not objective facts.
- Reuse only structural patterns and comparison axes from competing articles; never copy their language.
- Include disadvantages, unsuitable readers, and the option not to buy.
- Keep the affiliate/PR disclosure visible and unambiguous.
- Never put credentials, cookies, API keys, access tokens, or private identifiers in repository files.
- Do not publish, push, schedule, or send content to an external service without explicit owner approval.

## Build and verification

Run shell commands through `rtk` when it is available.

Build order matters because the AI-site generator initializes `dist/`:

```text
node affiliate/lint.mjs
node learning/lint.mjs
node affiliate/build.mjs
node learning/build.mjs
node shopping/build.mjs
```

Verify at minimum:

- `dist/index.html`
- `dist/shopping/index.html`
- `dist/shopping/carry-on-suitcase-1-3-nights/index.html`
- `dist/learning/index.html`
- `dist/learning/course/index.html`

Preserve unrelated and pre-existing working-tree changes. Add only the files changed for the current task.
