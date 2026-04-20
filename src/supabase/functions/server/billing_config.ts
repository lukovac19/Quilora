export type QuiloraTier = 'bookworm' | 'bibliophile' | 'genesis' | 'early_access';

/** Must match public.credit_events.event_type check constraint */
export type CreditEventType =
  | 'source_upload'
  | 'library_activation'
  | 'lens_activation'
  | 'entity_extract_confirm'
  | 'evidence_anchor'
  | 'evidence_micro_search'
  | 'connector_ai_analysis'
  | 'mastery_blitz'
  | 'study_chat'
  | 'freestyle_prompt'
  | 'boost_pack_purchase'
  | 'monthly_renewal'
  | 'manual_adjustment';

export const PRICING = {
  genesis80Usd: 80,
  genesis119Usd: 119,
  bookwormMonthlyUsd: 6,
  bibliophileMonthlyUsd: 16,
  boostPackUsd: 1.99,
} as const;

export const CREDIT_RULES = {
  uploadPer100Pages: 20,
  libraryActivation: 5,
  promptCost: 1,
  boostPackCredits: 200,
  lowBalanceThreshold: 100,
  masteryBlitzMin: 10,
  masteryBlitzMax: 25,
} as const;

export const TIER_LIMITS: Record<QuiloraTier, { monthlyCredits: number; maxSandboxes: number | null }> = {
  bookworm: { monthlyCredits: 800, maxSandboxes: 5 },
  early_access: { monthlyCredits: 800, maxSandboxes: 5 },
  bibliophile: { monthlyCredits: 2500, maxSandboxes: null },
  genesis: { monthlyCredits: 15000, maxSandboxes: null },
};

export const GENESIS_SLOT_LIMITS = {
  genesis80: 50,
  genesis119: 150,
  /** Bundled lifetime + 1Y Sage — high cap, inventory row `176` */
  genesis176: 100_000,
} as const;

export function sourceUploadCreditCost(pages: number): number {
  const n = Math.max(1, Math.ceil(Math.max(1, pages) / 100));
  return n * CREDIT_RULES.uploadPer100Pages;
}
