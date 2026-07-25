import { resolveToolId } from './mapper';

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

interface ExpertiseScore {
  coding: number;
  writing: number;
  data: number;
  research: number;
  reasoning: number;
  multimodal: number;
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
  perplexity: 'Perplexity',
  midjourney: 'Midjourney',
  v0: 'v0 by Vercel',
};

const PRICING = {
  cursor: { pro: 20, business: 40 },
  github_copilot: { individual: 10, business: 19, enterprise: 39 },
  claude: { pro: 20, max: 100, team: 30 },
  chatgpt: { plus: 20, team: 30 },
  perplexity: { pro: 20 },
  midjourney: { basic: 10, standard: 30, pro: 60 },
  v0: { premium: 20 },
};

const TOOL_EXPERTISE: Record<string, ExpertiseScore> = {
  cursor: { coding: 10, writing: 2, data: 2, research: 2, reasoning: 7, multimodal: 1 },
  github_copilot: { coding: 9, writing: 2, data: 2, research: 1, reasoning: 5, multimodal: 1 },
  windsurf: { coding: 9, writing: 2, data: 2, research: 2, reasoning: 6, multimodal: 1 },
  v0: { coding: 8, writing: 1, data: 1, research: 1, reasoning: 4, multimodal: 6 },
  
  claude: { coding: 10, writing: 10, data: 8, research: 9, reasoning: 10, multimodal: 7 },
  chatgpt: { coding: 9, writing: 9, data: 10, research: 8, reasoning: 9, multimodal: 9 },
  gemini: { coding: 7, writing: 8, data: 8, research: 10, reasoning: 8, multimodal: 10 },
  
  anthropic_api: { coding: 10, writing: 10, data: 8, research: 9, reasoning: 10, multimodal: 7 },
  openai_api: { coding: 9, writing: 9, data: 10, research: 8, reasoning: 9, multimodal: 9 },
  
  perplexity: { coding: 5, writing: 8, data: 7, research: 10, reasoning: 8, multimodal: 5 },
  midjourney: { coding: 0, writing: 0, data: 0, research: 1, reasoning: 1, multimodal: 10 },
};

