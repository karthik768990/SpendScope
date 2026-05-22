# Architecture

## Data Flow
```mermaid
graph TD
  A[User fills form] --> B[/api/audit POST]
  B --> C[auditEngine.ts]
  C --> D[Anthropic API]
  D --> E[Supabase audits table]
  E --> F[Shareable URL /audit/slug]
  F --> G[Lead capture modal]
  G --> H[Supabase leads table]
  G --> I[Resend email]
```

## Stack Reasoning
- **Framework:** Next.js 14 App Router gives us excellent hybrid rendering capabilities.
- **Styling:** Tailwind CSS + shadcn/ui provides beautiful, rapid component prototyping without reinventing the wheel.
- **Backend/DB:** Supabase allows simple JSONB schema for audits and fast insertion. Lead table uses RLS for security.
- **Email:** Resend API gives high deliverability for transactional emails natively with React elements.
- **AI:** Anthropic API (Claude 3.5 Sonnet) is extremely competent at following precise instruction tone and formatting for financial advice.

## Scale Section
- In-memory rate-limiting is used for the MVP. Before going viral, we should migrate this to an Upstash Redis store to ensure rate-limiting spans across multiple Vercel serverless instances.
- RLS limits direct read access to lead information, protecting PII.
