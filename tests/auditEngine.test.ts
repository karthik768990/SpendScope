import { describe, it, expect } from 'vitest';
import { auditTools, AuditInput } from '../src/lib/auditEngine';

describe('auditTools Engine', () => {
  it('correctly flags Cursor Business overkill for small team', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'Business ($40/mo)', monthlySpend: 200, seats: 5 }
      ]
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('downgrade');
    expect(result.items[0].potentialMonthlySavings).toBe(100); // (40 - 20) * 5
    expect(result.totalMonthlySavings).toBe(100);
  });

  it('correctly identifies Copilot Enterprise downgrade path', () => {
    const input: AuditInput = {
      teamSize: 30,
      primaryUseCase: 'mixed',
      tools: [
        { toolId: 'github_copilot', plan: 'Enterprise ($39/mo)', monthlySpend: 1170, seats: 30 }
      ]
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('downgrade');
    expect(result.items[0].potentialMonthlySavings).toBe(600); // (39 - 19) * 30
  });

  it('does not manufacture savings when spend is already optimal', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 100, seats: 5 }
      ]
    };
    const result = auditTools(input);
    expect(result.items[0].recommendedAction).toBe('optimal');
    expect(result.items[0].potentialMonthlySavings).toBe(0);
    expect(result.totalMonthlySavings).toBe(0);
  });

  it('flags Cursor + Copilot redundancy for coding use case', () => {
    const input: AuditInput = {
      teamSize: 10,
      primaryUseCase: 'coding',
      tools: [
        { toolId: 'cursor', plan: 'Pro ($20/mo)', monthlySpend: 200, seats: 10 },
        { toolId: 'github_copilot', plan: 'Business ($19/mo)', monthlySpend: 190, seats: 10 }
      ]
    };
    const result = auditTools(input);
    const copilotResult = result.items.find(i => i.toolId === 'github_copilot');
    expect(copilotResult?.recommendedAction).toBe('consolidate');
    expect(copilotResult?.potentialMonthlySavings).toBe(190);
  });

  it('handles empty tools array gracefully', () => {
    const input: AuditInput = {
      teamSize: 5,
      primaryUseCase: 'coding',
      tools: []
    };
    const result = auditTools(input);
    expect(result.items.length).toBe(0);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.totalAnnualSavings).toBe(0);
    expect(result.savingsTier).toBe('optimal');
  });
});
