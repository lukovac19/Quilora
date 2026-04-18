import { readAiPublicConfig } from '../config/aiPublicConfig';
import { createEmbeddingsHttpClient } from '../providers/embeddingsClient';
import { createNoopRerankClient, createProxyRerankClient } from '../providers/rerankClient';
import { memoryVectorStoreQuery, memoryVectorStoreQueryMulti } from '../stores/memoryVectorStore';
import type { RetrievedChunk } from '../types/groundedAnswer';

export type RetrieveParams = {
  sandboxKey: string;
  documentIds: string[];
  query: string;
  /** Initial vector recall (feeds Voyage rerank). */
  recallK?: number;
  /** After rerank — chunks passed to the answer model (target 5–10). */
  finalK?: number;
  signal?: AbortSignal;
};

export async function retrieveGroundedContext(params: RetrieveParams): Promise<RetrievedChunk[]> {
  const cfg = readAiPublicConfig();
  const recallK = params.recallK ?? 20;
  const finalK = params.finalK ?? 8;
  const embedder = createEmbeddingsHttpClient();
  let queryEmbedding: number[] | undefined;
  try {
    const qv = await embedder.embedBatch([params.query], cfg.embeddingsModelName, params.signal);
    queryEmbedding = qv[0];
  } catch {
    return [];
  }
  if (!queryEmbedding?.length) return [];

  const primary =
    params.documentIds.length === 1
      ? memoryVectorStoreQuery(params.sandboxKey, params.documentIds[0], queryEmbedding, recallK)
      : memoryVectorStoreQueryMulti(params.sandboxKey, params.documentIds, queryEmbedding, Math.ceil(recallK / params.documentIds.length), recallK);

  const rerank =
    cfg.rerankProvider === 'none' || !cfg.rerankModelName.trim()
      ? createNoopRerankClient()
      : createProxyRerankClient(cfg.rerankModelName);

  return rerank.rerank(params.query, primary, finalK, params.signal);
}
