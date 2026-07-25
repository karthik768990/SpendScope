# SpendScope Audit Engine

SpendScope is a high-performance tool for analyzing and optimizing AI subscription stacks for startups. It instantly identifies redundancies, overkill plans, and cheaper alternatives based on team size and use cases.

## Recent Architectural Upgrades

### Audit Engine & Business Logic
The core audit engine has been rewritten to move away from static, hardcoded `if/else` rules. It now employs an **expertise scoring system** and dynamic **business logic**:
- **Capability Comparison**: Every tool is assigned an expertise score across 6 domains (coding, writing, data, research, reasoning, multimodal).
- **Duplicate Resolution Strategy**: Tools are no longer naively removed if they belong to the same category. Instead, their capability vectors are compared against the stack's "Core Tools". A tool is only recommended for consolidation if its maximum expertise scores are dominated by existing tools (e.g., Gemini might be retained alongside Claude if Gemini provides uniquely superior research capabilities).
- **Explainable Decisions**: Recommendations are driven by quantifiable score thresholds and generate dynamic, contextual explanations for why a tool is kept or consolidated.

### Mapper Architecture
A new intelligent tool mapper (`src/lib/mapper.ts`) handles name resolution.
- It normalizes strings by removing casing, punctuation, and extraneous spaces.
- It leverages an extensible synonym database to map inputs (e.g., "cursor", "cursor ai", "cursor editor") seamlessly to standardized `toolId`s.
- This decoupling allows the UI and API to be resilient to varying tool names without complex regex or hardcoded rules.

## Local Development (Docker)

You can now start the entire stack using a single command with Docker Compose. This ensures your local environment perfectly mirrors production while preserving hot-reloading.

### Setup
1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your API keys (e.g., `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`).

### Start the Application
Run the following command in the project root:
```bash
docker compose up
```

This will:
- Build the `node:20-alpine` image.
- Install dependencies (using an anonymous volume for `node_modules` to avoid cross-platform binary issues).
- Mount the local source code into the container for **instant hot-reloading** (`npm run dev`).
- Expose the app on `http://localhost:3000`.

To stop the containers, run:
```bash
docker compose down
```

## Maintenance & Extensibility

- **Adding New Tools**: To add a new tool, define its pricing in `PRICING_DATA.md`, add it to `TOOL_NAMES`, `PRICING`, and `TOOL_EXPERTISE` in `src/lib/auditEngine.ts`, and update its synonyms in `src/lib/mapper.ts`.
- **Modifying Scores**: Tweak the expertise matrix (`TOOL_EXPERTISE`) to change how the algorithm values specific features (e.g. if a tool gets better at coding).
    