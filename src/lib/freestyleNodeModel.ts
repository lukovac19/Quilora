/** EP-08 Freestyle node — open-ended chat; standalone vs connected to Source. */

import type { AiEvidenceBundle } from './ai/types/aiEvidenceBundle';

export type FreestyleMode = 'standalone' | 'connected';

export type FreestyleUserMessage = {
  id: string;
  role: 'user';
  content: string;
  /** When false, this turn is dimmed and omitted from the next API context (except as visual history). */
  includedInContext: boolean;
};

export type FreestyleAssistantMessage = {
  id: string;
  role: 'assistant';
  content: string;
  pending?: boolean;
  aiEvidence?: AiEvidenceBundle | null;
};

export type FreestyleThreadMessage = FreestyleUserMessage | FreestyleAssistantMessage;

export type FreestyleNodePayload = {
  mode: FreestyleMode;
  linkedSourceNodeId: string | null;
  /** Short label for chips / grounding copy */
  sourceDocumentLabel: string;
  messages: FreestyleThreadMessage[];
};

export const FREESTYLE_PROMPT_CREDITS = 1;

export function initialFreestylePayload(
  mode: FreestyleMode,
  linkedSourceNodeId: string | null,
  sourceDocumentLabel: string,
): FreestyleNodePayload {
  return {
    mode,
    linkedSourceNodeId,
    sourceDocumentLabel: sourceDocumentLabel || '—',
    messages: [],
  };
}

export function parseFreestylePayload(raw: unknown): FreestyleNodePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const modeRaw = String(o.mode ?? 'standalone');
  const mode: FreestyleMode = modeRaw === 'connected' ? 'connected' : 'standalone';
  const linkedSourceNodeId =
    o.linkedSourceNodeId != null && String(o.linkedSourceNodeId) ? String(o.linkedSourceNodeId) : null;
  const sourceDocumentLabel = String(o.sourceDocumentLabel ?? '');
  const rawMsgs = Array.isArray(o.messages) ? o.messages : [];
  const messages: FreestyleThreadMessage[] = [];
  for (const item of rawMsgs) {
    if (!item || typeof item !== 'object') continue;
    const m = item as Record<string, unknown>;
    const id = String(m.id ?? '');
    const role = String(m.role ?? '');
    if (!id) continue;
    if (role === 'user') {
      messages.push({
        id,
        role: 'user',
        content: String(m.content ?? ''),
        includedInContext: m.includedInContext !== false,
      });
    } else if (role === 'assistant') {
      const aiRaw = m.aiEvidence;
      let aiEvidence: AiEvidenceBundle | null | undefined;
      if (aiRaw === null) aiEvidence = null;
      else if (aiRaw && typeof aiRaw === 'object') {
        const a = aiRaw as Record<string, unknown>;
        const citRaw = a.citations;
        const citations = Array.isArray(citRaw)
          ? (citRaw as Record<string, unknown>[]).map((x) => ({
              document_id: String(x.document_id ?? ''),
              source_title: String(x.source_title ?? ''),
              page_number: Number(x.page_number ?? 0) || 0,
              chunk_id: String(x.chunk_id ?? ''),
              quoted_text: String(x.quoted_text ?? ''),
              start_char: Number(x.start_char ?? 0) || 0,
              end_char: Number(x.end_char ?? 0) || 0,
            }))
          : [];
        aiEvidence = {
          grounded: Boolean(a.grounded),
          confidence: Number(a.confidence ?? 0) || 0,
          citations,
          insufficient_evidence: Boolean(a.insufficient_evidence),
          reason: String(a.reason ?? ''),
          trust_state:
            a.trust_state === 'ungrounded' || a.trust_state === 'insufficient' || a.trust_state === 'unanchored' || a.trust_state === 'grounded'
              ? a.trust_state
              : 'insufficient',
        };
      }
      messages.push({
        id,
        role: 'assistant',
        content: String(m.content ?? ''),
        pending: Boolean(m.pending),
        aiEvidence,
      });
    }
  }
  return { mode, linkedSourceNodeId, sourceDocumentLabel, messages };
}

/**
 * Build a single prompt string from thread state when the last message is the new user turn
 * and an assistant placeholder may follow. Uses only user rows with includedInContext and
 * their immediately following assistant content.
 */
export function buildFreestylePromptContext(messages: FreestyleThreadMessage[]): string {
  if (messages.length === 0) return '';
  let endExclusive = messages.length;
  const last = messages[endExclusive - 1];
  if (last.role === 'assistant' && (last.pending || !last.content.trim())) {
    endExclusive -= 1;
  }
  if (endExclusive <= 0) return '';
  const newUser = messages[endExclusive - 1];
  if (newUser.role !== 'user') return '';
  const history = messages.slice(0, endExclusive - 1);
  const parts: string[] = [];
  let i = 0;
  while (i < history.length) {
    const m = history[i];
    if (m.role === 'user' && m.includedInContext) {
      parts.push(`User: ${m.content}`);
      const next = history[i + 1];
      if (next?.role === 'assistant' && next.content.trim()) {
        parts.push(`Assistant: ${next.content}`);
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }
    i += 1;
  }
  parts.push(`User: ${newUser.content}`);
  return parts.join('\n\n').trim();
}

export function countIncludedContextTurns(messages: FreestyleThreadMessage[]): number {
  return messages.filter((m): m is FreestyleUserMessage => m.role === 'user' && m.includedInContext).length;
}
