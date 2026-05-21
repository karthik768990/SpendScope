import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const savings = searchParams.get('savings') ?? '0';
    const tools = searchParams.get('tools') ?? '0';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            fontFamily: 'sans-serif',
            padding: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '24px', fontWeight: 'bold' }}>
              Credex Audit
            </div>
          </div>
          <h1 style={{ fontSize: '60px', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', margin: '0' }}>
            I could save <span style={{ color: '#10b981', margin: '0 10px' }}>${savings}/mo</span> on AI tools
          </h1>
          <p style={{ fontSize: '30px', color: '#64748b', marginTop: '20px' }}>
            Audited {tools} subscriptions in 60 seconds
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
