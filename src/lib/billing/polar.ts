/**
 * Client-safe Polar helpers (no secrets). Checkout creation runs on the Edge function.
 * TODO_APP_URL — set `VITE_APP_URL` to your deployed origin (must match routes `/billing/success`, `/pricing`, etc.).
 * TODO_POLAR_ENV — `VITE_POLAR_ENV=sandbox` | `production` (informational for client; server uses `POLAR_ENV`).
 */

import { getPublicSiteOrigin } from '../publicSiteOrigin';

export function quiloraPublicAppUrl(): string {
  return getPublicSiteOrigin();
}

export function polarClientEnv(): 'sandbox' | 'production' {
  // TODO_POLAR_ENV
  const raw = (import.meta.env.VITE_POLAR_ENV as string | undefined)?.trim().toLowerCase();
  return raw === 'sandbox' ? 'sandbox' : 'production';
}
