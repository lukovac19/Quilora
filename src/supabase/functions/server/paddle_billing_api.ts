/**
 * Paddle Billing API (server) — refunds (EC-04, EC-08), subscription cancel (EC-07).
 * Requires `PADDLE_API_KEY` (Bearer) with permission to create adjustments and cancel subscriptions.
 * @see https://developer.paddle.com/api-reference/adjustments/create-adjustment
 */

const PADDLE_API_BASE = 'https://api.paddle.com';

function normalizeTxnId(id: string): string {
  const t = id.trim();
  if (t.startsWith('txn_')) return t;
  return `txn_${t}`;
}

function normalizeSubId(id: string): string {
  const t = id.trim();
  if (t.startsWith('sub_')) return t;
  return `sub_${t}`;
}

export type PaddleApiResult =
  | { ok: true; status: number; body?: string }
  | { ok: false; status?: number; error: string };

/** Full refund for a completed transaction (grand total). */
export async function paddleCreateFullRefund(
  transactionId: string,
  reason: string,
): Promise<PaddleApiResult> {
  const key = Deno.env.get('PADDLE_API_KEY')?.trim();
  if (!key) return { ok: false, error: 'PADDLE_API_KEY not configured' };
  const tid = normalizeTxnId(transactionId);
  const res = await fetch(`${PADDLE_API_BASE}/adjustments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'refund',
      transaction_id: tid,
      reason,
      type: 'full',
    }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 800) };
  return { ok: true, status: res.status, body: text.slice(0, 400) };
}

/** Stop billing immediately (does not auto-refund unused time — pair with adjustment if needed). */
export async function paddleCancelSubscriptionImmediately(subscriptionId: string): Promise<PaddleApiResult> {
  const key = Deno.env.get('PADDLE_API_KEY')?.trim();
  if (!key) return { ok: false, error: 'PADDLE_API_KEY not configured' };
  const sid = normalizeSubId(subscriptionId);
  const res = await fetch(`${PADDLE_API_BASE}/subscriptions/${encodeURIComponent(sid)}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ effective_from: 'immediately' }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 800) };
  return { ok: true, status: res.status, body: text.slice(0, 400) };
}
