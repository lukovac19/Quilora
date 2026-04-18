import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { Webhook } from 'npm:standardwebhooks@1.0.2';
import { CREDIT_RULES, type QuiloraTier } from './billing_config.ts';
import {
  applyBibliophileMonthlyRenewal,
  applyBookwormMonthlyRenewal,
  applyBookwormSandboxReadonly,
  applyGenesisPerks,
  getLowBalanceStatus,
  getProfile,
  getTierEntitlements,
  grantCredits,
  markPrelaunchPurchaseProfile,
  setPlanSelectionCompleted,
  setTier,
} from './credit_service.ts';
import { reserveGenesisSlot, type GenesisTier } from './genesis_inventory_service.ts';
import { polarApiJson } from './polar_api.ts';
import { isPolarPlanKey, planKeyFromPolarProductId, polarProductIdForPlan, type PolarPlanKey } from './polar_plan.ts';

function readString(obj: Record<string, unknown> | null | undefined, key: string): string | null {
  const v = obj?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function tierFromPlanKey(planKey: PolarPlanKey): QuiloraTier {
  if (planKey === 'genesis_lifetime') return 'genesis';
  if (planKey.startsWith('sage_')) return 'bibliophile';
  return 'bookworm';
}

export function mapPolarSubscriptionStatus(raw: string | null | undefined): 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'unpaid' {
  const s = (raw ?? '').toLowerCase();
  if (s === 'active' || s === 'trialing') return 'active';
  if (s === 'past_due') return 'past_due';
  if (s === 'incomplete' || s === 'incomplete_expired') return 'incomplete';
  if (s === 'unpaid') return 'unpaid';
  if (s === 'revoked') return 'cancelled';
  if (s === 'canceled' || s === 'cancelled') return 'cancelled';
  return 'cancelled';
}

export function verifyPolarWebhook(rawBody: string, headers: Headers): Record<string, unknown> {
  // TODO_POLAR_WEBHOOK_SECRET — Polar webhook endpoint signing secret → Supabase Edge secret POLAR_WEBHOOK_SECRET
  const secret = Deno.env.get('POLAR_WEBHOOK_SECRET')?.trim();
  if (!secret) throw new Error('POLAR_WEBHOOK_SECRET missing');
  const wh = new Webhook(secret);
  const verified = wh.verify(rawBody, {
    'webhook-id': headers.get('webhook-id') ?? '',
    'webhook-timestamp': headers.get('webhook-timestamp') ?? '',
    'webhook-signature': headers.get('webhook-signature') ?? '',
  });
  const text = typeof verified === 'string' ? verified : new TextDecoder().decode(verified as ArrayBuffer);
  return JSON.parse(text) as Record<string, unknown>;
}

function polarEventId(body: Record<string, unknown>): string {
  return readString(body, 'id') ?? readString(body, 'timestamp') ?? `polar_${crypto.randomUUID()}`;
}

export async function markPolarEventStart(admin: SupabaseClient, polarEventId: string, eventType: string): Promise<boolean> {
  const { error } = await admin.from('polar_webhook_events').insert({
    polar_event_id: polarEventId,
    event_type: eventType,
  });
  if (!error) return true;
  if (String(error.message).toLowerCase().includes('duplicate') || String(error.code) === '23505') return false;
  console.error('polar_webhook_dedup_insert', error);
  throw error;
}

export async function markPolarEventError(admin: SupabaseClient, polarEventId: string, message: string) {
  await admin.from('polar_webhook_events').update({ processing_error: message.slice(0, 2000) }).eq('polar_event_id', polarEventId);
}

async function upsertCustomerProfile(admin: SupabaseClient, userId: string, billingCustomerId: string | null) {
  if (!billingCustomerId) return;
  await admin.from('customer_billing_profiles').upsert(
    { user_id: userId, billing_customer_id: billingCustomerId, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
}

async function upsertPolarSubscriptionRow(
  admin: SupabaseClient,
  input: {
    userId: string;
    tier: QuiloraTier;
    planKey: PolarPlanKey;
    billingCustomerId: string | null;
    billingSubscriptionId: string | null;
    billingProductId: string | null;
    status: 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'unpaid';
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    isLifetime: boolean;
  },
) {
  await admin.from('subscriptions').delete().eq('user_id', input.userId);
  const { error } = await admin.from('subscriptions').insert({
    user_id: input.userId,
    tier: input.tier,
    status: input.status,
    billing_customer_id: input.billingCustomerId,
    billing_subscription_id: input.billingSubscriptionId,
    billing_product_id: input.billingProductId,
    internal_plan_key: input.planKey,
    is_lifetime: input.isLifetime,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    billing_provider: 'polar',
    current_period_start: input.currentPeriodStart,
    current_period_end: input.currentPeriodEnd,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function metadataUserId(meta: Record<string, unknown> | null): string | null {
  if (!meta) return null;
  return readString(meta, 'userId') ?? readString(meta, 'user_id');
}

function genesisSlotTierFromMeta(meta: Record<string, unknown> | null): GenesisTier {
  const slot = readString(meta, 'genesis_slot') ?? readString(meta, 'genesisSlot');
  if (slot === '119') return 'genesis_119';
  return 'genesis_80';
}

async function fulfillBoostPack(admin: SupabaseClient, userId: string, polarEventId: string) {
  await grantCredits(admin, {
    userId,
    amount: CREDIT_RULES.boostPackCredits,
    eventType: 'boost_pack_purchase',
    idempotencyKey: `polar_boost_${polarEventId}`,
    metadata: { provider: 'polar' },
  });
}

export async function fulfillPolarOrder(admin: SupabaseClient, data: Record<string, unknown>, polarEventId: string) {
  const meta = asRecord(data.metadata) ?? asRecord(data['metadata']);
  const userId = metadataUserId(meta);
  if (!userId) throw new Error('order_missing_metadata_userId');

  const productId =
    readString(data, 'product_id') ??
    readString(asRecord(data.product) ?? null, 'id') ??
    readString(asRecord(data.product) ?? null, 'product_id');
  const metaPlan = readString(meta, 'planKey');
  const planKey =
    metaPlan && isPolarPlanKey(metaPlan) ? metaPlan : productId ? planKeyFromPolarProductId(productId) : null;
  const orderId = readString(data, 'id');
  if (orderId) {
    const { error } = await admin.from('billing_orders').insert({
      user_id: userId,
      provider_order_id: orderId,
      internal_plan_key: planKey,
      provider_product_id: productId,
    });
    if (error && String(error.code) !== '23505') console.warn('billing_orders insert', error);
  }

  if (planKey === 'boost_pack') {
    await fulfillBoostPack(admin, userId, polarEventId);
    return;
  }

  if (planKey === 'genesis_lifetime') {
    const slotTier = genesisSlotTierFromMeta(meta);
    const reserved = await reserveGenesisSlot(admin, slotTier);
    if (!reserved.ok) throw new Error(`genesis_slot_unavailable:${reserved.reason ?? 'unknown'}`);
    await applyGenesisPerks(admin, userId, polarEventId, slotTier);
    await upsertPolarSubscriptionRow(admin, {
      userId,
      tier: 'genesis',
      planKey: 'genesis_lifetime',
      billingCustomerId: readString(data, 'customer_id') ?? readString(asRecord(data.customer) ?? null, 'id'),
      billingSubscriptionId: null,
      billingProductId: productId,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      isLifetime: true,
    });
    await markPrelaunchPurchaseProfile(admin, userId);
    await setPlanSelectionCompleted(admin, userId, true);
    await upsertCustomerProfile(
      admin,
      userId,
      readString(data, 'customer_id') ?? readString(asRecord(data.customer) ?? null, 'id'),
    );
    return;
  }

  if (planKey && planKey !== 'boost_pack') {
    const tier = tierFromPlanKey(planKey);
    await setTier(admin, userId, tier);
    await upsertPolarSubscriptionRow(admin, {
      userId,
      tier,
      planKey,
      billingCustomerId: readString(data, 'customer_id') ?? readString(asRecord(data.customer) ?? null, 'id'),
      billingSubscriptionId: null,
      billingProductId: productId,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      isLifetime: false,
    });
    await markPrelaunchPurchaseProfile(admin, userId);
    await setPlanSelectionCompleted(admin, userId, true);
    await upsertCustomerProfile(
      admin,
      userId,
      readString(data, 'customer_id') ?? readString(asRecord(data.customer) ?? null, 'id'),
    );
  }
}

function firstProductIdFromSubscription(data: Record<string, unknown>): string | null {
  const products = data['products'];
  if (Array.isArray(products) && products.length > 0) {
    const p0 = products[0];
    if (typeof p0 === 'string') return p0;
    const r = asRecord(p0);
    return readString(r, 'id') ?? readString(r, 'product_id');
  }
  return readString(data, 'product_id') ?? readString(asRecord(data.product) ?? null, 'id');
}

export async function fulfillPolarSubscription(
  admin: SupabaseClient,
  data: Record<string, unknown>,
  polarEventId: string,
  eventType: string,
) {
  const meta = asRecord(data.metadata) ?? null;
  let userId = metadataUserId(meta) ?? readString(data, 'user_id');
  if (!userId) {
    userId = readString(asRecord(data.customer) ?? null, 'external_id');
  }
  if (!userId) throw new Error('subscription_missing_user');

  const productId = firstProductIdFromSubscription(data);
  const planKey = (meta && readString(meta, 'planKey') && isPolarPlanKey(readString(meta, 'planKey')!))
    ? (readString(meta, 'planKey') as PolarPlanKey)
    : productId
    ? planKeyFromPolarProductId(productId)
    : null;
  if (!planKey || planKey === 'boost_pack') return;

  const tier = tierFromPlanKey(planKey);
  const polarStatus = mapPolarSubscriptionStatus(readString(data, 'status'));
  const cancelAtPeriodEnd = Boolean(data['cancel_at_period_end'] ?? data['cancelAtPeriodEnd']);
  const currentPeriodStart = readString(data, 'current_period_start') ?? readString(data, 'currentPeriodStart');
  const currentPeriodEnd = readString(data, 'current_period_end') ?? readString(data, 'currentPeriodEnd');
  const billingCustomerId = readString(data, 'customer_id') ?? readString(asRecord(data.customer) ?? null, 'id');
  const billingSubscriptionId = readString(data, 'id');

  const prev = await getProfile(admin, userId);
  const prevTier = (prev?.tier as QuiloraTier | undefined) ?? 'bookworm';
  await setTier(admin, userId, tier);
  if (prevTier === 'bibliophile' && tier === 'bookworm') {
    await applyBookwormSandboxReadonly(admin, userId);
  }

  const effectiveStatus =
    polarStatus === 'cancelled' && cancelAtPeriodEnd && currentPeriodEnd && new Date(currentPeriodEnd) > new Date()
      ? 'active'
      : polarStatus;

  await upsertPolarSubscriptionRow(admin, {
    userId,
    tier,
    planKey,
    billingCustomerId,
    billingSubscriptionId,
    billingProductId: productId,
    status: effectiveStatus,
    cancelAtPeriodEnd,
    currentPeriodStart,
    currentPeriodEnd,
    isLifetime: false,
  });

  if (eventType.toLowerCase() === 'subscription.updated' || eventType.toLowerCase() === 'subscription.active') {
    const raw = readString(data, 'status')?.toLowerCase() ?? '';
    if (tier === 'bookworm' && (raw === 'active' || raw === 'trialing')) {
      await applyBookwormMonthlyRenewal(admin, userId, `polar_renew_bw_${polarEventId}`);
    }
    if (tier === 'bibliophile' && (raw === 'active' || raw === 'trialing')) {
      await applyBibliophileMonthlyRenewal(admin, userId, `polar_renew_sage_${polarEventId}`);
    }
  }

  await markPrelaunchPurchaseProfile(admin, userId);
  await setPlanSelectionCompleted(admin, userId, true);
  await upsertCustomerProfile(admin, userId, billingCustomerId);
}

export async function handlePolarCustomerStateChanged(admin: SupabaseClient, data: Record<string, unknown>) {
  const cust = asRecord(data.customer) ?? data;
  const billingCustomerId = readString(cust, 'id');
  const externalId = readString(cust, 'external_id');
  if (!billingCustomerId || !externalId) return;
  await upsertCustomerProfile(admin, externalId, billingCustomerId);
}

export async function processPolarWebhookEnvelope(admin: SupabaseClient, body: Record<string, unknown>, polarEventId: string) {
  const eventType = String(body.type ?? body['event'] ?? '');
  const data = asRecord(body.data) ?? {};

  const t = eventType.toLowerCase();
  if (t === 'order.created') {
    await fulfillPolarOrder(admin, data, polarEventId);
    return;
  }
  if (
    t === 'subscription.created' ||
    t === 'subscription.active' ||
    t === 'subscription.updated' ||
    t === 'subscription.canceled' ||
    t === 'subscription.cancelled' ||
    t === 'subscription.revoked'
  ) {
    await fulfillPolarSubscription(admin, data, polarEventId, t);
    return;
  }
  if (t === 'customer.state_changed' || t === 'customer.updated') {
    await handlePolarCustomerStateChanged(admin, data);
    return;
  }
  if (t === 'checkout.updated') {
    const status = readString(data, 'status')?.toLowerCase();
    if (status === 'confirmed' || status === 'succeeded') {
      await fulfillFromCheckout(admin, data, polarEventId);
    }
    return;
  }
}

async function fulfillFromCheckout(admin: SupabaseClient, data: Record<string, unknown>, polarEventId: string) {
  const meta = asRecord(data.metadata) ?? {};
  const userId = metadataUserId(meta);
  if (!userId) return;
  const planRaw = readString(meta, 'planKey');
  const planKey = planRaw && isPolarPlanKey(planRaw) ? planRaw : null;
  const productList = data['products'];
  let productId: string | null = null;
  if (Array.isArray(productList) && productList.length > 0) {
    const p0 = productList[0];
    productId = typeof p0 === 'string' ? p0 : readString(asRecord(p0), 'id');
  }
  const resolvedPlan = planKey ?? (productId ? planKeyFromPolarProductId(productId) : null);
  if (!resolvedPlan) return;

  if (resolvedPlan === 'boost_pack') {
    await fulfillBoostPack(admin, userId, polarEventId);
    return;
  }
  if (resolvedPlan === 'genesis_lifetime') {
    await fulfillPolarOrder(
      admin,
      {
        id: readString(data, 'id'),
        customer_id: readString(asRecord(data.customer) ?? null, 'id'),
        customer: data.customer,
        product_id: productId,
        metadata: meta,
      },
      polarEventId,
    );
    return;
  }

  const tier = tierFromPlanKey(resolvedPlan);
  await setTier(admin, userId, tier);
  const billingCustomerId = readString(asRecord(data.customer) ?? null, 'id');
  const billingSubscriptionId = readString(data, 'subscription_id') ?? readString(asRecord(data.subscription) ?? null, 'id');
  await upsertPolarSubscriptionRow(admin, {
    userId,
    tier,
    planKey: resolvedPlan,
    billingCustomerId,
    billingSubscriptionId,
    billingProductId: productId,
    status: 'active',
    cancelAtPeriodEnd: false,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    isLifetime: false,
  });
}

export type CreateCheckoutInput = {
  planKey: PolarPlanKey;
  userId: string;
  userEmail: string;
  successUrl: string;
  returnUrl?: string | null;
  genesisSlotPricePoint?: '80' | '119' | null;
};

export async function createPolarCheckoutSession(input: CreateCheckoutInput): Promise<{ url: string }> {
  const productId = polarProductIdForPlan(input.planKey);
  if (!productId) throw new Error(`Missing Polar product env for plan ${input.planKey}`);

  const metadata: Record<string, string> = {
    userId: input.userId,
    planKey: input.planKey,
    source: 'quilora_pricing',
  };
  if (input.planKey === 'genesis_lifetime' && input.genesisSlotPricePoint) {
    metadata.genesis_slot = input.genesisSlotPricePoint;
  }

  const body: Record<string, unknown> = {
    products: [productId],
    success_url: input.successUrl,
    external_customer_id: input.userId,
    customer_email: input.userEmail,
    metadata,
  };
  if (input.returnUrl) {
    body['return_url'] = input.returnUrl;
  }

  const created = await polarApiJson<Record<string, unknown>>('POST', '/v1/checkouts/', body);
  const url = readString(created, 'url');
  if (!url) throw new Error('Polar checkout did not return url');
  return { url };
}

export async function createPolarCustomerPortalSession(params: {
  userId: string;
  returnUrl: string;
}): Promise<{ customerPortalUrl: string }> {
  const created = await polarApiJson<Record<string, unknown>>('POST', '/v1/customer-sessions/', {
    external_customer_id: params.userId,
    return_url: params.returnUrl,
  });
  const url = readString(created, 'customer_portal_url') ?? readString(created, 'customerPortalUrl');
  if (!url) throw new Error('Polar customer session did not return customer_portal_url');
  return { customerPortalUrl: url };
}

export async function fetchPolarCheckout(checkoutId: string): Promise<Record<string, unknown>> {
  return polarApiJson<Record<string, unknown>>('GET', `/v1/checkouts/${encodeURIComponent(checkoutId)}`, undefined);
}

function subscriptionRowGrantsPaidSeatServer(row: Record<string, unknown> | null): boolean {
  if (!row) return false;
  const st = String(row['status'] ?? '');
  const endRaw = row['current_period_end'] as string | null | undefined;
  const end = endRaw ? new Date(endRaw).getTime() : null;
  const now = Date.now();
  if (Boolean(row['is_lifetime']) && st === 'active') return true;
  if (st === 'active' || st === 'past_due') return true;
  if (st === 'cancelled' && Boolean(row['cancel_at_period_end']) && end !== null && !Number.isNaN(end) && end > now) {
    return true;
  }
  return false;
}

export async function buildPolarBillingMe(admin: SupabaseClient, userId: string) {
  const entitlements = await getTierEntitlements(admin, userId);
  const lowBalance = await getLowBalanceStatus(admin, userId);
  const { data: subRows } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);
  const sub = (subRows?.[0] ?? null) as Record<string, unknown> | null;
  const { data: cbp } = await admin.from('customer_billing_profiles').select('billing_customer_id').eq('user_id', userId).maybeSingle();
  const billingCustomerId = (cbp as { billing_customer_id?: string } | null)?.billing_customer_id ?? null;
  const portalAvailable = Boolean(sub && String(sub['billing_provider'] ?? '') === 'polar');
  const activeAccess = subscriptionRowGrantsPaidSeatServer(sub);
  const currentPlanKey = typeof sub?.['internal_plan_key'] === 'string' ? (sub['internal_plan_key'] as string) : null;
  return {
    entitlements,
    lowBalance,
    subscription: sub,
    billingCustomerId,
    portalAvailable,
    currentPlanKey,
    tier: entitlements.tier,
    provider: sub ? String(sub['billing_provider'] ?? 'unknown') : 'unknown',
    isLifetime: Boolean(sub?.['is_lifetime']),
    subscriptionStatus: sub ? String(sub['status'] ?? '') : null,
    activeAccess,
    cancelAtPeriodEnd: Boolean(sub?.['cancel_at_period_end']),
    currentPeriodEnd: (sub?.['current_period_end'] as string | null | undefined) ?? null,
    canManageBilling: portalAvailable && Boolean(billingCustomerId),
  };
}

export async function fulfillFromCheckoutApi(admin: SupabaseClient, checkoutId: string, expectedUserId: string) {
  const checkout = await fetchPolarCheckout(checkoutId);
  const meta = asRecord(checkout.metadata) ?? {};
  const userId = metadataUserId(meta);
  if (!userId || userId !== expectedUserId) throw new Error('checkout_user_mismatch');
  const status = readString(checkout, 'status')?.toLowerCase();
  if (status !== 'confirmed' && status !== 'succeeded' && status !== 'complete' && status !== 'completed') {
    throw new Error(`checkout_not_ready:${status ?? 'unknown'}`);
  }
  const syntheticEventId = `polar_sync_${checkoutId}`;
  const first = await markPolarEventStart(admin, syntheticEventId, 'checkout.sync');
  if (!first) return;
  try {
    await fulfillFromCheckout(admin, checkout, syntheticEventId);
  } catch (e) {
    await markPolarEventError(admin, syntheticEventId, e instanceof Error ? e.message : String(e));
    throw e;
  }
}
