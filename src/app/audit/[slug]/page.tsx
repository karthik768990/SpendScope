import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import AuditResultClient from './AuditResultClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await supabase
    .from('audits')
    .select('*')
    .eq('share_slug', params.slug)
    .single();

  if (!data) {
    return { title: 'Audit Not Found' };
  }

  const savings = data.savings_monthly || 0;
  const toolCount = data.tools?.length || 0;

  return {
    title: `I could save $${savings}/month on AI tools — here's how`,
    description: "Free AI spend audit by Credex. Run yours in 60 seconds.",
    openGraph: {
      title: `I could save $${savings}/month on AI tools — here's how`,
      description: "Free AI spend audit by Credex. Run yours in 60 seconds.",
      images: [`/api/og?savings=${savings}&tools=${toolCount}`],
    },
    twitter: {
      card: 'summary_large_image',
    }
  };
}

export default async function AuditPage({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('audits')
    .select('*')
    .eq('share_slug', params.slug)
    .single();

  if (!data) return notFound();

  // In a real app we'd also store the full AuditResult items in DB, or re-run the engine here.
  // The prompt implies we have enough in the summary, but also mentions "Per-tool breakdown table: Tool | Current | Recommended Action | Monthly Savings | Reason".
  // Let's re-run the engine if the detailed items aren't in the DB.
  // We can import `auditTools` and re-calculate because we have `data.tools`.
  
  return <AuditResultClient audit={data} slug={params.slug} />;
}
