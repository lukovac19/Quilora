/**
 * POLAR MANUAL CONFIGURATION — READ ME FIRST
 *
 * SEARCH ANCHORS (use ripgrep / IDE search on these exact strings):
 * - TODO_POLAR_MANUAL_SETUP
 * - TODO_POLAR_ACCESS_TOKEN
 * - TODO_POLAR_WEBHOOK_SECRET
 * - TODO_POLAR_WEBHOOK_URL
 * - TODO_POLAR_PRODUCT_BOOKWORM_MONTHLY
 * - TODO_POLAR_PRODUCT_BOOKWORM_YEARLY
 * - TODO_POLAR_PRODUCT_SAGE_MONTHLY
 * - TODO_POLAR_PRODUCT_SAGE_YEARLY
 * - TODO_POLAR_PRODUCT_GENESIS_LIFETIME
 * - TODO_POLAR_PRODUCT_BOOST_PACK
 * - TODO_POLAR_ENV
 * - TODO_POLAR_API_BASE
 * - TODO_APP_URL
 *
 * Do not put secrets in this file. Copy values from Polar / Supabase into:
 * - Vite: `.env.local` (or hosting env UI) for `VITE_*` only
 * - Supabase Edge Function secrets for `POLAR_*` (server-only)
 *
 * ---------------------------------------------------------------------------
 * A) WHERE SECRETS & PRODUCT IDS ARE READ (server = Supabase Edge / Deno)
 * ---------------------------------------------------------------------------
 * `src/supabase/functions/server/polar_api.ts`     → TODO_POLAR_ACCESS_TOKEN, TODO_POLAR_API_BASE, TODO_POLAR_ENV
 * `src/supabase/functions/server/polar_plan.ts`    → TODO_POLAR_PRODUCT_* (env **names** only; values from dashboard)
 * `src/supabase/functions/server/polar_billing.ts` → TODO_POLAR_WEBHOOK_SECRET
 * `src/supabase/functions/server/billing_adjustments.ts` → TODO_POLAR_ACCESS_TOKEN (refund/revoke)
 *
 * ---------------------------------------------------------------------------
 * B) WHERE APP URL & ENV ARE READ (browser-safe)
 * ---------------------------------------------------------------------------
 * `src/lib/billing/polar.ts` → TODO_APP_URL (`VITE_APP_URL`), TODO_POLAR_ENV (`VITE_POLAR_ENV`)
 * `src/lib/billingCheckout.ts` → builds success/return URLs from `quiloraPublicAppUrl()` → TODO_APP_URL
 *
 * ---------------------------------------------------------------------------
 * C) WEBHOOK URL YOU REGISTER IN POLAR (constructed; not a single constant in repo)
 * ---------------------------------------------------------------------------
 * TODO_POLAR_WEBHOOK_URL =
 *   `https://${VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-5a3d4811/billing/polar-webhook`
 * Route definition: `src/supabase/functions/server/index.tsx` → `POST .../billing/polar-webhook`
 *
 * ---------------------------------------------------------------------------
 * D) POLAR DASHBOARD: WEBHOOK SIGNING SECRET
 * ---------------------------------------------------------------------------
 * Polar → Webhooks → create endpoint → copy signing secret into Supabase secret:
 *   POLAR_WEBHOOK_SECRET  (TODO_POLAR_WEBHOOK_SECRET)
 *
 * ---------------------------------------------------------------------------
 * E) POLAR DASHBOARD: ORGANIZATION ACCESS TOKEN
 * ---------------------------------------------------------------------------
 * Polar → Settings / Organization tokens → copy into Supabase secret:
 *   POLAR_ACCESS_TOKEN (TODO_POLAR_ACCESS_TOKEN)
 * Scopes needed: checkout create, customer sessions, webhooks verify, subscriptions write, refunds write (for admin refund paths).
 *
 * ---------------------------------------------------------------------------
 * F) POLAR DASHBOARD: PRODUCT UUIDs (one Polar product per plan)
 * ---------------------------------------------------------------------------
 * Paste each Product **id** (UUID) into the matching Supabase Edge secret (see `polar_plan.ts` ENV_BY_PLAN).
 */
export const POLAR_MANUAL_SETUP_SEARCH_ANCHOR = 'TODO_POLAR_MANUAL_SETUP' as const;
