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

});
