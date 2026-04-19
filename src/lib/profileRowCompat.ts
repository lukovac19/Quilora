/**
 * Maps `profiles` rows from different DB eras into one shape.
 * Live projects may have Quilora migrations (full_name, plan_selection_completed, …)
 * or an older schema (display_name, credits, genesis, plan_selection).
 */
export type NormalizedProfile = {
  full_name: string | null;
  email: string | null;
  tier: string | null;
  credit_balance: number;
  streak_count: number;
  streak_goal: number;
  avatar_url: string | null;
  genesis_badge: boolean;
  plan_selection_completed: boolean;
};

export function normalizeProfileRow(raw: Record<string, unknown> | null | undefined): NormalizedProfile | null {
  if (!raw) return null;
  const fullName = (raw.full_name ?? raw.display_name) as string | null | undefined;
  const creditRaw = raw.credit_balance ?? raw.credits;
  const planSel = raw.plan_selection;
  const explicitDone = Boolean(raw.plan_selection_completed);
  const legacyDone =
    typeof planSel === 'string' && planSel.trim().length > 0 && planSel.trim().toLowerCase() !== 'pending';

  return {
    full_name: fullName ?? null,
    email: (raw.email as string | null | undefined) ?? null,
    tier: (raw.tier as string | null | undefined) ?? null,
    credit_balance: Number(creditRaw ?? 0),
    streak_count: Number(raw.streak_count ?? 0),
    streak_goal: Number(raw.streak_goal ?? 1),
    avatar_url: (raw.avatar_url as string | null | undefined) ?? null,
    genesis_badge: Boolean(raw.genesis_badge ?? raw.genesis ?? false),
    plan_selection_completed: explicitDone || legacyDone,
  };
}

/** When `public.subscriptions` is missing (404 / PGRST205), infer paid status from `user_plans`. */
export function paidFromUserPlansRow(row: {
  plan?: string | null;
  subscription_status?: string | null;
  is_lifetime?: boolean | null;
}): boolean {
  if (row.is_lifetime) return true;
  const plan = row.plan?.trim();
  if (!plan || plan === 'free') return false;
  return row.subscription_status === 'active';
}
