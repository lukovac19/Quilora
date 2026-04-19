/**
 * Dodo Payments webhook (Next.js App Router).
 *
 * Verifies Standard Webhooks signature, dedupes by `webhook-id`, then applies billing side effects on Supabase Edge
 * (`/billing/dodo/webhook-apply`) using the service role. Configure:
 *
 * - `DODO_PAYMENTS_WEBHOOK_SECRET`
 * - `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
 * - `SUPABASE_SERVICE_ROLE_KEY`
 * - `QUILORA_WEBHOOK_APPLY_URL` — full URL to `.../make-server-5a3d4811/billing/dodo/webhook-apply`
 *
 * Alternatively, point Dodo directly at the Edge URL `.../payments/dodo/webhook` and skip this route.
 */
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'standardwebhooks';

function header(req: Request, name: string): string {
  return req.headers.get(name) ?? '';
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET?.trim() || process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim();
  if (!secret) {
    return new Response(JSON.stringify({ error: 'DODO_PAYMENTS_WEBHOOK_SECRET is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const applyUrl = (process.env.QUILORA_WEBHOOK_APPLY_URL || '').trim();

  if (!supabaseUrl || !serviceKey || !applyUrl) {
    return new Response(
      JSON.stringify({
        error:
          'Configure NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, and QUILORA_WEBHOOK_APPLY_URL',
      }),
      { status: 501, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const rawBody = await req.text();
  let payload: Record<string, unknown>;
  try {
    const webhook = new Webhook(secret);
    payload = (await webhook.verify(rawBody, {
      'webhook-id': header(req, 'webhook-id') || '',
      'webhook-signature': header(req, 'webhook-signature') || '',
      'webhook-timestamp': header(req, 'webhook-timestamp') || '',
    })) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const webhookId = header(req, 'webhook-id').trim();
  if (!webhookId) {
    return new Response(JSON.stringify({ error: 'Missing webhook-id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: dup } = await admin.from('dodo_webhook_dedup').select('event_id').eq('event_id', webhookId).maybeSingle();
  if (dup?.event_id) {
    return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const applyRes = await fetch(applyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ payload, webhookId }),
    });
    const text = await applyRes.text();
    if (!applyRes.ok) {
      return new Response(JSON.stringify({ error: 'webhook_apply_failed', detail: text.slice(0, 500) }), {
        status: applyRes.status || 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: insErr } = await admin.from('dodo_webhook_dedup').insert({ event_id: webhookId });
    if (insErr && !String(insErr.message).toLowerCase().includes('duplicate')) {
      console.warn('dodo_webhook_dedup insert', insErr);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'webhook_failed';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
