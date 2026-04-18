import type { RetrievedChunk } from '../ai/types/groundedAnswer';

export type PageTextMap = Record<number, string>;

export type ChunkDocumentInput = {
  document_id: string;
  source_title: string;
  pages: PageTextMap;
  /** Max characters per chunk (soft target). */
  maxChars?: number;
};

const DEFAULT_MAX = 1100;

function estimateTokens(s: string): number {
  return Math.max(1, Math.ceil(s.length / 4));
}

function splitOversizedParagraph(text: string, maxChars: number): string[] {
  const t = text.trim();
  if (t.length <= maxChars) return t ? [t] : [];
  const parts: string[] = [];
  let start = 0;
  while (start < t.length) {
    let end = Math.min(t.length, start + maxChars);
    if (end < t.length) {
      const slice = t.slice(start, end);
      const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
      if (lastBreak > 120) end = start + lastBreak + 1;
    }
    const chunk = t.slice(start, end).trim();
    if (chunk) parts.push(chunk);
    start = end;
  }
  return parts;
}

/**
 * Page-aware chunking: never merges across pages; prefers paragraph boundaries.
 */
export function chunkPagesAware(input: ChunkDocumentInput): Omit<RetrievedChunk, 'embedding' | 'score'>[] {
  const maxChars = input.maxChars ?? DEFAULT_MAX;
  const out: Omit<RetrievedChunk, 'embedding' | 'score'>[] = [];
  const pageNums = Object.keys(input.pages)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  for (const page_number of pageNums) {
    const pageText = String(input.pages[page_number] ?? '');
    if (!pageText.trim()) continue;
    const paragraphs = pageText.split(/\n{2,}|\r\n\r\n+/);
    const blocks = paragraphs.some((p) => p.trim()) ? paragraphs : [pageText];
    let paragraph_index = 0;
    for (const rawPara of blocks) {
      const para = rawPara.replace(/\r\n/g, '\n').trim();
      if (!para) continue;
      const pieces = splitOversizedParagraph(para, maxChars);
      for (const text of pieces) {
        if (text.length < 8 && pieces.length > 1) continue;
        const start_char = pageText.indexOf(text);
        const safeStart = start_char >= 0 ? start_char : 0;
        const end_char = safeStart + text.length;
        const chunk_id = `chk:${input.document_id}:p${page_number}:pi${paragraph_index}:${hashShort(text)}`;
        out.push({
          chunk_id,
          document_id: input.document_id,
          page_number,
          paragraph_index,
          text,
          token_count_estimate: estimateTokens(text),
          source_title: input.source_title,
          start_char: safeStart,
          end_char,
        });
      }
      paragraph_index += 1;
    }
  }
  return out;
}

function hashShort(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 10);
}
