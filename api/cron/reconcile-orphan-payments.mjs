/**
 * Vercel Cron → Supabase Edge `internal/cron/reconcile-orphan-payments` (6h cadence, EC-04 recovery emails).
 *
 * Env (Vercel):
 * - `QUILORA_CRON_RECONCILE_URL` — full POST URL to the Edge internal cron route
 * - `CRON_SECRET` — must match Supabase Edge `CRON_SECRET`
 *
 * Secured with Vercel cron header in production.
 */
export default async function handler(req) {
  if (process.env.VERCEL === '1' && req.headers.get('x-vercel-cron') !== '1') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = process.env.QUILORA_CRON_RECONCILE_URL?.trim();
  const secret = process.env.CRON_SECRET?.trim();
  if (!url || !secret) {
    return new Response(JSON.stringify({ error: 'missing_env' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-cron-secret': secret },
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
