/**
 * Run this in your browser console (e.g. on the Supabase dashboard page).
 * It will look up each active deal on Google Places and pull the phone number,
 * then update the Supabase deals table.
 *
 * Usage: paste the entire script into Chrome DevTools console and hit Enter.
 */

const GOOGLE_API_KEY = 'AIzaSyAbGQoMEGifOMCADh0MwItoEtPjPS6Vak8';
const SUPABASE_URL = 'https://yzkaaxazsakuqcpeesry.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jzL5jU9PKmTAiCR33SE_Cg_p9cHhpD-';

async function fetchActiveDeals() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/deals?is_active=eq.true&phone=is.null&select=id,restaurant_name,address,neighborhood&order=id.asc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  return res.json();
}

async function searchPlace(name, address) {
  const query = `${name}, ${address}`;
  const res = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.nationalPhoneNumber,places.internationalPhoneNumber,places.displayName',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
    }
  );
  const data = await res.json();
  if (data.places && data.places.length > 0) {
    return data.places[0].nationalPhoneNumber || data.places[0].internationalPhoneNumber || null;
  }
  return null;
}

async function updateDealPhone(dealId, phone) {
  await fetch(`${SUPABASE_URL}/rest/v1/deals?id=eq.${dealId}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ phone }),
  });
}

async function run() {
  const deals = await fetchActiveDeals();
  console.log(`Found ${deals.length} deals without phone numbers`);

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i];
    try {
      // Rate limit: ~200ms between requests to avoid hitting quotas
      await new Promise((r) => setTimeout(r, 200));

      const phone = await searchPlace(deal.restaurant_name, deal.address);

      if (phone) {
        await updateDealPhone(deal.id, phone);
        found++;
        console.log(`✅ [${i + 1}/${deals.length}] ${deal.restaurant_name}: ${phone}`);
      } else {
        notFound++;
        console.log(`❌ [${i + 1}/${deals.length}] ${deal.restaurant_name}: no phone found`);
      }
    } catch (err) {
      notFound++;
      console.error(`⚠️ [${i + 1}/${deals.length}] ${deal.restaurant_name}: error`, err.message);
    }
  }

  console.log(`\n🎉 Done! Found ${found} phone numbers, ${notFound} not found.`);
}

run();
