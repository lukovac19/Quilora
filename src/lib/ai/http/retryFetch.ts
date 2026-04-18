export type RetryFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
};

const DEFAULT_TIMEOUT = 60_000;
const DEFAULT_RETRIES = 2;

export async function retryFetch(input: string, init: RequestInit & RetryFetchOptions = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, retryDelayMs = 400, signal, ...rest } = init;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), timeoutMs);
    const merged = new AbortController();
    const onAbort = () => merged.abort();
    signal?.addEventListener('abort', onAbort);
    controller.signal.addEventListener('abort', onAbort);
    try {
      const res = await fetch(input, {
        ...rest,
        signal: merged.signal,
      });
      window.clearTimeout(t);
      signal?.removeEventListener('abort', onAbort);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          await sleep(retryDelayMs * (attempt + 1));
          continue;
        }
      }
      return res;
    } catch (e) {
      lastErr = e;
      window.clearTimeout(t);
      signal?.removeEventListener('abort', onAbort);
      if (attempt < retries && !signal?.aborted) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}
