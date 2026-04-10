import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yzkaaxazsakuqcpeesry.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jzL5jU9PKmTAiCR33SE_Cg_p9cHhpD-';

// Supabase still probes storage on init; without this, expo-router web SSR hits
// AsyncStorage's web path and throws `window is not defined` in Node.
const noopAuthStorage = {
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
};

// No auth/session storage needed for MVP — we're querying public data only
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: noopAuthStorage,
  },
});
