import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { GENESIS_SLOT_LIMITS } from './billing_config.ts';

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
