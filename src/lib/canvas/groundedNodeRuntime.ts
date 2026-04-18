import type { AiEvidenceBundle } from '../ai/types/aiEvidenceBundle';
import type { GroundedAnswerJson } from '../ai/types/groundedAnswer';
import type { LensSubtype, PersonaTraitChip, PlotEventBlock } from '../lensNodeModel';
import { ingestDocumentIntoMemoryStore } from '../ai/pipeline/ingestPipeline';
import {
  runConnectorAnswer,
  runEvidenceAnchorAnswer,
  runFreestyleConnectedAnswer,
  runFreestyleStandaloneAnswer,
  runGroundedLensAnswer,
} from '../ai/pipeline/answerPipeline';
import { retrieveGroundedContext } from '../ai/pipeline/retrievePipeline';
import { memoryVectorStoreGetChunks } from '../ai/stores/memoryVectorStore';
import { trustStateFromAnswer } from '../ai/utils/trustState';
import { registerSourceCorpus } from '../documents/corpusRegistry';
import type { PageTextMap } from '../documents/pageAwareChunker';

export function bundleFromAnswer(g: GroundedAnswerJson, mode: Parameters<typeof trustStateFromAnswer>[1]): AiEvidenceBundle {
  return {
    grounded: g.grounded,
    confidence: g.confidence,
    citations: g.citations,
    insufficient_evidence: g.insufficient_evidence,
    reason: g.reason,
    trust_state: trustStateFromAnswer(g, mode),
  };
}

export async function ensureDocumentIngested(params: {
  sandboxKey: string;
  documentId: string;
  sourceTitle: string;
  pages: PageTextMap;
  signal?: AbortSignal;
}): Promise<{ ok: boolean; error?: string }> {
  const existing = memoryVectorStoreGetChunks(params.sandboxKey, params.documentId);
  if (existing.length > 0) return { ok: true };
  registerSourceCorpus({
    documentId: params.documentId,
    sourceTitle: params.sourceTitle,
    pages: params.pages,
    canvasSourceNodeId: null,
  });
  return ingestDocumentIntoMemoryStore({
    sandboxKey: params.sandboxKey,
    documentId: params.documentId,
    sourceTitle: params.sourceTitle,
    pages: params.pages,
    signal: params.signal,
  });
}

function lensQuery(subtype: LensSubtype, characterName?: string): string {
  switch (subtype) {
    case 'plot_events':
      return 'Identify a concise ordered chain of plot beats and turning points supported by the text.';
    case 'persona':
      return `Analyze the character "${characterName || 'the focal character'}" using motives, contradictions, and social presentation.`;
    case 'theme':
      return 'What central themes are most strongly supported by recurring evidence in the text?';
    case 'symbol':
      return 'What symbols or motifs recur, and what evidence ties them to meaning?';
    case 'idea':
    default:
      return 'What thesis or core message is argued in the passage material?';
  }
}

const SUBTYPE_LABELS: Record<LensSubtype, string> = {
  plot_events: 'Plot & events',
  persona: 'Persona',
  theme: 'Theme',
  symbol: 'Symbol / motif',
  idea: 'Idea / message',
};

export async function runLensGroundedPipeline(params: {
  sandboxKey: string;
  documentId: string;
  sourceTitle: string;
  pages: PageTextMap;
  subtype: LensSubtype;
  characterName?: string;
  signal?: AbortSignal;
}): Promise<{
  answer: GroundedAnswerJson;
  extras: import('../ai/types/groundedAnswer').GroundedAnswerWithLensExtras;
  personaTraits?: PersonaTraitChip[];
  plotEvents?: PlotEventBlock[];
  ingestError?: string;
}> {
  const ing = await ensureDocumentIngested({
    sandboxKey: params.sandboxKey,
    documentId: params.documentId,
    sourceTitle: params.sourceTitle,
    pages: params.pages,
    signal: params.signal,
  });
  if (!ing.ok) {
    const fail: GroundedAnswerJson = {
      answer: 'Vector index could not be built (embeddings unavailable). Configure API keys and retry.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: ing.error ?? 'ingest_failed',
    };
    return { answer: fail, extras: { ...fail }, ingestError: ing.error };
  }
  const q = lensQuery(params.subtype, params.characterName);
  const chunks = await retrieveGroundedContext({
    sandboxKey: params.sandboxKey,
    documentIds: [params.documentId],
    query: q,
    signal: params.signal,
  });
  if (chunks.length === 0) {
    const fail: GroundedAnswerJson = {
      answer: 'No retrievable chunks were found for this Source. Re-upload or wait for text extraction to finish.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: 'no_chunks',
    };
    return { answer: fail, extras: { ...fail } };
  }
  const extras = await runGroundedLensAnswer({
    subtypeLabel: SUBTYPE_LABELS[params.subtype],
    userQuestion: q,
    chunks,
    signal: params.signal,
  });
  const answer: GroundedAnswerJson = {
    answer: extras.answer,
    grounded: extras.grounded,
    confidence: extras.confidence,
    citations: extras.citations,
    insufficient_evidence: extras.insufficient_evidence,
    reason: extras.reason,
  };

  let personaTraits: PersonaTraitChip[] | undefined;
  if (params.subtype === 'persona' && extras?.persona_traits?.length) {
    personaTraits = extras.persona_traits.map((t, i) => ({
      id: `trait-rag-${i}`,
      label: t.label || 'Trait',
      quote: t.quoted_text ? `"${t.quoted_text}"` : '—',
      citation: `${params.sourceTitle} · p.${t.page_number} · ${t.chunk_id}`,
      expanded: false,
    }));
  }
  let plotEvents: PlotEventBlock[] | undefined;
  if (params.subtype === 'plot_events' && extras?.plot_events?.length) {
    plotEvents = extras.plot_events.map((e, i) => ({
      id: `pe-rag-${i}`,
      sequenceNumber: i + 1,
      title: e.title || `Beat ${i + 1}`,
      significance: e.significance || '—',
      chapterCitation: `p.${e.page_number} · ${e.chunk_id}`,
    }));
  }
  return { answer, extras: extras ?? { ...answer }, personaTraits, plotEvents };
}

