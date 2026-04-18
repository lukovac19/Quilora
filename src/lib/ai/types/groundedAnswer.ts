/** Structured RAG output — every grounded path must map to stored evidence. */

export type GroundedCitation = {
  document_id: string;
  source_title: string;
  page_number: number;
  chunk_id: string;
  quoted_text: string;
  start_char: number;
  end_char: number;
};

export type GroundedAnswerJson = {
  answer: string;
  grounded: boolean;
  confidence: number;
  citations: GroundedCitation[];
  insufficient_evidence: boolean;
  reason: string;
};

/** Optional structured blocks returned alongside core schema (Lens). */
export type LensPersonaTraitJson = {
  label: string;
  quoted_text: string;
  page_number: number;
  chunk_id: string;
};

export type LensPlotEventJson = {
  title: string;
  significance: string;
  page_number: number;
  chunk_id: string;
  quoted_text: string;
};

export type GroundedAnswerWithLensExtras = GroundedAnswerJson & {
  persona_traits?: LensPersonaTraitJson[];
  plot_events?: LensPlotEventJson[];
};

export type TrustSurfaceState = 'grounded' | 'ungrounded' | 'insufficient' | 'unanchored';

export type RetrievedChunk = {
  chunk_id: string;
  document_id: string;
  page_number: number;
  paragraph_index: number;
  text: string;
  token_count_estimate: number;
  source_title: string;
  start_char: number;
  end_char: number;
  embedding?: number[];
  /** Cosine similarity after retrieval (pre-rerank) */
  score?: number;
};
