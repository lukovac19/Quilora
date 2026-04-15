import { supabase } from '../lib/supabase';

export type QuiloraCreditEventType =
  | 'source_upload'
  | 'library_activation'
  | 'lens_activation'
  | 'evidence_anchor'
  | 'evidence_micro_search'
  | 'connector_ai_analysis'
  | 'entity_extract_confirm'
  | 'mastery_blitz'
  | 'study_chat'
  | 'freestyle_prompt'
  | 'boost_pack_purchase'
  | 'monthly_renewal'
  | 'manual_adjustment';

export type CreditLedgerResponse = {
  ok: boolean;
  duplicate?: boolean;
  credit_balance?: number;
  error?: string;
  message?: string;
};

/**
 * Centralized credit mutation — all AI and paid actions should use this (via RPC).
 */
export async function quiloraApplyCredits(params: {
  creditsDelta: number;
  eventType: QuiloraCreditEventType;
  sandboxId?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
}): Promise<CreditLedgerResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'NOT_AUTH', message: 'Sign in required.' };
  }
  const { data, error } = await supabase.rpc('apply_credit_ledger', {
    p_user_id: user.id,
    p_event_type: params.eventType,
    p_credits_delta: params.creditsDelta,
    p_sandbox_id: params.sandboxId ?? null,
    p_metadata: params.metadata ?? {},
    p_idempotency_key: params.idempotencyKey ?? null,
  });
  if (error) {
    console.error('[creditService]', error);
    return { ok: false, error: error.code, message: error.message };
  }
  return (data ?? {}) as CreditLedgerResponse;
}

export async function quiloraDeductCredits(params: {
  amount: number;
  eventType: QuiloraCreditEventType;
  sandboxId?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
}) {
  if (params.amount <= 0) return { ok: false as const, message: 'Invalid amount' };
  return quiloraApplyCredits({
    creditsDelta: -Math.abs(params.amount),
    eventType: params.eventType,
    sandboxId: params.sandboxId,
    metadata: params.metadata,
    idempotencyKey: params.idempotencyKey,
  });
}

export function sourceUploadCreditCost(pageCount: number): number {
  const units = Math.max(1, Math.ceil(Math.max(1, pageCount) / 100));
  return units * 20;
}

export function masteryBlitzCreditCost(questionCount: number): number {
  const q = Math.min(25, Math.max(5, questionCount));
  const ratio = (q - 5) / 20;
  return Math.round(10 + ratio * 15);
}

/** EP-04 CC Library — activate title onto canvas */
export const CC_LIBRARY_ACTIVATION_CREDITS = 5;

/** EP-04 Ghost Node — confirm entity into a real block */
export const ENTITY_EXTRACT_CONFIRM_CREDITS = 3;
