import { useState, useRef, useEffect, useCallback } from 'react';
import { Link2, MoreHorizontal, Plus, Star } from 'lucide-react';
import type { CanvasNode } from '../../lib/canvasNodeModel';
import { NODE_LABELS } from '../../lib/canvasNodeModel';
import type { LensNodePayload, PersonaTraitChip } from '../../lib/lensNodeModel';
import { LENS_SUBTYPE_LABELS } from '../../lib/lensNodeModel';

/** EP-05 — Lens Block (canvas): type label, loading skeleton, output, citation footer; subtype panels. */
export function LensBlockChrome({
  node,
  payload,
  readOnly,
  onUpdate,
  onDelete,
  onDuplicate,
  onNativeConnectFromMenu,
  onConnectorDragStart,
  onResizePointerDown,
  onToggleFavorite,
  onPersonaSubmit,
}: {
  node: CanvasNode;
  payload: LensNodePayload;
  readOnly: boolean;
  onUpdate: (id: string, patch: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onNativeConnectFromMenu: (id: string) => void;
  onConnectorDragStart: (id: string, event: React.PointerEvent) => void;
  onResizePointerDown: (event: React.MouseEvent, nodeId: string) => void;
  onToggleFavorite: (id: string, next: boolean) => void;
  onPersonaSubmit: (nodeId: string, characterName: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConnectHandle, setShowConnectHandle] = useState(false);
  const [characterDraft, setCharacterDraft] = useState(payload.personaCharacterName ?? '');
  const connectTimerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCharacterDraft(payload.personaCharacterName ?? '');
  }, [payload.personaCharacterName]);

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

  const toggleTraitExpand = useCallback(
    (chipId: string) => {
      const traits = payload.personaTraits ?? [];
      const next = traits.map((t) => (t.id === chipId ? { ...t, expanded: !t.expanded } : t));
      onUpdate(node.id, { lensPayload: { ...payload, personaTraits: next } });
    },
    [node.id, onUpdate, payload],
  );

  const setSymbolTab = useCallback(
    (tab: 'symbolism' | 'motif') => {
      onUpdate(node.id, { lensPayload: { ...payload, symbolMotifActiveTab: tab } });
    },
    [node.id, onUpdate, payload],
  );

  const subtypeLabel = LENS_SUBTYPE_LABELS[payload.subtype];
  const tab = payload.symbolMotifActiveTab ?? 'symbolism';

  return (
    <div
      ref={frameRef}
      data-lens-block
      className="relative flex h-full min-h-0 flex-col rounded-[1.35rem] border-2 border-[#7c6bb5] bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] shadow-[0_18px_50px_rgba(168,160,248,0.2)]"
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
          className="pointer-events-auto absolute -bottom-3 left-1/2 z-[4] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#6d28d9] bg-white text-[#6d28d9] shadow-lg transition-opacity duration-150"
          title="Draw connection"
          aria-label="Add connector from this block"
          onMouseEnter={onEdgeEnter}
          onMouseLeave={onEdgeLeave}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onConnectorDragStart(node.id, e);
            setShowConnectHandle(false);
          }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}

      <div className="flex items-start justify-between gap-2 border-b border-[#0f172a]/10 px-3 pt-3">
        <div className="min-w-0 flex-1">
          <p data-lens-type-label className="text-[10px] font-bold uppercase tracking-wide text-[#5b21b6]">
            {NODE_LABELS.lens} · {subtypeLabel}
          </p>
          <p className="truncate text-sm font-semibold text-[#0f172a]">{node.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            data-favorite-toggle
            disabled={readOnly}
            title={node.favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(e) => {
              e.stopPropagation();
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
            aria-label="Lens menu"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div data-lens-no-drag className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {payload.loading ? (
          <div data-loading-state-skeleton className="animate-pulse space-y-2 py-1">
            <div className="h-3 w-[92%] rounded bg-[#c4b5fd]/50" />
            <div className="h-3 w-[84%] rounded bg-[#c4b5fd]/40" />
            <div className="h-3 w-[76%] rounded bg-[#c4b5fd]/35" />
            <div className="h-16 w-full rounded-lg bg-[#c4b5fd]/30" />
          </div>
        ) : (
          <>
            {payload.subtype === 'persona' && !payload.personaTraits?.length ? (
              <div className="space-y-2 border-b border-[#0f172a]/10 pb-3">
                <label className="block text-[11px] font-semibold text-[#475569]" htmlFor={`${node.id}-persona-name`}>
                  Character name
                </label>
                <input
                  id={`${node.id}-persona-name`}
                  data-character-name-input
                  disabled={readOnly}
                  value={characterDraft}
                  onChange={(e) => setCharacterDraft(e.target.value)}
                  placeholder="e.g. Elizabeth Bennet"
                  className="w-full rounded-xl border border-[#0f172a]/15 bg-white/80 px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#6d28d9]/45"
                />
                <button
                  type="button"
                  data-submit-btn
                  disabled={readOnly || !characterDraft.trim()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPersonaSubmit(node.id, characterDraft.trim());
                  }}
                  className="rounded-full bg-[#6d28d9] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#5b21b6] disabled:opacity-40"
                >
                  Run Persona lens
                </button>
              </div>
            ) : null}

            {payload.subtype === 'persona' && payload.personaTraits?.length ? (
              <div data-trait-chip-grid className="mb-3 space-y-2">
                {payload.personaTraits.map((chip: PersonaTraitChip) => (
                  <div key={chip.id} className="rounded-xl border border-[#0f172a]/10 bg-white/70 p-2">
                    <button
                      type="button"
                      data-chip-expand-toggle
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTraitExpand(chip.id);
                      }}
                      className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-[#4c1d95]"
                    >
                      <span>{chip.label}</span>
                      <span className="text-[10px] font-normal text-[#64748b]">{chip.expanded ? 'Hide quote' : 'Show quote'}</span>
                    </button>
                    {chip.expanded ? (
                      <blockquote className="mt-2 border-l-2 border-[#6d28d9]/40 pl-2 text-xs italic text-[#334155]">&ldquo;{chip.quote}&rdquo;</blockquote>
                    ) : null}
                    <p data-source-citation-per-chip className="mt-1 text-[10px] text-[#64748b]">
                      {chip.citation}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {payload.subtype === 'symbol' ? (
              <div className="mb-3 space-y-2">
                {payload.outputBody ? (
                  <div data-output-body className="mb-2 whitespace-pre-wrap text-xs leading-relaxed text-[#0f172a]/90">
                    {payload.outputBody}
                  </div>
                ) : null}
                <div role="tablist" className="flex gap-1 rounded-full bg-[#0f172a]/5 p-1">
                  <button
                    type="button"
                    role="tab"
                    data-symbolism-tab
                    aria-selected={tab === 'symbolism'}
                    data-active-tab-highlight={tab === 'symbolism' ? 'true' : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSymbolTab('symbolism');
                    }}
                    className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === 'symbolism' ? 'bg-white text-[#5b21b6] shadow' : 'text-[#64748b]'}`}
                  >
                    Symbolism
                  </button>
                  <button
                    type="button"
                    role="tab"
                    data-motif-tab
                    aria-selected={tab === 'motif'}
                    data-active-tab-highlight={tab === 'motif' ? 'true' : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSymbolTab('motif');
                    }}
                    className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === 'motif' ? 'bg-white text-[#5b21b6] shadow' : 'text-[#64748b]'}`}
                  >
                    Motif
                  </button>
                </div>
                <div data-view-content-area className="min-h-[4.5rem] rounded-xl border border-[#0f172a]/10 bg-white/60 p-2 text-xs leading-relaxed text-[#0f172a]/90">
                  {tab === 'symbolism' ? (
                    <div className="whitespace-pre-wrap">{payload.symbolismBody ?? ''}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">{payload.motifBody ?? ''}</div>
                  )}
                </div>
                <p data-source-citation className="text-[10px] text-[#64748b]">
                  {payload.symbolSourceCitation ?? payload.citationFooter}
                </p>
              </div>
            ) : null}

            {payload.subtype === 'plot_events' && payload.outputBody ? (
              <div data-output-body className="mb-2 whitespace-pre-wrap text-xs leading-relaxed text-[#0f172a]/90">
                {payload.outputBody}
              </div>
            ) : null}

            {payload.subtype === 'plot_events' && payload.plotEvents?.length ? (
              <div data-plot-sequence className="mb-3 space-y-0">
                {payload.plotEvents.map((ev, idx) => (
                  <div key={ev.id} className="relative">
                    {idx > 0 ? (
                      <div
                        data-sequence-connector-line
                        className="absolute left-[11px] top-[-10px] h-[10px] w-0.5 bg-[#7c6bb5]/80"
                        aria-hidden
                      />
                    ) : null}
                    <div data-event-block className="relative rounded-xl border border-[#0f172a]/10 bg-white/75 p-2 pl-9">
                      <span
                        data-sequence-number
                        className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#6d28d9] text-[11px] font-bold text-white"
                      >
                        {ev.sequenceNumber}
                      </span>
                      <p className="text-xs font-bold text-[#0f172a]">{ev.title}</p>
                      <p data-significance-note-per-event className="mt-1 text-xs text-[#334155]">
                        {ev.significance}
                      </p>
                      <p data-chapter-citation className="mt-1 text-[10px] font-medium text-[#64748b]">
                        {ev.chapterCitation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {payload.subtype === 'persona' && payload.personaTraits?.length && payload.outputBody ? (
              <div data-output-body className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[#0f172a]/90">
                {payload.outputBody}
              </div>
            ) : null}

            {(payload.subtype === 'theme' || payload.subtype === 'idea') && payload.outputBody ? (
              <div data-output-body className="whitespace-pre-wrap text-xs leading-relaxed text-[#0f172a]/90">
                {payload.outputBody}
              </div>
            ) : null}
          </>
        )}
      </div>

      {!payload.loading ? (
        <footer data-source-citation-footer className="border-t border-[#0f172a]/10 px-3 py-2 text-[10px] leading-snug text-[#64748b]">
          {payload.citationFooter}
          {payload.lastCreditDebit != null ? (
            <span className="mt-1 block text-[#5b21b6]/80">Last activation: {payload.lastCreditDebit} credits</span>
          ) : null}
        </footer>
      ) : null}

      {!readOnly ? (
        <button
          type="button"
          data-resize-handle
          aria-label="Resize block"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizePointerDown(e, node.id);
          }}
          className="absolute bottom-1 right-1 z-[5] h-5 w-5 cursor-nwse-resize rounded-br-[1.25rem] border-b-2 border-r-2 border-[#6d28d9]/50 bg-white/40 hover:bg-white/60"
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
              className="flex w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
              onClick={() => {
                onDuplicate(node.id);
                setMenuOpen(false);
              }}
            >
              Duplicate
            </button>
            {!readOnly ? (
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
            ) : null}
            {!readOnly ? (
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/20"
                onClick={() => {
                  onDelete(node.id);
                  setMenuOpen(false);
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
