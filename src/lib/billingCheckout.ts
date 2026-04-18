import { quiloraPublicAppUrl } from './billing/polar';
// Checkout redirect URLs are derived from `quiloraPublicAppUrl()` → TODO_APP_URL (`VITE_APP_URL`).
import type { InternalPlanKey } from './billing/types';
import { QUILORA_EDGE_SLUG, quiloraEdgeGetJson, quiloraEdgePostJson } from './quiloraEdge';
import { scheduleWebhookDelayWatchAfterCheckout } from './postCheckoutWebhookDelayWatch';
import { supabase } from './supabase';

export type GenesisInventory = {
  genesis80: { sold: number; cap: number; remaining: number };
  genesis119: { sold: number; cap: number; remaining: number };
};

const AFTER_CHECKOUT_NAV_KEY = 'quilora_after_checkout_nav';

/** When set, after a successful Genesis checkout we immediately start this plan checkout (bundle: LTD + Sage year). */
export const POLAR_POST_GENESIS_PLAN_KEY = 'quilora_post_genesis_plan_key';

export async function fetchGenesisInventory(): Promise<GenesisInventory | null> {
  try {
    const data = await quiloraEdgeGetJson<{ inventory?: GenesisInventory }>(`${QUILORA_EDGE_SLUG}/billing/genesis-inventory`);
    return data.inventory ?? null;
  } catch {
    return null;
  }
}

export function isGenesisSoldOut(inventory: GenesisInventory | null, slot: '80' | '119' | 'genesis_80' | 'genesis_119'): boolean {
  if (!inventory) return false;
  const normalized = slot === 'genesis_80' || slot === '80' ? '80' : '119';
  const row = normalized === '80' ? inventory.genesis80 : inventory.genesis119;
  return row.remaining <= 0;
}

export function lifetimeDealSeatsRemaining(inventory: GenesisInventory | null): number | null {
  if (!inventory) return null;
  return inventory.genesis80.remaining + inventory.genesis119.remaining;
}

export type OpenCheckoutResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'network' | 'sold_out'; message: string };

export type PlanCheckoutParams = {
  planKey: InternalPlanKey;
  userId: string;
  email: string;
  /** Where to navigate after successful return + sync (default `/onboarding`). */
  afterSuccessNavigate?: string;
  genesisSlotPricePoint?: '80' | '119' | null;
};

/**
 * Server-created Polar checkout (redirect). Never uses organization tokens on the client.
 */
export async function openPlanCheckout(params: PlanCheckoutParams): Promise<OpenCheckoutResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, reason: 'not_configured', message: 'Please sign in to continue.' };
  }
  if (!params.email?.trim()) {
    return { ok: false, reason: 'not_configured', message: 'Missing email for checkout.' };
  }

  if (params.planKey === 'genesis_lifetime') {
    const inv = await fetchGenesisInventory();
    const slot = params.genesisSlotPricePoint === '119' ? '119' : '80';
    if (isGenesisSoldOut(inv, slot)) {
      return { ok: false, reason: 'sold_out', message: 'That Genesis tier is sold out.' };
    }
  }

  const appUrl = quiloraPublicAppUrl(); // TODO_APP_URL
  // Polar success redirect — `{CHECKOUT_ID}` is substituted by Polar at redirect time.
  const successUrl = `${appUrl}/billing/success?checkout_id={CHECKOUT_ID}`;
  const returnUrl = `${appUrl}/pricing?checkout=cancelled`;

  try {
    const nav = params.afterSuccessNavigate ?? '/onboarding';
    try {
      sessionStorage.setItem(AFTER_CHECKOUT_NAV_KEY, nav);
    } catch {
      /* ignore */
    }
    const data = await quiloraEdgePostJson<{ checkoutUrl?: string; error?: string }>(
      `${QUILORA_EDGE_SLUG}/billing/create-checkout-session`,
      token,
      {
        planKey: params.planKey,
        userId: params.userId,
        userEmail: params.email.trim(),
        successUrl,
        returnUrl,
        genesisSlotPricePoint: params.genesisSlotPricePoint ?? null,
      },
    );
    if (data.error || !data.checkoutUrl) {
      return {
        ok: false,
        reason: 'network',
        message: data.error ?? 'Could not start checkout.',
      };
    }
    scheduleWebhookDelayWatchAfterCheckout(params.userId, params.planKey);
    window.location.href = data.checkoutUrl;
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Checkout request failed.';
    return { ok: false, reason: 'network', message };
  }
}

/** Polar checkout is always server-configured; “not configured” is returned as a failed openPlanCheckout result. */
export function polarCheckoutConfigured(): boolean {
  return true;
}

export function priceConfigured(_planKey: InternalPlanKey): boolean {
  return true;
}
