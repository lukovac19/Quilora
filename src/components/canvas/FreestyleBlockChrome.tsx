import { useState, useRef, useEffect } from 'react';
import { Copy, GripVertical, MoreHorizontal, Plus, SendHorizontal, Trash2 } from 'lucide-react';
import type { CanvasNode } from '../../lib/canvasNodeModel';
import { NODE_LABELS } from '../../lib/canvasNodeModel';
import type { FreestyleNodePayload } from '../../lib/freestyleNodeModel';
import { countIncludedContextTurns } from '../../lib/freestyleNodeModel';

const BUBBLE_DRAG_MIME = 'application/quilora-freestyle-bubble';

/** EP-08 — Freestyle chat block (standalone vs connected). */
export function FreestyleBlockChrome({
  node,
  payload,
  readOnly,
  isSending,
  onUpdate,
  onDelete,
  onDuplicate,
  onNativeConnectFromMenu,
  onConnectorDragStart,
  onResizePointerDown,
  onSendPrompt,
  onToggleUserTurnIncluded,
  onSendAssistantToCanvas,
}: {
  node: CanvasNode;
  payload: FreestyleNodePayload;
  readOnly: boolean;
  isSending: boolean;
  onUpdate: (id: string, patch: Partial<CanvasNode>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onNativeConnectFromMenu: (id: string) => void;
  onConnectorDragStart: (id: string, event: React.PointerEvent) => void;
  onResizePointerDown: (event: React.MouseEvent, nodeId: string) => void;
  onSendPrompt: (nodeId: string, text: string) => void;
  onToggleUserTurnIncluded: (nodeId: string, messageId: string, included: boolean) => void;
  onSendAssistantToCanvas: (nodeId: string, messageId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');
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

  const contextCount = countIncludedContextTurns(payload.messages);

  const onDragAssistantStart = (messageId: string, text: string, e: React.DragEvent) => {
    if (readOnly || !text.trim()) return;
    e.dataTransfer.setData(
      BUBBLE_DRAG_MIME,
      JSON.stringify({
        text: text.trim(),
        mode: payload.mode,
        linkedSourceNodeId: payload.linkedSourceNodeId,
        sourceDocumentLabel: payload.sourceDocumentLabel,
      }),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      ref={frameRef}
      data-freestyle-block
      className="relative flex h-full min-h-0 flex-col rounded-[1.35rem] border-2 border-[#f0a500] bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] shadow-[0_18px_50px_rgba(240,165,0,0.14)]"
      onContextMenu={(ev) => {
        ev.preventDefault();
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
          className="pointer-events-auto absolute -bottom-3 left-1/2 z-[4] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#d97706] bg-white text-[#b45309] shadow-lg transition-opacity duration-150"
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
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#b45309]">{NODE_LABELS.freestyle}</p>
          <input
            disabled={readOnly}
            value={node.title}
            onChange={(e) => onUpdate(node.id, { title: e.target.value, label: e.target.value.slice(0, 120) })}
            className="mt-0.5 w-full border-0 bg-transparent text-sm font-bold text-[#0f172a] outline-none placeholder:text-[#64748b] disabled:opacity-60"
            placeholder="Freestyle title"
          />
          {payload.mode === 'connected' && payload.sourceDocumentLabel ? (
            <div
              data-source-block-reference-chip
              className="mt-1.5 inline-flex max-w-full rounded-full border border-[#f0a500]/35 bg-[#f0a500]/12 px-2.5 py-0.5 text-[10px] font-semibold text-[#92400e]"
              title="Linked Source for grounding"
            >
              <span className="truncate">Source · {payload.sourceDocumentLabel}</span>
            </div>
          ) : null}
          {payload.mode === 'standalone' ? (
            <p data-ungrounded-label className="mt-1.5 text-[10px] font-medium text-amber-900/80">
              Ungrounded — answers are not tied to your Source text.
            </p>
          ) : (
            <p data-grounded-label className="mt-1.5 text-[10px] font-semibold text-emerald-800">
              Grounded — Trust Factor (document context included in prompts).
            </p>
          )}
          <p data-1-credit-per-prompt-label className="mt-1 text-[10px] text-[#64748b]">
            1 credit per prompt
          </p>
        </div>
        <button
          type="button"
          data-block-context-menu-trigger
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-black/5"
          aria-label="Freestyle menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div data-freestyle-no-drag className="flex min-h-0 flex-1 flex-col px-3 py-2">
        <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-[#64748b]">
          <span>Prompt thread</span>
          <span data-context-turn-count-indicator className="font-mono tabular-nums text-[#b45309]">
            Context turns: {contextCount}
          </span>
        </div>
        <div data-chat-thread-area className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {payload.messages.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#64748b]">Ask anything to start the thread.</p>
          ) : null}
          {payload.messages.map((m) => {
            if (m.role === 'user') {
              const dim = !m.includedInContext;
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border border-[#0f172a]/10 bg-white/80 px-2 py-2 ${dim ? 'opacity-45' : ''}`}
                  {...(dim ? { 'data-unchecked-turn-visual-dimming': '' } : {})}
                >
                  <div className="flex items-start gap-2">
                    <label className="mt-0.5 flex shrink-0 cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        data-turn-checkbox
                        checked={m.includedInContext}
                        disabled={readOnly}
                        onChange={(e) => onToggleUserTurnIncluded(node.id, m.id, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[#0f172a]/25 text-[#f0a500] focus:ring-[#f0a500]/40"
                      />
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-[#64748b]">In context</span>
                    </label>
                    <p className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-[#0f172a]">{m.content}</p>
                  </div>
                </div>
              );
            }
            const streaming = Boolean(m.pending);
            return (
              <div
                key={m.id}
                className={`group relative rounded-xl border border-[#f0a500]/25 bg-[#fffbeb] px-2 py-2 ${streaming ? 'animate-pulse' : ''}`}
                {...(streaming ? { 'data-streaming-response-animation': '' } : {})}
              >
                <div className="flex gap-1.5">
                  <div
                    data-drag-handle
                    draggable={!readOnly && !streaming && Boolean(m.content.trim())}
                    onDragStart={(e) => onDragAssistantStart(m.id, m.content, e)}
                    className="mt-0.5 flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded-md text-[#b45309]/70 hover:bg-[#f0a500]/15 active:cursor-grabbing"
                    title="Drag to canvas"
                  >
                    <GripVertical className="h-4 w-4 pointer-events-none" strokeWidth={2} />
                  </div>
                  <p className="min-w-0 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-[#0f172a]/95">
                    {m.content || (streaming ? '…' : '')}
                  </p>
                </div>
                {!readOnly && !streaming && m.content.trim() ? (
                  <button
                    type="button"
                    data-send-to-canvas-icon
                    className="absolute right-2 top-2 rounded-lg border border-[#f0a500]/30 bg-white/90 p-1.5 text-[#b45309] opacity-0 shadow-sm transition hover:bg-[#fff7ed] group-hover:opacity-100"
                    title="Send to canvas"
                    aria-label="Send this reply to the canvas as a Freestyle block"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendAssistantToCanvas(node.id, m.id);
                    }}
                  >
                    <SendHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div data-freestyle-no-drag className="border-t border-[#0f172a]/10 px-3 py-2">
        <div className="flex gap-2">
          <textarea
            data-prompt-input-field
            value={draft}
            disabled={readOnly || isSending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const t = draft.trim();
                if (!t || isSending) return;
                onSendPrompt(node.id, t);
                setDraft('');
              }
            }}
            rows={2}
            placeholder="Type a prompt… (Enter to send, Shift+Enter for newline)"
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#0f172a]/12 bg-white/90 px-2 py-1.5 text-xs text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#f0a500]/45 disabled:opacity-50"
          />
          <button
            type="button"
            data-send-btn
            disabled={readOnly || isSending || !draft.trim()}
            onClick={() => {
              const t = draft.trim();
              if (!t) return;
              onSendPrompt(node.id, t);
              setDraft('');
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-[#f0a500] text-white shadow-sm transition hover:bg-[#d97706] disabled:opacity-40"
            aria-label="Send prompt"
          >
            <SendHorizontal className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
        {!readOnly ? (
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-[#b45309]/20 py-1 text-[10px] font-semibold text-[#b45309] hover:bg-[#f0a500]/10"
            onClick={(e) => {
              e.stopPropagation();
              onNativeConnectFromMenu(node.id);
            }}
          >
            Connect…
          </button>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#0f172a]/10 px-2 py-1 text-[10px] text-[#64748b]">
        <span className="truncate pl-1">{payload.mode === 'connected' ? 'Connected mode' : 'Standalone mode'}</span>
      </div>

      {!readOnly ? (
        <button
          type="button"
          data-resize-handle
          aria-label="Resize freestyle block"
          onMouseDown={(event) => {
            event.stopPropagation();
            onResizePointerDown(event, node.id);
          }}
          className="absolute bottom-1 right-1 z-[5] h-5 w-5 cursor-nwse-resize rounded-br-[1.25rem] border-b-2 border-r-2 border-[#f0a500]/45 bg-white/40 hover:bg-white/60"
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/20"
              onClick={() => {
                onDelete(node.id);
                setMenuOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export const FREESTYLE_BUBBLE_DRAG_MIME = BUBBLE_DRAG_MIME;
