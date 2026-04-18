/**
 * Server-side Polar billing adjustments (cancel / refund).
 * TODO_POLAR_ACCESS_TOKEN — same org token as `polar_api.ts`; set on Supabase Edge only.
 */
import { polarApiJson, polarServerBaseUrl } from './polar_api.ts';

export type BillingApiResult =
  | { ok: true; status: number; body?: string }
  | { ok: false; status?: number; error: string };

/** Revoke (immediately cancel) a Polar subscription by id (UUID). */
export async function revokePolarSubscription(subscriptionId: string): Promise<BillingApiResult> {
  const id = subscriptionId.trim();
  if (!id) return { ok: false, error: 'missing_subscription_id' };
  // TODO_POLAR_ACCESS_TOKEN
  const token = Deno.env.get('POLAR_ACCESS_TOKEN')?.trim();
  if (!token) return { ok: false, error: 'POLAR_ACCESS_TOKEN is not configured' };
  const url = `${polarServerBaseUrl()}/v1/subscriptions/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const text = await res.text();
  if (res.ok || res.status === 403) {
    return { ok: true, status: res.status, body: text.slice(0, 400) };
  }
  return { ok: false, status: res.status, error: text.slice(0, 800) };
}

export function isLikelyPolarOrderId(id: string): boolean {
  const t = id.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t);
}

function readOrderTotalCents(order: Record<string, unknown>): number | null {
  const candidates: unknown[] = [
    order['total_amount'],
    order['net_amount'],
    order['amount'],
    (order['amount'] as Record<string, unknown> | undefined)?.['amount'],
    (order['total'] as Record<string, unknown> | undefined)?.['amount'],
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && c > 0) return Math.round(c);
    if (typeof c === 'string' && /^\d+$/.test(c)) return Number(c);
  }
  const nested = order['amount'] as Record<string, unknown> | undefined;
  if (nested && typeof nested['amount'] === 'number') return Math.round(nested['amount'] as number);
  return null;
}

/** Full refund for a Polar order (requires refunds:write on the org token). */
export async function createPolarFullRefund(orderId: string, reason: string): Promise<BillingApiResult> {
  const oid = orderId.trim();
  if (!isLikelyPolarOrderId(oid)) {
    return { ok: false, error: 'not_a_polar_order_id' };
  }
  try {
    const order = await polarApiJson<Record<string, unknown>>('GET', `/v1/orders/${encodeURIComponent(oid)}`, undefined);
    const cents = readOrderTotalCents(order);
    if (!cents || cents < 1) {
      return { ok: false, error: `could_not_resolve_order_amount:${JSON.stringify(order).slice(0, 200)}` };
    }
    const created = await polarApiJson<Record<string, unknown>>('POST', '/v1/refunds/', {
      order_id: oid,
      amount: cents,
      reason: 'requested_by_customer',
      comment: reason.slice(0, 500),
    });
    return { ok: true, status: 201, body: JSON.stringify(created).slice(0, 400) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
