import type { QuiloraProfileTier } from '../../context/AppContext';
import { isInternalPlanKey } from './planMapping';
import type { EffectiveBillingState, InternalPlanKey, SubscriptionLifecycleStatus } from './types';

type SubscriptionRow = {
  status?: string | null;
  cancel_at_period_end?: boolean | null;
  current_period_end?: string | null;
  is_lifetime?: boolean | null;
  internal_plan_key?: string | null;
  billing_provider?: string | null;
} | null;

function asLifecycleStatus(raw: string | null | undefined): SubscriptionLifecycleStatus | null {
  if (!raw) return null;
  if (raw === 'active' || raw === 'cancelled' || raw === 'past_due' || raw === 'incomplete' || raw === 'unpaid') {
    return raw;
  }
  return null;
}

/**
 * Single source of truth for “does billing data show an entitled paid seat?”
 * Used with profile tier + plan_selection_completed inside `computeBillingGatePassed`.
 */
export function subscriptionRowGrantsPaidSeat(row: NonNullable<SubscriptionRow>): boolean {
  const st = row.status ?? '';
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  const now = Date.now();
  if (row.is_lifetime && st === 'active') return true;
  if (st === 'active' || st === 'past_due') return true;
  if (st === 'cancelled' && row.cancel_at_period_end && end !== null && !Number.isNaN(end) && end > now) return true;
  return false;
}

export function getEffectiveBillingState(params: {
  profileTier: QuiloraProfileTier;
  planSelectionCompleted: boolean;
  subscription: SubscriptionRow;
}): EffectiveBillingState {
  const sub = params.subscription;
  const tier = params.profileTier;
  const planKey = sub?.internal_plan_key && isInternalPlanKey(sub.internal_plan_key) ? sub.internal_plan_key : null;
  const bp = sub?.billing_provider === 'polar' || sub?.billing_provider === 'legacy_checkout' ? sub.billing_provider : 'unknown';
  const portalAvailable = bp === 'polar';

  return {
    internalPlanKey: planKey,
    tier,
    subscriptionStatus: asLifecycleStatus(sub?.status ?? null),
    isLifetime: Boolean(sub?.is_lifetime),
    cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    currentPeriodEnd: sub?.current_period_end ?? null,
    billingProvider: bp,
    portalAvailable,
  };
}
