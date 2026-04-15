import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, BookOpen, Link2 } from 'lucide-react';
import type { CanvasNode, SourceArtifact } from '../../lib/canvasNodeModel';
import { NODE_LABELS } from '../../lib/canvasNodeModel';

function formatUploadedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function chapterCountLabel(artifact: SourceArtifact, fallbackPages: number) {
  const sel = artifact.chapterSelectedPageIndices;
  if (sel?.length) return `${sel.length} chapter${sel.length === 1 ? '' : 's'} selected`;
  const t = artifact.totalPdfPages ?? fallbackPages;
  if (t > 0) return `${t} page${t === 1 ? '' : 's'} (full document)`;
  return '—';
}

/** EP-04 — Source Block (on canvas) */
export function SourceBlockChrome({
  node,
  artifact,
  readOnly,
  pdfPageCount,
  onUpdate,
  onDelete,
  onDuplicate,
  onNativeConnectFromMenu,
  onConnectorDragStart,
  onResizePointerDown,
  onOpenReadingMode,
  onOpenChapterSplit,
}: {
  node: CanvasNode;
  artifact: SourceArtifact;
  readOnly: boolean;
  pdfPageCount: number;
  onUpdate: (id: string, patch: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onNativeConnectFromMenu: (id: string) => void;
  onConnectorDragStart: (id: string, event: React.PointerEvent) => void;
  onResizePointerDown: (event: React.MouseEvent, nodeId: string) => void;
  onOpenReadingMode: () => void;
  onOpenChapterSplit: () => void;
}) {
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

  const badgeLabel = artifact.fileType.toUpperCase();

  return (
    <div
      ref={frameRef}
      data-source-block
      className="relative flex h-full min-h-0 flex-col rounded-[1.35rem] border-2 border-[#1e8aa8] bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2] shadow-[0_18px_50px_rgba(41,182,212,0.18)]"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      <input type="hidden" data-source-id-metadata readOnly value={artifact.sourceSystemId} tabIndex={-1} aria-hidden />

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
          className="pointer-events-auto absolute -bottom-3 left-1/2 z-[4] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#0e7490] bg-white text-[#0e7490] shadow-lg transition-opacity duration-150"
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
        <input
          data-source-title
          disabled={readOnly}
          value={node.title}
          onChange={(e) => onUpdate(node.id, { title: e.target.value, label: e.target.value.slice(0, 120) })}
          className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold tracking-tight text-[#0f172a] outline-none placeholder:text-[#64748b] disabled:opacity-60"
          placeholder="Source title"
        />
        <button
          type="button"
          data-block-context-menu-trigger
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0f4c5c] hover:bg-black/5"
          aria-label="Source menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <span data-file-type-badge className="rounded-full bg-[#0e7490]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0c4a5a]">
          {badgeLabel}
        </span>
        <span data-upload-date-label className="text-[11px] text-[#0f172a]/70">
          Uploaded {formatUploadedAt(artifact.uploadedAt)}
        </span>
      </div>

      <p data-chapter-count-label className="px-3 text-xs font-medium text-[#0f172a]/80">
        {chapterCountLabel(artifact, pdfPageCount)}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-[#0f172a]/10 px-3 py-2.5">
        <button
          type="button"
          data-open-reading-mode-btn
          onClick={(e) => {
            e.stopPropagation();
            onOpenReadingMode();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0e7490] px-3 py-2 text-xs font-bold text-white shadow hover:bg-[#155e75]"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          Open Reading Mode
        </button>
        {artifact.fileType === 'pdf' && (artifact.totalPdfPages ?? pdfPageCount) > 1 ? (
          <button
            type="button"
            data-open-chapter-split-btn
            onClick={(e) => {
              e.stopPropagation();
              onOpenChapterSplit();
            }}
            className="rounded-full border border-[#0e7490]/40 bg-white/70 px-3 py-2 text-xs font-semibold text-[#0c4a5a] hover:bg-white"
          >
            Chapter splitter…
          </button>
        ) : null}
      </div>

      <p className="px-3 pb-2 text-[10px] text-[#64748b]">{NODE_LABELS.source}</p>

      {!readOnly ? (
        <button
          type="button"
          data-resize-handle
          aria-label="Resize block"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizePointerDown(e, node.id);
          }}
          className="absolute bottom-1 right-1 z-[5] h-5 w-5 cursor-nwse-resize rounded-br-[1.25rem] border-b-2 border-r-2 border-[#0e7490]/50 bg-white/40 hover:bg-white/60"
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
