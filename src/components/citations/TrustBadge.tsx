import type { TrustSurfaceState } from '../../lib/ai/types/groundedAnswer';

const STYLES: Record<TrustSurfaceState, string> = {
  grounded: 'bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/30',
  ungrounded: 'bg-amber-500/15 text-amber-950 ring-1 ring-amber-500/25',
  insufficient: 'bg-rose-500/12 text-rose-950 ring-1 ring-rose-400/35',
  unanchored: 'bg-violet-500/12 text-violet-950 ring-1 ring-violet-400/35 animate-pulse',
};

const LABELS: Record<TrustSurfaceState, string> = {
  grounded: 'Grounded',
  ungrounded: 'Ungrounded',
  insufficient: 'Insufficient evidence',
  unanchored: 'Unanchored',
};

export function TrustBadge({ state, className }: { state: TrustSurfaceState; className?: string }) {
  return (
    <span
      data-trust-badge
      data-trust-state={state}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STYLES[state]} ${className ?? ''}`}
    >
      {LABELS[state]}
    </span>
  );
}
