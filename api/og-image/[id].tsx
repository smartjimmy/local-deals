import { ImageResponse } from '@vercel/og';
import type { VercelRequest } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { PLACES_CACHE } from '../../lib/google-places-cache';

export const config = { runtime: 'edge' };

const supabase = createClient(
  'https://yzkaaxazsakuqcpeesry.supabase.co',
  'sb_publishable_jzL5jU9PKmTAiCR33SE_Cg_p9cHhpD-'
);

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const id = parseInt(url.pathname.split('/').pop() || '', 10);

  if (!id || isNaN(id)) {
    return new Response('Not found', { status: 404 });
  }

  const { data: deal } = await supabase
    .from('deals')
    .select('restaurant_name, deal_description, address, neighborhood')
    .eq('id', id)
    .single();

  if (!deal) {
    return new Response('Not found', { status: 404 });
  }

  const cached = PLACES_CACHE[id];
  const photoUrl = cached?.photoUrl || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#1a1a1a',
        }}
      >
        {/* Restaurant photo as background */}
        {photoUrl ? (
          <img
            src={photoUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '65%',
            display: 'flex',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
          }}
        />

        {/* Text content at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '40px 48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* App branding pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                backgroundColor: '#E1306C',
                borderRadius: '16px',
                padding: '4px 14px',
                fontSize: '20px',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
              }}
            >
              Local Deals
            </div>
          </div>

          {/* Restaurant name */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {deal.restaurant_name}
          </div>

          {/* Deal description */}
          <div
            style={{
              fontSize: '26px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.3,
              display: 'flex',
            }}
          >
            {deal.deal_description}
          </div>

          {/* Location */}
          {deal.neighborhood ? (
            <div
              style={{
                fontSize: '22px',
                color: 'rgba(255,255,255,0.6)',
                display: 'flex',
                marginTop: '4px',
              }}
            >
              📍 {deal.neighborhood}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
