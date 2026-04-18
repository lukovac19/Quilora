import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { chunkPagesAware } from '../lib/documents/pageAwareChunker';
import { readAiPublicConfig } from '../lib/ai/config/aiPublicConfig';
import { createEmbeddingsHttpClient } from '../lib/ai/providers/embeddingsClient';
import { ingestDocumentIntoMemoryStore } from '../lib/ai/pipeline/ingestPipeline';
import { memoryVectorStoreQuery } from '../lib/ai/stores/memoryVectorStore';

/** Dev utility: smoke-test chunking + optional embeddings via Vite `/api/ai/*` proxy. */
export function AiRagDebugPage() {
  const [out, setOut] = useState<string>('Run the checks to see output.');
  const run = useCallback(async () => {
    const chunks = chunkPagesAware({
      document_id: 'debug-doc',
      source_title: 'Debug',
      pages: { 1: 'Alpha paragraph.\n\nBeta second block with more text for chunking.', 2: 'Gamma on page two.' },
    });
    let text = `Chunks (${chunks.length}):\n${JSON.stringify(chunks, null, 2)}`;
    const cfg = readAiPublicConfig();
    text += `\n\nPublic AI config: ${JSON.stringify(cfg, null, 2)}`;
    try {
      const client = createEmbeddingsHttpClient();
      const vec = await client.embedBatch(['sanity check'], cfg.embeddingsModelName);
      text += `\n\nEmbedding length: ${vec[0]?.length ?? 0}`;
      const ing = await ingestDocumentIntoMemoryStore({
        sandboxKey: 'debug-sandbox',
        documentId: 'debug-doc',
        sourceTitle: 'Debug',
        pages: { 1: 'Alpha paragraph.\n\nBeta second block.', 2: 'Gamma on page two.' },
      });
      text += `\n\nIngest: ${ing.ok ? 'ok' : 'fail'} chunkCount=${ing.chunkCount} ${ing.error ?? ''}`;
      if (ing.ok) {
        const qv = await client.embedBatch(['Gamma'], cfg.embeddingsModelName);
        const hits = memoryVectorStoreQuery('debug-sandbox', 'debug-doc', qv[0], 3);
        text += `\n\nRetrieval hits: ${hits.map((h) => `${h.chunk_id} p${h.page_number}`).join(', ')}`;
      }
    } catch (e) {
      text += `\n\nAPI error (expected if keys unset): ${e instanceof Error ? e.message : String(e)}`;
    }
    setOut(text);
  }, []);
  return (
    <div className="min-h-screen bg-[#07111f] p-8 text-slate-200">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold text-white">AI RAG debug</h1>
        <p className="text-sm text-slate-400">
          Uses the same chunking and `/api/ai/embeddings` path as Canvas Mode. Set server env vars and run <code className="text-slate-300">npm run dev</code>.
        </p>
        <button
          type="button"
          className="rounded-full bg-[#266ba7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b82c4]"
          onClick={() => void run()}
        >
          Run smoke test
        </button>
        <pre className="max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs">{out}</pre>
        <Link to="/" className="text-sm text-[#6eb6ff] hover:underline">
          ← Home
        </Link>
      </div>
    </div>
  );
}
