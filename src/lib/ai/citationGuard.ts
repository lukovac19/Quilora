import type { GroundedCitation, RetrievedChunk } from './types/groundedAnswer';

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Drop citations whose quote cannot be located in the referenced chunk text. */
export function filterCitationsAgainstChunks(citations: GroundedCitation[], chunks: RetrievedChunk[]): GroundedCitation[] {
  const byId = new Map(chunks.map((c) => [c.chunk_id, c]));
  return citations.filter((cit) => {
    const ch = byId.get(cit.chunk_id);
    if (!ch) return false;
    const q = normalize(cit.quoted_text);
    if (!q) return false;
    const body = normalize(ch.text);
    return body.includes(q);
  });
}
