import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

// Simple in-memory rate limiter for MVP
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimitInfo = rateLimitMap.get(ip) || { count: 0, timestamp: now };
    
    // Reset if > 1 hour
    if (now - rateLimitInfo.timestamp > 3600000) {
      rateLimitInfo.count = 0;
      rateLimitInfo.timestamp = now;
    }

    if (rateLimitInfo.count >= 3) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { auditId, email, company, role, teamSize, slug } = body;

    // Email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Rate limit increment
    rateLimitInfo.count++;
    rateLimitMap.set(ip, rateLimitInfo);

    // Save to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await supabase.from('leads').insert({
        audit_id: auditId,
        email,
        company,
        role,
        team_size: teamSize
      });
    }

    let mockSent = false;
    const origin = req.headers.get('origin') || 'https://spendscope.app';
    const auditUrl = `${origin}/audit/${slug}`;

    const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-w: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Your AI Spend Audit is ready</h2>
        <p>Thanks for running an audit with SpendScope.</p>
        <p>You can access your full, shareable report here:</p>
        <p><a href="${auditUrl}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View Full Report</a></p>
        <p><strong>Our team will reach out within 1 business day to discuss optimized AI spend if your savings potential is high.</strong></p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888;">SpendScope helps startups save up to 40% on AI subscriptions.</p>
      </div>
    `;

    // Send email via Resend
    if (resend) {
      await resend.emails.send({
        from: 'SpendScope <audits@spendscope.app>',
        to: email,
        subject: `Your AI Spend Audit — ${company || 'Your team'}`,
        html: emailHtml
      });
    } else {
      mockSent = true;
      console.log('\n==================================================');
      console.log('[SpendScope Mock Email Service]');
      console.log(`To: ${email}`);
      console.log(`Subject: Your AI Spend Audit — ${company || 'Your team'}`);
      console.log(`URL: ${auditUrl}`);
      console.log('==================================================\n');
    }

    return NextResponse.json({ success: true, mockSent });
  } catch (error: unknown) {
    console.error("Leads API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
