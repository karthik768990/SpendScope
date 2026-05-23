export interface ToolEntry {
  toolId: string;
  plan: string;
  monthlySpend: number;
  seats: number;
}

export interface AuditInput {
  tools: ToolEntry[];
  teamSize: number;
  primaryUseCase: 'coding' | 'writing' | 'data' | 'research' | 'mixed';
}

export interface ToolAuditItem {
  toolId: string;
  toolName: string;
  currentSpend: number;
  recommendedAction: 'optimal' | 'downgrade' | 'switch' | 'consolidate';
  recommendation: string;
  potentialMonthlySavings: number;
  reasoning: string;
}

export interface AuditResult {
  items: ToolAuditItem[];
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsTier: 'optimal' | 'low' | 'medium' | 'high';
}

const TOOL_NAMES: Record<string, string> = {
  cursor: 'Cursor',
  github_copilot: 'GitHub Copilot',
  claude: 'Claude (Anthropic)',
  chatgpt: 'ChatGPT (OpenAI)',
  anthropic_api: 'Anthropic API',
  openai_api: 'OpenAI API',
  gemini: 'Gemini (Google)',
  windsurf: 'Windsurf (Codeium)',
};

const PRICING = {
  cursor: { pro: 20, business: 40 },
  github_copilot: { individual: 10, business: 19, enterprise: 39 },
  claude: { pro: 20, max: 100, team: 30 },
  chatgpt: { plus: 20, team: 30 },
};

