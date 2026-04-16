import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://yzkaaxazsakuqcpeesry.supabase.co',
  'sb_publishable_jzL5jU9PKmTAiCR33SE_Cg_p9cHhpD-'
);

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = parseInt(rawId || '', 10);

  if (!id || isNaN(id)) {
    return res.redirect(302, '/');
  }

  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single();

  if (!deal) {
    return res.redirect(302, '/');
  }

  const imageUrl = `https://local-deals-xi.vercel.app/api/og-image/${id}`;
  const title = `${deal.restaurant_name} — ${deal.deal_description}`;
  const description = [deal.address, deal.neighborhood].filter(Boolean).join(' · ');
  const appUrl = `https://local-deals-xi.vercel.app/deal/${id}?r=1`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Local Deals" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://local-deals-xi.vercel.app/deal/${id}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(imageUrl)}" />

  <!-- Redirect real users to the app -->
  <meta http-equiv="refresh" content="0;url=${appUrl}" />
</head>
<body>
  <script>window.location.replace("${appUrl}");</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.send(html);
}
