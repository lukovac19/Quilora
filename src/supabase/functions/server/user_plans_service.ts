import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export type BillingUserPlan =
  | 'free'
  | 'bookworm'
  | 'sage'
  | 'lifetime_early'
  | 'lifetime_standard'
  | 'lifetime_plus_sage';

export function billingUserPlanFromProductKind(productKind: string): BillingUserPlan | null {
  if (productKind.startsWith('bookworm')) return 'bookworm';
  if (productKind.startsWith('bibliophile') || productKind.startsWith('sage_')) return 'sage';
  if (productKind === 'lifetime_early_bird' || productKind === 'genesis_80') return 'lifetime_early';
  if (productKind === 'lifetime_standard' || productKind === 'genesis_119') return 'lifetime_standard';
  if (productKind === 'lifetime_plus_sage') return 'lifetime_plus_sage';
  return null;
}

export async function upsertUserPlan(
  admin: SupabaseClient,
  input: {
    userId: string;
    plan: BillingUserPlan;
    subscriptionId?: string | null;
    subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | null;
    subscriptionPeriodEnd?: string | null;
    tokenBalance?: number | null;
    tokensPerCycle?: number | null;
    isLifetime?: boolean | null;
    genesisSeatNumber?: number | null;
  },
) {
  const row = {
    user_id: input.userId,
    plan: input.plan,
    subscription_id: input.subscriptionId ?? null,
    subscription_status: input.subscriptionStatus ?? null,
    subscription_period_end: input.subscriptionPeriodEnd ?? null,
    token_balance: input.tokenBalance ?? 0,
    tokens_per_cycle: input.tokensPerCycle ?? 0,
    is_lifetime: input.isLifetime ?? false,
    genesis_seat_number: input.genesisSeatNumber ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from('user_plans').upsert(row, { onConflict: 'user_id' });
  if (error) console.error('upsertUserPlan', error);
}

export async function syncUserPlanTokenBalanceFromProfile(admin: SupabaseClient, userId: string) {
  const { data: prof } = await admin.from('profiles').select('token_balance').eq('id', userId).maybeSingle();
  const tb = Number((prof as { token_balance?: number } | null)?.token_balance ?? 0);
  await admin.from('user_plans').update({ token_balance: tb, updated_at: new Date().toISOString() }).eq('user_id', userId);
}
