import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://yzkaaxazsakuqcpeesry.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jzL5jU9PKmTAiCR33SE_Cg_p9cHhpD-';

// Web: use localStorage for session persistence; SSR/native: noop
const webStorage =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
        getItem: (_key: string) => Promise.resolve(null),
        setItem: (_key: string, _value: string) => Promise.resolve(),
        removeItem: (_key: string) => Promise.resolve(),
      };

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: Platform.OS === 'web' && typeof window !== 'undefined',
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
    storage: webStorage,
  },
});
