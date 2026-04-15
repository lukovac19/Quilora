import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Link2, MoreHorizontal, Plus, Star, Trash2 } from 'lucide-react';
import type { CanvasNode } from '../../lib/canvasNodeModel';
import { BLOCK_COLOR_SWATCHES, NODE_LABELS } from '../../lib/canvasNodeModel';

export function CanvasBlockChrome({
  node,
  readOnly,
  unanchoredClaim,
  onAttachEvidence,
  onUpdate,
  onDelete,
  onDuplicate,
  onNativeConnectFromMenu,
  onConnectorDragStart,
  onResizePointerDown,
  onToggleFavorite,
}: {
  node: CanvasNode;
  readOnly: boolean;
  /** EP-06 — claim block has no incoming Evidence edge */
  unanchoredClaim?: boolean;
  onAttachEvidence?: (blockNodeId: string) => void;
  onUpdate: (id: string, patch: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onNativeConnectFromMenu: (id: string) => void;
  onConnectorDragStart: (id: string, event: React.PointerEvent) => void;
  onResizePointerDown: (event: React.MouseEvent, nodeId: string) => void;
  onToggleFavorite: (id: string, next: boolean) => void;
}) {
  const [tagDraft, setTagDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConnectHandle, setShowConnectHandle] = useState(false);
  const connectTimerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

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

  const commitTags = useCallback(() => {
    const next = tagDraft
      .split(/[,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (!next.length && !tagDraft.trim()) return;
    const merged = [...new Set([...node.tags, ...next])];
    onUpdate(node.id, { tags: merged });
    setTagDraft('');
  }, [node.id, node.tags, onUpdate, tagDraft]);

  const bg = BLOCK_COLOR_SWATCHES.find((c) => c.id === node.colorId)?.hex ?? '#dbeafe';

  const showUnanchored = Boolean(unanchoredClaim && !readOnly);

  return (
    <div
      ref={frameRef}
      data-block-frame
      {...(unanchoredClaim ? { 'data-unanchored-claim-block': '', 'data-pulsing-border-animation': '' } : {})}
      title={unanchoredClaim ? 'Unanchored claim — attach Evidence grounded in a Source.' : undefined}
      className={`relative flex h-full min-h-0 flex-col rounded-[1.35rem] border-2 shadow-[0_18px_50px_rgba(38,107,167,0.12)] ${unanchoredClaim ? 'border-[#e8825a] ep06-unanchored-pulse' : 'border-[#1e5a8f]'}`}
      style={{ backgroundColor: bg }}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen(true);
      }}
    >
      <style>{`@keyframes ep06UnanchoredPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,130,90,0.35);}50%{box-shadow:0 0 0 5px rgba(232,130,90,0.15);}}.ep06-unanchored-pulse{animation:ep06UnanchoredPulse 1.6s ease-in-out infinite;}`}</style>
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
          className="pointer-events-auto absolute -bottom-3 left-1/2 z-[4] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#266ba7] bg-white text-[#266ba7] shadow-lg transition-opacity duration-150"
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

      {showUnanchored ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8825a]/25 bg-[#e8825a]/08 px-3 py-2">
          <span data-warning-tooltip-on-hover className="text-[11px] font-semibold text-[#9a3412]" title="Unanchored claim — attach Evidence grounded in a Source.">
            Unanchored claim
          </span>
          {onAttachEvidence ? (
            <button
              type="button"
              data-attach-evidence-cta-btn
              className="rounded-full bg-[#7b68ee] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm hover:bg-[#6b58de]"
              onClick={(event) => {
                event.stopPropagation();
                onAttachEvidence(node.id);
              }}
            >
              Attach evidence
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2 border-b border-[#0f172a]/10 px-3 pt-3">
        <input
          data-block-title-editable
          disabled={readOnly}
          value={node.title}
          onChange={(event) => onUpdate(node.id, { title: event.target.value, label: event.target.value.slice(0, 120) })}
          className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold tracking-tight text-[#0f172a] outline-none ring-0 placeholder:text-[#64748b] disabled:opacity-60"
          placeholder="Block title"
        />
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
            aria-label="Block menu"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <textarea
        data-block-body
        disabled={readOnly}
        value={node.body}
        onChange={(event) => onUpdate(node.id, { body: event.target.value })}
        rows={3}
        className="mx-3 mt-2 min-h-[4.5rem] flex-1 resize-none border-0 bg-transparent text-sm leading-relaxed text-[#0f172a]/90 outline-none placeholder:text-[#64748b] disabled:opacity-60"
        placeholder="Notes, quotes, or hypotheses…"
      />

      <div data-color-picker className="flex flex-wrap items-center gap-1.5 border-t border-[#0f172a]/10 px-3 py-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">Color</span>
        {BLOCK_COLOR_SWATCHES.map((sw) => (
          <button
            key={sw.id}
            type="button"
            disabled={readOnly}
            title={sw.label}
            onClick={() => onUpdate(node.id, { colorId: sw.id })}
            className={`h-6 w-6 rounded-full border-2 transition ${node.colorId === sw.id ? 'border-[#266ba7] ring-2 ring-[#266ba7]/30' : 'border-transparent hover:border-[#94a3b8]'}`}
            style={{ backgroundColor: sw.hex }}
            aria-label={`Color ${sw.label}`}
          />
        ))}
      </div>

      <div data-tag-input className="border-t border-[#0f172a]/10 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {node.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#0f172a]/10 px-2 py-0.5 text-[11px] font-medium text-[#0f172a]">
              {tag}
              {!readOnly ? (
                <button
                  type="button"
                  className="text-[#64748b] hover:text-rose-600"
                  aria-label={`Remove ${tag}`}
                  onClick={() => onUpdate(node.id, { tags: node.tags.filter((t) => t !== tag) })}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
        {!readOnly ? (
          <div className="mt-1 flex gap-1">
            <input
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitTags();
                }
              }}
              placeholder="Add tag, Enter"
              className="min-w-0 flex-1 rounded-full border border-[#0f172a]/15 bg-white/60 px-3 py-1 text-xs text-[#0f172a] outline-none focus:border-[#266ba7]/40"
            />
            <button type="button" onClick={commitTags} className="rounded-full bg-[#0f172a]/10 px-2 py-1 text-xs font-medium text-[#0f172a] hover:bg-[#0f172a]/15">
              Add
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#0f172a]/10 px-2 py-1.5 text-[10px] text-[#64748b]">
        <span className="truncate pl-1">{NODE_LABELS[node.kind]}</span>
        {node.tileVariant && node.tileVariant !== 'default' && node.tileVariant !== 'drag-default' ? (
          <span className="truncate font-mono text-[9px] opacity-80" title="Creation tile">
            {node.tileVariant}
          </span>
        ) : (
          <span />
        )}
      </div>

      {!readOnly ? (
        <button
          type="button"
          data-resize-handle
          aria-label="Resize block"
          onMouseDown={(event) => {
            event.stopPropagation();
            onResizePointerDown(event, node.id);
          }}
          className="absolute bottom-1 right-1 z-[5] h-5 w-5 cursor-nwse-resize rounded-br-[1.25rem] border-b-2 border-r-2 border-[#266ba7]/50 bg-white/30 hover:bg-white/50"
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
