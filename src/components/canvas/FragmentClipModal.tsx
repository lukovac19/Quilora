import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/** EP-04 — Fragment clip: paste passage as text Source */
export function FragmentClipModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, body: string) => void;
}) {
  const [title, setTitle] = useState('Fragment clip');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('Fragment clip');
      setBody('');
    }
  }, [open]);

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

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[520] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      data-fragment-clip-modal
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="frag-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1f33] p-5 shadow-xl"
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <h2 id="frag-title" className="text-lg font-bold text-white">
          Fragment clip
        </h2>
        <p className="mt-1 text-xs text-white/50">Paste or type a short passage. It becomes a text Source on the canvas.</p>
        <label className="mt-4 block text-xs font-semibold text-white/70">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white outline-none focus:border-[#266ba7]/50"
          />
        </label>
        <label className="mt-3 block text-xs font-semibold text-white/70">
          Passage
          <textarea
            data-fragment-clip-textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="mt-1 w-full resize-none rounded-xl border border-white/15 bg-[#0a1628] px-3 py-2 text-sm text-white outline-none focus:border-[#266ba7]/50"
            placeholder="Paste your excerpt…"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
            Cancel
          </button>
          <button
            type="button"
            data-fragment-clip-submit
            disabled={!body.trim()}
            onClick={() => onSubmit(title.trim() || 'Fragment clip', body.trim())}
            className="rounded-full bg-[#266ba7] px-4 py-2 text-xs font-bold text-white hover:bg-[#3b82c4] disabled:opacity-40"
          >
            Add to canvas
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
