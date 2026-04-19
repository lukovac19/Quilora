import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { CREDIT_RULES, type CreditEventType, type QuiloraTier, TIER_LIMITS } from './billing_config.ts';

type LedgerResult = {
  ok: boolean;
  duplicate?: boolean;
  credit_balance?: number;
  error?: string;
  message?: string;
};

export async function applyCreditLedger(
  admin: SupabaseClient,
  input: {
    userId: string;
    eventType: CreditEventType;
    creditsDelta: number;
    sandboxId?: string | null;
    metadata?: Record<string, unknown>;
    idempotencyKey?: string | null;
  },
): Promise<LedgerResult> {
  const { data, error } = await admin.rpc('apply_credit_ledger', {
    p_user_id: input.userId,
    p_event_type: input.eventType,
    p_credits_delta: input.creditsDelta,
    p_sandbox_id: input.sandboxId ?? null,
    p_metadata: input.metadata ?? {},
    p_idempotency_key: input.idempotencyKey ?? null,
  });
  if (error) {
    console.error('apply_credit_ledger rpc error', error);
    throw error;
  }
  return (data ?? {}) as LedgerResult;
}

export async function chargeCredits(admin: SupabaseClient, input: {
  userId: string;
  amount: number;
  eventType: CreditEventType;
  idempotencyKey: string;
  sandboxId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (input.amount <= 0) throw new Error('INVALID_CHARGE_AMOUNT');
  const res = await applyCreditLedger(admin, {
    userId: input.userId,
    eventType: input.eventType,
    creditsDelta: -Math.abs(input.amount),
    sandboxId: input.sandboxId,
    metadata: input.metadata,
    idempotencyKey: input.idempotencyKey,
  });
  if (!res.ok && res.error === 'INSUFFICIENT_CREDITS') {
    throw new Error('INSUFFICIENT_CREDITS');
  }
  if (!res.ok) throw new Error(res.error ?? 'CREDIT_ERROR');
  return { balance: res.credit_balance ?? 0, duplicate: Boolean(res.duplicate) };
}

export async function grantCredits(admin: SupabaseClient, input: {
  userId: string;
  amount: number;
  eventType: CreditEventType;
  idempotencyKey: string;
  sandboxId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (input.amount <= 0) throw new Error('INVALID_GRANT_AMOUNT');
  const res = await applyCreditLedger(admin, {
    userId: input.userId,
    eventType: input.eventType,
    creditsDelta: Math.abs(input.amount),
    sandboxId: input.sandboxId,
    metadata: input.metadata,
    idempotencyKey: input.idempotencyKey,
  });
  if (!res.ok) throw new Error(res.error ?? 'CREDIT_ERROR');
  return { balance: res.credit_balance ?? 0, duplicate: Boolean(res.duplicate) };
}

export async function getProfile(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Record<string, unknown> | null;
}

export async function ensureBillingState(admin: SupabaseClient, userId: string) {
  const row = await getProfile(admin, userId);
  if (row) return row;
  return null;
}

export async function getLowBalanceStatus(admin: SupabaseClient, userId: string) {
  const row = await getProfile(admin, userId);
  const balance = Number(row?.credit_balance ?? 0);
  return {
    balance,
    threshold: CREDIT_RULES.lowBalanceThreshold,
    lowBalance: balance < CREDIT_RULES.lowBalanceThreshold,
  };
}

export async function getTierEntitlements(admin: SupabaseClient, userId: string) {
  const row = await getProfile(admin, userId);
  const tier = (row?.tier as QuiloraTier) ?? 'bookworm';
  return {
    tier,
    maxSandboxes: TIER_LIMITS[tier].maxSandboxes,
    monthlyCredits: TIER_LIMITS[tier].monthlyCredits,
    rolloverEnabled: tier === 'bibliophile',
    genesisBadge: Boolean(row?.genesis_badge),
    alphaLabAccess: Boolean(row?.alpha_lab_access),
    lowBalanceThreshold: CREDIT_RULES.lowBalanceThreshold,
  };
}

export async function setTier(admin: SupabaseClient, userId: string, tier: QuiloraTier) {
  const { error } = await admin.from('profiles').update({ tier, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw error;
  return getTierEntitlements(admin, userId);
}

export async function setPlanSelectionCompleted(admin: SupabaseClient, userId: string, completed = true) {
  await admin
    .from('profiles')
    .update({ plan_selection_completed: completed, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function markPrelaunchPurchaseProfile(admin: SupabaseClient, userId: string) {
  const row = await getProfile(admin, userId);
  const { data: launchRow } = await admin.from('app_settings').select('value').eq('key', 'public_launch').maybeSingle();
  const launched = Boolean((launchRow?.value as Record<string, unknown> | undefined)?.['complete']);
  const patch: Record<string, unknown> = {
    prelaunch_holding: !launched,
    updated_at: new Date().toISOString(),
  };
  const firstPurchase = (row as { first_prelaunch_purchase_at?: string } | null)?.first_prelaunch_purchase_at;
  if (!firstPurchase) {
    patch.first_prelaunch_purchase_at = new Date().toISOString();
  }
  await admin.from('profiles').update(patch).eq('id', userId);
}

/** Genesis purchase: tier, credits, badges, alpha — after slot reserved */
export async function applyGenesisPerks(
  admin: SupabaseClient,
  userId: string,
  sourceId: string,
  slotTier: 'genesis_80' | 'genesis_119' | 'genesis_176' = 'genesis_80',
) {
  const row = await getProfile(admin, userId);
  const bal = Number(row?.credit_balance ?? 0);
  const target = 15000;
  const delta = target - bal;
  const pricePoint = slotTier === 'genesis_119' ? '119' : slotTier === 'genesis_176' ? '176' : '80';

  await admin.from('profiles').update({
    tier: 'genesis',
    genesis_badge: true,
    alpha_lab_access: true,
    genesis_slot_price_point: pricePoint,
    genesis_lifetime_discount: true,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  if (delta !== 0) {
    await applyCreditLedger(admin, {
      userId,
      eventType: 'manual_adjustment',
      creditsDelta: delta,
      metadata: { genesis_activation: true, sourceId },
      idempotencyKey: `genesis_legacy_${sourceId}`,
    });
  }

  return getTierEntitlements(admin, userId);
}

/** Bookworm monthly: balance reset to 800 */
export async function applyBookwormMonthlyRenewal(admin: SupabaseClient, userId: string, idempotencyKey: string) {
  const row = await getProfile(admin, userId);
  const bal = Number(row?.credit_balance ?? 0);
  const delta = 800 - bal;
  return applyCreditLedger(admin, {
    userId,
    eventType: 'monthly_renewal',
    creditsDelta: delta,
    metadata: { tier: 'bookworm', mode: 'reset_to_800' },
    idempotencyKey,
  });
}

/** Bibliophile monthly: add 2500 rollover */
export async function applyBibliophileMonthlyRenewal(admin: SupabaseClient, userId: string, idempotencyKey: string) {
  return grantCredits(admin, {
    userId,
    amount: 2500,
    eventType: 'monthly_renewal',
    idempotencyKey,
    metadata: { tier: 'bibliophile', mode: 'add_2500' },
  });
}

export async function applyBookwormSandboxReadonly(admin: SupabaseClient, userId: string) {
  const { error } = await admin.rpc('apply_bookworm_readonly_overflow', { p_user_id: userId });
  if (error) console.warn('apply_bookworm_readonly_overflow', error);
}
