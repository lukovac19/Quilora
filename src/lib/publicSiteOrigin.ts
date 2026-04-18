/**
 * Canonical browser origin for auth redirects, Polar return URLs, and email links.
 * Order: `VITE_APP_URL` → dev: current origin → production default.
 */
const PRODUCTION_DEFAULT_ORIGIN = 'https://quilora.app';

export function getPublicSiteOrigin(): string {
  const raw = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (raw) return raw.replace(/\/$/, '');
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  return PRODUCTION_DEFAULT_ORIGIN;
}

/** Supabase `emailRedirectTo` / OAuth `redirectTo` base (PKCE returns here). */
export function getAuthRedirectBaseUrl(): string {
  return `${getPublicSiteOrigin()}/auth`;
}
