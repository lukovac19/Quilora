import { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { CC_CATALOG_PLACEHOLDER, type CCBookEntry } from '../../lib/ccCatalog';

/** EP-04 — CC Library Browser */
export function CCLibraryBrowserPanel({
  open,
  onClose,
  onActivateBook,
}: {
  open: boolean;
  onClose: () => void;
  onActivateBook: (book: CCBookEntry) => void;
}) {
  const [q, setQ] = useState('');
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return CC_CATALOG_PLACEHOLDER;
    return CC_CATALOG_PLACEHOLDER.filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(s));
  }, [q]);

  if (!open) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-[505] bg-black/45 backdrop-blur-[1px]" aria-label="Close CC library" onClick={onClose} />
      <aside
        data-cc-library-browser
        className="fixed right-0 top-0 z-[515] flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#091523] shadow-[-12px_0_48px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-white">CC Library</h2>
            <p data-browse-free-label className="mt-1 text-xs font-medium text-emerald-200/90">
              Browsing the catalog is free
            </p>
            <p data-placeholder-catalog-note className="mt-2 text-[11px] leading-relaxed text-white/45">
              MVP placeholder catalog — titles are representative; activation places a Source block on your canvas (5 cr).
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0d1f33] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-white/40" />
            <input
              data-search-input
              data-cc-library-search-input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search catalog…"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
        </div>

        <div data-catalog-grid className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((book) => (
              <article
                key={book.id}
                data-book-card
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <h3 data-book-title className="text-sm font-bold text-white">
                  {book.title}
                </h3>
                <p data-book-author className="mt-1 text-xs text-white/50">
                  {book.author}
                </p>
                <button
                  type="button"
                  data-activate-btn
                  onClick={() => onActivateBook(book)}
                  className="mt-3 rounded-full bg-[#266ba7] px-3 py-2 text-center text-xs font-bold text-white hover:bg-[#3b82c4]"
                >
                  Activate (5 cr)
                </button>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
