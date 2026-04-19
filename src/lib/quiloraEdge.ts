import { resolveSupabaseAnonKeyForClient, resolveSupabaseProjectId } from '../utils/supabase/credentials';

export const QUILORA_EDGE_SLUG = 'make-server-5a3d4811';

const DEFAULT_EDGE_TIMEOUT_MS = 45_000;

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Single system prompt for canvas, tutor, and edge — answers about the user's book/PDF from provided text. */
export const QUILORA_BOOK_ASSISTANT_SYSTEM = `You are Quilora, an expert reading companion. The user is studying a book or PDF; their message may include long excerpts from the document—treat that as the only ground truth when present.
Rules:
- Answer in the same language the user writes in when possible.
- Be specific: refer to themes, characters, arguments, and evidence from the excerpts when you can.
- If the message has no document text and you lack context, ask one short clarifying question or give general study tips—never refuse to help.
- Do not mention API keys, backends, sign-in, sandboxes, or placeholders. Never say you cannot answer because of technical limits.`;

export function quiloraFunctionsBaseUrl() {
  return `https://${resolveSupabaseProjectId()}.supabase.co/functions/v1`;
}

/**
 * POST JSON to a Quilora edge path (e.g. `make-server-5a3d4811/chat/<sandboxId>`).
 * Sends both `apikey` and `Authorization` — required by the Supabase Functions gateway.
 */
/** GET JSON from edge (e.g. public billing routes). Optional bearer for user-scoped routes. */
export async function quiloraEdgeGetJson<T>(relativePath: string, accessToken?: string | null): Promise<T> {
  const url = new URL(relativePath.replace(/^\//, ''), `${quiloraFunctionsBaseUrl()}/`);
  const headers: Record<string, string> = { apikey: resolveSupabaseAnonKeyForClient() };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url.href, { method: 'GET', headers }, DEFAULT_EDGE_TIMEOUT_MS);
  } catch (e: unknown) {
    const aborted =
      (typeof e === 'object' && e !== null && 'name' in e && (e as { name?: string }).name === 'AbortError') ||
      (e instanceof Error && /abort/i.test(e.message));
    if (aborted) throw new Error('Request timed out — check your connection and try again.');
    throw e;
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      if (ct.includes('application/json')) {
        const j = (await res.json()) as { message?: string; error?: string };
        detail = j?.message || j?.error || JSON.stringify(j);
      } else {
        detail = (await res.text()).slice(0, 400);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail.slice(0, 280));
  }
  if (!ct.includes('application/json')) {
    const text = (await res.text()).slice(0, 200);
    throw new Error(`Expected JSON from edge function, got: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function quiloraEdgePostJson<T>(relativePath: string, accessToken: string, jsonBody: unknown): Promise<T> {
  const url = new URL(relativePath.replace(/^\//, ''), `${quiloraFunctionsBaseUrl()}/`);
  let res: Response;
  try {
    res = await fetchWithTimeout(
      url.href,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: resolveSupabaseAnonKeyForClient(),
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(jsonBody),
      },
      DEFAULT_EDGE_TIMEOUT_MS,
    );
  } catch (e: unknown) {
    const aborted =
      (typeof e === 'object' && e !== null && 'name' in e && (e as { name?: string }).name === 'AbortError') ||
      (e instanceof Error && /abort/i.test(e.message));
    if (aborted) throw new Error('Request timed out — check your connection and try again.');
    throw e;
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      if (ct.includes('application/json')) {
        const j = (await res.json()) as { message?: string; error?: string };
        detail = j?.message || j?.error || JSON.stringify(j);
      } else {
        detail = (await res.text()).slice(0, 400);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail.slice(0, 280));
  }
  if (!ct.includes('application/json')) {
    const text = (await res.text()).slice(0, 200);
    throw new Error(`Expected JSON from edge function, got: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function parseDeepseekJson(res: Response): Promise<string | null> {
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text || null;
}

/** Browser → DeepSeek (needs VITE_DEEPSEEK_API_KEY; works in prod build). CORS must allow the app origin. */
async function deepseekViaClientKey(userPayload: string): Promise<string | null> {
  const key = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
  if (!key?.trim()) return null;
  try {
    const res = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key.trim()}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: QUILORA_BOOK_ASSISTANT_SYSTEM },
          { role: 'user', content: userPayload },
        ],
        max_tokens: 4096,
      }),
    });
    return parseDeepseekJson(res);
  } catch {
    return null;
  }
}

/** Dev only: Vite proxy injects server-side DEEPSEEK_API_KEY. */
async function deepseekViaDevProxy(userPayload: string): Promise<string | null> {
  if (!import.meta.env.DEV) return null;
  try {
    const res = await fetch('/api/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: QUILORA_BOOK_ASSISTANT_SYSTEM },
          { role: 'user', content: userPayload },
        ],
        max_tokens: 4096,
      }),
    });
    return parseDeepseekJson(res);
  } catch {
    return null;
  }
}

export async function tryQuiloraDeepseek(userPayload: string): Promise<string | null> {
  return (await deepseekViaClientKey(userPayload)) ?? (await deepseekViaDevProxy(userPayload));
}

export async function postSandboxChat(accessToken: string, sessionId: string, message: string) {
  const path = `${QUILORA_EDGE_SLUG}/chat/${encodeURIComponent(sessionId)}`;
  return quiloraEdgePostJson<{ message?: { content?: string }; lowBalance?: unknown }>(path, accessToken, { message });
}
