import { chunkPagesAware } from '../../documents/pageAwareChunker';
import type { PageTextMap } from '../../documents/pageAwareChunker';
import { readAiPublicConfig } from '../config/aiPublicConfig';
import { createEmbeddingsHttpClient } from '../providers/embeddingsClient';
import { memoryVectorStoreUpsertChunks } from '../stores/memoryVectorStore';
import type { RetrievedChunk } from '../types/groundedAnswer';

const BATCH = 16;

export type IngestDocumentParams = {
  sandboxKey: string;
  documentId: string;
  sourceTitle: string;
  pages: PageTextMap;
  signal?: AbortSignal;
};

export async function ingestDocumentIntoMemoryStore(params: IngestDocumentParams): Promise<{ chunkCount: number; ok: boolean; error?: string }> {
  const cfg = readAiPublicConfig();
  const baseChunks = chunkPagesAware({
    document_id: params.documentId,
    source_title: params.sourceTitle,
    pages: params.pages,
  });
  if (baseChunks.length === 0) {
    return { chunkCount: 0, ok: true };
  }
  const embedder = createEmbeddingsHttpClient();
  const withEmbeddings: RetrievedChunk[] = [];
  try {
    for (let i = 0; i < baseChunks.length; i += BATCH) {
      const slice = baseChunks.slice(i, i + BATCH);
      const texts = slice.map((c) => c.text);
      const vectors = await embedder.embedBatch(texts, cfg.embeddingsModelName, params.signal);
      if (vectors.length !== slice.length) {
        throw new Error('Embedding batch size mismatch');
      }
      for (let j = 0; j < slice.length; j++) {
        withEmbeddings.push({ ...slice[j], embedding: vectors[j] });
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { chunkCount: baseChunks.length, ok: false, error: msg };
  }
  if (cfg.vectorStoreProvider === 'memory') {
    memoryVectorStoreUpsertChunks(params.sandboxKey, withEmbeddings);
  }
  void cfg.vectorStoreProvider;
  return { chunkCount: withEmbeddings.length, ok: true };
}
