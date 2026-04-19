import { useState } from 'react';
import { Link } from 'react-router';
import type { NavigateFunction } from 'react-router';
import { Lock, Sparkles, Mail, ArrowRight, X } from 'lucide-react';
import type { User } from '../../context/AppContext';
import { markGenesisChoiceFlowPending } from '../../lib/genesisEarlyAccessSession';
import { QUILORA_CONTACT_EMAIL } from '../../lib/siteContact';

const SUPPORT = QUILORA_CONTACT_EMAIL;

function tierPublicLabel(user: User): string {
  const t = user.profileTier ?? 'bookworm';
  if (t === 'genesis') return 'Genesis (Lifetime Deal)';
  if (t === 'bibliophile') return 'Sage';
  return 'Bookworm';
}

type Props = {
  user: User;
  navigate: NavigateFunction;
  /** v4 EC-07 / PAY-10 — Edge cancels subscription row and queues Email 3. */
  onCancelBookwormSage?: () => Promise<void>;
  /** v4 Genesis seat release + tier downgrade (support-triggered or self-serve test). */
  onCancelGenesisSeat?: () => Promise<void>;
};

export function PreLaunchAccountHoldingCard({
  user,
  navigate,
  onCancelBookwormSage,
  onCancelGenesisSeat,
}: Props) {
  const [ltdModalOpen, setLtdModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const isGenesis = user.profileTier === 'genesis';
  const canLtdUpgrade = !isGenesis;

  const goGenesisPackageSelection = () => {
    markGenesisChoiceFlowPending();
    navigate('/early-access/genesis-choice', { state: { genesisLtd: true } });
  };

  const handleUpgradeLtd = () => {
    if (user.profileTier === 'bibliophile') {
      setLtdModalOpen(true);
      return;
    }
    goGenesisPackageSelection();
  };

  const confirmLtdAfterPaidPlan = () => {
    setLtdModalOpen(false);
    goGenesisPackageSelection();
  };

  return (
    <>
      <section
        className="rounded-3xl border border-[#266ba7]/30 bg-gradient-to-br from-[#1a2f45]/80 to-[#0a1929]/80 p-6 shadow-[0_24px_60px_-20px_rgba(38,107,167,0.35)] sm:p-8"
        aria-labelledby="prelaunch-holding-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p id="prelaunch-holding-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7bbdf3]/90">
              Pre-launch account
            </p>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              {isGenesis ? "You're one of 200. Welcome, founding member." : "You're in. Welcome to Quilora."}
            </h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/60">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                {tierPublicLabel(user)}
                {user.genesisBadge ? (
                  <Sparkles className="h-3.5 w-3.5 text-[#7bbdf3]" aria-hidden />
                ) : null}
              </span>
              <span className="inline-flex items-center gap-1 text-white/45">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#7bbdf3]/80" aria-hidden />
                Credits shown for your tier — sandbox unlocks at public launch
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/65">
          <p>
            Your spot is locked in and your plan starts on launch day. If Quilora doesn&apos;t reach public launch
            (defined as full canvas access for all paid users) within 90 days of your purchase, you&apos;ll receive a
            full refund automatically via Dodo Payments.
          </p>
          {!isGenesis ? (
            <p>
              Changed your mind? You can cancel anytime before launch day from your account for a full refund (Bookworm
              / Sage via self-serve billing; see below).
            </p>
          ) : (
            <p>
              Changed your mind? Contact {SUPPORT} before launch for a full refund. Your Genesis seat will be released
              for others.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/40 sm:flex-none"
            title="Canvas unlocks when Quilora reaches public launch."
          >
            <Lock className="h-4 w-4 shrink-0" aria-hidden />
            Canvas — available on launch day
          </button>

          {user.profileTier === 'bookworm' ? (
            <button
              type="button"
              onClick={() => navigate('/early-access')}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#7bbdf3]/40 bg-[#266ba7]/20 px-5 py-3 text-sm font-semibold text-[#c8e6ff] transition hover:bg-[#266ba7]/35 sm:flex-none"
            >
              Upgrade to Sage
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          ) : null}

          {canLtdUpgrade ? (
            <button
              type="button"
              onClick={handleUpgradeLtd}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#266ba7] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#266ba7]/25 transition hover:bg-[#3b82c4] sm:flex-none"
            >
              Upgrade to Lifetime Deal
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          ) : null}

          {!isGenesis ? (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/5 sm:flex-none"
            >
              Cancel pre-launch purchase
            </button>
          ) : (
            <div className="flex flex-1 flex-col gap-2 sm:flex-none">
              <a
                href={`mailto:${SUPPORT}?subject=${encodeURIComponent('Genesis pre-launch refund request')}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/70 transition hover:bg-white/5"
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                Contact support to cancel Genesis
              </a>
              {onCancelGenesisSeat ? (
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={async () => {
                    if (!window.confirm('Release your Genesis seat and downgrade to Bookworm? This cannot be undone.')) return;
                    setCancelBusy(true);
                    try {
                      await onCancelGenesisSeat();
                    } finally {
                      setCancelBusy(false);
                    }
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-rose-500/40 px-5 py-3 text-sm font-medium text-rose-200/90 transition hover:bg-rose-500/10 disabled:opacity-50"
                >
                  {cancelBusy ? 'Processing…' : 'Release Genesis seat (after refund approved)'}
                </button>
              ) : null}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          <Link to="/early-access/promises" className="text-[#7bbdf3]/90 underline-offset-2 hover:underline">
            Pre-launch promise registry
          </Link>{' '}
          — refunds, email names, and billing definitions (v4 Phase 7).
        </p>
      </section>

      {ltdModalOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setLtdModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1929] p-6 text-white shadow-2xl"
            role="dialog"
            aria-modal
            aria-labelledby="ltd-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="ltd-modal-title" className="text-lg font-semibold">
                Upgrade to Lifetime Deal
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setLtdModalOpen(false)}
                className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {user.profileTier === 'bibliophile' ? (
                <>
                  Your existing Sage subscription should be cancelled and fully refunded in Dodo Payments before you complete
                  Lifetime checkout. Ready to proceed? After you confirm, you&apos;ll pick your Genesis package (Lifetime
                  Deal only or + 1 Year Sage), then complete checkout in Dodo Payments.
                </>
              ) : (
                <>
                  You&apos;ll choose your Genesis package next (Lifetime Deal only or + 1 Year Sage), then complete
                  checkout in Dodo Payments. If you already have another paid Quilora subscription, cancel it for a full refund
                  first or contact {SUPPORT} for help.
                </>
              )}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setLtdModalOpen(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={confirmLtdAfterPaidPlan}
                className="rounded-full bg-[#266ba7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b82c4]"
              >
                Continue to Genesis packages
              </button>
            </div>
            <p className="mt-4 text-xs text-white/40">
              Refund of your current pre-launch subscription is processed in Dodo Payments when you cancel or migrate billing
              — contact {SUPPORT} if you need help.
            </p>
          </div>
        </div>
      ) : null}

      {cancelModalOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setCancelModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1929] p-6 text-white shadow-2xl"
            role="dialog"
            aria-modal
            aria-labelledby="cancel-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="cancel-modal-title" className="text-lg font-semibold">
                Cancel pre-launch purchase
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCancelModalOpen(false)}
                className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              For Bookworm or Sage, you can cancel before launch day for a full refund via &quot;Manage subscription&quot;
              (Dodo customer portal) or the link in your Dodo receipt. Lifetime Deal cancellations are handled by support:
              email {SUPPORT} with the email you used at checkout (PAY-10).
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
              >
                Close
              </button>
              {onCancelBookwormSage ? (
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={async () => {
                    setCancelBusy(true);
                    try {
                      await onCancelBookwormSage();
                      setCancelModalOpen(false);
                    } finally {
                      setCancelBusy(false);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-[#266ba7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3b82c4] disabled:opacity-50"
                >
                  {cancelBusy ? 'Submitting…' : 'Submit cancellation'}
                </button>
              ) : null}
              <a
                href={`mailto:${SUPPORT}?subject=${encodeURIComponent('Pre-launch cancellation / refund')}`}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Email support
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
