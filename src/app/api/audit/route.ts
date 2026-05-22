import { NextResponse } from 'next/server';
import { auditTools, AuditInput, AuditResult } from '@/lib/auditEngine';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const input: AuditInput = await req.json();
    const result: AuditResult = auditTools(input);

    const toolList = input.tools.map(t => t.toolId).join(', ');
    const topRecommendation = result.items.length > 0 
      ? result.items.sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings)[0].recommendation 
      : 'Review your tools to ensure optimal usage.';
    
    let summary = '';
    
    // Anthropic API Call
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 150,
          system: "You are a concise financial advisor specializing in SaaS spend optimization for startups. Write only the summary paragraph — no preamble, no sign-off.",
          messages: [
            {
              role: 'user',
              content: `Write a ~100-word personalized audit summary for a ${input.teamSize}-person team spending $${input.tools.reduce((sum, t) => sum + t.monthlySpend, 0)}/month on AI tools. Their top tools are ${toolList}. The audit found $${result.totalMonthlySavings}/month in potential savings. Primary use case: ${input.primaryUseCase}. Biggest opportunity: ${topRecommendation}. Be specific, warm, and actionable. Mention Credex as a resource for capturing more savings through discounted AI credits.`
            }
          ]
        });
        summary = (response.content[0] as any).text;
      } else {
        throw new Error("No API key");
      }
    } catch (e) {
      console.warn("Anthropic API failed or missing, using fallback.", e);
      const totalMonthly = input.tools.reduce((sum, t) => sum + t.monthlySpend, 0);
      summary = `Your team of ${input.teamSize} is spending $${totalMonthly}/month on AI tools. Our audit identified $${result.totalMonthlySavings}/month in potential savings — that's $${result.totalAnnualSavings} annually. Your biggest opportunity is ${topRecommendation}. ${result.savingsTier === 'high' ? 'Credex can help you capture additional savings through discounted AI infrastructure credits.' : ''}`;
    }

    const slug = nanoid(10);

    // Save to Supabase
    if (supabaseUrl && supabaseAnonKey) {
      const { error } = await supabase
        .from('audits')
        .insert({
          tools: input.tools,
          summary,
          savings_monthly: result.totalMonthlySavings,
          savings_annual: result.totalAnnualSavings,
          share_slug: slug
        });
      
      if (error) {
        console.error("Supabase insert error:", error);
      }
    }

    return NextResponse.json({ slug, result, summary });
  } catch (error: unknown) {
    console.error("Audit API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
