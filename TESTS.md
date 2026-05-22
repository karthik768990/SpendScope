# Tests

All tests live in `/tests/auditEngine.test.ts` and run with **Vitest**.

## Running Tests

```bash
npm test
```

## Test Coverage — 10 Tests

### Core Downgrade Rules
1. **`correctly flags Cursor Business overkill for small coding team`** — Team of 5 on Cursor Business should be flagged to downgrade to Pro, saving $100/mo.
2. **`does NOT flag Cursor Business for large team (>10 seats)`** — A team of 15 should get `optimal` — rule only fires for teams ≤ 10.
3. **`correctly identifies Copilot Enterprise downgrade path for team < 50`** — 30-seat Enterprise plan should downgrade to Business, saving $600/mo.
4. **`does not manufacture savings when Cursor Pro is already optimal`** — Cursor Pro on a small team should return `optimal` with $0 savings.
5. **`flags Cursor + Copilot redundancy for coding use case`** — Having both Cursor and GitHub Copilot for a coding team flags Copilot as `consolidate`.

### Edge Cases
6. **`handles empty tools array gracefully`** — Empty input returns zero savings, empty items, and `optimal` tier without crashing.

### Redundancy Rules
7. **`flags Claude Pro + Anthropic API as redundant when Pro spend > $50`** — If a team pays for Claude Pro AND the API, the Pro subscription gets flagged as `consolidate`.
8. **`flags ChatGPT Plus + OpenAI API as redundant`** — ChatGPT Plus alongside API access is flagged as redundant.
9. **`suggests switching Cursor to Claude Pro for writing-focused team`** — A writing-focused team on Cursor with no Claude gets a `switch` recommendation.

### Savings Tier Classification
10. **`assigns high savings tier when totalMonthlySavings > $500`** — Large teams with multiple overkill plans correctly get `high` tier classification.
