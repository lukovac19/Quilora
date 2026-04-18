/**
 * Phase 7 — Communication & Promise Registry (Pre-Launch User Flow v4).
 * Single source of truth for in-product legal/marketing alignment.
 */

export type PromiseSection = {
  id: string;
  title: string;
  bullets: string[];
  tags?: string[];
};

export const PRELAUNCH_PROMISE_REGISTRY: PromiseSection[] = [
  {
    id: 'bookworm-free-forever',
    title: 'Promise: “Bookworm free forever” (Genesis)',
    tags: ['FIX #7', 'Genesis'],
    bullets: [
      'Scope: Genesis holders receive free access to the Bookworm feature set as it exists on public launch day.',
      'Does not guarantee: future features added exclusively to the Bookworm tier after launch.',
      'If Bookworm is sunset: Genesis holders retain equivalent feature access to the launch-day Bookworm set.',
      'Suggested user-facing copy: “Bookworm features, free for life — based on the launch-day feature set.”',
    ],
  },
  {
    id: 'fifty-percent-off',
    title: 'Promise: “50% off” (pre-launch subscriptions)',
    tags: ['Pricing decision'],
    bullets: [
      'Scope: 50% off standard pricing for the pre-launch window shown on the pricing page.',
      'Product decision: lock the dollar amounts shown at checkout ($3 / $8 Bookworm & Sage pre-launch, annual totals as displayed) for the life of that subscription while it remains active — not a perpetual “50%” percentage if list prices change.',
      'If standard prices change later, grandfathering follows the locked checkout amounts and Polar subscription products configured for that checkout.',
    ],
  },
  {
    id: 'ninety-day-refund',
    title: 'Promise: “90-day refund”',
    tags: ['FIX #3', 'EC-08'],
    bullets: [
      'Trigger: “Public launch” has not occurred — defined as pre-launch flags lifted and full canvas access enabled for all paid accounts (see `app_settings.public_launch` + product gates).',
      'Beta or soft launch does not satisfy the public-launch definition.',
      'Mechanism: automated Polar refunds where `POLAR_ACCESS_TOKEN` has refunds scope; legacy `txn_*` rows require manual support completion.',
      'Cron: `POST …/internal/cron/ninety-day-refund` (secured with `CRON_SECRET`).',
    ],
  },
  {
    id: 'twenty-percent-genesis',
    title: 'Promise: “20% lifetime discount” (Genesis on Sage+)',
    tags: ['FIX #5'],
    bullets: [
      'Scope: 20% off standard Sage (and future higher paid tiers) at each renewal, applied to the standard list price at the time of renewal.',
      'Example: standard Sage $16/mo → Genesis pays $12.80/mo; if Sage later becomes $20/mo → Genesis pays $16/mo.',
      'Flag: `profiles.genesis_lifetime_discount` is set true on Genesis activation for downstream renewal pricing logic.',
      'Checkout and confirmation emails should repeat this math explicitly.',
    ],
  },
  {
    id: 'billing-prelaunch',
    title: 'Promise: Billing during pre-launch',
    tags: ['PAY', 'AUTH'],
    bullets: [
      'Monthly: first period charged at the pre-launch rate at checkout — no “trial” that delays first payment.',
      'Annual: full year charged upfront at the discounted annual totals shown; renewal reverts to standard pricing after the first annual term as configured in Polar.',
      'LTD: one-time charge today; no recurring billing for the lifetime entitlement.',
      'LTD + Sage bundle: the live app may open sequential Polar checkouts until a single bundled price is configured — both paths are logged to `billing_transactions` for reconciliation.',
      'Credits and canvas: spendable credits may be shown during Phase 4 “holding”; full canvas unlock follows public launch (Phase 5).',
      '90-day guarantee: if public launch (as defined) has not occurred within 90 days of the cohort’s earliest `first_prelaunch_purchase_at`, refunds run per EC-08 automation + email `email_4_90_day_refund`.',
    ],
  },
  {
    id: 'email-schedule',
    title: 'Email schedule (registry)',
    tags: ['Comms'],
    bullets: [
      'Email 0: Supabase verification (immediate on sign-up) — AUTH-01.',
      'Email 1: Purchase confirmation + tier summary + refund policy — queued as `email_1_purchase_confirmation` from Edge after successful webhook handling.',
      'Email 1.5: Recovery — `email_1_5_recovery_setup` at ≥6h and ≥24h for orphan billing rows without a linked profile (EC-04).',
      'Email 2: Launch day — `email_2_launch_day` enqueued when `finalize_public_launch` succeeds.',
      'Email 3: Cancel confirmation — `email_3_cancel_confirmation` on pre-launch cancel paths.',
      'Email 4: 90-day policy — `email_4_90_day_refund` when the ninety-day cron fires.',
      'Support templates: `email_support_alert_unclaimed_payment`, `email_support_billing_refund_failed`, `email_support_billing_refund_manual`, `email_support_billing_cancel_failed`, `email_ec03_webhook_delay_support`.',
    ],
  },
];
