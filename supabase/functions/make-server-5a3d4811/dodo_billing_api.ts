/**
 * Dodo Payments REST helpers (Deno / Edge). Uses bearer API key — never expose to clients.
 */

export type DodoApiResult =
  | { ok: true; status: number; body?: string }
  | { ok: false; status?: number; error: string };

/** Live: https://live.dodopayments.com · Test: https://test.dodopayments.com */
export function dodoApiBase(): string {
  const override = Deno.env.get('DODO_PAYMENTS_ENVIRONMENT')?.trim();
  const mode =
    override === 'live_mode' || override === 'test_mode'
      ? override
      : Deno.env.get('NODE_ENV') === 'production'
        ? 'live_mode'
        : 'test_mode';
  return mode === 'live_mode' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
}

/** Prefer `DODO_PAYMENTS_API_KEY`; accept `DODO_API_KEY` for older dashboards. Never log values. */
export function getDodoApiKey(): string | null {
  return Deno.env.get('DODO_PAYMENTS_API_KEY')?.trim() || Deno.env.get('DODO_API_KEY')?.trim() || null;
}

function authHeaders(): HeadersInit {
  const key = getDodoApiKey();
  if (!key) throw new Error('Dodo merchant API key missing (set DODO_PAYMENTS_API_KEY or DODO_API_KEY on the Edge function)');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/** Full refund for a completed payment (uses payment id from Dodo). */
export async function dodoCreateFullRefund(paymentId: string, reason: string): Promise<DodoApiResult> {
  const key = getDodoApiKey();
  if (!key) return { ok: false, error: 'Dodo API key not configured (DODO_PAYMENTS_API_KEY or DODO_API_KEY)' };
  const base = dodoApiBase();
  const res = await fetch(`${base}/refunds`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      payment_id: paymentId.trim(),
      reason: reason.slice(0, 500),
    }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 800) };
  return { ok: true, status: res.status, body: text.slice(0, 400) };
}

/** Cancel subscription immediately (merchant-initiated). */
export async function dodoCancelSubscriptionImmediately(subscriptionId: string): Promise<DodoApiResult> {
  const key = getDodoApiKey();
  if (!key) return { ok: false, error: 'Dodo API key not configured (DODO_PAYMENTS_API_KEY or DODO_API_KEY)' };
  const base = dodoApiBase();
  const sid = subscriptionId.trim();
  const res = await fetch(`${base}/subscriptions/${encodeURIComponent(sid)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      status: 'cancelled',
      cancel_reason: 'cancelled_by_merchant',
    }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 800) };
  return { ok: true, status: res.status, body: text.slice(0, 400) };
}

export type CreateCheckoutInput = {
  productCart: Array<{ product_id: string; quantity: number }>;
  metadata?: Record<string, string>;
  customerEmail?: string | null;
  /** Display name from Supabase profile (or auth metadata). */
  customerName?: string | null;
  /**
   * When true, maps to Dodo `feature_flags.allow_customer_editing_email` / `name` = false
   * (same intent as “disableEmail” — customer cannot change prefilled email).
   */
  lockCustomerEmail?: boolean;
  returnUrl?: string | null;
  cancelUrl?: string | null;
};

export async function dodoCreateCheckoutSession(input: CreateCheckoutInput): Promise<{ checkoutUrl: string } | { error: string }> {
  try {
    const base = dodoApiBase();
    const body: Record<string, unknown> = {
      product_cart: input.productCart,
      metadata: input.metadata ?? {},
    };
    const em = input.customerEmail?.trim();
    if (em) {
      const displayName = (input.customerName?.trim() || em.split('@')[0] || 'Customer').slice(0, 200);
      body.customer = { email: em, name: displayName };
    }
    if (input.lockCustomerEmail) {
      body.feature_flags = {
        allow_customer_editing_email: false,
        allow_customer_editing_name: false,
      };
    }
    if (input.returnUrl) body.return_url = input.returnUrl;
    if (input.cancelUrl) body.cancel_url = input.cancelUrl;

    const res = await fetch(`${base}/checkouts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) return { error: text.slice(0, 600) || `HTTP ${res.status}` };
    const json = JSON.parse(text) as { checkout_url?: string | null };
    const url = json.checkout_url?.trim();
    if (!url) return { error: 'Missing checkout_url in Dodo response' };
    return { checkoutUrl: url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'checkout_failed' };
  }
}

export async function dodoCreateCustomerPortalSession(
  customerId: string,
  returnUrl?: string | null,
): Promise<{ link: string } | { error: string }> {
  try {
    const base = dodoApiBase();
    const qs = new URLSearchParams();
    if (returnUrl?.trim()) qs.set('return_url', returnUrl.trim());
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await fetch(
      `${base}/customers/${encodeURIComponent(customerId.trim())}/customer-portal/session${suffix}`,
      {
        method: 'POST',
        headers: authHeaders(),
      },
    );
    const text = await res.text();
    if (!res.ok) return { error: text.slice(0, 600) || `HTTP ${res.status}` };
    const json = JSON.parse(text) as { link?: string };
    const link = json.link?.trim();
    if (!link) return { error: 'Missing portal link in Dodo response' };
    return { link };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'portal_failed' };
  }
}
