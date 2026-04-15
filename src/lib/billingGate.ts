import type { QuiloraProfileTier } from '../context/AppContext';

/** EP-02: paid Sage/Genesis, active Paddle subscription, or explicit Bookworm plan confirmation. */
export function computeBillingGatePassed(params: {
  profileTier: QuiloraProfileTier;
  planSelectionCompleted: boolean;
  hasActivePaddleSubscription: boolean;
}): boolean {
  if (params.profileTier === 'bibliophile' || params.profileTier === 'genesis') return true;
  if (params.hasActivePaddleSubscription) return true;
  return params.planSelectionCompleted;
}
