import type { GroundedAnswerJson, GroundedAnswerWithLensExtras, GroundedCitation, LensPersonaTraitJson, LensPlotEventJson } from './types/groundedAnswer';

export function extractJsonObject(raw: string): string {
  const t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) return fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

export function parseGroundedAnswerJson(raw: string): GroundedAnswerJson | null {
  try {
    const s = extractJsonObject(raw);
    const j = JSON.parse(s) as Record<string, unknown>;
    const citationsRaw = j.citations;
    const citations: GroundedCitation[] = [];
    if (Array.isArray(citationsRaw)) {
      for (const c of citationsRaw) {
        if (!c || typeof c !== 'object') continue;
        const o = c as Record<string, unknown>;
        citations.push({
          document_id: String(o.document_id ?? ''),
          source_title: String(o.source_title ?? ''),
          page_number: Number(o.page_number ?? 0) || 0,
          chunk_id: String(o.chunk_id ?? ''),
          quoted_text: String(o.quoted_text ?? ''),
          start_char: Number(o.start_char ?? 0) || 0,
          end_char: Number(o.end_char ?? 0) || 0,
        });
      }
    }
    return {
      answer: String(j.answer ?? ''),
      grounded: Boolean(j.grounded),
      confidence: typeof j.confidence === 'number' ? j.confidence : Number(j.confidence ?? 0) || 0,
      citations,
      insufficient_evidence: Boolean(j.insufficient_evidence),
      reason: String(j.reason ?? ''),
    };
  } catch {
    return null;
  }
}

export function parseGroundedAnswerWithLensExtras(raw: string): GroundedAnswerWithLensExtras | null {
  const base = parseGroundedAnswerJson(raw);
  if (!base) return null;
  try {
    const j = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
    const personaRaw = j.persona_traits;
    const plotRaw = j.plot_events;
    const persona_traits: LensPersonaTraitJson[] | undefined = Array.isArray(personaRaw)
      ? (personaRaw as Record<string, unknown>[]).map((p) => ({
          label: String(p.label ?? ''),
          quoted_text: String(p.quoted_text ?? ''),
          page_number: Number(p.page_number ?? 0) || 0,
          chunk_id: String(p.chunk_id ?? ''),
        }))
      : undefined;
    const plot_events: LensPlotEventJson[] | undefined = Array.isArray(plotRaw)
      ? (plotRaw as Record<string, unknown>[]).map((p) => ({
          title: String(p.title ?? ''),
          significance: String(p.significance ?? ''),
          page_number: Number(p.page_number ?? 0) || 0,
          chunk_id: String(p.chunk_id ?? ''),
          quoted_text: String(p.quoted_text ?? ''),
        }))
      : undefined;
    return { ...base, persona_traits, plot_events };
  } catch {
    return { ...base };
  }
}
