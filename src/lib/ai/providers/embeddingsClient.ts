import { aiHttpUrl } from '../config/aiPublicConfig';
import { retryFetch } from '../http/retryFetch';

export type EmbeddingsClient = {
  embedBatch(texts: string[], model: string, signal?: AbortSignal): Promise<number[][]>;
};

function parseEmbeddingsResponse(json: unknown): number[][] {
  const d = json as { data?: Array<{ embedding?: number[] }> };
  const rows = d?.data ?? [];
  return rows.map((r) => (Array.isArray(r.embedding) ? r.embedding : [])).filter((e) => e.length > 0);
}

/** POST `/api/ai/embeddings` (Voyage via dev proxy or your gateway). */
export function createEmbeddingsHttpClient(): EmbeddingsClient {
  return {
    async embedBatch(texts, model, signal) {
      const res = await retryFetch(aiHttpUrl('/api/ai/embeddings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: texts }),
        signal,
        timeoutMs: 120_000,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Embeddings HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
      const json = await res.json();
      return parseEmbeddingsResponse(json);
    },
  };
}
