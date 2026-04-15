import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

/** EP-04 — Chapter Selection Overlay (multi-page PDF) */
export function ChapterSelectionOverlay({
  open,
  totalPages,
  isBookwormTier,
  initialSelected,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  totalPages: number;
  isBookwormTier: boolean;
  initialSelected?: number[] | null;
  onConfirm: (selectedOneBasedPages: number[]) => void;
  onCancel: () => void;
}) {
  const pageList = useMemo(() => Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1), [totalPages]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(pageList));

  useEffect(() => {
    if (!open) return;
    if (initialSelected?.length) {
      setSelected(new Set(initialSelected));
    } else {
      setSelected(new Set(pageList));
    }
  }, [open, initialSelected, pageList]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

  const toggle = (p: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(pageList));
  const deselectAll = () => setSelected(new Set());

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[520] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="presentation"
      data-chapter-selection-overlay
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chapter-selection-title"
        className="flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d1f33] shadow-[0_32px_90px_rgba(0,0,0,0.55)]"
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h2 id="chapter-selection-title" className="text-lg font-bold text-white">
            Select chapters (pages)
          </h2>
          <p className="mt-1 text-xs text-white/50">Each PDF page is listed as a selectable chapter row.</p>
        </div>

        <div data-chapter-list-scrollable className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <ul className="space-y-1">
            {pageList.map((p) => (
              <li key={p}>
                <label
                  data-chapter-checkbox-per-item
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition hover:border-[#3b82c4]/35"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p)}
                    onChange={() => toggle(p)}
                    className="h-4 w-4 rounded border-white/30 bg-[#0a1628] text-[#266ba7]"
                  />
                  <span className="text-sm text-white">
                    Page {p} <span className="text-white/40">· Chapter slice</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {isBookwormTier ? (
          <p data-ocr-parsing-cost-note className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
            OCR / parsing may incur credits on large PDFs (Bookworm). Fewer pages selected can reduce later processing cost.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3">
          <button data-select-all-btn type="button" onClick={selectAll} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#b9dcff] hover:bg-white/10">
            Select all
          </button>
          <button data-deselect-all-btn type="button" onClick={deselectAll} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
            Deselect all
          </button>
          <div className="ml-auto flex gap-2">
            <button data-cancel-btn type="button" onClick={onCancel} className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">
              Cancel
            </button>
            <button
              data-confirm-btn
              type="button"
              disabled={selected.size === 0}
              onClick={() => onConfirm(Array.from(selected).sort((a, b) => a - b))}
              className="rounded-full bg-[#266ba7] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3b82c4] disabled:opacity-40"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
