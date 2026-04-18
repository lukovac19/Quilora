/**
 * Dev server middleware: proxies `/api/ai/*` to **Together AI** (chat) and **Voyage AI** (embeddings + rerank).
 * Keys are server-only (never sent to the browser).
 *
 * - `AI_API_KEY` → Together (`/api/ai/chat`)
 * - `EMBEDDINGS_API_KEY` → Voyage embeddings (`/api/ai/embeddings`); falls back to `RERANK_API_KEY` then `AI_API_KEY` if unset
 * - `RERANK_API_KEY` → Voyage rerank (`/api/ai/rerank`); falls back to `EMBEDDINGS_API_KEY` then `AI_API_KEY`
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

const TOGETHER_CHAT_URL = 'https://api.together.xyz/v1/chat/completions';
const VOYAGE_EMBEDDINGS_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_RERANK_URL = 'https://api.voyageai.com/v1/rerank';

function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function quiloraAiProxyPlugin(): Plugin {
  return {
    name: 'quilora-ai-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? '';
        const url = rawUrl.split('?')[0] ?? '';
        if (!url.startsWith('/api/ai/')) return next();
        if (req.method !== 'POST') return next();

        const env = loadEnv(server.config.mode, process.cwd(), '');

        try {
          const bodyText = await readRawBody(req as IncomingMessage);

          if (url === '/api/ai/embeddings') {
            const key = (env.EMBEDDINGS_API_KEY || env.RERANK_API_KEY || env.AI_API_KEY || '').trim();
            if (!key) {
              (res as ServerResponse).statusCode = 503;
              (res as ServerResponse).end(JSON.stringify({ error: 'Missing EMBEDDINGS_API_KEY (or RERANK_API_KEY / AI_API_KEY) in .env' }));
              return;
            }
            const r = await fetch(VOYAGE_EMBEDDINGS_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
              },
              body: bodyText,
            });
            const t = await r.text();
            (res as ServerResponse).statusCode = r.status;
            (res as ServerResponse).setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
            (res as ServerResponse).end(t);
            return;
          }

          if (url === '/api/ai/chat') {
            const key = (env.AI_API_KEY || '').trim();
            if (!key) {
              (res as ServerResponse).statusCode = 503;
              (res as ServerResponse).end(JSON.stringify({ error: 'Missing AI_API_KEY in .env' }));
              return;
            }
            const r = await fetch(TOGETHER_CHAT_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
              },
              body: bodyText,
            });
            const t = await r.text();
            (res as ServerResponse).statusCode = r.status;
            (res as ServerResponse).setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
            (res as ServerResponse).end(t);
            return;
          }

          if (url === '/api/ai/rerank') {
            const key = (env.RERANK_API_KEY || env.EMBEDDINGS_API_KEY || env.AI_API_KEY || '').trim();
            if (!key) {
              (res as ServerResponse).statusCode = 503;
              (res as ServerResponse).end(JSON.stringify({ error: 'Missing RERANK_API_KEY (or EMBEDDINGS_API_KEY / AI_API_KEY) in .env' }));
              return;
            }
            const r = await fetch(VOYAGE_RERANK_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
              },
              body: bodyText,
            });
            const t = await r.text();
            (res as ServerResponse).statusCode = r.status;
            (res as ServerResponse).setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
            (res as ServerResponse).end(t);
            return;
          }

          (res as ServerResponse).statusCode = 404;
          (res as ServerResponse).end(JSON.stringify({ error: 'Unknown AI path' }));
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          (res as ServerResponse).statusCode = 500;
          (res as ServerResponse).setHeader('Content-Type', 'application/json');
          (res as ServerResponse).end(JSON.stringify({ error: msg.slice(0, 400) }));
        }
      });
    },
  };
}
