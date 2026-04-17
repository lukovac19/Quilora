import { createClient } from '@supabase/supabase-js';
import {
  isSupabaseAnonKeyConfigured,
  resolveSupabaseAnonKeyForClient,
  resolveSupabaseUrl,
} from '../utils/supabase/credentials';

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey = resolveSupabaseAnonKeyForClient();

if (!isSupabaseAnonKeyConfigured()) {
  const msg =
    '[Supabase] Nema ispravnog ključa — postavi VITE_SUPABASE_ANON_KEY u .env.local ili publicAnonKey u src/utils/supabase/info.tsx (anon JWT eyJ… ili sb_publishable_*; nikad sb_secret_*). Restartuj dev server nakon .env promjene.';
  if (import.meta.env.DEV) console.warn(msg);
  else console.error(msg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    /** Hosted Supabase Auth expects PKCE for OAuth / URL callbacks; implicit flow can break at `*.supabase.co/auth/v1/authorize`. */
    flowType: 'pkce',
  },
});
