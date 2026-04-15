/** EP-05 Lens node — payload, activation credits, deterministic mock outputs for checklist UI. */

export type LensSubtype = 'plot_events' | 'persona' | 'theme' | 'symbol' | 'idea';

export type PersonaTraitChip = {
  id: string;
  label: string;
  quote: string;
  citation: string;
  expanded?: boolean;
};

export type PlotEventBlock = {
  id: string;
  sequenceNumber: number;
  title: string;
  significance: string;
  chapterCitation: string;
};

export type LensNodePayload = {
  subtype: LensSubtype;
  linkedSourceNodeId: string | null;
  loading: boolean;
  lastCreditDebit?: number;
  citationFooter: string;
  outputBody: string;
  personaCharacterName?: string;
  personaTraits?: PersonaTraitChip[];
  symbolMotifActiveTab?: 'symbolism' | 'motif';
  symbolismBody?: string;
  motifBody?: string;
  symbolSourceCitation?: string;
  plotEvents?: PlotEventBlock[];
};

export const LENS_SUBTYPE_LABELS: Record<LensSubtype, string> = {
  plot_events: 'Plot & events',
  persona: 'Persona',
  theme: 'Theme',
  symbol: 'Symbol / motif',
  idea: 'Idea / message',
};

export function lensActivationCredit(subtype: LensSubtype): number {
  switch (subtype) {
    case 'plot_events':
      return 8;
    case 'persona':
      return 5;
    case 'theme':
      return 4;
    case 'symbol':
      return 6;
    case 'idea':
      return 5;
    default:
      return 5;
  }
}

function excerptSlice(text: string, max = 900): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function initialLensPayload(subtype: LensSubtype, linkedSourceNodeId: string, sourceTitle: string): LensNodePayload {
  const cite = `Grounded in: ${sourceTitle || 'Source'} · material on canvas`;
  return {
    subtype,
    linkedSourceNodeId,
    loading: subtype !== 'persona',
    citationFooter: cite,
    outputBody: '',
    symbolMotifActiveTab: 'symbolism',
    symbolismBody: '',
    motifBody: '',
    symbolSourceCitation: cite,
  };
}

export function buildActivatedLensContent(
  subtype: LensSubtype,
  ctx: { sourceTitle: string; documentExcerpt: string; characterName?: string },
): Omit<LensNodePayload, 'subtype' | 'linkedSourceNodeId' | 'loading'> & { loading: false; lastCreditDebit: number; citationFooter: string } {
  const ex = excerptSlice(ctx.documentExcerpt || 'No extracted text yet — open Reading Mode to build context.');
  const credit = lensActivationCredit(subtype);
  const baseFooter = `${ctx.sourceTitle || 'Source'} · ${ex.slice(0, 120)}…`;

  if (subtype === 'plot_events') {
    const events: PlotEventBlock[] = [
      { id: 'pe-1', sequenceNumber: 1, title: 'Inciting context', significance: 'Establishes stakes and pushes the narrative into motion.', chapterCitation: 'Ch. 1 · opening' },
      { id: 'pe-2', sequenceNumber: 2, title: 'Rising complication', significance: 'Tightens pressure; choices narrow for the focal subject.', chapterCitation: 'Ch. 2–3' },
      { id: 'pe-3', sequenceNumber: 3, title: 'Turning point', significance: 'Reframes what the reader assumed; refracts earlier motifs.', chapterCitation: 'Ch. 4' },
      { id: 'pe-4', sequenceNumber: 4, title: 'Consequence beat', significance: 'Emotional/logical fallout that conditions the finale.', chapterCitation: 'Ch. 5' },
      { id: 'pe-5', sequenceNumber: 5, title: 'Resolution echo', significance: 'Closing beat mirrors the opening question with a transformed answer.', chapterCitation: 'Ch. 6 · denouement' },
    ];
    return {
      loading: false,
      lastCreditDebit: credit,
      citationFooter: `Plot chain · ${baseFooter}`,
      outputBody: 'Ordered beats derived from your material (MVP chain). Expand each event for the significance note and chapter citation.',
      plotEvents: events,
    };
  }

  if (subtype === 'persona') {
    const name = (ctx.characterName || 'the focal character').trim();
    const traits: PersonaTraitChip[] = [
      {
        id: 'tr-1',
        label: 'Motive',
        quote: `"I can't leave it unsettled—not after what was said."`,
        citation: `${ctx.sourceTitle} · inferred tone from: ${ex.slice(0, 80)}…`,
        expanded: false,
      },
      {
        id: 'tr-2',
        label: 'Contradiction',
        quote: `"Duty here, desire there—both pull the same hour."`,
        citation: `${ctx.sourceTitle} · juxtaposed clauses in excerpt`,
        expanded: false,
      },
      {
        id: 'tr-3',
        label: 'Social mask',
        quote: `"They smiled the way people smile when the room is watching."`,
        citation: `${ctx.sourceTitle} · public vs private cues`,
        expanded: false,
      },
    ];
    return {
      loading: false,
      lastCreditDebit: credit,
      citationFooter: `Persona · ${name} · ${baseFooter}`,
      outputBody: `Lens summary for **${name}**: traits below are grounded chips — expand any chip to reveal the supporting quote.`,
      personaCharacterName: name,
      personaTraits: traits,
    };
  }

  if (subtype === 'theme') {
    return {
      loading: false,
      lastCreditDebit: credit,
      citationFooter: `Theme · ${baseFooter}`,
      outputBody: `**Central theme (MVP):** Recurring tension between obligation and self-authorship, expressed through repeated spatial imagery in your excerpt.\n\n**Thread:** ${ex.slice(0, 420)}`,
    };
  }

  if (subtype === 'symbol') {
    return {
      loading: false,
      lastCreditDebit: credit,
      citationFooter: `Symbol / motif · ${baseFooter}`,
      outputBody: 'Dual-view lens: use the Symbolism and Motif tabs for grounded readings of the excerpt below.',
      symbolMotifActiveTab: 'symbolism',
      symbolismBody: `**Symbolism:** Recurring light/shadow contrasts operate as moral semaphore — brightness aligns with disclosure, dimness with withheld intent.\n\nAnchor: ${ex.slice(0, 380)}`,
      motifBody: `**Motif:** Hands (open, closed, clasped) track trust — the motif returns at decision beats to signal reconciliation or fracture.\n\nAnchor: ${ex.slice(0, 380)}`,
      symbolSourceCitation: `${ctx.sourceTitle} · motif/symbol read from canvas excerpt`,
    };
  }

  /* idea */
  return {
    loading: false,
    lastCreditDebit: credit,
    citationFooter: `Idea / message · ${baseFooter}`,
    outputBody: `**Thesis (MVP):** The passage argues that understanding requires accepting partial information — certainty is portrayed as a risk rather than a reward.\n\n**Support:** ${ex.slice(0, 480)}`,
  };
}

