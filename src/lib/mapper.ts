export const TOOL_ALIASES: Record<string, string[]> = {
  cursor: [
    'cursor', 'cursor ai', 'cursor editor', 'cursor ide', 'cursor code editor'
  ],
  github_copilot: [
    'copilot', 'github copilot', 'gh copilot', 'github copilot enterprise', 'github copilot business'
  ],
  claude: [
    'claude', 'claude sonnet', 'claude 4 sonnet', 'anthropic claude', 'claude 3', 'claude 3.5'
  ],
  chatgpt: [
    'chatgpt', 'gpt4', 'gpt 4', 'openai gpt4', 'openai gpt-4', 'gpt', 'chat gpt', 'chatgpt plus'
  ],
  anthropic_api: [
    'anthropic api', 'claude api'
  ],
  openai_api: [
    'openai api', 'gpt api', 'gpt4 api'
  ],
  gemini: [
    'gemini', 'google gemini', 'gemini advanced', 'gemini pro', 'gemini ultra'
  ],
  windsurf: [
    'windsurf', 'windsurf codeium', 'codeium windsurf', 'windsurf editor', 'codeium'
  ],
  perplexity: [
    'perplexity', 'perplexity ai', 'perplexity pro', 'pplx'
  ],
  midjourney: [
    'midjourney', 'mj', 'midjourney ai'
  ],
  v0: [
    'v0', 'v0 by vercel', 'vercel v0', 'v0 dev'
  ]
};

/**
 * Normalizes an input string for matching by removing punctuation,
 * extra spaces, and converting to lowercase.
 */
function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Condense spaces
    .trim();
}

/**
 * Resolves a raw tool name to its standardized toolId.
 * @param rawInput The raw input string provided by the user or UI.
 * @returns The resolved toolId or the normalized input if no match is found.
 */
export function resolveToolId(rawInput: string): string {
  const normalized = normalizeString(rawInput);

  for (const [toolId, aliases] of Object.entries(TOOL_ALIASES)) {
    // Exact match on normalized aliases
    if (aliases.some(alias => normalizeString(alias) === normalized)) {
      return toolId;
    }
    
    // Substring match
    if (aliases.some(alias => normalized.includes(normalizeString(alias)))) {
      return toolId;
    }
  }

  // Fallback to replacing spaces with underscores if no match
  return normalized.replace(/\s+/g, '_');
}
