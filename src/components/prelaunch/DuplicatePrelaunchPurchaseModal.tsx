import { Link } from 'react-router';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
  onGoDashboard?: () => void;
};

/** Flow v4 EC-09 — duplicate / conflicting pre-launch purchase attempt. */
export function DuplicatePrelaunchPurchaseModal({ open, message, onClose, onGoDashboard }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-[#0a1929] p-6 text-white shadow-2xl"
        role="dialog"
        aria-modal
        aria-labelledby="dup-prelaunch-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="dup-prelaunch-title" className="text-lg font-semibold text-amber-100/95">
            Already subscribed
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-white/75">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/5"
          >
            OK
          </button>
          {onGoDashboard ? (
            <button
              type="button"
              onClick={onGoDashboard}
              className="rounded-full bg-[#266ba7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b82c4]"
            >
              Open dashboard
            </button>
          ) : null}
        </div>
        <p className="mt-4 text-center text-xs text-white/40">
          <Link to="/early-access/promises" className="text-[#7bbdf3]/90 underline-offset-2 hover:underline" onClick={onClose}>
            Pre-launch promise registry
          </Link>{' '}
          (pricing scope, 90-day rule, emails)
        </p>
      </div>
    </div>
  );
}
