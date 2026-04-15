/** Shared deal shape from Supabase `deals` table */
export type Deal = {
  id: number;
  restaurant_name: string;
  deal_description: string;
  category: string;
  days_of_week: string;
  start_time: string;
  end_time: string;
  address: string;
  neighborhood: string;
  last_verified: string;
  is_active: boolean;
  created_at?: string;
  google_place_id?: string | null;
  google_photo_reference?: string | null;
  google_rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

import { PLACES_CACHE } from './google-places-cache';

const CATEGORY_IMAGES: Record<string, string> = {
  'Happy Hour': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
  Drinks: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
  Brunch: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  Lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  Dinner: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
};

/** Return the best image URL for a deal: cached Google photo → category fallback */
export function getDealImageUri(deal: Pick<Deal, 'id' | 'category'>): string {
  const cached = PLACES_CACHE[deal.id];
  if (cached?.photoUrl) return cached.photoUrl;
  return CATEGORY_IMAGES[deal.category] || CATEGORY_IMAGES.default;
}

/** Return the Google rating for a deal from the static cache, formatted as "4.5" */
export function formatGoogleRating(dealId: number): string | null {
  const cached = PLACES_CACHE[dealId];
  if (!cached?.rating) return null;
  return cached.rating.toFixed(1);
}

/** Return the raw numeric rating from cache */
export function getGoogleRating(dealId: number): number | null {
  return PLACES_CACHE[dealId]?.rating ?? null;
}
