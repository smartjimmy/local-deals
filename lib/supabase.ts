import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://yzkaaxazsakuqcpeesry.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jzL5jU9PKmTAiCR33SE_Cg_p9cHhpD-';

// Web: use localStorage; Native: use AsyncStorage
const storage =
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
    : Platform.OS === 'web'
      ? {
          // SSR noop
          getItem: (_key: string) => Promise.resolve(null),
          setItem: (_key: string, _value: string) => Promise.resolve(),
          removeItem: (_key: string) => Promise.resolve(),
        }
      : {
          // Native: use AsyncStorage for session persistence
          getItem: (key: string) => AsyncStorage.getItem(key),
          setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
          removeItem: (key: string) => AsyncStorage.removeItem(key),
        };

const isNativeOrBrowser = Platform.OS !== 'web' || typeof window !== 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: isNativeOrBrowser,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
    storage,
  },
});
