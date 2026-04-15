import type { Paddle, PaddleEventData } from '@paddle/paddle-js';
import { CheckoutEventNames, initializePaddle } from '@paddle/paddle-js';
import { QUILORA_EDGE_SLUG, quiloraEdgeGetJson, quiloraEdgePostJson } from './quiloraEdge';
import { scheduleWebhookDelayWatchAfterCheckout } from './postCheckoutWebhookDelayWatch';
import { supabase } from './supabase';

export type GenesisInventory = {
  genesis80: { sold: number; cap: number; remaining: number };
  genesis119: { sold: number; cap: number; remaining: number };
};

export type CheckoutProductKey =
  | 'bookworm_monthly'
  | 'bookworm_yearly'
  | 'bibliophile_monthly'
  | 'bibliophile_yearly'
  | 'genesis_80'
  | 'genesis_119'
  | 'boost_pack';

const PRICE_ENV_KEYS: Record<CheckoutProductKey, string> = {
  bookworm_monthly: 'VITE_PADDLE_PRICE_BOOKWORM_MONTHLY',
  bookworm_yearly: 'VITE_PADDLE_PRICE_BOOKWORM_YEARLY',
  bibliophile_monthly: 'VITE_PADDLE_PRICE_BIBLIOPHILE_MONTHLY',
  bibliophile_yearly: 'VITE_PADDLE_PRICE_BIBLIOPHILE_YEARLY',
  genesis_80: 'VITE_PADDLE_PRICE_GENESIS_80',
  genesis_119: 'VITE_PADDLE_PRICE_GENESIS_119',
  boost_pack: 'VITE_PADDLE_PRICE_BOOST_PACK',
};

function priceIdFor(product: CheckoutProductKey): string | null {
  const envName = PRICE_ENV_KEYS[product];
  const raw = (import.meta.env as Record<string, string | undefined>)[envName];
  const v = raw?.trim();
  return v || null;
}

export function paddleClientConfigured(): boolean {
  return Boolean((import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined)?.trim());
}

export function priceConfigured(product: CheckoutProductKey): boolean {
  return Boolean(priceIdFor(product));
}

let paddleSingleton: Promise<Paddle | null> | null = null;

/** Fired once per checkout when `checkout.completed` is received (Paddle overlay). */
let pendingOnCheckoutCompleted: ((product: CheckoutProductKey) => void) | undefined;

function isCheckoutProductKey(value: string): value is CheckoutProductKey {
  return (
    value === 'bookworm_monthly' ||
    value === 'bookworm_yearly' ||
    value === 'bibliophile_monthly' ||
    value === 'bibliophile_yearly' ||
    value === 'genesis_80' ||
    value === 'genesis_119' ||
    value === 'boost_pack'
  );
}

function paddleGlobalEventCallback(event: PaddleEventData): void {
  if (event.name !== CheckoutEventNames.CHECKOUT_COMPLETED) return;
  const raw = event.data?.custom_data;
  if (raw == null || typeof raw !== 'object') return;
  const o = raw as Record<string, unknown>;
  const pk =
    (typeof o.productKind === 'string' && o.productKind) ||
    (typeof o.product_kind === 'string' && o.product_kind) ||
    '';
  if (!pk || !isCheckoutProductKey(pk)) return;
  const cb = pendingOnCheckoutCompleted;
  pendingOnCheckoutCompleted = undefined;
  cb?.(pk);
  const uid = typeof o.userId === 'string' ? o.userId.trim() : '';
  if (uid) scheduleWebhookDelayWatchAfterCheckout(uid, pk);
}

async function getPaddle(): Promise<Paddle | null> {
  const token = (import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined)?.trim();
  if (!token) return null;
  if (!paddleSingleton) {
    const envSetting = import.meta.env.VITE_PADDLE_ENVIRONMENT as 'sandbox' | 'production' | undefined;
    const environment =
      envSetting ?? (token.startsWith('live_') ? 'production' : 'sandbox');
    paddleSingleton = initializePaddle({
      environment,
      token,
      eventCallback: paddleGlobalEventCallback,
    }).then((p) => p ?? null);
  }
  return paddleSingleton;
}

