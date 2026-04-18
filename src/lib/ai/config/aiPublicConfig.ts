/**
 * Browser-visible provider hints (no secrets).
 * Server keys: AI_API_KEY, EMBEDDINGS_API_KEY, RERANK_API_KEY (see .env.example).
 */
export function readAiPublicConfig() {
  return {
    aiProvider: (import.meta.env.VITE_AI_PROVIDER as string | undefined)?.trim() || 'together',
    embeddingsProvider: (import.meta.env.VITE_EMBEDDINGS_PROVIDER as string | undefined)?.trim() || 'voyage',
    rerankProvider: (import.meta.env.VITE_RERANK_PROVIDER as string | undefined)?.trim() || 'voyage',
    aiModelName:
      (import.meta.env.VITE_AI_MODEL_NAME as string | undefined)?.trim() || 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    embeddingsModelName: (import.meta.env.VITE_EMBEDDINGS_MODEL_NAME as string | undefined)?.trim() || 'voyage-3-large',
    rerankModelName: (import.meta.env.VITE_RERANK_MODEL_NAME as string | undefined)?.trim() || 'rerank-2.5-lite',
    /** Optional absolute base for AI HTTP calls when not same-origin (e.g. deployed API gateway). */
    httpBase: (import.meta.env.VITE_AI_HTTP_BASE as string | undefined)?.trim() || '',
    vectorStoreProvider: (import.meta.env.VITE_VECTOR_STORE_PROVIDER as string | undefined)?.trim() || 'memory',
  };
}

export function aiHttpUrl(path: string): string {
  const base = readAiPublicConfig().httpBase.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  if (base) return `${base}${p}`;
  return p;
}
