import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      // In a real app we'd fetch the actual audit details from DB to put in the email
      // But for this MVP we can just mention the shared link and Credex CTA.
      const auditUrl = `https://credex.rocks/audit/${slug}`; // using base url

      await resend.emails.send({
        from: 'Credex <audits@credex.rocks>',
        to: email,
        subject: `Your AI Spend Audit — ${company || 'Your team'}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-w: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a7a5e;">Your AI Spend Audit is ready</h2>
            <p>Thanks for running an audit with SpendScope by Credex.</p>
            <p>You can access your full, shareable report here:</p>
            <p><a href="${auditUrl}" style="display: inline-block; padding: 10px 20px; background: #1a7a5e; color: white; text-decoration: none; border-radius: 5px;">View Full Report</a></p>
            <p><strong>Our team will reach out within 1 business day to discuss discounted AI credits if your savings potential is high.</strong></p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="font-size: 12px; color: #888;">Credex helps startups save up to 40% on AI infrastructure.</p>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Leads API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
