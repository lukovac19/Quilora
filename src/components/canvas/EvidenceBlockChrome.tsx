import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Link2, MoreHorizontal, Plus, Star, Trash2 } from 'lucide-react';
import type { CanvasNode } from '../../lib/canvasNodeModel';
import { NODE_LABELS } from '../../lib/canvasNodeModel';
import type { EvidenceNodePayload } from '../../lib/evidenceNodeModel';
import { EVIDENCE_MICRO_SEARCH_CREDITS, frequencyByChapter, microDetailSearchInCorpus } from '../../lib/evidenceNodeModel';

const SUBTYPE_LABELS: Record<EvidenceNodePayload['subtype'], string> = {
  anchor: 'Evidence anchor',
  micro_search: 'Micro-detail search',
  frequency: 'Frequency chart',
};

/** EP-06 — Evidence block: anchor, micro search, frequency; checklist `data-*` hooks. */
export function EvidenceBlockChrome({
  node,
  payload,
  readOnly,
  sourceMissing,
  corpusTextByPage,
  onUpdate,
  onDelete,
  onDuplicate,
  onNativeConnectFromMenu,
  onConnectorDragStart,
  onResizePointerDown,
  onToggleFavorite,
  onFocusSourceNode,
  onMicroSearchPaid,
}: {
  node: CanvasNode;
  payload: EvidenceNodePayload;
  readOnly: boolean;
  /** Source node removed or unlinkable — floating evidence warning */
  sourceMissing: boolean;
  corpusTextByPage: Record<number, string>;
  onUpdate: (id: string, patch: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onNativeConnectFromMenu: (id: string) => void;
  onConnectorDragStart: (id: string, event: React.PointerEvent) => void;
  onResizePointerDown: (event: React.MouseEvent, nodeId: string) => void;
  onToggleFavorite: (id: string, next: boolean) => void;
  onFocusSourceNode: (sourceNodeId: string) => void;
  /** Return true when 2 cr deducted and search may run */
  onMicroSearchPaid: (nodeId: string, query: string) => Promise<boolean>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConnectHandle, setShowConnectHandle] = useState(false);
  const [queryDraft, setQueryDraft] = useState(payload.searchQuery ?? '');
  const [phraseDraft, setPhraseDraft] = useState(payload.frequencyPhrase ?? '');
  const [microBusy, setMicroBusy] = useState(false);
  const connectTimerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQueryDraft(payload.searchQuery ?? '');
  }, [payload.searchQuery]);
  useEffect(() => {
    setPhraseDraft(payload.frequencyPhrase ?? '');
  }, [payload.frequencyPhrase]);

  const clearConnectTimer = () => {
    if (connectTimerRef.current != null) {
      window.clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
  };
  const onEdgeEnter = () => {
    clearConnectTimer();
    connectTimerRef.current = window.setTimeout(() => setShowConnectHandle(true), 150);
  };
  const onEdgeLeave = () => {
    clearConnectTimer();
    setShowConnectHandle(false);
  };
  useEffect(() => () => clearConnectTimer(), []);

  const runMicroSearch = useCallback(async () => {
    const q = queryDraft.trim();
    if (q.length < 2 || readOnly || sourceMissing) return;
    setMicroBusy(true);
    try {
      const ok = await onMicroSearchPaid(node.id, q);
      if (!ok) return;
      const results = microDetailSearchInCorpus(q, corpusTextByPage);
      onUpdate(node.id, {
        evidencePayload: {
          ...payload,
          searchQuery: q,
          searchResults: results,
          searchCreditsDebited: (payload.searchCreditsDebited ?? 0) + EVIDENCE_MICRO_SEARCH_CREDITS,
        },
      });
    } finally {
      setMicroBusy(false);
    }
  }, [corpusTextByPage, node.id, onMicroSearchPaid, onUpdate, payload, queryDraft, readOnly, sourceMissing]);

  const runFrequency = useCallback(() => {
    const p = phraseDraft.trim();
    if (!p || readOnly || sourceMissing) return;
    const { points, max } = frequencyByChapter(p, corpusTextByPage);
    onUpdate(node.id, {
      evidencePayload: {
        ...payload,
        frequencyPhrase: p,
        frequencyByChapter: points,
        maxFrequency: max,
      },
    });
  }, [corpusTextByPage, node.id, onUpdate, payload, phraseDraft, readOnly, sourceMissing]);

  const pts = payload.frequencyByChapter ?? [];
  const maxF = Math.max(1, payload.maxFrequency ?? 1);

  return (
    <div
      ref={frameRef}
      data-evidence-block
      className="relative flex h-full min-h-0 flex-col rounded-[1.35rem] border-2 border-[#7b68ee] bg-gradient-to-br from-[#f5f3ff] to-[#ebe4ff] shadow-[0_18px_50px_rgba(123,104,238,0.18)]"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      <div
        className="pointer-events-auto absolute -bottom-1 left-1/2 z-[3] h-6 w-[52%] -translate-x-1/2"
        data-150ms-appear-delay
        data-handle-disappear-on-mouseout
        onMouseEnter={onEdgeEnter}
        onMouseLeave={onEdgeLeave}
        aria-hidden
      />
      {showConnectHandle && !readOnly ? (
        <button
          type="button"
          data-hover-connector-handle
          data-plus-handle-icon
          className="pointer-events-auto absolute -bottom-3 left-1/2 z-[4] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#7b68ee] bg-white text-[#5b4bdb] shadow-lg transition-opacity duration-150"
          title="Draw connection"
          aria-label="Add connector from this block"
          onMouseEnter={onEdgeEnter}
          onMouseLeave={onEdgeLeave}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            onConnectorDragStart(node.id, event);
            setShowConnectHandle(false);
          }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}

      <div className="flex items-start justify-between gap-2 border-b border-[#0f172a]/10 px-3 pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5b4bdb]">Evidence</p>
          <p data-evidence-subtype-label className="truncate text-sm font-bold text-[#0f172a]">
            {SUBTYPE_LABELS[payload.subtype]}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            data-favorite-toggle
            disabled={readOnly}
            title={node.favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(node.id, !node.favorite);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${node.favorite ? 'text-amber-500' : 'text-[#64748b] hover:bg-black/5'}`}
            aria-pressed={node.favorite}
          >
            <Star className={`h-4 w-4 ${node.favorite ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            data-block-context-menu-trigger
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] hover:bg-black/5"
            aria-label="Evidence menu"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {sourceMissing ? (
        <div className="mx-3 mt-2 rounded-xl border border-amber-400/50 bg-amber-50/90 px-2 py-1.5 text-[11px] font-medium text-amber-950" role="alert">
          Evidence is not tied to a valid Source — attach a Source or delete this node.
        </div>
      ) : null}

      <div data-evidence-no-drag className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {payload.subtype === 'anchor' ? (
          payload.loading ? (
            <div data-loading-state-skeleton className="animate-pulse space-y-2 py-1">
              <div className="h-3 w-2/3 rounded bg-[#0f172a]/10" />
              <div className="h-16 w-full rounded-lg bg-[#0f172a]/8" />
              <div className="h-3 w-1/2 rounded bg-[#0f172a]/10" />
            </div>
          ) : (
            <div className="space-y-2">
              <p data-attached-block-label className="text-xs font-semibold text-[#0f172a]">
                {payload.attachedBlockLabel ?? '—'}
              </p>
              <blockquote
                data-verbatim-quote-display
                className="rounded-xl border border-[#0f172a]/10 bg-white/70 px-2 py-2 text-xs leading-relaxed text-[#0f172a]/90"
              >
                {payload.verbatimQuote ?? '—'}
              </blockquote>
              <div className="flex flex-wrap items-center gap-2">
                <p data-chapter-section-citation className="text-[10px] font-medium text-[#64748b]">
                  {payload.chapterSectionCitation ?? '—'}
                </p>
                <button
                  type="button"
                  data-citation-source-link
                  disabled={readOnly || sourceMissing || !payload.linkedSourceNodeId}
                  className="text-[10px] font-bold uppercase tracking-wide text-[#5b4bdb] underline-offset-2 hover:underline disabled:opacity-40"
                  onClick={() => onFocusSourceNode(payload.linkedSourceNodeId)}
                >
                  Open source
                </button>
              </div>
              <span
                data-trust-factor-badge
                className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800"
              >
                {payload.trustFactorLabel ?? 'High'}
              </span>
              <p data-2-credit-deduction-label className="text-[10px] text-[#64748b]">
                2 credits charged for this anchor
              </p>
            </div>
          )
        ) : null}

        {payload.subtype === 'micro_search' ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                data-search-query-input
                disabled={readOnly || sourceMissing}
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                placeholder="Search phrase (2+ chars)…"
                className="min-w-[8rem] flex-1 rounded-xl border border-[#0f172a]/12 bg-white/80 px-2 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#7b68ee]/50"
              />
              <button
                type="button"
                data-search-submit-btn
                disabled={readOnly || sourceMissing || queryDraft.trim().length < 2 || microBusy}
                onClick={() => void runMicroSearch()}
                className="rounded-xl bg-[#7b68ee] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-45"
              >
                {microBusy ? '…' : 'Search'}
              </button>
            </div>
            <p data-2-credit-deduction-label className="text-[10px] text-[#64748b]">
              {EVIDENCE_MICRO_SEARCH_CREDITS} credits per search run
            </p>
            <ul data-results-list className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {(payload.searchResults ?? []).map((r) => (
                <li key={r.id} className="rounded-xl border border-[#0f172a]/10 bg-white/75 p-2">
                  <p data-result-fragment className="text-xs leading-relaxed text-[#0f172a]/90">
                    {r.fragment}
                  </p>
                  <p data-chapter-attribution className="mt-1 text-[10px] text-[#64748b]">
                    {r.chapterAttribution}
                  </p>
                </li>
              ))}
            </ul>
            {(payload.searchResults ?? []).length === 0 ? (
              <p className="text-[11px] text-[#64748b]">No results yet — run a search (verbatim fragments).</p>
            ) : null}
          </div>
        ) : null}

        {payload.subtype === 'frequency' ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                data-word-phrase-input
                disabled={readOnly || sourceMissing}
                value={phraseDraft}
                onChange={(e) => setPhraseDraft(e.target.value)}
                placeholder="Word or phrase…"
                className="min-w-[8rem] flex-1 rounded-xl border border-[#0f172a]/12 bg-white/80 px-2 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#7b68ee]/50"
              />
              <button
                type="button"
                data-generate-btn
                disabled={readOnly || sourceMissing || !phraseDraft.trim()}
                onClick={runFrequency}
                className="rounded-xl bg-[#7b68ee] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-45"
              >
                Generate
              </button>
            </div>
            <p data-free-no-credit-label className="text-[10px] font-medium text-emerald-800">
              Free — no credits
            </p>
            <div data-bar-chart-render className="rounded-xl border border-[#0f172a]/10 bg-white/70 px-2 py-3">
              <div className="mb-1 flex items-end justify-between gap-1" style={{ minHeight: 100 }}>
                <div data-frequency-y-axis className="flex h-[100px] flex-col justify-between pr-1 text-[9px] text-[#64748b]">
                  <span>{maxF}</span>
                  <span>{Math.round(maxF / 2)}</span>
                  <span>0</span>
                </div>
                <div className="flex flex-1 items-end justify-around gap-1 border-l border-[#0f172a]/10 pl-2">
                  {pts.map((pt) => (
                    <div key={pt.chapterLabel} className="flex flex-col items-center gap-1">
                      <div
                        className="w-5 rounded-t bg-[#7b68ee]/85"
                        style={{ height: `${Math.max(4, (pt.count / maxF) * 88)}px` }}
                        title={`${pt.count}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div data-chapter-x-axis className="mt-1 flex justify-around gap-1 border-t border-[#0f172a]/8 pt-1">
                {pts.map((pt) => (
                  <span key={pt.chapterLabel} className="max-w-[3.5rem] truncate text-center text-[9px] text-[#64748b]" title={pt.chapterLabel}>
                    {pt.chapterLabel}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#0f172a]/10 px-2 py-1.5 text-[10px] text-[#64748b]">
        <span className="truncate pl-1">{NODE_LABELS[node.kind]}</span>
        <span className="truncate text-right font-mono text-[9px] opacity-80">{payload.sourceDocumentLabel}</span>
      </div>

      {!readOnly ? (
        <button
          type="button"
          data-resize-handle
          aria-label="Resize evidence block"
          onMouseDown={(event) => {
            event.stopPropagation();
            onResizePointerDown(event, node.id);
          }}
          className="absolute bottom-1 right-1 z-[5] h-5 w-5 cursor-nwse-resize rounded-br-[1.25rem] border-b-2 border-r-2 border-[#7b68ee]/50 bg-white/30 hover:bg-white/50"
        />
      ) : null}

      {menuOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-[40]" aria-label="Dismiss menu" onClick={() => setMenuOpen(false)} />
          <div
            data-block-context-menu
            role="menu"
            className="fixed z-[50] min-w-[10rem] rounded-xl border border-white/10 bg-[#0d1f33] py-1 shadow-xl"
            style={{
              left: Math.min((frameRef.current?.getBoundingClientRect().right ?? 0) - 8, window.innerWidth - 160),
              top: (frameRef.current?.getBoundingClientRect().top ?? 0) + 36,
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
              onClick={() => {
                onDuplicate(node.id);
                setMenuOpen(false);
              }}
            >
              <Copy className="h-4 w-4" /> Duplicate
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
              onClick={() => {
                onNativeConnectFromMenu(node.id);
                setMenuOpen(false);
              }}
            >
              <Link2 className="h-4 w-4" /> Connect…
            </button>
            {!readOnly ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/20"
                onClick={() => {
                  onDelete(node.id);
                  setMenuOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
