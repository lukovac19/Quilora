export type PolarPlanKey =
  | 'bookworm_monthly'
  | 'bookworm_yearly'
  | 'sage_monthly'
  | 'sage_yearly'
  | 'genesis_lifetime'
  | 'boost_pack';

const KEYS: readonly PolarPlanKey[] = [
  'bookworm_monthly',
  'bookworm_yearly',
  'sage_monthly',
  'sage_yearly',
  'genesis_lifetime',
  'boost_pack',
] as const;

const ENV_BY_PLAN: Record<PolarPlanKey, string> = {
  bookworm_monthly: 'POLAR_PRODUCT_BOOKWORM_MONTHLY',
  bookworm_yearly: 'POLAR_PRODUCT_BOOKWORM_YEARLY',
  sage_monthly: 'POLAR_PRODUCT_SAGE_MONTHLY',
  sage_yearly: 'POLAR_PRODUCT_SAGE_YEARLY',
  genesis_lifetime: 'POLAR_PRODUCT_GENESIS_LIFETIME',
  boost_pack: 'POLAR_PRODUCT_BOOST_PACK',
};

export function isPolarPlanKey(value: string): value is PolarPlanKey {
  return (KEYS as readonly string[]).includes(value);
}

export function polarProductIdForPlan(planKey: PolarPlanKey): string | null {
  const name = ENV_BY_PLAN[planKey];
  const v = Deno.env.get(name)?.trim();
  return v || null;
}

export function planKeyFromPolarProductId(productId: string): PolarPlanKey | null {
  for (const k of KEYS) {
    if (polarProductIdForPlan(k) === productId) return k;
  }
  return null;
}