export async function fetchGenesisInventory(): Promise<GenesisInventory | null> {
  try {
    const data = await quiloraEdgeGetJson<{ inventory?: GenesisInventory }>(
      `${QUILORA_EDGE_SLUG}/billing/genesis-inventory`,
    );
    return data.inventory ?? null;
  } catch {
    return null;
  }
}

export function isGenesisSoldOut(
  inventory: GenesisInventory | null,
  product: 'genesis_80' | 'genesis_119',
): boolean {
  if (!inventory) return false;
  const row = product === 'genesis_80' ? inventory.genesis80 : inventory.genesis119;
  return row.remaining <= 0;
}

/** Remaining Lifetime Deal seats from DB-backed inventory (both tiers). */
export function lifetimeDealSeatsRemaining(inventory: GenesisInventory | null): number | null {
  if (!inventory) return null;
  return inventory.genesis80.remaining + inventory.genesis119.remaining;
}

export type OpenCheckoutResult = { ok: true } | { ok: false; reason: 'no_paddle' | 'no_price' | 'sold_out' | 'paddle_error'; message: string };

/**
 * Opens Paddle overlay checkout when client token and price ID env vars are set.
 * Passes custom_data expected by the Edge webhook (`userId`, `productKind`, `tier` where relevant).
 */
export async function openPaddleCheckout(params: {
  product: CheckoutProductKey;
  userId: string;
  email?: string | null;
  /** Invoked when Paddle emits `checkout.completed` for this checkout (same tab). */
  onCheckoutCompleted?: (product: CheckoutProductKey) => void;
}): Promise<OpenCheckoutResult> {
  const priceId = priceIdFor(params.product);
  if (!paddleClientConfigured()) {
    return { ok: false, reason: 'no_paddle', message: 'Checkout is not configured (missing client token).' };
  }
  if (!priceId) {
    return { ok: false, reason: 'no_price', message: 'Checkout is not configured (missing price ID for this product).' };
  }

  if (params.product === 'genesis_80' || params.product === 'genesis_119') {
    const inv = await fetchGenesisInventory();
    if (isGenesisSoldOut(inv, params.product)) {
      return { ok: false, reason: 'sold_out', message: 'This tier is sold out' };
    }
  }

  const paddle = await getPaddle();
  if (!paddle?.Checkout?.open) {
    return { ok: false, reason: 'paddle_error', message: 'Could not initialize Paddle checkout.' };
  }

  const productKind: string = params.product;
  let tier: string | undefined;
  if (params.product.startsWith('bookworm')) tier = 'bookworm';
  if (params.product.startsWith('bibliophile')) tier = 'bibliophile';

  const customData: Record<string, string> = {
    userId: params.userId,
    productKind,
  };
  if (tier) customData.tier = tier;

  try {
    const { data: auth } = await supabase.auth.getSession();
    const bearer = auth.session?.access_token;
    const em = params.email?.trim();
    if (bearer && em) {
      try {
        const pt = await quiloraEdgePostJson<{ passthroughToken?: string }>(
          `${QUILORA_EDGE_SLUG}/billing/checkout-passthrough`,
          bearer,
          { expectedCheckoutEmail: em },
        );
        if (pt.passthroughToken) customData.passthroughToken = pt.passthroughToken;
      } catch {
        /* passthrough optional if edge unreachable */
      }
    }
  } catch {
    /* ignore auth for passthrough */
  }

  try {
    /** EP-02 race-condition-handler: re-check Genesis inventory immediately before opening checkout. */
    if (params.product === 'genesis_80' || params.product === 'genesis_119') {
      const invFinal = await fetchGenesisInventory();
      if (isGenesisSoldOut(invFinal, params.product)) {
        return {
          ok: false,
          reason: 'sold_out',
          message: 'That Genesis slot was just taken. Refresh the page and try again.',
        };
      }
    }
    pendingOnCheckoutCompleted = params.onCheckoutCompleted;
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: params.email ? { email: params.email } : undefined,
      customData,
      settings: { displayMode: 'overlay', theme: 'dark', locale: 'en' },
    });
    return { ok: true };
  } catch (e: unknown) {
    pendingOnCheckoutCompleted = undefined;
    const message = e instanceof Error ? e.message : 'Checkout failed to open.';
    return { ok: false, reason: 'paddle_error', message };
  }
}
