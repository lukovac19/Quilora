import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { GhostEntityType } from '../../lib/canvasNodeModel';

const ENTITY_BADGE: Record<GhostEntityType, string> = {
  person: 'Person',
  location: 'Location',
  date: 'Date',
};

/** EP-04 — Ghost Node (Entity Extractor result) · EP-07 hover connect handle */
export function GhostNodeFrame({
  ghostNodeId,
  readOnly,
  entityLabel,
  entityType,
  linkedSourceNodeId,
  onConfirm,
  onDismiss,
  onLinkToSource,
  onNativeConnectFromMenu,
  onConnectorDragStart,
}: {
  ghostNodeId: string;
  readOnly: boolean;
  entityLabel: string;
  entityType: GhostEntityType;
  linkedSourceNodeId: string;
  onConfirm: () => void;
  onDismiss: () => void;
  onLinkToSource: () => void;
  onNativeConnectFromMenu: (id: string) => void;
  onConnectorDragStart: (id: string, event: React.PointerEvent) => void;
}) {
  const [showConnectHandle, setShowConnectHandle] = useState(false);
  const connectTimerRef = useRef<number | null>(null);

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

  return (
    <div
      data-ghost-node-frame
      className="relative flex h-full min-h-0 flex-col rounded-[1.35rem] border-2 border-dashed border-[#94a3b8] bg-white/90 p-3 pb-8 shadow-inner"
    >
      <p data-entity-label className="text-sm font-bold text-[#0f172a]">
        {entityLabel}
      </p>
      <span data-entity-type-badge className="mt-2 inline-flex w-fit rounded-full bg-[#7b68ee]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5b21b6]">
        {ENTITY_BADGE[entityType]}
      </span>
      <p data-three-credit-deduction-label className="mt-3 text-[11px] font-medium text-[#64748b]">
        Confirming materializes this entity as a real block · 3 credits
      </p>
      <button
        type="button"
        data-source-block-id-link=""
        onClick={(e) => {
          e.stopPropagation();
          onLinkToSource();
        }}
        className="mt-2 w-fit text-left text-xs font-semibold text-[#266ba7] underline-offset-2 hover:underline"
      >
        View linked Source
      </button>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <button
          type="button"
          data-confirm-btn
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
        >
          Confirm
        </button>
        <button
          type="button"
          data-dismiss-btn
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100"
        >
          Dismiss
        </button>
        {!readOnly ? (
          <button
            type="button"
            className="rounded-full border border-[#266ba7]/30 bg-white px-3 py-1.5 text-xs font-bold text-[#266ba7] hover:bg-[#266ba7]/10"
            onClick={(e) => {
              e.stopPropagation();
              onNativeConnectFromMenu(ghostNodeId);
            }}
          >
            Connect…
          </button>
        ) : null}
      </div>

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
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            onConnectorDragStart(ghostNodeId, e);
            setShowConnectHandle(false);
          }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
