import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { LayoutGrid, Sparkles } from 'lucide-react';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { useApp } from '../context/AppContext';
import {
  fetchGenesisInventory,
  isGenesisSoldOut,
  openDodoCheckout,
  type GenesisInventory,
} from '../lib/billingCheckout';
import {
  clearGenesisChoiceFlowPending,
  isGenesisChoiceFlowPending,
  markGenesisChoiceFlowPending,
} from '../lib/genesisEarlyAccessSession';

const GENESIS_BUNDLE_CHOICE = 'quiloraGenesisBundleChoice';

/** Screen 3 — Lifetime Deal options before checkout. Not onboarding. */
export function GenesisChoicePage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [genesisInv, setGenesisInv] = useState<GenesisInventory | null>(null);
  const tier80WasOpen = useRef<boolean | null>(null);
  const tierTransitionToastSent = useRef(false);
  /** EC-06 — require explicit acknowledgement after live $80 → $119 transition before checkout. */
  const [blockCheckoutForTierChange, setBlockCheckoutForTierChange] = useState(false);
  const fromLifetimePricing =
    (location.state as { genesisLtd?: boolean } | null)?.genesisLtd === true;

  useEffect(() => {
    if (fromLifetimePricing) markGenesisChoiceFlowPending();
  }, [fromLifetimePricing]);

  useEffect(() => {
    void fetchGenesisInventory().then(setGenesisInv);
  }, []);

  /** v4 EC-06 — live Genesis tier transition while user is on this screen. */
  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchGenesisInventory().then(setGenesisInv);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!genesisInv) return;
    const open80 = genesisInv.genesis80.remaining > 0;
    if (tier80WasOpen.current === null) {
      tier80WasOpen.current = open80;
      return;
    }
    if (tier80WasOpen.current === true && !open80 && !tierTransitionToastSent.current) {
      tierTransitionToastSent.current = true;
      setBlockCheckoutForTierChange(true);
      toast.message('The first 50 Lifetime seats just sold out — checkout is now at the $119 tier.', {
        duration: 10_000,
      });
    }
    tier80WasOpen.current = open80;
  }, [genesisInv]);

  const allowed = import.meta.env.DEV || isGenesisChoiceFlowPending() || fromLifetimePricing;

  const finishPostPurchaseOnboarding = useCallback(() => {
    clearGenesisChoiceFlowPending();
    navigate('/onboarding');
  }, [navigate]);

  const continueLtdOnly = useCallback(async () => {
    if (blockCheckoutForTierChange) {
      toast.error('Confirm the updated Lifetime price below before continuing to checkout.');
      return;
    }
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/early-access/genesis-choice'));
      return;
    }
    if (import.meta.env.DEV) {
      try {
        localStorage.setItem(GENESIS_BUNDLE_CHOICE, 'ltd_only');
      } catch {
        /* ignore */
      }
      finishPostPurchaseOnboarding();
      return;
    }
    const inv = await fetchGenesisInventory();
    let product: 'lifetime_early_bird' | 'lifetime_standard' = 'lifetime_early_bird';
    if (inv && isGenesisSoldOut(inv, 'lifetime_early_bird')) product = 'lifetime_standard';
    if (inv && isGenesisSoldOut(inv, product)) {
      navigate('/early-access', { replace: true });
      return;
    }
    const res = await openDodoCheckout({
      product,
      userId: user.id,
      email: user.email,
      onCheckoutCompleted: () => {
        try {
          localStorage.setItem(GENESIS_BUNDLE_CHOICE, 'ltd_only');
        } catch {
          /* ignore */
        }
        finishPostPurchaseOnboarding();
      },
    });
    if (!res.ok) {
      if (res.reason === 'sold_out') navigate('/early-access', { replace: true });
      else toast.error(res.message);
    }
  }, [user, navigate, finishPostPurchaseOnboarding, blockCheckoutForTierChange]);

  const addSageYear = useCallback(async () => {
    if (blockCheckoutForTierChange) {
      toast.error('Confirm the updated Lifetime price below before continuing to checkout.');
      return;
    }
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/early-access/genesis-choice'));
      return;
    }
    if (import.meta.env.DEV) {
      try {
        localStorage.setItem(GENESIS_BUNDLE_CHOICE, 'ltd_sage_year');
      } catch {
        /* ignore */
      }
      finishPostPurchaseOnboarding();
      return;
    }
    const inv = await fetchGenesisInventory();
    let product: 'lifetime_early_bird' | 'lifetime_standard' = 'lifetime_early_bird';
    if (inv && isGenesisSoldOut(inv, 'lifetime_early_bird')) product = 'lifetime_standard';
    if (inv && isGenesisSoldOut(inv, product)) {
      navigate('/early-access', { replace: true });
      return;
    }
    const res = await openDodoCheckout({
      product,
      userId: user.id,
      email: user.email,
      onCheckoutCompleted: () => {
        void openDodoCheckout({
          product: 'sage_yearly',
          userId: user.id,
          email: user.email,
          onCheckoutCompleted: () => {
            try {
              localStorage.setItem(GENESIS_BUNDLE_CHOICE, 'ltd_sage_year');
            } catch {
              /* ignore */
            }
            finishPostPurchaseOnboarding();
          },
        }).then((res2) => {
          if (!res2.ok) toast.error(res2.message);
        });
      },
    });
    if (!res.ok) {
      if (res.reason === 'sold_out') navigate('/early-access', { replace: true });
      else toast.error(res.message);
    }
  }, [user, navigate, finishPostPurchaseOnboarding, blockCheckoutForTierChange]);

  if (!allowed) {
    return <Navigate to="/early-access" replace />;
  }

  return (
    <div
      className="flex min-h-screen min-w-0 flex-col overflow-x-hidden"
      style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(38,107,167,0.22),transparent)]" />
      <QuiloraMarketingNavBar logoOnly />

      <main className="relative z-10 flex flex-1 flex-col px-4 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32 md:pt-36">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <header className="mb-10 text-center md:mb-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7bbdf3]/90">Genesis</p>
            <h1 className="quilora-heading-section text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Choose your Genesis package
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/55 md:text-lg">
              Shown before checkout during pre-launch only.
            </p>
            {genesisInv && !isGenesisSoldOut(genesisInv, 'lifetime_early_bird') ? (
              <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-[#266ba7]/30 bg-[#266ba7]/10 px-4 py-3 text-sm font-medium text-[#7bbdf3]">
                You&apos;re getting the $80 rate (first 50 seats).
              </p>
            ) : genesisInv ? (
              <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80">
                Current rate: $119.
              </p>
            ) : null}
          </header>

          {blockCheckoutForTierChange ? (
            <div
              className="mx-auto mb-8 flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
              role="status"
            >
              <p className="text-sm font-medium text-amber-100/95">
                The $80 rate has sold out while you were on this page. Review the header price, then confirm you want to
                continue at the <span className="whitespace-nowrap">$119</span> tier before opening checkout.
              </p>
              <button
                type="button"
                onClick={() => setBlockCheckoutForTierChange(false)}
                className="shrink-0 rounded-full bg-amber-400/90 px-4 py-2.5 text-sm font-semibold text-[#0a1929] hover:bg-amber-300"
              >
                I understand — enable checkout
              </button>
            </div>
          ) : null}

          <div className="grid flex-1 grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="flex min-h-[min(22rem,70vh)] flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a2f45]/70 to-[#0a1929]/90 p-8 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 hover:border-[#266ba7]/35 hover:shadow-[0_28px_72px_-12px_rgba(38,107,167,0.2)] md:p-10 lg:p-12">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#266ba7]/20 text-[#7bbdf3] ring-1 ring-[#266ba7]/30">
                <Sparkles className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Lifetime Deal only</h2>
              <p className="mt-3 text-sm text-white/50">$80 · First 50 seats · $119 · Remaining 150 seats</p>
              <p className="mt-3 max-w-md flex-1 text-base leading-relaxed text-white/50 md:text-lg">
                All Genesis perks included. Bookworm tier features free forever (launch-day feature set). 20% lifetime
                discount on Sage after pre-launch.
              </p>
              <button
                type="button"
                disabled={blockCheckoutForTierChange}
                onClick={() => void continueLtdOnly()}
                className="mt-8 w-full rounded-full border border-white/20 bg-white/5 py-4 text-base font-semibold text-white transition-all duration-200 hover:border-[#7bbdf3]/50 hover:bg-white/10 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:py-4 md:text-lg"
              >
                Continue with LTD → Checkout
              </button>
            </div>

            <div className="flex min-h-[min(22rem,70vh)] flex-col rounded-3xl border border-[#266ba7]/35 bg-gradient-to-b from-[#266ba7]/25 via-[#1a2f45]/50 to-[#0a1929]/90 p-8 shadow-[0_24px_64px_-16px_rgba(38,107,167,0.25)] backdrop-blur-sm transition-all duration-300 hover:border-[#3b82c4]/45 hover:shadow-[0_32px_80px_-12px_rgba(38,107,167,0.3)] md:p-10 lg:p-12">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                <LayoutGrid className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Lifetime Deal + 1 Year Sage</h2>
              <p className="mt-3 text-sm font-medium text-[#7bbdf3] md:text-base">
                $80/$119 + $96 (50% off Sage yearly) · one combined checkout where configured
              </p>
              <p className="mt-3 max-w-md flex-1 text-base leading-relaxed text-white/60 md:text-lg">
                Full Sage for your first year at the pre-launch rate. After year 1, Sage renews at about $153/year (20%
                off the $192 standard annual). All Genesis perks included.
              </p>
              <button
                type="button"
                disabled={blockCheckoutForTierChange}
                onClick={() => void addSageYear()}
                className="mt-8 w-full rounded-full bg-[#266ba7] py-4 text-base font-semibold text-white shadow-lg shadow-[#266ba7]/25 transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-xl hover:shadow-[#266ba7]/35 disabled:cursor-not-allowed disabled:opacity-50 md:py-4 md:text-lg"
              >
                Add Sage for my first year → Checkout
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
