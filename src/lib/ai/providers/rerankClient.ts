import { aiHttpUrl, readAiPublicConfig } from '../config/aiPublicConfig';
import { retryFetch } from '../http/retryFetch';
import type { RetrievedChunk } from '../types/groundedAnswer';

export type RerankClient = {
  rerank(query: string, chunks: RetrievedChunk[], topN: number, signal?: AbortSignal): Promise<RetrievedChunk[]>;
};

/** Identity rerank — preserves incoming order (used when provider is `none` or keys missing). */
export function createNoopRerankClient(): RerankClient {
  return {
    async rerank(_query, chunks, topN) {
      return chunks.slice(0, topN);
    },
  };
}

/**
 * POST `/api/ai/rerank` — Voyage returns `{ data: [{ index, relevance_score }] }` sorted by score (desc).
 */
export function createProxyRerankClient(model: string): RerankClient {
  return {
    async rerank(query, chunks, topN, signal) {
      if (!model.trim() || readAiPublicConfig().rerankProvider === 'none') {
        return chunks.slice(0, topN);
      }
      const documents = chunks.map((c) => c.text.slice(0, 8000));
      try {
        const res = await retryFetch(aiHttpUrl('/api/ai/rerank'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, query, documents, top_k: topN }),
          signal,
          timeoutMs: 60_000,
        });
        if (!res.ok) {
          return chunks.slice(0, topN);
        }
        const json = (await res.json()) as {
          data?: Array<{ index: number; relevance_score?: number }>;
          results?: Array<{ index: number; relevance_score?: number }>;
        };
        const rows = json?.data ?? json?.results ?? [];
        if (!rows.length) return chunks.slice(0, topN);
        const ordered = rows.map((r) => chunks[r.index]).filter((c): c is RetrievedChunk => Boolean(c));
        return (ordered.length ? ordered : chunks).slice(0, topN);
      } catch {
        return chunks.slice(0, topN);
      }
    },
  };
}
