import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileUp,
  Library,
  Scissors,
  Quote,
  ScanSearch,
  Search,
  Sparkles,
  FileSearch,
  ListOrdered,
  User,
  Palette,
  Infinity,
  Lightbulb,
  Anchor,
  BarChart2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NodeKind } from '../../lib/canvasNodeModel';
import { NODE_LABELS, NODE_OVERLAY_TILES, isNodeKindWithOverlay, type OverlayTileDef } from '../../lib/canvasNodeModel';

function tileIconFor(kind: NodeKind, tile: OverlayTileDef): LucideIcon | null {
  if (kind === 'source') {
    const m: Record<string, LucideIcon> = {
      upload: FileUp,
      cc_library: Library,
      chapter_split: Scissors,
      fragment: Quote,
      entity: ScanSearch,
    };
    return m[tile.id] ?? null;
  }
  if (kind === 'lens') {
    const m: Record<string, LucideIcon> = {
      plot_events: ListOrdered,
      persona: User,
      theme: Palette,
      symbol: Infinity,
      idea: Lightbulb,
    };
    return m[tile.id] ?? Search;
  }
  if (kind === 'evidence') {
    const m: Record<string, LucideIcon> = {
      anchor: Anchor,
      micro_search: Search,
      frequency: BarChart2,
    };
    return m[tile.id] ?? FileSearch;
  }
  if (kind === 'freestyle') return Sparkles;
  return null;
}

export function NodeKindOverlayPanel({
  kind,
  onClose,
  onPickTile,
}: {
  kind: NodeKind | null;
  onClose: () => void;
  onPickTile: (tileId: string) => void;
}) {
  const [activeTileId, setActiveTileId] = useState<string | null>(null);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!kind || !isNodeKindWithOverlay(kind)) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [kind, onKeyDown]);

  useEffect(() => {
    setActiveTileId(null);
  }, [kind]);

  if (!kind || !isNodeKindWithOverlay(kind)) return null;

  const tiles = NODE_OVERLAY_TILES[kind];
  const title = NODE_LABELS[kind];

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      data-overlay-panel-container
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="node-overlay-title"
        className="relative max-h-[min(90vh,640px)] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0d1f33] shadow-[0_32px_90px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="node-overlay-title" className="text-lg font-bold text-white">
              Add {title}
            </h2>
            <p className="mt-1 text-xs text-white/50">Choose a starting layout.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close overlay"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[min(60vh,480px)] overflow-y-auto px-4 py-4">
          <div data-sub-node-tile-grid className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tiles.map((tile) => {
              const Icon = tileIconFor(kind, tile);
              const checklist = tile.checklistDataAttr;
              const checklistProps = checklist
                ? ({ [`data-${checklist}`]: '' } as Record<string, string>)
                : {};
              return (
                <button
                  key={tile.id}
                  type="button"
                  data-tile-id={tile.id}
                  data-tile-hover-state
                  data-tile-active-state={activeTileId === tile.id ? 'true' : undefined}
                  {...checklistProps}
                  onClick={() => onPickTile(tile.id)}
                  onFocus={() => setActiveTileId(tile.id)}
                  onBlur={() => setActiveTileId((cur) => (cur === tile.id ? null : cur))}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left outline-none transition hover:border-[#3b82c4]/45 hover:bg-[#266ba7]/12 focus-visible:border-[#3b82c4] focus-visible:ring-2 focus-visible:ring-[#266ba7]/50"
                >
                  <span data-tile-icon className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-[#b9dcff] group-hover:text-white">
                    {Icon ? <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden /> : null}
                  </span>
                  <span data-tile-label className="text-sm font-semibold text-white group-hover:text-[#b9dcff]">
                    {tile.label}
                  </span>
                  <span className="mt-1 text-xs leading-relaxed text-white/45 group-hover:text-white/55">{tile.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
