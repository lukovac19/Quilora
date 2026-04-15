import { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, Star, X, MapPin } from 'lucide-react';
import type { CanvasNode } from '../../lib/canvasNodeModel';
import { NODE_LABELS, BOOKWORM_MAX_FAVORITES } from '../../lib/canvasNodeModel';

export function BlocksLibraryPanel({
  open,
  onClose,
  nodes,
  activeSandboxId,
  isBookwormTier,
  search,
  onSearchChange,
  onToggleFavorite,
  onFocusNode,
  onDuplicateFromLibrary,
}: {
  open: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  activeSandboxId: string | null;
  isBookwormTier: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleFavorite: (id: string, next: boolean) => void;
  onFocusNode: (id: string) => void;
  onDuplicateFromLibrary: (node: CanvasNode) => void;
}) {
  const favoriteCount = useMemo(() => nodes.filter((n) => n.favorite).length, [nodes]);
  const capLabel =
    isBookwormTier && favoriteCount >= BOOKWORM_MAX_FAVORITES
      ? `${BOOKWORM_MAX_FAVORITES} favorites (Bookworm cap)`
      : isBookwormTier
        ? `${favoriteCount} / ${BOOKWORM_MAX_FAVORITES} favorites`
        : `${favoriteCount} favorites`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return nodes;
    return nodes.filter((n) => {
      const hay = `${n.title} ${n.label} ${n.body} ${n.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [nodes, search]);

  const { favorites, rest } = useMemo(() => {
    const fav = filtered.filter((n) => n.favorite).sort((a, b) => a.title.localeCompare(b.title));
    const r = filtered.filter((n) => !n.favorite).sort((a, b) => a.title.localeCompare(b.title));
    return { favorites: fav, rest: r };
  }, [filtered]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

  if (!open) return null;

  const Row = ({ node }: { node: CanvasNode }) => {
    const foreign = Boolean(node.originSandboxId && node.originSandboxId !== activeSandboxId);
    return (
      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <button
          type="button"
          title={node.favorite ? 'Unfavorite' : 'Favorite'}
          onClick={() => onToggleFavorite(node.id, !node.favorite)}
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${node.favorite ? 'text-amber-400' : 'text-white/35 hover:text-white/70'}`}
        >
          <Star className={`h-4 w-4 ${node.favorite ? 'fill-current' : ''}`} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-white">{node.title || node.label}</p>
            {foreign ? (
              <span
                data-cross-sandbox-origin-badge
                className="inline-flex items-center gap-0.5 rounded-full bg-[#266ba7]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#b9dcff]"
              >
                <MapPin className="h-3 w-3" aria-hidden />
                Other sandbox
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-white/45">{node.body || '—'}</p>
          <p className="mt-1 text-[10px] text-white/35">{NODE_LABELS[node.kind]}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            className="rounded-lg border border-white/15 px-2 py-1 text-[11px] font-medium text-[#b9dcff] hover:bg-white/10"
            onClick={() => onFocusNode(node.id)}
          >
            Focus
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-2 py-1 text-[11px] font-medium text-white/70 hover:bg-white/10"
            onClick={() => onDuplicateFromLibrary(node)}
          >
            Duplicate
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <button type="button" className="fixed inset-0 z-[480] bg-black/40 backdrop-blur-[1px]" aria-label="Close blocks panel" onClick={onClose} />
      <aside
        id="blocks-library-panel"
        data-blocks-library-panel
        className="fixed right-0 top-0 z-[490] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#091523] shadow-[-12px_0_48px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-white">Blocks</h2>
            <p className="text-xs text-white/45">Search, favorites, and all blocks in this sandbox</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0d1f33] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-white/40" />
            <input
              data-blocks-search-input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search blocks…"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
          <p data-favorites-cap-label className={`mt-2 text-[11px] ${isBookwormTier && favoriteCount >= BOOKWORM_MAX_FAVORITES ? 'font-semibold text-amber-200' : 'text-white/40'}`}>
            {capLabel}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <section data-favorites-section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#7bbdf3]">
              <Star className="h-3.5 w-3.5" />
              Favorites first
            </h3>
            {favorites.length === 0 ? <p className="text-sm text-white/35">No favorites match this search.</p> : null}
            <div className="space-y-2">{favorites.map((node) => <Row key={node.id} node={node} />)}</div>
          </section>

          <section data-all-blocks-section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">All blocks</h3>
            {rest.length === 0 && favorites.length === 0 ? (
              <p className="text-sm text-white/35">No blocks yet. Add nodes from the toolbar.</p>
            ) : null}
            <div className="space-y-2">{rest.map((node) => <Row key={node.id} node={node} />)}</div>
          </section>
        </div>
      </aside>
    </>
  );
}
