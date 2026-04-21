import { BILLING_DODO_CHECKOUT_SESSION_PATH, QUILORA_EDGE_SLUG, quiloraEdgeGetJson, quiloraEdgePostJson } from './quiloraEdge';
import { markCheckoutFunnelEntered } from './prelaunchFlowFlag';
import { scheduleWebhookDelayWatchAfterCheckout } from './postCheckoutWebhookDelayWatch';
import { supabase } from './supabase';

function readClientEnv(...keys: string[]): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  for (const k of keys) {
    const v = env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

export type GenesisInventory = {
  genesis80: { sold: number; cap: number; remaining: number };
  genesis119: { sold: number; cap: number; remaining: number };
  genesis176: { sold: number; cap: number; remaining: number };
};

export type CheckoutProductKey =
  | 'bookworm_monthly'
  | 'bookworm_yearly'
  | 'sage_monthly'
  | 'sage_yearly'
  | 'lifetime_early_bird'
  | 'lifetime_standard'
  | 'lifetime_plus_sage'
  | 'boost_pack';

const PRODUCT_ENV_KEYS: Record<CheckoutProductKey, readonly string[]> = {
  bookworm_monthly: ['NEXT_PUBLIC_PRICE_ID_BOOKWORM_MONTHLY', 'VITE_DODO_PRODUCT_BOOKWORM_MONTHLY'],
  bookworm_yearly: ['NEXT_PUBLIC_PRICE_ID_BOOKWORM_YEARLY', 'VITE_DODO_PRODUCT_BOOKWORM_YEARLY'],
  sage_monthly: ['NEXT_PUBLIC_PRICE_ID_SAGE_MONTHLY', 'VITE_DODO_PRODUCT_BIBLIOPHILE_MONTHLY'],
  sage_yearly: ['NEXT_PUBLIC_PRICE_ID_SAGE_YEARLY', 'VITE_DODO_PRODUCT_BIBLIOPHILE_YEARLY'],
  lifetime_early_bird: ['NEXT_PUBLIC_PRICE_ID_LIFETIME_EARLY_BIRD', 'VITE_DODO_PRODUCT_GENESIS_80'],
  lifetime_standard: ['NEXT_PUBLIC_PRICE_ID_LIFETIME_STANDARD', 'VITE_DODO_PRODUCT_GENESIS_119'],
  lifetime_plus_sage: ['NEXT_PUBLIC_PRICE_ID_LIFETIME_PLUS_SAGE'],
  boost_pack: ['VITE_DODO_PRODUCT_BOOST_PACK'],
};

function productIdFor(product: CheckoutProductKey): string | null {
  const keys = PRODUCT_ENV_KEYS[product];
  const v = readClientEnv(...keys);
  return v || null;
}

/** Public Dodo product / price id for overlay checkout (from `NEXT_PUBLIC_PRICE_ID_*` or legacy `VITE_*`). */
export function getCheckoutProductId(product: CheckoutProductKey): string | null {
  return productIdFor(product);
}

/** Resolve Dodo product id from a checkout plan key (same mapping as `PRODUCT_ENV_KEYS`). For legacy POST bodies that send `planKey` instead of `productId`. */
export function productIdFromCheckoutPlanKey(planKey: string): string | null {
  const p = planKey.trim();
  if (!Object.prototype.hasOwnProperty.call(PRODUCT_ENV_KEYS, p)) return null;
  return productIdFor(p as CheckoutProductKey);
}

export function dodoCheckoutConfigured(): boolean {
  return Boolean(readClientEnv('NEXT_PUBLIC_PRICE_ID_BOOKWORM_MONTHLY', 'VITE_DODO_PRODUCT_BOOKWORM_MONTHLY'));
}

export function priceConfigured(product: CheckoutProductKey): boolean {
  return Boolean(productIdFor(product));
}

export async function fetchGenesisInventory(): Promise<GenesisInventory | null> {
  try {
    const data = await quiloraEdgeGetJson<{ inventory?: GenesisInventory }>(
      `${QUILORA_EDGE_SLUG}/billing/genesis-inventory`,
    );
    const inv = data.inventory;
    if (!inv) return null;
    return {
      genesis80: inv.genesis80,
      genesis119: inv.genesis119,
      genesis176: inv.genesis176 ?? { sold: 0, cap: 100_000, remaining: 100_000 },
    };
  } catch {
    return null;
  }
}

export function isEarlyBirdSoldOut(inventory: GenesisInventory | null): boolean {
  if (!inventory) return false;
  return inventory.genesis80.remaining <= 0;
}

export function isGenesisSoldOut(
  inventory: GenesisInventory | null,
  product: 'lifetime_early_bird' | 'lifetime_standard',
): boolean {
  if (!inventory) return false;
  const row = product === 'lifetime_early_bird' ? inventory.genesis80 : inventory.genesis119;
  return row.remaining <= 0;
}

export function lifetimeDealSeatsRemaining(inventory: GenesisInventory | null): number | null {
  if (!inventory) return null;
  return inventory.genesis80.remaining + inventory.genesis119.remaining;
}

export type CheckoutEligibility = {
  ok: boolean;
  error: string | null;
  userPlan: { plan: string; subscription_status: string | null; is_lifetime: boolean } | null;
};

export async function fetchCheckoutEligibility(productKind: string): Promise<CheckoutEligibility | null> {
  try {
    const { data: auth } = await supabase.auth.getSession();
    const bearer = auth.session?.access_token;
    if (!bearer) return null;
    return await quiloraEdgeGetJson<CheckoutEligibility>(
      `${QUILORA_EDGE_SLUG}/billing/dodo/checkout-eligibility?productKind=${encodeURIComponent(productKind)}`,
      bearer,
    );
  } catch {
    return null;
  }
}

export type OpenCheckoutResult =
  | { ok: true }
  | { ok: false; reason: 'no_dodo' | 'no_price' | 'sold_out' | 'checkout_error' | 'not_allowed'; message: string };

/**
 * Opens Dodo overlay checkout. Session is created on the server (API key never touches the browser).
 */
export async function openDodoCheckout(params: {
  product: CheckoutProductKey;
  userId: string;
  email?: string | null;
  onCheckoutCompleted?: (product: CheckoutProductKey) => void;
}): Promise<OpenCheckoutResult> {
  console.log('[debug] openDodoCheckout called:', {
    product: params.product,
    productId: productIdFor(params.product),
    envVars: {
      NEXT_PUBLIC_PRICE_ID_BOOKWORM_MONTHLY: import.meta.env.NEXT_PUBLIC_PRICE_ID_BOOKWORM_MONTHLY,
      VITE_DODO_PRODUCT_BOOKWORM_MONTHLY: import.meta.env.VITE_DODO_PRODUCT_BOOKWORM_MONTHLY,
    },
  });
  const productId = productIdFor(params.product);
  if (!dodoCheckoutConfigured()) {
    return {
      ok: false,
      reason: 'no_dodo',
      message: 'Checkout is not configured (set NEXT_PUBLIC_PRICE_ID_* or legacy VITE_DODO product IDs).',
    };
  }
  if (!productId) {
    return { ok: false, reason: 'no_price', message: 'Checkout is not configured (missing product ID for this plan).' };
  }

  const elig = await fetchCheckoutEligibility(params.product);
  if (elig && !elig.ok) {
    return {
      ok: false,
      reason: 'not_allowed',
      message:
        elig.error === 'DUPLICATE_BOOKWORM' || elig.error === 'DUPLICATE_SAGE' || elig.error === 'DUPLICATE_GENESIS'
          ? 'You already have an active plan for this checkout.'
          : elig.error || 'Checkout is not available for your account.',
    };
  }

  if (params.product === 'lifetime_early_bird' || params.product === 'lifetime_standard') {
    const inv = await fetchGenesisInventory();
    if (isGenesisSoldOut(inv, params.product)) {
      return { ok: false, reason: 'sold_out', message: 'This tier is sold out' };
    }
  }

  try {
    const { data: auth } = await supabase.auth.getSession();
    const bearer = auth.session?.access_token;
    if (!bearer) {
      return { ok: false, reason: 'checkout_error', message: 'Sign in to continue to checkout.' };
    }

    if (params.product === 'lifetime_early_bird' || params.product === 'lifetime_standard') {
      const invFinal = await fetchGenesisInventory();
      if (isGenesisSoldOut(invFinal, params.product)) {
        return {
          ok: false,
          reason: 'sold_out',
          message: 'That seat was just taken. Refresh the page and try again.',
        };
      }
    }

    console.log('[debug] productId being sent:', productId);
    const session = await quiloraEdgePostJson<{ checkoutUrl?: string; error?: string }>(
      BILLING_DODO_CHECKOUT_SESSION_PATH,
      bearer,
      { productId, productKind: params.product },
    );
    const checkoutUrl = session.checkoutUrl?.trim();
    if (!checkoutUrl) {
      return {
        ok: false,
        reason: 'checkout_error',
        message: session.error || 'Could not start checkout.',
      };
    }

    scheduleWebhookDelayWatchAfterCheckout(params.userId, params.product);
    params.onCheckoutCompleted?.(params.product);
    markCheckoutFunnelEntered();
    window.location.assign(checkoutUrl);

    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Checkout failed to open.';
    if (/DUPLICATE_|BLOCK_BW|CHECKOUT_NOT_ALLOWED/i.test(message)) {
      return {
        ok: false,
        reason: 'not_allowed',
        message: 'You already have an active plan or this checkout is not available for your account.',
      };
    }
    return { ok: false, reason: 'checkout_error', message };
  }
}
