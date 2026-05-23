import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import AuditResultClient from './AuditResultClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

async function getAuditData(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabase = url && 
                      url !== 'your_supabase_url' && 
                      url !== 'https://dummy.supabase.co' && 
                      key && 
                      key !== 'your_supabase_anon_key' && 
                      key !== 'dummy';
  if (!hasSupabase) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('share_slug', slug)
      .single();
    if (error) {
      console.warn('Supabase query error:', error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Supabase fetch failed:', e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getAuditData(params.slug);

  if (!data) {
    return { title: 'Audit Not Found' };
  }

  const savings = data.savings_monthly || 0;
  const toolCount = Array.isArray(data.tools) 
    ? data.tools.length 
    : (data.tools?.entries?.length || 0);

  return {
    title: `I could save $${savings}/month on AI tools — here's how`,
    description: "Free AI spend audit by SpendScope. Run yours in 60 seconds.",
    openGraph: {
      title: `I could save $${savings}/month on AI tools — here's how`,
      description: "Free AI spend audit by SpendScope. Run yours in 60 seconds.",
      images: [`/api/og?savings=${savings}&tools=${toolCount}`],
    },
    twitter: {
      card: 'summary_large_image',
    }
  };
}

export default async function AuditPage({ params }: { params: { slug: string } }) {
  const data = await getAuditData(params.slug);

  return <AuditResultClient initialAudit={data} slug={params.slug} />;
}
