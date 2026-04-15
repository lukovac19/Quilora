import type { QuiloraProfileTier } from '../context/AppContext';

/** Monthly credit pools by server tier (matches PaymentTerms / marketing copy). */
export const MONTHLY_CREDIT_ALLOCATION: Record<QuiloraProfileTier, number> = {
  bookworm: 800,
  bibliophile: 2500,
  genesis: 15000,
};

export function monthlyCreditsForProfile(tier: QuiloraProfileTier | undefined): number {
  const k = tier ?? 'bookworm';
  return MONTHLY_CREDIT_ALLOCATION[k] ?? 800;
}

export function hasRolloverCredits(tier: QuiloraProfileTier | undefined): boolean {
  return tier === 'bibliophile' || tier === 'genesis';
}
