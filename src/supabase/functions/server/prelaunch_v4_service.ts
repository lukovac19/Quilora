import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import {
  applyBibliophileMonthlyRenewal,
  applyBookwormMonthlyRenewal,
  applyBookwormSandboxReadonly,
  applyGenesisPerks,
  getProfile,
  grantCredits,
  setTier,
  setPlanSelectionCompleted,
  markPrelaunchPurchaseProfile,
} from './credit_service.ts';
import { TIER_LIMITS, type QuiloraTier } from './billing_config.ts';
import { type GenesisTier, releaseGenesisSlot, reserveGenesisSlot } from './billing_genesis_service.ts';
import { dodoCancelSubscriptionImmediately, dodoCreateFullRefund } from './dodo_billing_api.ts';

type Json = Record<string, unknown>;

export async function getPublicLaunchComplete(admin: SupabaseClient): Promise<boolean> {
  const { data } = await admin.from('app_settings').select('value').eq('key', 'public_launch').maybeSingle();
  const v = (data?.value as Json | undefined) ?? {};
  return Boolean(v['complete']);
}

export async function setPublicLaunchComplete(admin: SupabaseClient, complete: boolean) {
  if (!complete) {
    await admin.from('app_settings').upsert({
      key: 'public_launch',
      value: { complete: false },
      updated_at: new Date().toISOString(),
    });
    return;
  }
  const { error } = await admin.rpc('finalize_public_launch');
  if (error) {
    console.error('finalize_public_launch', error);
    return;
  }
  const { data: buyers } = await admin
    .from('profiles')
    .select('id, email')
    .not('first_prelaunch_purchase_at', 'is', null);
  for (const b of buyers ?? []) {
    const em = String(b.email ?? '').trim();
    if (em) {
      await enqueueEmail(admin, 'email_2_launch_day', em, {
        userId: b.id,
        message: 'Quilora is live — your canvas is ready.',
      });
    }
  }
}

