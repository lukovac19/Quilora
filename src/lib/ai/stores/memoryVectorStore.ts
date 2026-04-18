import type { RetrievedChunk } from '../types/groundedAnswer';

type StoreKey = string;

function keyOf(sandboxKey: string, documentId: string): StoreKey {
  return `${sandboxKey}::${documentId}`;
}

const stores = new Map<StoreKey, RetrievedChunk[]>();

export function memoryVectorStoreClearDocument(sandboxKey: string, documentId: string) {
  stores.delete(keyOf(sandboxKey, documentId));
}

export function memoryVectorStoreUpsertChunks(sandboxKey: string, chunks: RetrievedChunk[]) {
  if (chunks.length === 0) return;
  const docId = chunks[0].document_id;
  const k = keyOf(sandboxKey, docId);
  stores.set(k, chunks);
}

export function memoryVectorStoreGetChunks(sandboxKey: string, documentId: string): RetrievedChunk[] {
  return stores.get(keyOf(sandboxKey, documentId)) ?? [];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export function memoryVectorStoreQuery(
  sandboxKey: string,
  documentId: string,
  queryEmbedding: number[],
  topK: number,
): RetrievedChunk[] {
  const list = memoryVectorStoreGetChunks(sandboxKey, documentId);
  const scored = list
    .map((c) => ({
      c,
      s: c.embedding && c.embedding.length === queryEmbedding.length ? cosineSimilarity(queryEmbedding, c.embedding) : 0,
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map((x) => ({ ...x.c, score: x.s }));
  return scored;
}

/** Query across multiple document IDs (same sandbox). */
export function memoryVectorStoreQueryMulti(
  sandboxKey: string,
  documentIds: string[],
  queryEmbedding: number[],
  topKPerDoc: number,
  finalTop: number,
): RetrievedChunk[] {
  const pool: RetrievedChunk[] = [];
  for (const docId of documentIds) {
    pool.push(...memoryVectorStoreQuery(sandboxKey, docId, queryEmbedding, topKPerDoc));
  }
  return pool.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, finalTop);
}
