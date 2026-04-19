import type { QuiloraProfileTier } from '../context/AppContext';

/** EP-02: paid Sage/Genesis, active paid subscription (Dodo), or explicit Bookworm plan confirmation. */
export function computeBillingGatePassed(params: {
  profileTier: QuiloraProfileTier;
  planSelectionCompleted: boolean;
  hasActivePaidSubscription: boolean;
}): boolean {
  if (params.profileTier === 'bibliophile' || params.profileTier === 'genesis') return true;
  if (params.hasActivePaidSubscription) return true;
  return params.planSelectionCompleted;
}
