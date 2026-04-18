/** EP-06 Evidence node — payloads, search, frequency (grounded in Source). */

import type { AiEvidenceBundle } from './ai/types/aiEvidenceBundle';

export type EvidenceSubtype = 'anchor' | 'micro_search' | 'frequency';

export const EVIDENCE_ANCHOR_CREDITS = 2;
export const EVIDENCE_MICRO_SEARCH_CREDITS = 2;

/** Persisted in block.content to disambiguate DB type `evidence` rows (EP-06 vs legacy canvas `block`). */
export const CONTENT_NODE_KIND_EVIDENCE_EP06 = 'evidence-node' as const;

export type EvidenceSearchResult = {
  id: string;
  fragment: string;
  chapterAttribution: string;
  pageNumber: number;
};

export type EvidenceFrequencyPoint = {
  chapterLabel: string;
  count: number;
};

export type EvidenceNodePayload = {
  subtype: EvidenceSubtype;
  linkedSourceNodeId: string;
  sourceDocumentLabel: string;
  loading?: boolean;
  /** Anchor */
  attachedBlockLabel?: string;
  verbatimQuote?: string;
  chapterSectionCitation?: string;
  trustFactorLabel?: string;
  anchorCreditsDebited?: number;
  /** Micro-detail search */
  searchQuery?: string;
  searchResults?: EvidenceSearchResult[];
  searchCreditsDebited?: number;
  /** Frequency (free) */
  frequencyPhrase?: string;
  frequencyByChapter?: EvidenceFrequencyPoint[];
  maxFrequency?: number;
  /** Structured RAG output for evidence anchor */
  anchorAiEvidence?: AiEvidenceBundle | null;
};

export function initialEvidencePayload(
  subtype: EvidenceSubtype,
  linkedSourceNodeId: string,
  sourceDocumentLabel: string,
): EvidenceNodePayload {
  return {
    subtype,
    linkedSourceNodeId,
    sourceDocumentLabel,
    loading: subtype === 'anchor',
    trustFactorLabel: 'High',
  };
}

export function microDetailSearchInCorpus(
  query: string,
  pageTextByPage: Record<number, string>,
  maxResults = 12,
): EvidenceSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: EvidenceSearchResult[] = [];
  const pages = Object.keys(pageTextByPage)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  for (const page of pages) {
    const text = String(pageTextByPage[page] ?? '');
    const lower = text.toLowerCase();
    let idx = 0;
    while (idx < lower.length && out.length < maxResults) {
      const found = lower.indexOf(q, idx);
      if (found < 0) break;
      const start = Math.max(0, found - 70);
      const end = Math.min(text.length, found + q.length + 90);
      const fragment = text.slice(start, end).replace(/\s+/g, ' ').trim();
      out.push({
        id: `hit-${page}-${found}-${out.length}`,
        fragment,
        chapterAttribution: `Page ${page} · verbatim offset ${found}`,
        pageNumber: page,
      });
      idx = found + Math.max(1, q.length);
    }
  }
  return out;
}

export function frequencyByChapter(
  phrase: string,
  pageTextByPage: Record<number, string>,
): { points: EvidenceFrequencyPoint[]; max: number } {
  const p = phrase.trim().toLowerCase();
  if (!p) return { points: [], max: 0 };
  const pages = Object.keys(pageTextByPage)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const points: EvidenceFrequencyPoint[] = [];
  let max = 0;
  for (const page of pages) {
    const text = String(pageTextByPage[page] ?? '').toLowerCase();
    if (!text) continue;
    let count = 0;
    let i = 0;
    while (i < text.length) {
      const j = text.indexOf(p, i);
      if (j < 0) break;
      count += 1;
      i = j + Math.max(1, p.length);
    }
    points.push({ chapterLabel: `Ch. slice · p.${page}`, count });
    max = Math.max(max, count);
  }
  if (points.length === 0) {
    points.push({ chapterLabel: 'p.1', count: 0 });
  }
  return { points, max };
}

