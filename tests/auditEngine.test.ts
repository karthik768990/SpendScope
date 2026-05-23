import { describe, it, expect } from 'vitest';
import { auditTools, AuditInput } from '../src/lib/auditEngine';

describe('auditTools Engine', () => {

  // ── Core downgrade rules ──────────────────────────────────────────────────

  it('correctly flags Cursor Business overkill for small coding team', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [{ toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 200, seats: 5 }],
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('downgrade');
    expect(result.items[0].potentialMonthlySavings).toBe(100); // (40-20)*5
    expect(result.totalMonthlySavings).toBe(100);
  });

  it('does NOT flag Cursor Business for large team (>10 seats)', () => {
    const input: AuditInput = {
      teamSize: 15,
      primaryUseCase: 'coding',
      tools: [{ toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 600, seats: 15 }],
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('optimal');
    expect(result.items[0].potentialMonthlySavings).toBe(0);
  });

  it('correctly identifies Copilot Enterprise downgrade path for team < 50', () => {
    const input: AuditInput = {
      teamSize: 30,
      primaryUseCase: 'mixed',
      tools: [{ toolId: 'github_copilot', plan: 'Enterprise ($39/mo)', monthlySpend: 1170, seats: 30 }],
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('downgrade');
    expect(result.items[0].potentialMonthlySavings).toBe(600); // (39-19)*30
  });

  it('does not manufacture savings when Cursor Pro is already optimal', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [{ toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 }],
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('optimal');
    expect(result.items[0].potentialMonthlySavings).toBe(0);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.savingsTier).toBe('optimal');
  });

  it('flags Cursor + Copilot redundancy for coding use case', () => {
    const input: AuditInput = {
      teamSize: 10,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 200, seats: 10 },
        { toolId: 'github_copilot', plan: 'Business ($19/mo)', monthlySpend: 190, seats: 10 },
      ],
    };
    const result = auditTools(input);
    const copilotResult = result.items.find(i => i.toolId === 'github_copilot');
    expect(copilotResult?.recommendedAction).toBe('consolidate');
    expect(copilotResult?.potentialMonthlySavings).toBe(190);
  });

  it('handles empty tools array gracefully', () => {
    const input: AuditInput = { teamSize: 5, primaryUseCase: 'coding', tools: [] };
    const result = auditTools(input);
    expect(result.items.length).toBe(0);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.totalAnnualSavings).toBe(0);
    expect(result.savingsTier).toBe('optimal');
  });

  // ── Redundancy rules ──────────────────────────────────────────────────────

  it('flags Claude Pro + Anthropic API as redundant when Pro spend > $50', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'mixed',
      tools: [
        { toolId: 'anthropic_api', plan: 'Pay-as-you-go', monthlySpend: 200, seats: 1 },
        { toolId: 'claude', plan: 'Pro ($20/mo)', monthlySpend: 60, seats: 3 },
      ],
    };
    const result = auditTools(input);
    const claudeResult = result.items.find(i => i.toolId === 'claude');
    expect(claudeResult?.recommendedAction).toBe('consolidate');
  });

  it('flags ChatGPT Plus + OpenAI API as redundant', () => {
    const input: AuditInput = {
      teamSize: 3,
      primaryUseCase: 'mixed',
      tools: [
        { toolId: 'openai_api', plan: 'Pay-as-you-go', monthlySpend: 150, seats: 1 },
        { toolId: 'chatgpt', plan: 'Plus ($20/mo)', monthlySpend: 20, seats: 1 },
      ],
    };
    const result = auditTools(input);
    const chatgptResult = result.items.find(i => i.toolId === 'chatgpt');
    expect(chatgptResult?.recommendedAction).toBe('consolidate');
  });

  it('suggests switching Cursor to Claude Pro for writing-focused team', () => {
    const input: AuditInput = {
      teamSize: 4,
      primaryUseCase: 'writing',
      tools: [{ toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 80, seats: 4 }],
    };
    const result = auditTools(input);
    const cursorResult = result.items.find(i => i.toolId === 'cursor');
    expect(cursorResult?.recommendedAction).toBe('switch');
  });

  // ── Broadened rules (use-case independent) ────────────────────────────────

  it('flags Cursor Business for small team regardless of use case', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'mixed',
      tools: [{ toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 200, seats: 5 }],
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('downgrade');
    expect(result.items[0].potentialMonthlySavings).toBe(100);
  });

  it('flags Cursor + Copilot redundancy for mixed use case', () => {
    const input: AuditInput = {
      teamSize: 10,
      primaryUseCase: 'mixed',
      tools: [
        { toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 200, seats: 10 },
        { toolId: 'github_copilot', plan: 'Business ($19/mo)', monthlySpend: 190, seats: 10 },
      ],
    };
    const result = auditTools(input);
    const copilotResult = result.items.find(i => i.toolId === 'github_copilot');
    expect(copilotResult?.recommendedAction).toBe('consolidate');
  });

  // ── New rules ─────────────────────────────────────────────────────────────

  it('flags Claude Max downgrade for small team', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'mixed',
      tools: [{ toolId: 'claude', plan: 'Max ($100/mo)', monthlySpend: 200, seats: 2 }],
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('downgrade');
    expect(result.items[0].potentialMonthlySavings).toBe(160); // (100-20)*2
  });

  it('flags ChatGPT Team downgrade for ≤ 2 seats', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'mixed',
      tools: [{ toolId: 'chatgpt', plan: 'Team ($30/mo/user)', monthlySpend: 60, seats: 2 }],
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('downgrade');
    expect(result.items[0].potentialMonthlySavings).toBe(20); // (30-20)*2
  });

  it('flags Windsurf + Cursor as redundant', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 },
        { toolId: 'windsurf', plan: 'Pro ($15/mo)', monthlySpend: 75, seats: 5 },
      ],
    };
    const result = auditTools(input);
    const windsurfResult = result.items.find(i => i.toolId === 'windsurf');
    expect(windsurfResult?.recommendedAction).toBe('consolidate');
    expect(windsurfResult?.potentialMonthlySavings).toBe(75);
  });

  it('filters out empty tool entries from form', () => {
    const input = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 200, seats: 5 },
        { toolId: '', plan: '', monthlySpend: 0, seats: 1 },
      ],
    };
    const result = auditTools(input as AuditInput);
    expect(result.items.length).toBe(1);
    expect(result.items[0].recommendedAction).toBe('downgrade');
  });

  // ── Savings tier classification ───────────────────────────────────────────

  it('assigns high savings tier when totalMonthlySavings > $500', () => {
    const input: AuditInput = {
      teamSize: 30,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 1200, seats: 30 },
        { toolId: 'github_copilot', plan: 'Enterprise ($39/mo)', monthlySpend: 1170, seats: 30 },
      ],
    };
    const result = auditTools(input);
    expect(result.savingsTier).toBe('high');
  });

  // ── Use-Case Specific Optimizations ───────────────────────────────────────

  it('consolidates general LLM redundancy based on use case preference (data team with Claude & ChatGPT)', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'data',
      tools: [
        { toolId: 'chatgpt', plan: 'Plus ($20/mo)', monthlySpend: 100, seats: 5 },
        { toolId: 'claude', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 },
      ],
    };
    const result = auditTools(input);
    const claudeResult = result.items.find(i => i.toolId === 'claude');
    const chatgptResult = result.items.find(i => i.toolId === 'chatgpt');
    
    // For data, ChatGPT is preferred, so Claude should be consolidated (dropped)
    expect(claudeResult?.recommendedAction).toBe('consolidate');
    expect(claudeResult?.potentialMonthlySavings).toBe(100);
    expect(chatgptResult?.recommendedAction).toBe('optimal');
  });

  it('consolidates coding tools to drop for non-coding use case when a general LLM exists', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'writing',
      tools: [
        { toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 },
        { toolId: 'claude', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 },
      ],
    };
    const result = auditTools(input);
    const cursorResult = result.items.find(i => i.toolId === 'cursor');
    expect(cursorResult?.recommendedAction).toBe('consolidate');
    expect(cursorResult?.potentialMonthlySavings).toBe(100);
  });

  it('switches coding tool to general assistant for non-coding use case when no general LLM exists', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'writing',
      tools: [
        { toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 },
      ],
    };
    const result = auditTools(input);
    const cursorResult = result.items.find(i => i.toolId === 'cursor');
    expect(cursorResult?.recommendedAction).toBe('switch');
    expect(cursorResult?.recommendation).toContain('Claude Pro');
  });

  it('switches generic chat tool to coding assistant for coding use case when no coding assistant exists', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'chatgpt', plan: 'Plus ($20/mo)', monthlySpend: 100, seats: 5 },
      ],
    };
    const result = auditTools(input);
    const chatgptResult = result.items.find(i => i.toolId === 'chatgpt');
    expect(chatgptResult?.recommendedAction).toBe('switch');
    expect(chatgptResult?.recommendation).toContain('Cursor');
  });

  it('switches general assistant to ChatGPT for data use case', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'data',
      tools: [
        { toolId: 'claude', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 },
      ],
    };
    const result = auditTools(input);
    const claudeResult = result.items.find(i => i.toolId === 'claude');
    expect(claudeResult?.recommendedAction).toBe('switch');
    expect(claudeResult?.recommendation).toContain('ChatGPT');
  });

  it('switches ChatGPT to Gemini or Claude for research use case', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'research',
      tools: [
        { toolId: 'chatgpt', plan: 'Plus ($20/mo)', monthlySpend: 100, seats: 5 },
      ],
    };
    const result = auditTools(input);
    const chatgptResult = result.items.find(i => i.toolId === 'chatgpt');
    expect(chatgptResult?.recommendedAction).toBe('switch');
    expect(chatgptResult?.recommendation).toContain('Gemini Advanced');
  });

});
