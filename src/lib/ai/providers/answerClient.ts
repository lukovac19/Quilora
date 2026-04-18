import { aiHttpUrl } from '../config/aiPublicConfig';
import { retryFetch } from '../http/retryFetch';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type AnswerClient = {
  completeJson(system: string, user: string, model: string, signal?: AbortSignal): Promise<string>;
};

function insufficientEvidenceJson(reason: string): string {
  return JSON.stringify({
    answer: 'The answer service is temporarily unavailable or returned an error. No grounded answer can be produced.',
    grounded: false,
    confidence: 0,
    citations: [],
    insufficient_evidence: true,
    reason,
  });
}

/** POST `/api/ai/chat` (Together AI via dev proxy or your gateway). Same message + JSON contract as before. */
export function createAnswerHttpClient(): AnswerClient {
  return {
    async completeJson(system, user, model, signal) {
      try {
        const res = await retryFetch(aiHttpUrl('/api/ai/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ] as ChatMessage[],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          }),
          signal,
          timeoutMs: 120_000,
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          return insufficientEvidenceJson(`http_${res.status}:${t.slice(0, 120)}`);
        }
        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
        const text = json?.choices?.[0]?.message?.content?.trim() ?? '';
        if (!text) return insufficientEvidenceJson('empty_model_response');
        return text;
      } catch {
        return insufficientEvidenceJson('network_or_parse_error');
      }
    },
  };
}