export async function runEvidenceAnchorPipeline(params: {
  sandboxKey: string;
  documentId: string;
  sourceTitle: string;
  pages: PageTextMap;
  signal?: AbortSignal;
}): Promise<{ answer: GroundedAnswerJson; ingestError?: string }> {
  const ing = await ensureDocumentIngested({
    sandboxKey: params.sandboxKey,
    documentId: params.documentId,
    sourceTitle: params.sourceTitle,
    pages: params.pages,
    signal: params.signal,
  });
  if (!ing.ok) {
    return {
      answer: {
        answer: 'Embeddings pipeline unavailable — cannot anchor.',
        grounded: false,
        confidence: 0,
        citations: [],
        insufficient_evidence: true,
        reason: ing.error ?? 'ingest_failed',
      },
      ingestError: ing.error,
    };
  }
  const chunks = await retrieveGroundedContext({
    sandboxKey: params.sandboxKey,
    documentIds: [params.documentId],
    query: 'opening passage representative anchor verbatim',
    recallK: 20,
    finalK: 6,
    signal: params.signal,
  });
  if (!chunks.length) {
    return {
      answer: {
        answer: 'No evidence chunks available for this Source.',
        grounded: false,
        confidence: 0,
        citations: [],
        insufficient_evidence: true,
        reason: 'no_chunks',
      },
    };
  }
  const answer = await runEvidenceAnchorAnswer({ chunks, signal: params.signal });
  return { answer };
}

export async function runConnectorGroundedPipeline(params: {
  sandboxKey: string;
  documentIds: string[];
  linkLabel: string;
  blockA: string;
  blockB: string;
  userHypothesis?: string;
  signal?: AbortSignal;
}): Promise<GroundedAnswerJson> {
  const ids = params.documentIds.filter(Boolean);
  if (!ids.length) {
    return {
      answer: 'No linked Source corpora found on the canvas.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: 'no_documents',
    };
  }
  for (const id of ids) {
    const chunks = memoryVectorStoreGetChunks(params.sandboxKey, id);
    if (chunks.length === 0) {
      return {
        answer: 'One or more Sources are not indexed yet. Open Reading Mode or re-attach the PDF, then retry.',
        grounded: false,
        confidence: 0,
        citations: [],
        insufficient_evidence: true,
        reason: 'not_indexed',
      };
    }
  }
  const q = `${params.linkLabel} relationship between blocks: ${params.blockA.slice(0, 200)} … vs … ${params.blockB.slice(0, 200)}`;
  const chunks = await retrieveGroundedContext({
    sandboxKey: params.sandboxKey,
    documentIds: ids,
    query: q,
    recallK: 20,
    finalK: 10,
    signal: params.signal,
  });
  if (!chunks.length) {
    return {
      answer: 'Retrieval returned no context.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: 'no_chunks',
    };
  }
  return runConnectorAnswer({
    linkLabel: params.linkLabel,
    blockA: params.blockA,
    blockB: params.blockB,
    userHypothesis: params.userHypothesis,
    chunks,
    signal: params.signal,
  });
}

export async function runFreestyleGrounded(params: {
  mode: 'standalone' | 'connected';
  sandboxKey: string;
  documentId: string | null;
  pages: PageTextMap;
  thread: string;
  signal?: AbortSignal;
}): Promise<GroundedAnswerJson> {
  if (params.mode === 'standalone') {
    return runFreestyleStandaloneAnswer({ thread: params.thread, signal: params.signal });
  }
  if (!params.documentId) {
    return {
      answer: 'Connected mode requires a linked Source.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: 'no_source',
    };
  }
  const ing = await ensureDocumentIngested({
    sandboxKey: params.sandboxKey,
    documentId: params.documentId,
    sourceTitle: 'Source',
    pages: params.pages,
    signal: params.signal,
  });
  if (!ing.ok) {
    return {
      answer: 'Could not index the Source for retrieval.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: ing.error ?? 'ingest_failed',
    };
  }
  const chunks = await retrieveGroundedContext({
    sandboxKey: params.sandboxKey,
    documentIds: [params.documentId],
    query: params.thread.slice(-2000),
    signal: params.signal,
  });
  if (!chunks.length) {
    return {
      answer: 'No indexed passages for this Source yet.',
      grounded: false,
      confidence: 0,
      citations: [],
      insufficient_evidence: true,
      reason: 'no_chunks',
    };
  }
  return runFreestyleConnectedAnswer({ thread: params.thread, chunks, signal: params.signal });
}
