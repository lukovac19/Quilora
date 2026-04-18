import { useState, useRef, useEffect } from 'react';
import { Copy, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import type { CanvasNode } from '../../lib/canvasNodeModel';
import { NODE_LABELS } from '../../lib/canvasNodeModel';
import type { ConnectorNodePayload } from '../../lib/connectorNodeModel';
import { CONNECTOR_LINK_LABELS } from '../../lib/connectorNodeModel';
import type { GroundedCitation } from '../../lib/ai/types/groundedAnswer';
import { CitationList } from '../citations/CitationList';
import { TrustBadge } from '../citations/TrustBadge';

/** EP-07 — Connector hub block between two endpoints. */
export function ConnectorBlockChrome({
  node,
  payload,
  endpointALabel,
  endpointBLabel,
  readOnly,
  onDelete,
  onDuplicate,
  onResizePointerDown,
  onConnectorDragStart,
  onCitationOpen,
}: {
  node: CanvasNode;
  payload: ConnectorNodePayload;
  endpointALabel: string;
  endpointBLabel: string;
  readOnly: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onResizePointerDown: (event: React.MouseEvent, nodeId: string) => void;
  onConnectorDragStart: (nodeId: string, event: React.PointerEvent) => void;
  onCitationOpen?: (c: GroundedCitation) => void;
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

  const badgeLabel = CONNECTOR_LINK_LABELS[payload.linkType];

  return (
    <div
      ref={frameRef}
      data-connector-block
      className="relative flex h-full min-h-0 flex-col rounded-[1.35rem] border-2 border-[#e8825a] bg-gradient-to-br from-[#fff7f2] to-[#ffe8dc] shadow-[0_18px_50px_rgba(232,130,90,0.15)]"
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
          className="pointer-events-auto absolute -bottom-3 left-1/2 z-[4] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#e8825a] bg-white text-[#c2410c] shadow-lg transition-opacity duration-150"
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
          <span
            data-link-type-badge
            className="inline-flex rounded-full bg-[#e8825a]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a3412]"
          >
            {payload.linkType === 'cause_effect' ? 'Cause & Effect' : badgeLabel}
          </span>
          <p className="mt-1.5 truncate text-sm font-bold text-[#0f172a]">{node.title}</p>
        </div>
        <button
          type="button"
          data-block-context-menu-trigger
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-black/5"
          aria-label="Connector menu"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div data-connector-no-drag className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
        <div data-two-block-endpoint-labels className="rounded-xl border border-[#0f172a]/10 bg-white/70 px-2 py-2 text-[11px] leading-snug text-[#334155]">
          <p>
            <span className="font-semibold text-[#0f172a]">A:</span> {endpointALabel.slice(0, 120)}
            {endpointALabel.length > 120 ? '…' : ''}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#0f172a]">B:</span> {endpointBLabel.slice(0, 120)}
            {endpointBLabel.length > 120 ? '…' : ''}
          </p>
        </div>
        {payload.userReasoning.trim() ? (
          <div data-user-reasoning-display-area className="rounded-xl border border-[#0f172a]/8 bg-white/60 px-2 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">Your reasoning</p>
            <p className="text-xs text-[#0f172a]/90">{payload.userReasoning}</p>
          </div>
        ) : null}
        {payload.aiLoading ? (
          <div data-ai-analysis-body className="animate-pulse space-y-2 py-2">
            <div className="h-3 w-full rounded bg-[#0f172a]/10" />
            <div className="h-3 w-5/6 rounded bg-[#0f172a]/8" />
          </div>
        ) : (
          <div
            data-ai-response-display-area
            data-ai-analysis-body
            className="whitespace-pre-wrap text-xs leading-relaxed text-[#0f172a]/90"
          >
            {payload.aiAnalysisBody.trim() || '—'}
          </div>
        )}
        {payload.aiEvidence ? (
          <div className="space-y-2 rounded-xl border border-[#0f172a]/8 bg-white/50 px-2 py-2">
            <TrustBadge state={payload.aiEvidence.trust_state} />
            {payload.aiEvidence.insufficient_evidence && payload.aiEvidence.reason ? (
              <p className="text-[10px] text-amber-950/90">{payload.aiEvidence.reason}</p>
            ) : null}
            <CitationList citations={payload.aiEvidence.citations} compact onOpenSource={onCitationOpen} />
          </div>
        ) : null}
        <p data-source-citation className="text-[10px] font-medium text-[#64748b]">
          {payload.sourceCitation || '—'}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#0f172a]/10 px-2 py-1.5 text-[10px] text-[#64748b]">
        <span className="truncate pl-1">{NODE_LABELS[node.kind]}</span>
      </div>

      {!readOnly ? (
        <button
          type="button"
          data-resize-handle
          aria-label="Resize connector block"
          onMouseDown={(event) => {
            event.stopPropagation();
            onResizePointerDown(event, node.id);
          }}
          className="absolute bottom-1 right-1 z-[5] h-5 w-5 cursor-nwse-resize rounded-br-[1.25rem] border-b-2 border-r-2 border-[#e8825a]/50 bg-white/30 hover:bg-white/50"
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
