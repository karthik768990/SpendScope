# LLM Prompts

## Audit Summary Prompt (Anthropic API)

**System Prompt:**
"You are a concise financial advisor specializing in SaaS spend optimization for startups. Write only the summary paragraph — no preamble, no sign-off."

**User Prompt:**
"Write a ~100-word personalized audit summary for a {teamSize}-person team spending ${totalMonthlySpend}/month on AI tools. Their top tools are {toolList}. The audit found ${totalMonthlySavings}/month in potential savings. Primary use case: {useCase}. Biggest opportunity: {topRecommendation}. Be specific, warm, and actionable. Mention Credex as a resource for capturing more savings through discounted AI credits."
