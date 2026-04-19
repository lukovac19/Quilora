import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { Webhook } from 'npm:standardwebhooks@1.0.0';
import { TIER_LIMITS } from './billing_config.ts';
import {
  applyBibliophileMonthlyRenewal,
  applyBookwormMonthlyRenewal,
  applyBookwormSandboxReadonly,
  getProfile,
  grantCredits,
  markPrelaunchPurchaseProfile,
  setPlanSelectionCompleted,
  setTier,
} from './credit_service.ts';
import { releaseGenesisSlot } from './billing_genesis_service.ts';
import {
  assertPrelaunchWebhookPurchaseAllowed,
  consumeCheckoutPassthrough,
  handleTransactionCompleted,
  validatePassthroughForCheckout,
} from './prelaunch_v4_service.ts';
import {
  billingUserPlanFromProductKind,
  syncUserPlanTokenBalanceFromProfile,
  upsertUserPlan,
} from './user_plans_service.ts';

function webhookSecret(): string | null {
  return (
    Deno.env.get('DODO_PAYMENTS_WEBHOOK_SECRET')?.trim() ||
    Deno.env.get('DODO_PAYMENTS_WEBHOOK_KEY')?.trim() ||
    null
  );
}

export async function hasProcessedDodoWebhook(admin: SupabaseClient, eventId: string) {
  const { data } = await admin.from('dodo_webhook_dedup').select('event_id').eq('event_id', eventId).maybeSingle();
  return Boolean(data?.event_id);
}

export async function markDodoWebhookProcessed(admin: SupabaseClient, eventId: string) {
  const { error } = await admin.from('dodo_webhook_dedup').insert({ event_id: eventId });
  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    console.warn('markDodoWebhookProcessed', error);
  }
}

export async function verifyDodoWebhook(rawBody: string, headers: Record<string, string | undefined>) {
  const secret = webhookSecret();
  if (!secret) {
    console.warn('DODO_PAYMENTS_WEBHOOK_SECRET not set — rejecting webhook');
    return { ok: false as const, error: 'webhook_secret_missing' };
  }
  try {
    const webhook = new Webhook(secret);
    const payload = (await webhook.verify(rawBody, {
      'webhook-id': headers['webhook-id'] ?? '',
      'webhook-signature': headers['webhook-signature'] ?? '',
      'webhook-timestamp': headers['webhook-timestamp'] ?? '',
    })) as Record<string, unknown>;
    return { ok: true as const, payload };
  } catch (e) {
    console.warn('dodo webhook verify failed', e);
    return { ok: false as const, error: 'invalid_signature' };
  }
}

function strMeta(meta: unknown, key: string): string {
  if (!meta || typeof meta !== 'object') return '';
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === 'string' ? v.trim() : '';
}

function normalizedTierFromMetadata(meta: unknown): 'bookworm' | 'bibliophile' | 'genesis' {
  const pk = strMeta(meta, 'productKind') || strMeta(meta, 'product_kind');
  const tierHint = strMeta(meta, 'tier');
  if (tierHint === 'bibliophile' || tierHint === 'genesis' || tierHint === 'bookworm') {
    return tierHint === 'genesis' ? 'genesis' : tierHint === 'bibliophile' ? 'bibliophile' : 'bookworm';
  }
  if (pk.startsWith('sage_') || pk.startsWith('bibliophile')) return 'bibliophile';
  if (pk.startsWith('genesis') || pk.startsWith('lifetime_')) return 'genesis';
  return 'bookworm';
}

function genesisReleaseTierFromPricePoint(pp: string): 'genesis_80' | 'genesis_119' | 'genesis_176' {
  if (pp === '119') return 'genesis_119';
  if (pp === '176') return 'genesis_176';
  return 'genesis_80';
}

function billingPlanForTier(t: 'bookworm' | 'bibliophile' | 'genesis'): 'basic' | 'pro' | 'enterprise' {
  if (t === 'genesis') return 'enterprise';
  if (t === 'bibliophile') return 'pro';
  return 'basic';
}

