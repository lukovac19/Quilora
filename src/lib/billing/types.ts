import type { QuiloraProfileTier } from '../../context/AppContext';

/** Polar-backed catalog keys (monthly/yearly are separate Polar products). */
export type InternalPlanKey =
  | 'bookworm_monthly'
  | 'bookworm_yearly'
  | 'sage_monthly'
  | 'sage_yearly'
  | 'genesis_lifetime'
  | 'boost_pack';

export type SubscriptionLifecycleStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'incomplete'
  | 'unpaid';

export type EffectiveBillingState = {
  internalPlanKey: InternalPlanKey | null;
  tier: QuiloraProfileTier;
  subscriptionStatus: SubscriptionLifecycleStatus | null;
  isLifetime: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  billingProvider: 'polar' | 'legacy_checkout' | 'unknown';
  portalAvailable: boolean;
};
