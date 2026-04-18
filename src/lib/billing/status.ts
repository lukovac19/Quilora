import type { QuiloraProfileTier } from '../../context/AppContext';
import { isInternalPlanKey } from './planMapping';
import { subscriptionRowGrantsPaidSeat } from './effectiveBillingState';
import type { InternalPlanKey, SubscriptionLifecycleStatus } from './types';

export { isLifetimePlan, tierFromPlanKey as resolveTierFromPlanKey } from './planMapping';

/** Shape returned by Edge `GET …/billing/me` (subset used client-side). */
export type BillingMePayload = {
  currentPlanKey?: string | null;
  tier?: string;
  provider?: string;
  isLifetime?: boolean;
  subscriptionStatus?: string | null;
  activeAccess?: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  canManageBilling?: boolean;
  subscription?: {
    status?: string | null;
    cancel_at_period_end?: boolean | null;
    current_period_end?: string | null;
    is_lifetime?: boolean | null;
    internal_plan_key?: string | null;
    billing_provider?: string | null;
  } | null;
};

export type NormalizedBillingState = {
  currentPlanKey: InternalPlanKey | null;
  tier: QuiloraProfileTier;
  provider: string;
  isLifetime: boolean;
  subscriptionStatus: SubscriptionLifecycleStatus | null;
  activeAccess: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  canManageBilling: boolean;
};

export function isBillingAccessActive(state: Pick<NormalizedBillingState, 'activeAccess'>): boolean {
  return Boolean(state.activeAccess);
}

export function normalizeBillingState(me: BillingMePayload | null | undefined): NormalizedBillingState | null {
  if (!me) return null;
  const rawKey = me.currentPlanKey ?? me.subscription?.internal_plan_key ?? null;
  const currentPlanKey = rawKey && isInternalPlanKey(rawKey) ? rawKey : null;
  const tierRaw = String(me.tier ?? 'bookworm');
  const tier: QuiloraProfileTier =
    tierRaw === 'bibliophile' || tierRaw === 'genesis' ? tierRaw : 'bookworm';
  const sub = me.subscription ?? null;
  const activeAccess =
    typeof me.activeAccess === 'boolean'
      ? me.activeAccess
      : sub
        ? subscriptionRowGrantsPaidSeat({
            status: sub.status as string,
            cancel_at_period_end: sub.cancel_at_period_end as boolean | null,
            current_period_end: sub.current_period_end as string | null,
            is_lifetime: sub.is_lifetime as boolean | null,
          })
        : false;
  const st = (me.subscriptionStatus ?? sub?.status ?? null) as string | null;
  const subscriptionStatus =
    st === 'active' || st === 'cancelled' || st === 'past_due' || st === 'incomplete' || st === 'unpaid' ? st : null;
  return {
    currentPlanKey,
    tier,
    provider: String(me.provider ?? 'unknown'),
    isLifetime: Boolean(me.isLifetime ?? sub?.is_lifetime),
    subscriptionStatus,
    activeAccess,
    cancelAtPeriodEnd: Boolean(me.cancelAtPeriodEnd ?? sub?.cancel_at_period_end),
    currentPeriodEnd: (me.currentPeriodEnd ?? sub?.current_period_end ?? null) as string | null,
    canManageBilling: Boolean(me.canManageBilling),
  };
}