async function upsertProviderSubscription(
  admin: SupabaseClient,
  input: {
    userId: string;
    tier: 'bookworm' | 'bibliophile' | 'genesis';
    customerId: string | null;
    subscriptionId: string | null;
    periodEnd: string | null;
  },
) {
  await admin.from('subscriptions').delete().eq('user_id', input.userId);
  await admin.from('subscriptions').insert({
    user_id: input.userId,
    tier: input.tier,
    status: 'active',
    provider_customer_id: input.customerId,
    provider_subscription_id: input.subscriptionId,
    current_period_end: input.periodEnd,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
}

export async function processDodoWebhookPayload(
  admin: SupabaseClient,
  payload: Record<string, unknown>,
  webhookId: string,
) {
  const type = String(payload['type'] ?? '');
  const data = (payload['data'] ?? {}) as Record<string, unknown>;

  if (type === 'payment.succeeded') {
    const payment = data as Record<string, unknown>;
    const subscriptionId =
      typeof payment['subscription_id'] === 'string' && payment['subscription_id'].trim()
        ? String(payment['subscription_id'])
        : null;
    if (subscriptionId) {
      const customer = (payment['customer'] ?? {}) as Record<string, unknown>;
      const customerId = typeof customer['customer_id'] === 'string' ? customer['customer_id'] : null;
      const userId = strMeta(payment['metadata'], 'userId');
      if (userId && customerId) {
        await admin
          .from('profiles')
          .update({
            dodo_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
      return;
    }

    const userId = strMeta(payment['metadata'], 'userId');
    if (!userId) throw new Error('Missing userId in payment metadata');
    const productKind =
      strMeta(payment['metadata'], 'productKind') || strMeta(payment['metadata'], 'product_kind');
    if (!productKind) throw new Error('Missing productKind in payment metadata');
    const customer = (payment['customer'] ?? {}) as Record<string, unknown>;
    const customerEmail = typeof customer['email'] === 'string' ? customer['email'] : null;
    const providerPaymentId = typeof payment['payment_id'] === 'string' ? payment['payment_id'] : null;
    const providerCustomerId = typeof customer['customer_id'] === 'string' ? customer['customer_id'] : null;
    const passthroughToken = strMeta(payment['metadata'], 'passthroughToken') || undefined;

    if (Deno.env.get('REQUIRE_CHECKOUT_PASSTHROUGH') === 'true' && !passthroughToken) {
      throw new Error('Missing passthroughToken in metadata');
    }
    const passVal = await validatePassthroughForCheckout(admin, passthroughToken, userId, customerEmail);
    if (!passVal.ok) throw new Error(passVal.error);

    const dup = await assertPrelaunchWebhookPurchaseAllowed(admin, userId, productKind);
    if (!dup.ok) throw new Error(dup.error);

    const txMeta = await handleTransactionCompleted(admin, {
      userId,
      productKind,
      providerEventId: webhookId,
      customerEmail,
      providerPaymentId,
      providerCustomerId,
      rawCustom: (payment['metadata'] ?? {}) as Record<string, unknown>,
    });
    await consumeCheckoutPassthrough(admin, passthroughToken);

    const tier = normalizedTierFromMetadata(payment['metadata']);
    await admin
      .from('profiles')
      .update({
        dodo_customer_id: providerCustomerId,
        billing_plan: billingPlanForTier(tier),
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    const billingPlan = billingUserPlanFromProductKind(productKind);
    if (billingPlan) {
      const isLife = billingPlan.startsWith('lifetime');
      await upsertUserPlan(admin, {
        userId,
        plan: billingPlan,
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: null,
        tokensPerCycle: billingPlan === 'bookworm' ? 800 : billingPlan === 'sage' ? 2500 : 15000,
        isLifetime: isLife,
        genesisSeatNumber: txMeta.genesisSeatNumber ?? null,
      });
      await syncUserPlanTokenBalanceFromProfile(admin, userId);
    } else {
      await syncUserPlanTokenBalanceFromProfile(admin, userId);
    }
    return;
  }

  if (type === 'subscription.active') {
    const sub = data as Record<string, unknown>;
    const meta = sub['metadata'] as Record<string, unknown> | undefined;
    const userId = strMeta(meta, 'userId');
    if (!userId) throw new Error('Missing userId in subscription metadata');
    const tier = normalizedTierFromMetadata(meta);
    const customer = (sub['customer'] ?? {}) as Record<string, unknown>;
    const customerId = typeof customer['customer_id'] === 'string' ? customer['customer_id'] : null;
    const subscriptionId = typeof sub['subscription_id'] === 'string' ? sub['subscription_id'] : null;
    const periodEnd = typeof sub['next_billing_date'] === 'string' ? sub['next_billing_date'] : null;

    const prev = await getProfile(admin, userId);
    const prevTier = (prev?.tier as string) ?? 'bookworm';
    await setTier(admin, userId, tier);
    if (prevTier === 'bibliophile' && tier === 'bookworm') {
      await applyBookwormSandboxReadonly(admin, userId);
    }
    await markPrelaunchPurchaseProfile(admin, userId);
    await setPlanSelectionCompleted(admin, userId, true);
    await upsertProviderSubscription(admin, {
      userId,
      tier,
      customerId,
      subscriptionId,
      periodEnd,
    });
    await admin
      .from('profiles')
      .update({
        dodo_customer_id: customerId,
        billing_plan: billingPlanForTier(tier),
        subscription_status: 'active',
        subscription_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (tier === 'bookworm') {
      await applyBookwormMonthlyRenewal(admin, userId, `dodo_sub_active_bw_${webhookId}`);
    }
    if (tier === 'bibliophile') {
      await grantCredits(admin, {
        userId,
        amount: TIER_LIMITS.bibliophile.monthlyCredits,
        eventType: 'monthly_renewal',
        idempotencyKey: `dodo_sub_active_bib_${webhookId}`,
        metadata: { tier: 'bibliophile', mode: 'activation' },
      });
    }

    const billingPlan = tier === 'bibliophile' ? 'sage' : 'bookworm';
    await upsertUserPlan(admin, {
      userId,
      plan: billingPlan,
      subscriptionId,
      subscriptionStatus: 'active',
      subscriptionPeriodEnd: periodEnd,
      tokensPerCycle: tier === 'bibliophile' ? TIER_LIMITS.bibliophile.monthlyCredits : TIER_LIMITS.bookworm.monthlyCredits,
      isLifetime: false,
    });
    await syncUserPlanTokenBalanceFromProfile(admin, userId);
    return;
  }

  if (type === 'subscription.cancelled' || type === 'subscription.expired') {
    const sub = data as Record<string, unknown>;
    const subscriptionId = typeof sub['subscription_id'] === 'string' ? sub['subscription_id'] : '';
    if (!subscriptionId) return;
    const { data: row } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('provider_subscription_id', subscriptionId)
      .maybeSingle();
    const userId = row?.user_id as string | undefined;
    if (!userId) return;
    await setTier(admin, userId, 'bookworm');
    await applyBookwormSandboxReadonly(admin, userId);
    await admin
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    await admin
      .from('profiles')
      .update({
        billing_plan: 'basic',
        subscription_status: 'cancelled',
        subscription_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    await upsertUserPlan(admin, {
      userId,
      plan: 'free',
      subscriptionId: null,
      subscriptionStatus: 'cancelled',
      subscriptionPeriodEnd: null,
      tokensPerCycle: 0,
      isLifetime: false,
    });
    await syncUserPlanTokenBalanceFromProfile(admin, userId);
    return;
  }

  if (type === 'subscription.renewed' || type === 'subscription.updated') {
    const sub = data as Record<string, unknown>;
    const subscriptionId = typeof sub['subscription_id'] === 'string' ? sub['subscription_id'] : '';
    const periodEnd = typeof sub['next_billing_date'] === 'string' ? sub['next_billing_date'] : null;
    const meta = sub['metadata'] as Record<string, unknown> | undefined;
    const userId = strMeta(meta, 'userId');
    if (subscriptionId) {
      await admin
        .from('subscriptions')
        .update({
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_subscription_id', subscriptionId);
    }
    if (userId && periodEnd) {
      await admin
        .from('profiles')
        .update({
          subscription_period_end: periodEnd,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }
    const tier = normalizedTierFromMetadata(meta);
    const status = typeof sub['status'] === 'string' ? sub['status'] : '';
    if (status === 'active' && userId) {
      if (tier === 'bookworm') {
        await applyBookwormMonthlyRenewal(admin, userId, `dodo_renew_bw_${webhookId}`);
      }
      if (tier === 'bibliophile') {
        await applyBibliophileMonthlyRenewal(admin, userId, `dodo_renew_bib_${webhookId}`);
      }
    }
    if (userId && periodEnd) {
      const billingPlan = tier === 'bibliophile' ? 'sage' : 'bookworm';
      await upsertUserPlan(admin, {
        userId,
        plan: billingPlan,
        subscriptionId: subscriptionId || null,
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: periodEnd,
        tokensPerCycle: tier === 'bibliophile' ? TIER_LIMITS.bibliophile.monthlyCredits : TIER_LIMITS.bookworm.monthlyCredits,
        isLifetime: false,
      });
      await syncUserPlanTokenBalanceFromProfile(admin, userId);
    }
    return;
  }

  if (type === 'payment.failed') {
    const payment = data as Record<string, unknown>;
    const customer = (payment['customer'] ?? {}) as Record<string, unknown>;
    const customerEmail = typeof customer['email'] === 'string' ? customer['email'] : null;
    const providerPaymentId = typeof payment['payment_id'] === 'string' ? payment['payment_id'] : null;
    console.warn('[dodo] payment.failed', { webhookId, providerPaymentId, customerEmail });
    await admin.from('provider_transactions').insert({
      user_id: null,
      provider_payment_id: providerPaymentId,
      provider_customer_id: typeof customer['customer_id'] === 'string' ? customer['customer_id'] : null,
      customer_email: customerEmail?.toLowerCase() ?? null,
      product_kind: 'payment_failed',
      event_id: webhookId,
      reconciled: false,
      raw_custom_data: (payment['metadata'] ?? {}) as Record<string, unknown>,
    });
    return;
  }

  if (type === 'payment.refunded') {
    const payment = data as Record<string, unknown>;
    const userId = strMeta(payment['metadata'], 'userId');
    const productKind =
      strMeta(payment['metadata'], 'productKind') || strMeta(payment['metadata'], 'product_kind') || '';
    if (!userId) return;
    const prof = await getProfile(admin, userId);
    const tier = String(prof?.tier ?? 'bookworm');
    if (tier === 'genesis' || productKind.startsWith('lifetime') || productKind.startsWith('genesis')) {
      const pp = String((prof as { genesis_slot_price_point?: string }).genesis_slot_price_point ?? '80');
      await releaseGenesisSlot(admin, genesisReleaseTierFromPricePoint(pp));
    }
    await setTier(admin, userId, 'bookworm');
    await applyBookwormSandboxReadonly(admin, userId);
    await admin
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    await admin
      .from('profiles')
      .update({
        billing_plan: 'basic',
        subscription_status: 'cancelled',
        genesis_badge: false,
        alpha_lab_access: false,
        genesis_slot_price_point: null,
        genesis_lifetime_discount: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    await upsertUserPlan(admin, {
      userId,
      plan: 'free',
      subscriptionId: null,
      subscriptionStatus: 'cancelled',
      subscriptionPeriodEnd: null,
      tokensPerCycle: 0,
      isLifetime: false,
    });
    await syncUserPlanTokenBalanceFromProfile(admin, userId);
    return;
  }
}
