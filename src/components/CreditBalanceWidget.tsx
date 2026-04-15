import { useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, Lock, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hasRolloverCredits, monthlyCreditsForProfile } from '../lib/quiloraCreditUi';
import { BoostPackModal } from './BoostPackModal';

type Variant = 'toolbar' | 'dashboard';

type Props = {
  variant?: Variant;
  className?: string;
  /** Pre-launch v4 Phase 4 — credits allocated but sandbox locked until public launch. */
  creditsLocked?: boolean;
};

/**
 * EP-02 persistent credit UI: counter, monthly allocation bar, Sage rollover label,
 * low-balance warning, boost-pack entry (modal + deep link).
 */
export function CreditBalanceWidget({ variant = 'dashboard', className = '', creditsLocked = false }: Props) {
  const { user } = useApp();
  const [boostOpen, setBoostOpen] = useState(false);

  if (!user || user.creditBalance == null) return null;

  const bal = user.creditBalance;
  const tier = user.profileTier;
  const monthly = monthlyCreditsForProfile(tier);
  const pct = Math.min(100, Math.max(0, Math.round((bal / monthly) * 100)));
  const low = bal < 100;
  const compact = variant === 'toolbar';

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-2 ${compact ? 'text-xs' : 'gap-3 text-sm'} ${className}`}
        data-ep02="credit-balance-widget"
      >
        <span
          id="credit-counter"
          title={creditsLocked ? 'Credits unlock for use at public launch.' : undefined}
          className={`tabular-nums font-semibold text-white/90 ${compact ? 'rounded-full border border-white/15 bg-white/5 px-2.5 py-1' : 'rounded-2xl border border-white/15 bg-white/5 px-3 py-1.5'} ${creditsLocked ? 'opacity-80' : ''}`}
        >
          {bal} cr
          {creditsLocked ? (
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-[#7bbdf3]/90">
              <Lock className="h-3 w-3" aria-hidden />
              locked
            </span>
          ) : null}
        </span>

        <div className="flex min-w-[72px] flex-col gap-0.5" title="Rough share of one monthly allocation pool (for planning).">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              id="monthly-allocation-bar"
              className="h-full rounded-full bg-gradient-to-r from-[#266ba7] to-[#5aa3e4] transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {!compact && <span className="text-[10px] text-white/40">vs ~{monthly}/mo allocation</span>}
        </div>

        {hasRolloverCredits(tier) ? (
          <span id="rollover-balance-label" className="max-w-[10rem] text-[10px] font-medium leading-tight text-emerald-200/90">
            Rollover on
          </span>
        ) : null}

        {low ? (
          <span
            id="low-balance-warning"
            className={`inline-flex items-center gap-1 font-medium text-amber-200 ${compact ? 'text-[10px]' : 'text-xs'}`}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Low
          </span>
        ) : null}

        {!creditsLocked ? (
          <>
            <button
              type="button"
              id="boost-pack-cta-link"
              onClick={() => setBoostOpen(true)}
              className={`inline-flex items-center gap-1 rounded-full border border-[#266ba7]/40 font-medium text-[#9bcfff] transition hover:bg-[#266ba7]/20 ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}
            >
              <Sparkles className="h-3 w-3" aria-hidden />
              Boost
            </button>
            <Link
              to="/pricing?checkout=boost"
              className={`text-[#7bbdf3] underline-offset-2 hover:underline ${compact ? 'hidden sm:inline text-[10px]' : 'text-xs'}`}
            >
              Open checkout
            </Link>
          </>
        ) : null}
      </div>
      <BoostPackModal open={boostOpen} onClose={() => setBoostOpen(false)} />
    </>
  );
}
