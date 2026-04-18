import { filterCitationsAgainstChunks } from '../citationGuard';
import { readAiPublicConfig } from '../config/aiPublicConfig';
import {
  analyticalLensSystem,
  connectorReasoningSystem,
  evidenceAnchorSystem,
  freestyleConnectedSystem,
  freestyleStandaloneSystem,
  groundedQaSystem,
} from '../prompts/groundedModes';
import { parseGroundedAnswerJson, parseGroundedAnswerWithLensExtras } from '../parseGroundedJson';
import { createAnswerHttpClient } from '../providers/answerClient';
import type { GroundedAnswerJson, GroundedAnswerWithLensExtras, RetrievedChunk } from '../types/groundedAnswer';

function formatContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (c, i) =>
        `[#${i + 1}] chunk_id=${c.chunk_id} document_id=${c.document_id} page_number=${c.page_number} title=${JSON.stringify(
          c.source_title,
        )}\nTEXT:\n${c.text}\n---`,
    )
    .join('\n');
}

export async function runGroundedAnswer(params: {
  system: string;
  userInstruction: string;
  chunks: RetrievedChunk[];
  signal?: AbortSignal;
}): Promise<GroundedAnswerJson> {
  const cfg = readAiPublicConfig();
  const client = createAnswerHttpClient();
  const ctx = formatContextBlock(params.chunks);
  const user = `${params.userInstruction}\n\nCONTEXT (only source of truth):\n${ctx}`;
  const raw = await client.completeJson(params.system, user, cfg.aiModelName, params.signal);
  const parsed = parseGroundedAnswerJson(raw);
  if (!parsed) {
    return {
      answer: 'The model returned invalid JSON. No grounded answer is available.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: 'parse_error',
    };
  }
  const clean = filterCitationsAgainstChunks(parsed.citations, params.chunks);
  let grounded = parsed.grounded && clean.length > 0 && !parsed.insufficient_evidence;
  if (parsed.grounded && clean.length === 0) {
    grounded = false;
  }
  return {
    ...parsed,
    citations: clean,
    grounded,
    insufficient_evidence: parsed.insufficient_evidence || !grounded,
  };
}

export async function runGroundedLensAnswer(params: {
  subtypeLabel: string;
  userQuestion: string;
  chunks: RetrievedChunk[];
  signal?: AbortSignal;
}): Promise<GroundedAnswerWithLensExtras> {
  const cfg = readAiPublicConfig();
  const client = createAnswerHttpClient();
  const ctx = formatContextBlock(params.chunks);
  const user = `Lens subtype: ${params.subtypeLabel}\nTask: ${params.userQuestion}\n\nCONTEXT (only source of truth):\n${ctx}`;
  const raw = await client.completeJson(analyticalLensSystem(params.subtypeLabel), user, cfg.aiModelName, params.signal);
  const parsed = parseGroundedAnswerWithLensExtras(raw);
  if (!parsed) {
    return {
      answer: 'The model returned invalid JSON.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: 'parse_error',
    };
  }
  const clean = filterCitationsAgainstChunks(parsed.citations, params.chunks);
  let grounded = parsed.grounded && clean.length > 0 && !parsed.insufficient_evidence;
  if (parsed.grounded && clean.length === 0) grounded = false;
  return {
    ...parsed,
    citations: clean,
    grounded,
    insufficient_evidence: parsed.insufficient_evidence || !grounded,
  };
}

export async function runEvidenceAnchorAnswer(params: { chunks: RetrievedChunk[]; signal?: AbortSignal }): Promise<GroundedAnswerJson> {
  return runGroundedAnswer({
    system: evidenceAnchorSystem(),
    userInstruction: 'Select the strongest opening anchor: one contiguous verbatim quote that best represents the start of the material.',
    chunks: params.chunks,
    signal: params.signal,
  });
}

export async function runConnectorAnswer(params: {
  linkLabel: string;
  blockA: string;
  blockB: string;
  userHypothesis?: string;
  chunks: RetrievedChunk[];
  signal?: AbortSignal;
}): Promise<GroundedAnswerJson> {
  const extra =
    `Block A summary: ${params.blockA.slice(0, 1500)}\nBlock B summary: ${params.blockB.slice(0, 1500)}\n` +
    (params.userHypothesis ? `User hypothesis: ${params.userHypothesis.slice(0, 1200)}\n` : '');
  return runGroundedAnswer({
    system: connectorReasoningSystem(params.linkLabel),
    userInstruction: `${extra}\nExplain the relationship using CONTEXT only.`,
    chunks: params.chunks,
    signal: params.signal,
  });
}

export async function runFreestyleConnectedAnswer(params: {
  thread: string;
  chunks: RetrievedChunk[];
  signal?: AbortSignal;
}): Promise<GroundedAnswerJson> {
  return runGroundedAnswer({
    system: freestyleConnectedSystem(),
    userInstruction: `Conversation:\n${params.thread}`,
    chunks: params.chunks,
    signal: params.signal,
  });
}

export async function runFreestyleStandaloneAnswer(params: { thread: string; signal?: AbortSignal }): Promise<GroundedAnswerJson> {
  const cfg = readAiPublicConfig();
  const client = createAnswerHttpClient();
  const raw = await client.completeJson(
    freestyleStandaloneSystem(),
    `Conversation:\n${params.thread}\n\n(No document CONTEXT — general knowledge mode.)`,
    cfg.aiModelName,
    params.signal,
  );
  const parsed = parseGroundedAnswerJson(raw);
  if (!parsed) {
    return {
      answer: 'Invalid JSON from model.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: false,
      reason: 'parse_error',
    };
  }
  return { ...parsed, grounded: false, citations: [], insufficient_evidence: false };
}

export async function runGroundedReadingQa(params: { question: string; chunks: RetrievedChunk[]; signal?: AbortSignal }): Promise<GroundedAnswerJson> {
  return runGroundedAnswer({
    system: groundedQaSystem(),
    userInstruction: `User question: ${params.question}`,
    chunks: params.chunks,
    signal: params.signal,
  });
}
