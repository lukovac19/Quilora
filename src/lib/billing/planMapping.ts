import type { InternalPlanKey } from './types';
import type { QuiloraProfileTier } from '../../context/AppContext';

const PLAN_KEYS: readonly InternalPlanKey[] = [
  'bookworm_monthly',
  'bookworm_yearly',
  'sage_monthly',
  'sage_yearly',
  'genesis_lifetime',
  'boost_pack',
] as const;

export function isInternalPlanKey(value: string): value is InternalPlanKey {
  return (PLAN_KEYS as readonly string[]).includes(value);
}

/** Maps checkout plan keys to persisted profile tier (Sage → `bibliophile` in DB). */
export function tierFromPlanKey(planKey: InternalPlanKey): QuiloraProfileTier {
  if (planKey === 'genesis_lifetime') return 'genesis';
  if (planKey.startsWith('sage_')) return 'bibliophile';
  if (planKey === 'boost_pack') return 'bookworm';
  return 'bookworm';
}

export function isRecurringPlan(planKey: InternalPlanKey): boolean {
  return (
    planKey === 'bookworm_monthly' ||
    planKey === 'bookworm_yearly' ||
    planKey === 'sage_monthly' ||
    planKey === 'sage_yearly'
  );
}

export function isLifetimePlan(planKey: InternalPlanKey): boolean {
  return planKey === 'genesis_lifetime';
}
