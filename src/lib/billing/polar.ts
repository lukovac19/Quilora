/**
 * Client-safe Polar helpers (no secrets). Checkout creation runs on the Edge function.
 */

export function quiloraPublicAppUrl(): string {
  const fromEnv = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
  return '';
}

export function polarClientEnv(): 'sandbox' | 'production' {
  const raw = (import.meta.env.VITE_POLAR_ENV as string | undefined)?.trim().toLowerCase();
  return raw === 'sandbox' ? 'sandbox' : 'production';
}
