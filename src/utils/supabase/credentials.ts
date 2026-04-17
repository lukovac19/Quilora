import { projectId as embeddedProjectId, publicAnonKey as embeddedAnonKey } from './info';

/** Project ref from env or `info.tsx` (subdomain of *.supabase.co). */
export function resolveSupabaseProjectId(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined)?.trim();
  return fromEnv || embeddedProjectId;
}

/**
 * Raw browser-safe key from env or `info.tsx` (anon JWT `eyJ...` or `sb_publishable_...`).
 * Returns empty if unset or if a **secret** key was pasted by mistake.
 */
export function resolveSupabaseAnonKeyRaw(): string {
  const fromEnv = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  const key = fromEnv || embeddedAnonKey.trim();
  if (key.startsWith('sb_secret_')) {
    const src = fromEnv?.startsWith('sb_secret_')
      ? 'VITE_SUPABASE_ANON_KEY u .env.local'
      : embeddedAnonKey.trim().startsWith('sb_secret_')
        ? 'publicAnonKey u src/utils/supabase/info.tsx'
        : 'ključ';
    console.error(
      `[Supabase] ${src} sadrži sb_secret_* — to je tajni server ključ i ne smije u preglednik. U Supabase Dashboard → Settings → API stavi u .env.local vrijednost polja "anon" / "public" (JWT koji počinje s eyJ) ili "default publishable" (sb_publishable_*). Zatim rotiraj taj sb_secret u dashboardu jer je bio izložen.`,
    );
    return '';
  }
  return key;
}

/** Placeholder so `createClient` never gets an empty key (avoids white screen / Vite HMR cascade). Not valid for real API calls. */
const MISSING_KEY_PLACEHOLDER =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.set-VITE_SUPABASE_ANON_KEY-or-info-publicAnonKey';

/**
 * Key passed to `createClient` — always non-empty; use real anon / sb_publishable for working auth and Edge calls.
 */
export function resolveSupabaseAnonKeyForClient(): string {
  const raw = resolveSupabaseAnonKeyRaw();
  return raw || MISSING_KEY_PLACEHOLDER;
}

export function isSupabaseAnonKeyConfigured(): boolean {
  return resolveSupabaseAnonKeyRaw().length > 0;
}

export function resolveSupabaseUrl(): string {
  return `https://${resolveSupabaseProjectId()}.supabase.co`;
}