export function parseLensPayload(raw: unknown): LensNodePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const sub = String(p.subtype ?? '');
  const subtype: LensSubtype =
    sub === 'plot_events' || sub === 'persona' || sub === 'theme' || sub === 'symbol' || sub === 'idea' ? sub : 'theme';
  const linked = p.linkedSourceNodeId != null && String(p.linkedSourceNodeId) ? String(p.linkedSourceNodeId) : null;
  const traitsRaw = p.personaTraits;
  const personaTraits = Array.isArray(traitsRaw)
    ? (traitsRaw as Record<string, unknown>[]).map((t, i) => ({
        id: String(t.id ?? `trait-${i}`),
        label: String(t.label ?? 'Trait'),
        quote: String(t.quote ?? ''),
        citation: String(t.citation ?? ''),
        expanded: Boolean(t.expanded),
      }))
    : undefined;
  const plotRaw = p.plotEvents;
  const plotEvents = Array.isArray(plotRaw)
    ? (plotRaw as Record<string, unknown>[]).map((e, i) => ({
        id: String(e.id ?? `pe-${i}`),
        sequenceNumber: Number(e.sequenceNumber ?? i + 1),
        title: String(e.title ?? ''),
        significance: String(e.significance ?? ''),
        chapterCitation: String(e.chapterCitation ?? ''),
      }))
    : undefined;
  const tab = String(p.symbolMotifActiveTab ?? 'symbolism');
  return {
    subtype,
    linkedSourceNodeId: linked,
    loading: Boolean(p.loading),
    lastCreditDebit: p.lastCreditDebit != null ? Number(p.lastCreditDebit) : undefined,
    citationFooter: String(p.citationFooter ?? ''),
    outputBody: String(p.outputBody ?? ''),
    personaCharacterName: p.personaCharacterName != null ? String(p.personaCharacterName) : undefined,
    personaTraits,
    symbolMotifActiveTab: tab === 'motif' ? 'motif' : 'symbolism',
    symbolismBody: p.symbolismBody != null ? String(p.symbolismBody) : undefined,
    motifBody: p.motifBody != null ? String(p.motifBody) : undefined,
    symbolSourceCitation: p.symbolSourceCitation != null ? String(p.symbolSourceCitation) : undefined,
    plotEvents,
  };
}

export function defaultLensPayloadForMigration(tileVariant: string, linkedFallback: string | null): LensNodePayload {
  const sub = (['plot_events', 'persona', 'theme', 'symbol', 'idea'].includes(tileVariant) ? tileVariant : 'theme') as LensSubtype;
  return {
    subtype: sub,
    linkedSourceNodeId: linkedFallback,
    loading: false,
    lastCreditDebit: lensActivationCredit(sub),
    citationFooter: 'Legacy lens block — open Reading Mode to refresh grounding.',
    outputBody: 'This lens was migrated without full EP-05 payload. Use a new Lens from the toolbar to regenerate structured output.',
  };
}
