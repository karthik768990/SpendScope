# Dev Log

## Day 1 — 2026-05-18
**Hours worked:** 3
**What I did:** Scaffolded the Next.js App Router project with Tailwind CSS and shadcn/ui. Created required documentation placeholders and set up the CI/CD pipeline via GitHub Actions. Initialized the Supabase schema.
**What I learned:** Best practices for setting up scalable directory structures with App Router.
**Blockers / what I'm stuck on:** Nothing major.
**Plan for tomorrow:** Build the spend input form and implement localStorage persistence.

## Day 2 — 2026-05-19
**Hours worked:** 2.5
**What I did:** Updated pricing data sources and verified the plan tiers for the tools. Implemented the dynamic tools input form in `page.tsx` with responsive design and tool selector mapping. Added `localStorage` caching so user data isn't lost on refresh.
**What I learned:** Managing complex nested state inside `useState` arrays efficiently.
**Blockers / what I'm stuck on:** Form styling was a bit tricky with nested grids.
**Plan for tomorrow:** Create the Audit Engine and its unit tests.

## Day 3 — 2026-05-20
**Hours worked:** 4
**What I did:** Engineered the `auditTools` function in `/lib/auditEngine.ts`. Setup complex rules for downgrade paths and redundancy consolidation. Integrated `vitest` and wrote 5 robust test cases for the engine.
**What I learned:** How to write pure, side-effect free logic functions that can be tested trivially without mocking the frontend.
**Blockers / what I'm stuck on:** Ensuring tests didn't break when modifying the mock input arrays.
**Plan for tomorrow:** Build the results page and hook it up to the API.

## Day 4 — 2026-05-21
**Hours worked:** 3.5
**What I did:** Built the `/api/audit` endpoint to trigger Anthropic's Claude 3.5 Sonnet API for summaries, returning a custom slug. Designed the results page with the AI summary, per-tool tables, and tier-specific CTA messaging. Added OG image integration via `@vercel/og`.
**What I learned:** Anthropic SDK integration in Edge vs Node runtimes.
**Blockers / what I'm stuck on:** Rate limits on the LLM API testing; handled it cleanly with the fallback summary string.
**Plan for tomorrow:** Implement the lead capture modal and Resend email sending.

## Day 5 — 2026-05-22
**Hours worked:** 3
**What I did:** Built the lead capture modal logic and the `/api/leads` route. Included an in-memory rate limiting map and a honeypot field for abuse protection. Connected Resend API to send HTML transactional emails to leads. Updated the documentation to completion.
**What I learned:** Simple honeypot implementations are extremely effective for blocking basic scraping bots without introducing UX friction like captchas.
**Blockers / what I'm stuck on:** None! Ready to deploy.
**Plan for tomorrow:** Ship and monitor on Product Hunt.

## Day 6 — 2026-05-23
**Hours worked:** 2
**What I did:** Implemented OG image API and verified sharing link functionality. Polished the UI, adjusted accessibility issues like focus states and aria attributes.
**What I learned:** `@vercel/og` has specific flexbox limitations.
**Blockers / what I'm stuck on:** Tweaking the OG image design.
**Plan for tomorrow:** Final documentation and Lighthouse check.

## Day 7 — 2026-05-24
**Hours worked:** 1.5
**What I did:** Final Lighthouse run confirming all stats above 90. Final review of the GTM, Architecture, and User Interviews markdown docs to ensure high quality content.
**What I learned:** High-quality documentation takes as much focus as coding.
**Blockers / what I'm stuck on:** N/A.
**Plan for tomorrow:** Launch!
