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

  const tools = input.tools;
  const toolIds = tools.map(t => t.toolId);

  const hasAnthropicApi = toolIds.includes('anthropic_api');
  const hasOpenAiApi = toolIds.includes('openai_api');
  const hasCursor = toolIds.includes('cursor');
  const hasClaude = toolIds.includes('claude');

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

    // Rule 1: Cursor Business overkill for small team (coding use case)
    if (
      tool.toolId === 'cursor' &&
      tool.plan.includes('Business') &&
      input.teamSize <= 10 &&
      input.primaryUseCase === 'coding'
    ) {
      const savings = (PRICING.cursor.business - PRICING.cursor.pro) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to Cursor Pro — same feature set at $20/seat vs $40.',
        potentialMonthlySavings: savings,
        reasoning:
          'Cursor Business features (SSO, strict privacy mode) are typically unnecessary for teams under 10. Pro gives the same AI-powered autocomplete for half the price.',
      };
    }

    // Rule 2: GitHub Copilot Enterprise downgrade for teams < 50
    else if (
      tool.toolId === 'github_copilot' &&
      tool.plan.includes('Enterprise') &&
      input.teamSize < 50
    ) {
      const savings =
        (PRICING.github_copilot.enterprise - PRICING.github_copilot.business) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Downgrade to GitHub Copilot Business at $19/seat — save $20/seat/month.',
        potentialMonthlySavings: savings,
        reasoning:
          'Enterprise-exclusive features (custom fine-tuning on your codebase, SAML SSO) rarely justify the 2× cost for teams under 50. Business tier covers most engineering teams fully.',
      };
    }

    // Rule 3: Claude Team for ≤ 2 seats → recommend individual Pro
    else if (tool.toolId === 'claude' && tool.plan.includes('Team') && tool.seats <= 2) {
      const savings = (PRICING.claude.team - PRICING.claude.pro) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to individual Claude Pro accounts at $20/user/month.',
        potentialMonthlySavings: savings,
        reasoning:
          'Team plans add a billing management layer that costs $10/user extra. For 1-2 users, separate Pro subscriptions are functionally identical and cheaper.',
      };
    }

    // Rule 4: Cursor + GitHub Copilot redundancy (coding use case)
    else if (
      tool.toolId === 'github_copilot' &&
      hasCursor &&
      input.primaryUseCase === 'coding'
    ) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: 'Drop GitHub Copilot — Cursor already covers AI-assisted coding.',
        potentialMonthlySavings: tool.monthlySpend,
        reasoning:
          'Cursor provides tab-complete, chat, and codebase-aware suggestions — the same value prop as Copilot. Running both simultaneously is pure redundancy for coding-focused teams.',
      };
    }

    // Rule 5: Both Anthropic API and Claude Pro → flag redundancy if Pro spend > $50
    else if (
      tool.toolId === 'claude' &&
      tool.plan.includes('Pro') &&
      hasAnthropicApi &&
      tool.monthlySpend > 50
    ) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation:
          'Switch entirely to the Anthropic API — you already pay for it and it is more cost-effective at scale.',
        potentialMonthlySavings: tool.monthlySpend,
        reasoning:
          'Claude Pro is a fixed-cost consumer tier. If your API spend exceeds $50/month, migrating all usage to the API gives you more tokens per dollar with pay-as-you-go pricing.',
      };
    }

    // Rule 6: Both OpenAI API and ChatGPT Plus → flag redundancy for programmatic use
    else if (
      tool.toolId === 'chatgpt' &&
      tool.plan.includes('Plus') &&
      hasOpenAiApi
    ) {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation:
          'Drop ChatGPT Plus — your OpenAI API access already provides GPT-4 access programmatically.',
        potentialMonthlySavings: tool.monthlySpend,
        reasoning:
          'ChatGPT Plus ($20/mo) is a consumer UI subscription. If your team uses the OpenAI API for programmatic access, the Plus tier adds no engineering value and can be cancelled.',
      };
    }

    items.push(item);
    totalMonthlySavings += item.potentialMonthlySavings;
  });

  // Rule 7: Writing use case, has Cursor, no Claude → suggest Claude Pro as a switch
  if (
    input.primaryUseCase === 'writing' &&
    hasCursor &&
    !hasClaude
  ) {
    const cursorItem = items.find(i => i.toolId === 'cursor');
    if (cursorItem && cursorItem.recommendedAction === 'optimal') {
      cursorItem.recommendedAction = 'switch';
      cursorItem.recommendation =
        'For a writing-focused team, Claude Pro ($20/mo) is a better fit than Cursor — consider switching.';
      cursorItem.potentialMonthlySavings = Math.max(0, cursorItem.currentSpend - PRICING.claude.pro);
      cursorItem.reasoning =
        'Cursor is optimized for coding workflows. For writing-heavy teams, Claude Pro offers superior prose generation, editing, and summarization — often at the same price or cheaper.';
      totalMonthlySavings += cursorItem.potentialMonthlySavings;
    }
  }

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
