import type { GroundedCitation } from '../../lib/ai/types/groundedAnswer';

export function CitationList({
  citations,
  compact,
  onOpenSource,
}: {
  citations: GroundedCitation[];
  compact?: boolean;
  /** If provided, invoked with document_id and page_number when user clicks a row */
  onOpenSource?: (c: GroundedCitation) => void;
}) {
  if (!citations.length) {
    return <p className="text-[10px] text-[#64748b]">No citations.</p>;
  }
  return (
    <ul className={`space-y-2 ${compact ? '' : 'mt-2'}`} data-citation-list>
      {citations.map((c, i) => (
        <li
          key={`${c.chunk_id}-${i}`}
          className="rounded-lg border border-[#0f172a]/10 bg-white/80 px-2 py-1.5"
          data-citation-item
        >
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#334155]">{c.source_title || 'Source'}</span>
            <span className="rounded bg-[#0f172a]/6 px-1.5 py-0.5 font-mono text-[10px] text-[#0f172a]">p.{c.page_number}</span>
          </div>
          <blockquote className="mt-1 border-l-2 border-[#266ba7]/35 pl-2 text-[11px] leading-snug text-[#0f172a]/90">
            &ldquo;{c.quoted_text.slice(0, 420)}
            {c.quoted_text.length > 420 ? '…' : ''}&rdquo;
          </blockquote>
          <p className="mt-0.5 font-mono text-[9px] text-[#64748b]">{c.chunk_id}</p>
          {onOpenSource ? (
            <button
              type="button"
              className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#266ba7] underline-offset-2 hover:underline"
              onClick={() => onOpenSource(c)}
            >
              Open source · page {c.page_number}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