function getToolName(id: string): string {
  return TOOL_NAMES[id] ?? id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function auditTools(input: AuditInput): AuditResult {
  let totalMonthlySavings = 0;
  const items: ToolAuditItem[] = [];

  const validTools = input.tools.filter(t => t.toolId && t.toolId.trim() !== '');
  
  // Normalize and resolve tool ids using intelligent mapper
  const resolvedTools = validTools.map(t => ({
    ...t,
    originalId: t.toolId,
    toolId: resolveToolId(t.toolId)
  }));

  // Analyze the stack capabilities
  const stackCapabilities = {
    coding: 0, writing: 0, data: 0, research: 0, reasoning: 0, multimodal: 0
  };

  resolvedTools.forEach(t => {
    const exp = TOOL_EXPERTISE[t.toolId];
    if (exp) {
      stackCapabilities.coding = Math.max(stackCapabilities.coding, exp.coding);
      stackCapabilities.writing = Math.max(stackCapabilities.writing, exp.writing);
      stackCapabilities.data = Math.max(stackCapabilities.data, exp.data);
      stackCapabilities.research = Math.max(stackCapabilities.research, exp.research);
      stackCapabilities.reasoning = Math.max(stackCapabilities.reasoning, exp.reasoning);
      stackCapabilities.multimodal = Math.max(stackCapabilities.multimodal, exp.multimodal);
    }
  });





  // Business Logic: Identify core tools and redundancies
  resolvedTools.forEach((tool) => {
    const toolName = getToolName(tool.toolId);
    let item: ToolAuditItem = {
      toolId: tool.originalId,
      toolName,
      currentSpend: tool.monthlySpend,
      recommendedAction: 'optimal',
      recommendation: 'Current setup is cost-efficient.',
      potentialMonthlySavings: 0,
      reasoning: 'Your plan matches your team size and use case perfectly.',
    };

    const exp = TOOL_EXPERTISE[tool.toolId];
    if (exp) {
      // Find what unique value this tool brings to the stack
      // We simulate removing it and seeing if the stack max score drops
      let isRedundant = true;
      const uniqueStrengths: string[] = [];

      for (const cat of Object.keys(stackCapabilities) as Array<keyof ExpertiseScore>) {
        const othersMax = resolvedTools
          .filter(t => t !== tool)
          .reduce((max, t) => Math.max(max, TOOL_EXPERTISE[t.toolId]?.[cat] || 0), 0);

        if (exp[cat] > othersMax) {
          isRedundant = false;
          if (exp[cat] >= 7) { // Notable strength
            uniqueStrengths.push(cat);
          }
        }
      }

      // Consolidate logic based on expertise
      if (isRedundant && resolvedTools.length > 1) {
        item = {
          ...item,
          recommendedAction: 'consolidate',
          recommendation: `Consolidate ${toolName} to existing tools.`,
          potentialMonthlySavings: tool.monthlySpend,
          reasoning: `Your other tools already cover all capabilities provided by ${toolName} with equal or greater expertise. You can safely eliminate this redundant spend.`,
        };
      } else if (!isRedundant && uniqueStrengths.length > 0) {
        item.reasoning = `Retained because it provides superior capabilities in: ${uniqueStrengths.join(', ')}.`;
      }
    }

    // Specific business/pricing plan rules (overriding if necessary)
    if (item.recommendedAction === 'optimal' || item.recommendedAction === 'consolidate') {
      const planLower = tool.plan.toLowerCase();
      
      // Cursor Business overkill
      if (tool.toolId === 'cursor' && planLower.includes('business') && input.teamSize <= 10) {
        item = {
          ...item,
          recommendedAction: 'downgrade',
          recommendation: 'Switch to Cursor Pro at $20/seat.',
          potentialMonthlySavings: (PRICING.cursor.business - PRICING.cursor.pro) * tool.seats,
          reasoning: 'Cursor Business (SSO, privacy mode) is rarely needed for teams under 10. Pro provides the exact same AI capabilities at half the cost.',
        };
      }
      // Copilot Enterprise downgrade
      else if (tool.toolId === 'github_copilot' && planLower.includes('enterprise') && input.teamSize < 50) {
        item = {
          ...item,
          recommendedAction: 'downgrade',
          recommendation: 'Downgrade to GitHub Copilot Business at $19/seat.',
          potentialMonthlySavings: (PRICING.github_copilot.enterprise - PRICING.github_copilot.business) * tool.seats,
          reasoning: 'Enterprise features are not justified for teams under 50. Business covers AI pair programming fully.',
        };
      }
      // Claude Team downgrade for small teams
      else if (tool.toolId === 'claude' && planLower.includes('team') && tool.seats <= 2) {
        item = {
          ...item,
          recommendedAction: 'downgrade',
          recommendation: 'Switch to individual Claude Pro accounts.',
          potentialMonthlySavings: (PRICING.claude.team - PRICING.claude.pro) * tool.seats,
          reasoning: 'Team plans add a $10/user billing management fee. For 1-2 users, separate Pro subscriptions are cheaper.',
        };
      }
      // Claude Max overkill
      else if (tool.toolId === 'claude' && planLower.includes('max') && input.teamSize <= 10) {
        item = {
          ...item,
          recommendedAction: 'downgrade',
          recommendation: 'Switch to Claude Pro — Max tier is overkill.',
          potentialMonthlySavings: (PRICING.claude.max - PRICING.claude.pro) * tool.seats,
          reasoning: 'Claude Max is for extreme power users. Pro offers the same underlying model at 80% less cost.',
        };
      }
      // ChatGPT Team downgrade
      else if (tool.toolId === 'chatgpt' && planLower.includes('team') && tool.seats <= 2) {
        item = {
          ...item,
          recommendedAction: 'downgrade',
          recommendation: 'Switch to individual ChatGPT Plus accounts.',
          potentialMonthlySavings: (PRICING.chatgpt.team - PRICING.chatgpt.plus) * tool.seats,
          reasoning: 'ChatGPT Team adds workspace features. For 1-2 users, Plus is identical functionally but $10/mo cheaper per user.',
        };
      }
      // API migration
      else if (tool.toolId === 'claude' && planLower.includes('pro') && resolvedTools.some(t => t.toolId === 'anthropic_api') && tool.monthlySpend > 50) {
        item = {
          ...item,
          recommendedAction: 'consolidate',
          recommendation: 'Migrate usage to Anthropic API entirely.',
          potentialMonthlySavings: tool.monthlySpend,
          reasoning: 'You already use the Anthropic API. At higher usage levels, the pay-as-you-go API is more flexible and cost-effective than consumer subscriptions.',
        };
      }
    }

    items.push(item);
    if (item.recommendedAction !== 'optimal') {
      totalMonthlySavings += item.potentialMonthlySavings;
    }
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
