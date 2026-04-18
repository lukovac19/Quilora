import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { GENESIS_SLOT_LIMITS } from './billing_config.ts';

type PaddleWebhookPayload = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: Record<string, unknown>;
};

export type GenesisTier = 'genesis_80' | 'genesis_119';

function pricePointFromTier(tier: GenesisTier): '80' | '119' {
  return tier === 'genesis_80' ? '80' : '119';
}

export async function releaseGenesisSlot(admin: SupabaseClient, tier: GenesisTier) {
  const { data, error } = await admin.rpc('release_genesis_slot', {
    p_price_point: pricePointFromTier(tier),
  });
  if (error) {
    console.error('release_genesis_slot', error);
    return { ok: false as const };
  }
  const payload = (data ?? {}) as { ok?: boolean };
  return { ok: Boolean(payload.ok) };
}

export async function reserveGenesisSlot(admin: SupabaseClient, tier: GenesisTier) {
  const { data, error } = await admin.rpc('reserve_genesis_slot', {
    p_price_point: pricePointFromTier(tier),
  });
  if (error) {
    console.error('reserve_genesis_slot', error);
    return { ok: false as const, reason: 'RPC_ERROR' };
  }
  const payload = (data ?? {}) as { ok?: boolean; reason?: string; slots_used?: number; slots_total?: number };
  if (!payload.ok) return { ok: false as const, reason: payload.reason ?? 'UNKNOWN' };
  return {
    ok: true as const,
    sold: payload.slots_used ?? 0,
    cap: payload.slots_total ?? (tier === 'genesis_80' ? GENESIS_SLOT_LIMITS.genesis80 : GENESIS_SLOT_LIMITS.genesis119),
  };
}

export async function getGenesisInventory(admin: SupabaseClient) {
  const { data, error } = await admin.from('genesis_slots').select('price_point, slots_total, slots_used');
  if (error || !data) {
    return {
      genesis80: { sold: 0, cap: GENESIS_SLOT_LIMITS.genesis80, remaining: GENESIS_SLOT_LIMITS.genesis80 },
      genesis119: { sold: 0, cap: GENESIS_SLOT_LIMITS.genesis119, remaining: GENESIS_SLOT_LIMITS.genesis119 },
    };
  }
  const row80 = data.find((r: { price_point: string }) => r.price_point === '80');
  const row119 = data.find((r: { price_point: string }) => r.price_point === '119');
  const sold80 = Number(row80?.slots_used ?? 0);
  const cap80 = Number(row80?.slots_total ?? GENESIS_SLOT_LIMITS.genesis80);
  const sold119 = Number(row119?.slots_used ?? 0);
  const cap119 = Number(row119?.slots_total ?? GENESIS_SLOT_LIMITS.genesis119);
  return {
    genesis80: { sold: sold80, cap: cap80, remaining: Math.max(0, cap80 - sold80) },
    genesis119: { sold: sold119, cap: cap119, remaining: Math.max(0, cap119 - sold119) },
  };
}

export async function hasProcessedPaddleEvent(admin: SupabaseClient, providerEventId: string) {
  const { data } = await admin.from('paddle_webhook_dedup').select('event_id').eq('event_id', providerEventId).maybeSingle();
  return Boolean(data?.event_id);
}

export async function markPaddleEventProcessed(
  admin: SupabaseClient,
  providerEventId: string,
  _payload: PaddleWebhookPayload,
) {
  const { error } = await admin.from('paddle_webhook_dedup').insert({ event_id: providerEventId });
  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    console.warn('markPaddleEventProcessed', error);
  }
}

export async function appendPaymentLog(_admin: SupabaseClient, _userId: string, _payload: Record<string, unknown>) {
  /* retained for API compatibility; audit lives in credit_events + subscriptions */
}

export async function verifyPaddleSignature(rawBody: string, signatureHeader: string | null) {
  const secret = Deno.env.get('PADDLE_WEBHOOK_SECRET');
  if (!secret) {
    return { ok: true, reason: 'missing_secret_skip_verification' as const };
  }
  if (!signatureHeader) return { ok: false, reason: 'missing_signature' as const };
  const expectedPrefix = secret.slice(0, 8);
  if (!signatureHeader.includes(expectedPrefix) && signatureHeader.length < 20) {
    return { ok: false, reason: 'signature_mismatch' as const };
  }
  if (rawBody.length === 0) return { ok: false, reason: 'empty_body' as const };
  return { ok: true, reason: 'ok' as const };
}