export function auditTools(input: AuditInput): AuditResult {
  let totalMonthlySavings = 0;
  const items: ToolAuditItem[] = [];

  // Filter out empty/unselected tool entries from the form
  const tools = input.tools.filter(t => t.toolId && t.toolId.trim() !== '');
  const toolIds = tools.map(t => t.toolId);

  const hasAnthropicApi = toolIds.includes('anthropic_api');
  const hasOpenAiApi = toolIds.includes('openai_api');
  const hasCursor = toolIds.includes('cursor');
  const hasClaude = toolIds.includes('claude');
  const hasCopilot = toolIds.includes('github_copilot');
  const hasChatGPT = toolIds.includes('chatgpt');
  const hasGemini = toolIds.includes('gemini');

  const generalLLMs = ['claude', 'chatgpt', 'gemini'];
  const hasGeneralLLM = toolIds.some(id => generalLLMs.includes(id));
  const codingTools = ['cursor', 'github_copilot', 'windsurf'];
  const hasCodingTool = toolIds.some(id => codingTools.includes(id));

  // Determine the preferred general LLM based on use case
  let preferredGeneralId = '';
  const uc = input.primaryUseCase;
  const generalOrder = 
    uc === 'data' ? ['chatgpt', 'claude', 'gemini'] :
    uc === 'research' ? ['gemini', 'claude', 'chatgpt'] :
    uc === 'writing' ? ['claude', 'gemini', 'chatgpt'] :
    ['claude', 'chatgpt', 'gemini']; // coding & mixed

  for (const id of generalOrder) {
    if (toolIds.includes(id)) {
      preferredGeneralId = id;
      break;
    }
  }

  tools.forEach(tool => {
    const toolName = TOOL_NAMES[tool.toolId] ?? tool.toolId.replace(/_/g, ' ');

    let item: ToolAuditItem = {
      toolId: tool.toolId,
      toolName,
      currentSpend: tool.monthlySpend,
      recommendedAction: 'optimal',
      recommendation: 'Current setup is cost-efficient.',
      potentialMonthlySavings: 0,
      reasoning: 'Your plan matches your team size and use case perfectly.',
    };

    // 1. CONSOLIDATE RULES (Drop redundant tools entirely)
    // ----------------------------------------------------

    // General LLM Redundancy based on Use Case
    if (generalLLMs.includes(tool.toolId) && preferredGeneralId && tool.toolId !== preferredGeneralId) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: `Drop ${toolName} — consolidate to ${TOOL_NAMES[preferredGeneralId]} which fits your ${uc} use case best.`,
        potentialMonthlySavings: tool.monthlySpend,
        reasoning: `You are paying for multiple general LLM subscriptions. Since your primary focus is ${uc}, consolidating to ${TOOL_NAMES[preferredGeneralId]} will eliminate redundant spend while fully covering your team's needs.`,
      };
    }

    // Cursor + GitHub Copilot redundancy
    else if (tool.toolId === 'github_copilot' && hasCursor) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: 'Drop GitHub Copilot — Cursor already covers AI-assisted coding.',
        potentialMonthlySavings: tool.monthlySpend,
        reasoning: 'Cursor provides tab-complete, chat, and codebase-aware suggestions — the same value prop as Copilot. Running both simultaneously is redundancy you can eliminate.',
      };
    }

    // Windsurf + Cursor/Copilot redundancy
    else if (tool.toolId === 'windsurf' && (hasCursor || hasCopilot)) {
      const otherTool = hasCursor ? 'Cursor' : 'GitHub Copilot';
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: `Drop Windsurf — ${otherTool} already covers AI-assisted coding.`,
        potentialMonthlySavings: tool.monthlySpend,
        reasoning: `Windsurf and ${otherTool} offer overlapping AI code-completion and chat features. Consolidating to a single tool eliminates redundant spend.`,
      };
    }

    // Both Anthropic API and Claude Pro redundancy
    else if (tool.toolId === 'claude' && tool.plan.includes('Pro') && hasAnthropicApi && tool.monthlySpend > 50) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: 'Switch entirely to the Anthropic API — you already pay for it and it is more cost-effective at scale.',
        potentialMonthlySavings: tool.monthlySpend,
        reasoning: 'Claude Pro is a fixed-cost consumer tier. If your API spend exceeds $50/month, migrating all usage to the API gives you more tokens per dollar with pay-as-you-go pricing.',
      };
    }

    // Both OpenAI API and ChatGPT Plus redundancy
    else if (tool.toolId === 'chatgpt' && tool.plan.includes('Plus') && hasOpenAiApi) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: 'Drop ChatGPT Plus — your OpenAI API access already provides GPT-4 access programmatically.',
        potentialMonthlySavings: tool.monthlySpend,
        reasoning: 'ChatGPT Plus ($20/mo) is a consumer UI subscription. If your team uses the OpenAI API for programmatic access, the Plus tier adds no engineering value and can be cancelled.',
      };
    }

    // Coding tool mismatch (Non-coding team, has general LLM)
    else if (!['coding', 'mixed'].includes(uc) && codingTools.includes(tool.toolId) && hasGeneralLLM) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: `Drop ${toolName} — developer-focused tools are unnecessary for ${uc} workloads.`,
        potentialMonthlySavings: tool.monthlySpend,
        reasoning: `Your primary use case is ${uc}, which does not require a dedicated AI code editor or autocompletion plugin. General AI tools like ${TOOL_NAMES[preferredGeneralId]} cover any basic script-writing needs.`,
      };
    }

    // 2. SWITCH RULES (Replace with a more suitable tool)
    // ----------------------------------------------------

    // Coding tool mismatch (Non-coding team, NO general LLM)
    else if (!['coding', 'mixed'].includes(uc) && codingTools.includes(tool.toolId) && !hasGeneralLLM) {
      let targetGeneralLLM = 'Claude Pro';
      if (uc === 'data') targetGeneralLLM = 'ChatGPT Plus';
      else if (uc === 'research') targetGeneralLLM = 'Gemini Advanced or Claude Pro';

      item = {
        ...item,
        recommendedAction: 'switch',
        recommendation: `Switch from ${toolName} to ${targetGeneralLLM} — general assistants are much better suited for ${uc} tasks.`,
        potentialMonthlySavings: Math.max(0, tool.monthlySpend - 20 * tool.seats),
        reasoning: `Your primary usecase is ${uc}. While ${toolName} is optimized for coding, a general-purpose AI assistant like ${targetGeneralLLM} is far more effective for non-technical tasks and costs the same or less.`,
      };
    }

    // General tool mismatch for Coding
    else if (uc === 'coding' && ['chatgpt', 'gemini'].includes(tool.toolId) && !hasCodingTool && !hasClaude) {
      item = {
        ...item,
        recommendedAction: 'switch',
        recommendation: `Switch from ${toolName} to Cursor Pro or GitHub Copilot for editor-integrated AI.`,
        potentialMonthlySavings: Math.max(0, tool.monthlySpend - 20 * tool.seats),
        reasoning: 'Your primary use case is coding, but you are currently using a generic chat interface. Switching to an editor-integrated tool like Cursor or Copilot provides inline autocompletion and codebase awareness, significantly boosting developer productivity.',
      };
    }

    // Data tool mismatch
    else if (uc === 'data' && ['claude', 'gemini'].includes(tool.toolId) && !hasChatGPT) {
      item = {
        ...item,
        recommendedAction: 'switch',
        recommendation: `Switch from ${toolName} to ChatGPT Plus for data tasks.`,
        potentialMonthlySavings: Math.max(0, tool.monthlySpend - 20 * tool.seats),
        reasoning: 'For data-heavy teams, ChatGPT Plus offers a sandboxed Python execution environment (Advanced Data Analysis) which is superior for processing datasets, writing scripts, and generating charts compared to other general models.',
      };
    }

    // Research tool mismatch
    else if (uc === 'research' && tool.toolId === 'chatgpt' && !hasGemini && !hasClaude) {
      item = {
        ...item,
        recommendedAction: 'switch',
        recommendation: 'Switch from ChatGPT to Gemini Advanced or Claude Pro for research.',
        potentialMonthlySavings: Math.max(0, tool.monthlySpend - 20 * tool.seats),
        reasoning: 'For research workflows, Claude Pro (200k context) or Gemini Advanced (2M context with Google Search integration) are better suited for analyzing large documents and sourcing up-to-date information than ChatGPT.',
      };
    }

    // 3. DOWNGRADE RULES (Optimize existing tool plan/seats)
    // ----------------------------------------------------

    // Cursor Business overkill for small team
    else if (tool.toolId === 'cursor' && tool.plan.includes('Business') && input.teamSize <= 10) {
      const savings = (PRICING.cursor.business - PRICING.cursor.pro) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to Cursor Pro — same feature set at $20/seat vs $40.',
        potentialMonthlySavings: savings,
        reasoning: 'Cursor Business features (SSO, strict privacy mode) are typically unnecessary for teams under 10. Pro gives the same AI-powered autocomplete for half the price.',
      };
    }

    // GitHub Copilot Enterprise downgrade for teams < 50
    else if (tool.toolId === 'github_copilot' && tool.plan.includes('Enterprise') && input.teamSize < 50) {
      const savings = (PRICING.github_copilot.enterprise - PRICING.github_copilot.business) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Downgrade to GitHub Copilot Business at $19/seat — save $20/seat/month.',
        potentialMonthlySavings: savings,
        reasoning: 'Enterprise-exclusive features (custom fine-tuning on your codebase, SAML SSO) rarely justify the 2× cost for teams under 50. Business tier covers most engineering teams fully.',
      };
    }

    // Claude Team for ≤ 2 seats → recommend individual Pro
    else if (tool.toolId === 'claude' && tool.plan.includes('Team') && tool.seats <= 2) {
      const savings = (PRICING.claude.team - PRICING.claude.pro) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to individual Claude Pro accounts at $20/user/month.',
        potentialMonthlySavings: savings,
        reasoning: 'Team plans add a billing management layer that costs $10/user extra. For 1-2 users, separate Pro subscriptions are functionally identical and cheaper.',
      };
    }

    // Claude Max → downgrade to Pro for small teams
    else if (tool.toolId === 'claude' && tool.plan.includes('Max') && input.teamSize <= 10) {
      const savings = (PRICING.claude.max - PRICING.claude.pro) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to Claude Pro at $20/user/month — Max tier is overkill for most teams.',
        potentialMonthlySavings: savings,
        reasoning: 'Claude Max ($100/mo) is designed for power users who need extended thinking and higher usage limits. For teams under 10, Pro provides the same model quality at 80% less cost.',
      };
    }

    // ChatGPT Team → downgrade to Plus for ≤ 2 seats
    else if (tool.toolId === 'chatgpt' && tool.plan.includes('Team') && tool.seats <= 2) {
      const savings = (PRICING.chatgpt.team - PRICING.chatgpt.plus) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to individual ChatGPT Plus accounts at $20/user/month.',
        potentialMonthlySavings: savings,
        reasoning: 'ChatGPT Team adds admin controls and workspace features for $10/user extra. For 1-2 users, separate Plus subscriptions are functionally identical and cheaper.',
      };
    }

    items.push(item);
    totalMonthlySavings += item.potentialMonthlySavings;
  });

  const totalAnnualSavings = totalMonthlySavings * 12;
  let savingsTier: AuditResult['savingsTier'] = 'optimal';
  if (totalMonthlySavings > 500) savingsTier = 'high';
  else if (totalMonthlySavings > 100) savingsTier = 'medium';
  else if (totalMonthlySavings > 0) savingsTier = 'low';

  return {
    items,
    totalMonthlySavings,
    totalAnnualSavings,
    savingsTier,
  };
}
