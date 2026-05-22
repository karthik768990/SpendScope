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

const PRICING = {
  cursor: { pro: 20, business: 40 },
  github_copilot: { individual: 10, business: 19, enterprise: 39 },
  claude: { pro: 20, team: 30 },
  chatgpt: { plus: 20, team: 30 }
};

export function auditTools(input: AuditInput): AuditResult {
  let totalMonthlySavings = 0;
  const items: ToolAuditItem[] = [];

  const tools = input.tools;
  const toolIds = tools.map(t => t.toolId);

  tools.forEach(tool => {
    let item: ToolAuditItem = {
      toolId: tool.toolId,
      toolName: tool.toolId.replace('_', ' ').toUpperCase(), // basic formatting
      currentSpend: tool.monthlySpend,
      recommendedAction: 'optimal',
      recommendation: 'Current setup is cost-efficient.',
      potentialMonthlySavings: 0,
      reasoning: 'Your plan matches your team size and use case perfectly.'
    };

    // Rule 1: Cursor Business overkill for small team
    if (tool.toolId === 'cursor' && tool.plan.includes('Business') && input.teamSize <= 10 && input.primaryUseCase === 'coding') {
      const savings = (PRICING.cursor.business - PRICING.cursor.pro) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to Cursor Pro — same feature set at $20/seat vs $40.',
        potentialMonthlySavings: savings,
        reasoning: 'Cursor Business features (SSO, strict privacy) are typically unnecessary for teams under 10.'
      };
    }

    // Rule 2: GitHub Copilot Enterprise downgrade
    else if (tool.toolId === 'github_copilot' && tool.plan.includes('Enterprise') && input.teamSize < 50) {
      const savings = (PRICING.github_copilot.enterprise - PRICING.github_copilot.business) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Downgrade to GitHub Copilot Business at $19/seat.',
        potentialMonthlySavings: savings,
        reasoning: 'Enterprise features like codebase-specific fine-tuning rarely justify double the cost for smaller teams.'
      };
    }

    // Rule 3: Claude Team for small seats
    else if (tool.toolId === 'claude' && tool.plan.includes('Team') && tool.seats <= 2) {
      const savings = (PRICING.claude.team - PRICING.claude.pro) * tool.seats;
      item = {
        ...item,
        recommendedAction: 'downgrade',
        recommendation: 'Switch to individual Claude Pro accounts.',
        potentialMonthlySavings: savings,
        reasoning: 'Team plans charge a premium for billing management, which is overkill for 1-2 users.'
      };
    }

    // Rule 4: Cursor + GitHub Copilot redundancy
    else if (tool.toolId === 'github_copilot' && toolIds.includes('cursor') && input.primaryUseCase === 'coding') {
      item = {
        ...item,
        recommendedAction: 'consolidate',
        recommendation: 'Drop GitHub Copilot and rely fully on Cursor.',
        potentialMonthlySavings: tool.monthlySpend,
        reasoning: 'Cursor provides similar or better autocomplete; paying for both is redundant for coding.'
      };
    }

    // Add more rules if necessary
    // ...

    items.push(item);
    totalMonthlySavings += item.potentialMonthlySavings;
  });

  // Rule 7: Missing writing tool but has cursor
  if (input.primaryUseCase === 'writing' && toolIds.includes('cursor') && !toolIds.includes('claude')) {
    // We could add a holistic recommendation, but returning via items
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
    savingsTier
  };
}
