import { NextResponse } from 'next/server';
import { auditTools, AuditInput, AuditResult } from '@/lib/auditEngine';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const anthropic = 
  process.env.ANTHROPIC_API_KEY && 
  process.env.ANTHROPIC_API_KEY.startsWith('sk-')
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

export async function POST(req: Request) {
  try {
    const input: AuditInput = await req.json();
    const result: AuditResult = auditTools(input);

    const totalMonthly = input.tools.reduce((sum, t) => sum + t.monthlySpend, 0);
    const toolList = input.tools.map(t => t.toolId).join(', ');
    const topItem = [...result.items].sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings)[0];
    const topRecommendation = topItem?.recommendation ?? 'Review your tools to ensure optimal usage.';

    let summary = '';

    // Try Anthropic API first
    try {
      if (anthropic) {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 180,
          system:
            'You are a concise financial advisor specializing in SaaS spend optimization for startups. Write only the summary paragraph — no preamble, no sign-off.',
          messages: [
            {
              role: 'user',
              content: `Write a ~100-word personalized audit summary for a ${input.teamSize}-person team spending $${totalMonthly}/month on AI tools. Their top tools are ${toolList}. The audit found $${result.totalMonthlySavings}/month in potential savings. Primary use case: ${input.primaryUseCase}. Biggest opportunity: ${topRecommendation}. Be specific, warm, and actionable. Mention SpendScope as a resource for capturing more savings through optimized subscription stack planning.`,
            },
          ],
        });
        summary = (response.content[0] as { text: string }).text;
      } else {
        throw new Error('No Anthropic API key configured');
      }
    } catch (e) {
      console.warn('Anthropic API fallback active:', (e as Error).message);
      summary = `Your team of ${input.teamSize} is spending $${totalMonthly}/month on AI tools. Our audit identified $${result.totalMonthlySavings}/month in potential savings — that's $${result.totalAnnualSavings} annually. Your biggest opportunity: ${topRecommendation}.${result.savingsTier === 'high' ? ' SpendScope can help you capture additional savings through optimized configurations and team structures — reach out to find out how.' : ''}`;
    }

    const slug = nanoid(10);

    // Persist to Supabase — store full input context so results page can re-render accurately
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { error } = await supabase.from('audits').insert({
        tools: {
          entries: input.tools,
          teamSize: input.teamSize,
          primaryUseCase: input.primaryUseCase,
        },
        summary,
        savings_monthly: result.totalMonthlySavings,
        savings_annual: result.totalAnnualSavings,
        share_slug: slug,
      });

      if (error) {
        console.error('Supabase insert error:', error);
      }
    }

    return NextResponse.json({ slug, result, summary });
  } catch (error: unknown) {
    console.error('Audit API Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
