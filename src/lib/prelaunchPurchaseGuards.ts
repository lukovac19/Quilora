import type { User } from '../context/AppContext';

export type PrelaunchCheckoutIntent = 'bookworm' | 'sage' | 'genesis';

function tierLabel(user: User): string {
  const t = user.profileTier ?? 'bookworm';
  if (t === 'genesis') return 'Genesis';
  if (t === 'bibliophile') return 'Sage';
  return 'Bookworm';
}

/** Block duplicate or conflicting pre-launch purchases before opening Paddle (flow v4 — duplicate purchase guard). */
export function assertPrelaunchCheckoutAllowed(
  user: User,
  intent: PrelaunchCheckoutIntent,
): { ok: true } | { ok: false; message: string } {
  const tier = user.profileTier ?? 'bookworm';

  if (intent === 'genesis') {
    if (tier === 'genesis') {
      return { ok: false, message: 'You already own a Genesis seat.' };
    }
    return { ok: true };
  }

  if (intent === 'bookworm') {
    if (tier === 'genesis') {
      return {
        ok: false,
        message: `You already have a ${tierLabel(user)} plan. Open your account dashboard to manage upgrades or add-ons.`,
      };
    }
    if (tier === 'bibliophile') {
      return {
        ok: false,
        message:
          'You already have a Sage plan. Use Lifetime Deal or account billing if you want to change tiers.',
      };
    }
    if (tier === 'bookworm' && user.billingGatePassed) {
      return {
        ok: false,
        message:
          'You already have a Bookworm plan. Want to upgrade instead? Use Upgrade to Sage or Lifetime Deal from your pre-launch dashboard.',
      };
    }
    return { ok: true };
  }

  if (intent === 'sage') {
    if (tier === 'genesis') {
      return {
        ok: false,
        message: `You already have a ${tierLabel(user)} plan. Open your account dashboard to manage upgrades.`,
      };
    }
    if (tier === 'bibliophile' && user.billingGatePassed) {
      return {
        ok: false,
        message:
          'You already have a Sage plan. Want to upgrade instead? Use Lifetime Deal from your pre-launch dashboard.',
      };
    }
    return { ok: true };
  }

  return { ok: true };
}