export function buildAnchorFromCorpus(
  sourceDocumentLabel: string,
  pageTextByPage: Record<number, string>,
): { verbatimQuote: string; chapterSectionCitation: string; attachedBlockLabel: string } {
  const pages = Object.keys(pageTextByPage)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const first = pages[0] ?? 1;
  const raw = String(pageTextByPage[first] ?? '').replace(/\s+/g, ' ').trim();
  const verbatimQuote = raw.length > 380 ? `${raw.slice(0, 380)}…` : raw || '(No extractable text — add PDF text in Reading Mode.)';
  return {
    verbatimQuote,
    chapterSectionCitation: `Section · page ${first} · ${sourceDocumentLabel}`,
    attachedBlockLabel: `Anchored to · ${sourceDocumentLabel}`,
  };
}

export function parseEvidencePayload(raw: unknown): EvidenceNodePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  const sub = String(e.subtype ?? '');
  const subtype: EvidenceSubtype = sub === 'anchor' || sub === 'micro_search' || sub === 'frequency' ? sub : 'anchor';
  const linked = String(e.linkedSourceNodeId ?? '');
  if (!linked) return null;
  const resultsRaw = e.searchResults;
  const searchResults = Array.isArray(resultsRaw)
    ? (resultsRaw as Record<string, unknown>[]).map((r, i) => ({
        id: String(r.id ?? `sr-${i}`),
        fragment: String(r.fragment ?? ''),
        chapterAttribution: String(r.chapterAttribution ?? ''),
        pageNumber: Number(r.pageNumber ?? 1),
      }))
    : undefined;
  const freqRaw = e.frequencyByChapter;
  const frequencyByChapter = Array.isArray(freqRaw)
    ? (freqRaw as Record<string, unknown>[]).map((r, i) => ({
        chapterLabel: String(r.chapterLabel ?? `p.${i + 1}`),
        count: Number(r.count ?? 0),
      }))
    : undefined;
  const aiRaw = e.anchorAiEvidence;
  let anchorAiEvidence: AiEvidenceBundle | null | undefined;
  if (aiRaw === null) anchorAiEvidence = null;
  else if (aiRaw && typeof aiRaw === 'object') {
    const a = aiRaw as Record<string, unknown>;
    const citRaw = a.citations;
    const citations = Array.isArray(citRaw)
      ? (citRaw as Record<string, unknown>[]).map((x) => ({
          document_id: String(x.document_id ?? ''),
          source_title: String(x.source_title ?? ''),
          page_number: Number(x.page_number ?? 0) || 0,
          chunk_id: String(x.chunk_id ?? ''),
          quoted_text: String(x.quoted_text ?? ''),
          start_char: Number(x.start_char ?? 0) || 0,
          end_char: Number(x.end_char ?? 0) || 0,
        }))
      : [];
    anchorAiEvidence = {
      grounded: Boolean(a.grounded),
      confidence: Number(a.confidence ?? 0) || 0,
      citations,
      insufficient_evidence: Boolean(a.insufficient_evidence),
      reason: String(a.reason ?? ''),
      trust_state:
        a.trust_state === 'ungrounded' || a.trust_state === 'insufficient' || a.trust_state === 'unanchored' || a.trust_state === 'grounded'
          ? a.trust_state
          : 'insufficient',
    };
  }
  return {
    subtype,
    linkedSourceNodeId: linked,
    sourceDocumentLabel: String(e.sourceDocumentLabel ?? ''),
    loading: Boolean(e.loading),
    attachedBlockLabel: e.attachedBlockLabel != null ? String(e.attachedBlockLabel) : undefined,
    verbatimQuote: e.verbatimQuote != null ? String(e.verbatimQuote) : undefined,
    chapterSectionCitation: e.chapterSectionCitation != null ? String(e.chapterSectionCitation) : undefined,
    trustFactorLabel: e.trustFactorLabel != null ? String(e.trustFactorLabel) : undefined,
    anchorCreditsDebited: e.anchorCreditsDebited != null ? Number(e.anchorCreditsDebited) : undefined,
    searchQuery: e.searchQuery != null ? String(e.searchQuery) : undefined,
    searchResults,
    searchCreditsDebited: e.searchCreditsDebited != null ? Number(e.searchCreditsDebited) : undefined,
    frequencyPhrase: e.frequencyPhrase != null ? String(e.frequencyPhrase) : undefined,
    frequencyByChapter,
    maxFrequency: e.maxFrequency != null ? Number(e.maxFrequency) : undefined,
    anchorAiEvidence,
  };
}
