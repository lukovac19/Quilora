import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Initialize Supabase client
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing. Please connect your Supabase project.');
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