export async function createCheckoutPassthrough(admin: SupabaseClient, userId: string, expectedCheckoutEmail: string) {
  const token = `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await admin.from('checkout_passthrough').insert({
    token,
    user_id: userId,
    expected_checkout_email: expectedCheckoutEmail.trim().toLowerCase(),
    expires_at: expiresAt,
  });
  return { token, expiresAt };
}

export async function validatePassthroughForCheckout(
  admin: SupabaseClient,
  token: string | undefined,
  userId: string,
  customerEmail: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token) return { ok: true };
  const { data } = await admin.from('checkout_passthrough').select('*').eq('token', token).maybeSingle();
  if (!data) return { ok: false, error: 'INVALID_PASSTHROUGH' };
  if (data.consumed_at) return { ok: false, error: 'PASSTHROUGH_ALREADY_USED' };
  if (String(data.user_id) !== userId) return { ok: false, error: 'INVALID_PASSTHROUGH' };
  if (new Date(String(data.expires_at)).getTime() < Date.now()) return { ok: false, error: 'PASSTHROUGH_EXPIRED' };
  const expected = String(data.expected_checkout_email ?? '').toLowerCase();
  const bill = (customerEmail ?? '').toLowerCase();
  if (bill && expected && bill !== expected) {
    return { ok: false, error: 'EMAIL_MISMATCH_CHECKOUT' };
  }
  return { ok: true };
}

/** Single-use checkout binding (EC-05) — call after successful `transaction.completed` handling. */
export async function consumeCheckoutPassthrough(admin: SupabaseClient, token: string | undefined) {
  if (!token) return;
  await admin
    .from('checkout_passthrough')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', token)
    .is('consumed_at', null);
}

/**
 * PAY-09 / EC-09 — last-line duplicate guard on the server (client already blocks most cases).
 * Rejects clearly conflicting checkout completions for the same Supabase user.
 */
export async function assertPrelaunchWebhookPurchaseAllowed(
  admin: SupabaseClient,
  userId: string,
  productKind: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfile(admin, userId);
  const tier = String(profile?.tier ?? 'bookworm');
  const firstAt = profile?.first_prelaunch_purchase_at as string | undefined;

  const isLifetimeProduct =
    productKind === 'genesis_80' ||
    productKind === 'genesis_119' ||
    productKind === 'genesis_176' ||
    productKind === 'lifetime_early_bird' ||
    productKind === 'lifetime_standard' ||
    productKind === 'lifetime_plus_sage';
  if (isLifetimeProduct) {
    if (tier === 'genesis') return { ok: false, error: 'DUPLICATE_GENESIS' };
    return { ok: true };
  }

  if (productKind.startsWith('bibliophile') || productKind.startsWith('sage_')) {
    // Genesis + 1Y Sage bundle may use two checkout sessions — allow Sage after Genesis seat.
    if (tier === 'genesis') return { ok: true };
    if (tier === 'bibliophile' && firstAt) return { ok: false, error: 'DUPLICATE_SAGE' };
    return { ok: true };
  }

  if (productKind.startsWith('bookworm')) {
    if (tier === 'bibliophile' || tier === 'genesis') return { ok: false, error: 'BLOCK_BW_HIGHER_TIER' };
    if (tier === 'bookworm' && firstAt) return { ok: false, error: 'DUPLICATE_BOOKWORM' };
    return { ok: true };
  }

  if (productKind.startsWith('tokens_')) {
    return { ok: true };
  }

  return { ok: true };
}

export async function enqueueEmail(admin: SupabaseClient, template: string, toEmail: string, payload: Json = {}) {
  const { error } = await admin.from('email_outbox').insert({
    template,
    to_email: toEmail,
    payload,
  });
  if (error) console.error('enqueueEmail', error);
}

/** EC-03 — checkout completed in-app but profile still not activated after grace period. */
export async function reportWebhookDelayForUser(
  admin: SupabaseClient,
  userId: string,
  productHint: string | null | undefined,
) {
  const row = await getProfile(admin, userId);
  const email = String(row?.email ?? '');
  await enqueueEmail(admin, 'email_ec03_webhook_delay_support', 'support@quilora.com', {
    userId,
    userEmail: email,
    productHint: productHint ?? null,
    note: 'Checkout reported success in the browser, but billing activation was still pending after ~5 minutes.',
  });
}

/** Process pending outbox rows (Resend when configured, else log). */
export async function processEmailOutboxBatch(admin: SupabaseClient, limit = 15) {
  const { data: rows } = await admin
    .from('email_outbox')
    .select('id, template, to_email, payload')
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);
  const key = Deno.env.get('RESEND_API_KEY')?.trim();
  for (const row of rows ?? []) {
    if (key) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM') ?? 'Quilora <onboarding@resend.dev>',
            to: row.to_email,
            subject: `[Quilora] ${row.template}`,
            text: JSON.stringify(row.payload ?? {}, null, 2),
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          await admin.from('email_outbox').update({ error: t.slice(0, 500) }).eq('id', row.id);
          continue;
        }
      } catch (e) {
        await admin.from('email_outbox').update({ error: String(e) }).eq('id', row.id);
        continue;
      }
    } else {
      console.log('[email_outbox]', row.template, '→', row.to_email);
    }
    await admin.from('email_outbox').update({ sent_at: new Date().toISOString(), error: null }).eq('id', row.id);
  }
}

export async function logProviderTransaction(
  admin: SupabaseClient,
  input: {
    userId: string | null;
    providerPaymentId: string | null;
    providerCustomerId: string | null;
    customerEmail: string | null;
    productKind: string;
    eventId: string;
    rawCustom: Json;
  },
) {
  const { error } = await admin.from('provider_transactions').insert({
    user_id: input.userId,
    provider_payment_id: input.providerPaymentId,
    provider_customer_id: input.providerCustomerId,
    customer_email: input.customerEmail?.toLowerCase() ?? null,
    product_kind: input.productKind,
    event_id: input.eventId,
    reconciled: Boolean(input.userId),
    raw_custom_data: input.rawCustom,
  });
  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    console.error('logProviderTransaction', error);
  }
}

function genesisTierForProductKind(productKind: string): GenesisTier | null {
  if (productKind === 'lifetime_early_bird' || productKind === 'genesis_80') return 'genesis_80';
  if (productKind === 'lifetime_standard' || productKind === 'genesis_119') return 'genesis_119';
  if (productKind === 'lifetime_plus_sage') return 'genesis_176';
  return null;
}

function tierFromProductKind(productKind: string): QuiloraTier | null {
  if (productKind.startsWith('bookworm')) return 'bookworm';
  if (productKind.startsWith('bibliophile') || productKind.startsWith('sage_')) return 'bibliophile';
  return null;
}

async function upsertActiveSubscription(
  admin: SupabaseClient,
  userId: string,
  tier: QuiloraTier,
  providerCustomerId: string | null,
  providerSubscriptionId: string | null,
) {
  await admin.from('subscriptions').delete().eq('user_id', userId);
  await admin.from('subscriptions').insert({
    user_id: userId,
    tier,
    status: 'active',
    provider_customer_id: providerCustomerId,
    provider_subscription_id: providerSubscriptionId,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
}

export async function handleTransactionCompleted(
  admin: SupabaseClient,
  params: {
    userId: string;
    productKind: string;
    providerEventId: string;
    customerEmail: string | null;
    providerPaymentId: string | null;
    providerCustomerId: string | null;
    rawCustom: Json;
  },
): Promise<{ genesisSeatNumber?: number }> {
  const { userId, productKind, providerEventId, customerEmail, providerPaymentId, providerCustomerId, rawCustom } =
    params;

  await logProviderTransaction(admin, {
    userId,
    providerPaymentId,
    providerCustomerId,
    customerEmail,
    productKind,
    eventId: providerEventId,
    rawCustom,
  });

  const profile = await getProfile(admin, userId);
  const email = customerEmail || (profile?.email as string) || '';

  const genesisTier = genesisTierForProductKind(productKind);
  if (genesisTier) {
    const slot = await reserveGenesisSlot(admin, genesisTier);
    if (!slot.ok) {
      await enqueueEmail(admin, 'email_genesis_slot_failed', email || 'support@quilora.com', {
        userId,
        productKind,
        providerEventId,
      });
      throw new Error('GENESIS_SOLD_OUT');
    }
    await applyGenesisPerks(admin, userId, providerEventId, genesisTier);
    await markPrelaunchPurchaseProfile(admin, userId);
    await setPlanSelectionCompleted(admin, userId, true);
    await upsertActiveSubscription(admin, userId, 'genesis', providerCustomerId, null);
    await enqueueEmail(admin, 'email_1_purchase_confirmation', email, {
      tier: 'genesis',
      productKind,
      credits: TIER_LIMITS.genesis.monthlyCredits,
    });
    return { genesisSeatNumber: slot.sold };
  }

  if (productKind === 'boost_pack') {
    await grantCredits(admin, {
      userId,
      amount: 200,
      eventType: 'boost_pack_purchase',
      idempotencyKey: `boost_${providerEventId}`,
      metadata: { provider: 'dodo' },
    });
    const row = await getProfile(admin, userId);
    const tb = Number((row as { token_balance?: number }).token_balance ?? 0);
    await admin
      .from('profiles')
      .update({ token_balance: tb + 200, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return {};
  }

  if (productKind.startsWith('tokens_')) {
    const amount =
      productKind === 'tokens_large' ? 2000 : productKind === 'tokens_medium' ? 800 : 300;
    await grantCredits(admin, {
      userId,
      amount,
      eventType: 'boost_pack_purchase',
      idempotencyKey: `tokens_${productKind}_${providerEventId}`,
      metadata: { provider: 'dodo', pack: productKind },
    });
    const row = await getProfile(admin, userId);
    const tb = Number((row as { token_balance?: number }).token_balance ?? 0);
    await admin
      .from('profiles')
      .update({ token_balance: tb + amount, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return {};
  }

  const subTier = tierFromProductKind(productKind);
  if (subTier === 'bookworm') {
    await setTier(admin, userId, 'bookworm');
    await setPlanSelectionCompleted(admin, userId, true);
    await markPrelaunchPurchaseProfile(admin, userId);
    await applyBookwormMonthlyRenewal(admin, userId, `txn_bw_${providerEventId}`);
    await upsertActiveSubscription(admin, userId, 'bookworm', providerCustomerId, null);
    await enqueueEmail(admin, 'email_1_purchase_confirmation', email, {
      tier: 'bookworm',
      productKind,
      credits: TIER_LIMITS.bookworm.monthlyCredits,
    });
    return {};
  }

  if (subTier === 'bibliophile') {
    await setTier(admin, userId, 'bibliophile');
    await setPlanSelectionCompleted(admin, userId, true);
    await markPrelaunchPurchaseProfile(admin, userId);
    await grantCredits(admin, {
      userId,
      amount: TIER_LIMITS.bibliophile.monthlyCredits,
      eventType: 'monthly_renewal',
      idempotencyKey: `txn_bib_${providerEventId}`,
      metadata: { tier: 'bibliophile', mode: 'activation' },
    });
    await upsertActiveSubscription(admin, userId, 'bibliophile', providerCustomerId, null);
    await enqueueEmail(admin, 'email_1_purchase_confirmation', email, {
      tier: 'sage',
      productKind,
      credits: TIER_LIMITS.bibliophile.monthlyCredits,
    });
    return {};
  }

  return {};
}

type OrphanTx = {
  id: string;
  customer_email: string | null;
  created_at: string;
  provider_payment_id: string | null;
  recovery_stage: number | null;
  support_alert_7d_sent_at: string | null;
  auto_refund_30d_at: string | null;
};

async function attemptRefundRecorded(
  admin: SupabaseClient,
  providerPaymentId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pid = providerPaymentId.trim();
  const { data: dup } = await admin
    .from('billing_refund_attempts')
    .select('id')
    .eq('provider_payment_id', pid)
    .eq('reason', reason)
    .maybeSingle();
  if (dup) return { ok: true };
  const r = await dodoCreateFullRefund(pid, reason);
  if (r.ok) {
    await admin.from('billing_refund_attempts').insert({
      provider_payment_id: pid,
      reason,
      status: 'submitted',
      http_status: r.status,
      response_excerpt: r.body?.slice(0, 400) ?? null,
    });
    return { ok: true };
  }
  await admin.from('billing_refund_attempts').insert({
    provider_payment_id: pid,
    reason,
    status: 'failed',
    http_status: r.status ?? null,
    response_excerpt: r.error.slice(0, 500),
  });
  await enqueueEmail(admin, 'email_support_dodo_refund_failed', 'support@quilora.com', {
    provider_payment_id: pid,
    reason,
    detail: r.error,
  });
  return { ok: false, error: r.error };
}

/** EC-04 — recovery cadence (6h / 24h), 7d support alert, 30d refund; plus email outbox drain. */
export async function reconcileOrphanPayments(admin: SupabaseClient) {
  await processEmailOutboxBatch(admin, 10);

  const { data: orphans } = await admin
    .from('provider_transactions')
    .select(
      'id, customer_email, created_at, provider_payment_id, recovery_stage, support_alert_7d_sent_at, auto_refund_30d_at',
    )
    .is('user_id', null)
    .eq('reconciled', false)
    .limit(120);

  const now = Date.now();
  for (const raw of orphans ?? []) {
    const r = raw as OrphanTx;
    const em = String(r.customer_email ?? '');
    if (em) {
      const { data: prof } = await admin.from('profiles').select('id').ilike('email', em).maybeSingle();
      if (prof?.id) {
        await admin.from('provider_transactions').update({ user_id: prof.id, reconciled: true }).eq('id', r.id);
        continue;
      }
    }

    const created = new Date(String(r.created_at)).getTime();
    const ageH = (now - created) / (60 * 60 * 1000);
    const stage = Number(r.recovery_stage ?? 0);

    if (ageH >= 6 && stage < 1) {
      if (em) {
        await enqueueEmail(admin, 'email_1_5_recovery_setup', em, {
          message: 'Complete your Quilora setup — we found a payment without a linked account (first notice).',
        });
      }
      await admin
        .from('provider_transactions')
        .update({ recovery_stage: 1, recovery_last_sent_at: new Date().toISOString() })
        .eq('id', r.id);
      continue;
    }
    if (ageH >= 24 && stage < 2) {
      if (em) {
        await enqueueEmail(admin, 'email_1_5_recovery_setup', em, {
          message: 'Complete your Quilora setup — second reminder (24h).',
        });
      }
      await admin
        .from('provider_transactions')
        .update({ recovery_stage: 2, recovery_last_sent_at: new Date().toISOString() })
        .eq('id', r.id);
      continue;
    }
    if (ageH >= 7 * 24 && !r.support_alert_7d_sent_at) {
      await enqueueEmail(admin, 'email_support_alert_unclaimed_payment', 'support@quilora.com', {
        transaction_row_id: r.id,
        customer_email: r.customer_email,
        note: 'EC-04: unclaimed payment after 7 days — manual outreach.',
      });
      await admin
        .from('provider_transactions')
        .update({
          recovery_stage: Math.max(stage, 3),
          support_alert_7d_sent_at: new Date().toISOString(),
        })
        .eq('id', r.id);
      continue;
    }
    const pid = String(r.provider_payment_id ?? '');
    if (ageH >= 30 * 24 && pid && !r.auto_refund_30d_at) {
      const res = await attemptRefundRecorded(admin, pid, 'ec04_orphan_30d');
      await admin
        .from('provider_transactions')
        .update({
          auto_refund_30d_at: new Date().toISOString(),
          auto_refund_30d_error: res.ok ? null : res.error.slice(0, 500),
          recovery_stage: 4,
        })
        .eq('id', r.id);
    }
  }
}

export async function runNinetyDayRefundCheck(admin: SupabaseClient) {
  const launched = await getPublicLaunchComplete(admin);
  if (launched) return { ok: true, skipped: 'already_launched' as const };

  const { data: earliest } = await admin
    .from('profiles')
    .select('first_prelaunch_purchase_at')
    .not('first_prelaunch_purchase_at', 'is', null)
    .order('first_prelaunch_purchase_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const first = earliest?.first_prelaunch_purchase_at as string | undefined;
  if (!first) return { ok: true, skipped: 'no_purchases' as const };

  const due = new Date(first);
  due.setDate(due.getDate() + 90);
  if (due.getTime() > Date.now()) return { ok: true, skipped: 'not_due' as const };

  const { data: payers } = await admin
    .from('profiles')
    .select('id, email, tier')
    .not('first_prelaunch_purchase_at', 'is', null);

  for (const p of payers ?? []) {
    await enqueueEmail(admin, 'email_4_90_day_refund', String(p.email), {
      userId: p.id,
      tier: p.tier,
      message:
        'We have not reached public launch within 90 days. A full refund is being processed automatically via Dodo Payments (EC-08).',
    });
  }

  const payerIds = (payers ?? []).map((p) => p.id as string).filter(Boolean);
  if (payerIds.length > 0) {
    const { data: txs } = await admin
      .from('provider_transactions')
      .select('provider_payment_id, user_id')
      .in('user_id', payerIds)
      .not('provider_payment_id', 'is', null);
    const seen = new Set<string>();
    for (const t of txs ?? []) {
      const pid = String((t as { provider_payment_id?: string }).provider_payment_id ?? '');
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      await attemptRefundRecorded(admin, pid, 'ec08_ninety_day_no_launch');
    }
    for (const p of payers ?? []) {
      const uid = p.id as string;
      await setTier(admin, uid, 'bookworm');
      await admin
        .from('profiles')
        .update({
          genesis_badge: false,
          alpha_lab_access: false,
          genesis_slot_price_point: null,
          genesis_lifetime_discount: false,
          plan_selection_completed: false,
          prelaunch_holding: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid);
      await admin
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('user_id', uid);
    }
  }

  return { ok: true, notified: (payers ?? []).length, refundsAttempted: payerIds.length };
}

export async function cancelPrelaunchBookwormSage(admin: SupabaseClient, userId: string) {
  const row = await getProfile(admin, userId);
  const tier = (row?.tier as string) ?? 'bookworm';
  if (tier === 'genesis') {
    return { ok: false as const, error: 'Genesis cancellations go through support.' };
  }

  const { data: sub } = await admin
    .from('subscriptions')
    .select('provider_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  const subId = sub?.provider_subscription_id as string | undefined;
  if (subId) {
    const c = await dodoCancelSubscriptionImmediately(subId);
    if (!c.ok) {
      await enqueueEmail(admin, 'email_support_dodo_cancel_failed', 'support@quilora.com', {
        userId,
        subscriptionId: subId,
        detail: c.error,
      });
    }
  }

  const { data: lastTx } = await admin
    .from('provider_transactions')
    .select('provider_payment_id')
    .eq('user_id', userId)
    .not('provider_payment_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const ptx = lastTx?.provider_payment_id as string | undefined;
  if (ptx) {
    await attemptRefundRecorded(admin, ptx, 'ec07_prelaunch_self_cancel');
  }

  await setTier(admin, userId, 'bookworm');
  if (tier === 'bibliophile') {
    await applyBookwormSandboxReadonly(admin, userId);
  }
  await admin
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  await admin
    .from('profiles')
    .update({
      plan_selection_completed: false,
      prelaunch_cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  const email = String(row?.email ?? '');
  if (email) await enqueueEmail(admin, 'email_3_cancel_confirmation', email, { userId, tier });
  return { ok: true as const };
}

/** EC-05 — ops: attach an orphan `provider_transactions` row to an existing Supabase user. */
export async function adminLinkOrphanPayment(
  admin: SupabaseClient,
  input: { transactionRowId: string; targetUserId: string; actor?: string },
) {
  const { data: tx } = await admin.from('provider_transactions').select('id, user_id').eq('id', input.transactionRowId).maybeSingle();
  if (!tx || (tx as { user_id?: string }).user_id) {
    return { ok: false as const, error: 'INVALID_OR_ALREADY_LINKED' };
  }
  const { data: prof } = await admin.from('profiles').select('id').eq('id', input.targetUserId).maybeSingle();
  if (!prof) return { ok: false as const, error: 'USER_NOT_FOUND' };
  await admin
    .from('provider_transactions')
    .update({ user_id: input.targetUserId, reconciled: true })
    .eq('id', input.transactionRowId);
  await admin.from('billing_admin_actions').insert({
    action: 'link_orphan_payment',
    actor: input.actor ?? 'admin',
    user_id: input.targetUserId,
    payload: { provider_transaction_row: input.transactionRowId },
  });
  return { ok: true as const };
}

export async function cancelGenesisReleaseSeat(admin: SupabaseClient, userId: string) {
  const row = await getProfile(admin, userId);
  const pp = (row?.genesis_slot_price_point as string) || '80';
  const releaseTier: GenesisTier = pp === '119' ? 'genesis_119' : pp === '176' ? 'genesis_176' : 'genesis_80';
  await releaseGenesisSlot(admin, releaseTier);

  const { data: genesisTxs } = await admin
    .from('provider_transactions')
    .select('provider_payment_id, product_kind')
    .eq('user_id', userId)
    .in('product_kind', ['genesis_80', 'genesis_119', 'genesis_176', 'lifetime_early_bird', 'lifetime_standard', 'lifetime_plus_sage'])
    .not('provider_payment_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3);
  for (const t of genesisTxs ?? []) {
    const pid = String((t as { provider_payment_id?: string }).provider_payment_id ?? '');
    if (pid) {
      await attemptRefundRecorded(admin, pid, 'ec07_genesis_seat_release');
    }
  }

  await setTier(admin, userId, 'bookworm');
  await admin
    .from('profiles')
    .update({
      genesis_badge: false,
      alpha_lab_access: false,
      genesis_slot_price_point: null,
      genesis_lifetime_discount: false,
      plan_selection_completed: false,
      prelaunch_cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  const email = String(row?.email ?? '');
  if (email) await enqueueEmail(admin, 'email_3_cancel_confirmation', email, { userId, tier: 'genesis_cancelled' });
  return { ok: true as const };
}
