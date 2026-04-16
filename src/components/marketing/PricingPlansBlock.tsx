import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useApp } from '../../context/AppContext';
import {
  openPaddleCheckout,
  fetchGenesisInventory,
  isGenesisSoldOut,
  lifetimeDealSeatsRemaining,
  type CheckoutProductKey,
  type GenesisInventory,
} from '../../lib/billingCheckout';
import { markGenesisChoiceFlowPending } from '../../lib/genesisEarlyAccessSession';
import { assertPrelaunchCheckoutAllowed } from '../../lib/prelaunchPurchaseGuards';
import { markBookwormPlanSelectedForCurrentUser } from '../../lib/markPlanSelection';
import { safeInternalPath } from '../../lib/safeInternalPath';
import { DuplicatePrelaunchPurchaseModal } from '../prelaunch/DuplicatePrelaunchPurchaseModal';
import { ScrollReveal } from '../ScrollReveal';

export type PricingPlansBlockProps = {
  /** Early access: Monthly/Yearly toggle and plan cards only (no genesis banner, tax line, comparison table). */
  earlyAccessPricing?: boolean;
  /** When set, Paddle `checkout.completed` in this tab invokes this (early access and default pricing). */
  onCheckoutCompleted?: (product: CheckoutProductKey) => void;
};

/** Shared Bookworm · Sage · Genesis grid — used on /pricing and landing (#pricing) to stay in sync. */
export function PricingPlansBlock({ earlyAccessPricing = false, onCheckoutCompleted }: PricingPlansBlockProps) {
  const { user, refreshAuthUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookwormConfirmBusy, setBookwormConfirmBusy] = useState(false);
  const [billingYearly, setBillingYearly] = useState(true);
  const [displayedBilling, setDisplayedBilling] = useState(true);
  const [priceReveal, setPriceReveal] = useState(true);
  const billingAnimLock = useRef(false);
  const [genesisInventory, setGenesisInventory] = useState<GenesisInventory | null>(null);
  const [dupModal, setDupModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const selectBillingPeriod = useCallback(
    (yearly: boolean) => {
      if (yearly === billingYearly || billingAnimLock.current) return;
      billingAnimLock.current = true;
      setBillingYearly(yearly);
      setPriceReveal(false);
      window.setTimeout(() => {
        setDisplayedBilling(yearly);
        setPriceReveal(true);
        billingAnimLock.current = false;
      }, 300);
    },
    [billingYearly],
  );

  useEffect(() => {
    const load = () => void fetchGenesisInventory().then(setGenesisInventory);
    load();
    if (!earlyAccessPricing) return undefined;
    const id = window.setInterval(load, 30000);
    const onVis = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [earlyAccessPricing]);

  const handleGetStarted = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const completedOpt = useMemo(() => {
    if (onCheckoutCompleted) return { onCheckoutCompleted };
    return {} as { onCheckoutCompleted?: (p: CheckoutProductKey) => void };
  }, [onCheckoutCompleted]);

  const confirmBookwormFreePlan = useCallback(async () => {
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/pricing?billing=required'));
      return;
    }
    setBookwormConfirmBusy(true);
    const r = await markBookwormPlanSelectedForCurrentUser();
    if (!r.ok) {
      toast.error(r.message ?? 'Could not confirm your plan');
      setBookwormConfirmBusy(false);
      return;
    }
    const hydrated = await refreshAuthUser();
    setBookwormConfirmBusy(false);
    if (!hydrated?.billingGatePassed) {
      toast.error('Still pending — try again in a moment.');
      return;
    }
    const dest = safeInternalPath(searchParams.get('redirect')) ?? '/dashboard';
    toast.success('Bookworm plan confirmed — welcome in.');
    navigate(dest, { replace: true });
  }, [user?.id, navigate, refreshAuthUser, searchParams]);

  const runCheckoutSubscription = useCallback(async () => {
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/pricing'));
      return;
    }
    const yearlyKey: CheckoutProductKey = 'bookworm_yearly';
    const monthlyKey: CheckoutProductKey = 'bookworm_monthly';
    const primary = displayedBilling ? yearlyKey : monthlyKey;
    let res = await openPaddleCheckout({
      product: primary,
      userId: user.id,
      email: user.email,
      ...completedOpt,
    });
    if (!res.ok && res.reason === 'no_price' && displayedBilling) {
      res = await openPaddleCheckout({
        product: monthlyKey,
        userId: user.id,
        email: user.email,
        ...completedOpt,
      });
    }
    if (!res.ok && res.reason === 'sold_out') {
      toast.error(res.message);
      return;
    }
    if (!res.ok && (res.reason === 'no_paddle' || res.reason === 'no_price')) {
      if (import.meta.env.DEV) toast.message(res.message);
      if (onCheckoutCompleted) {
        onCheckoutCompleted(primary);
        return;
      }
      handleGetStarted();
      return;
    }
    if (!res.ok) toast.error(res.message);
  }, [user, displayedBilling, navigate, handleGetStarted, completedOpt, onCheckoutCompleted]);

  const runBibliophileCheckout = useCallback(async () => {
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/pricing'));
      return;
    }
    const yearlyKey: CheckoutProductKey = 'bibliophile_yearly';
    const monthlyKey: CheckoutProductKey = 'bibliophile_monthly';
    const primary = displayedBilling ? yearlyKey : monthlyKey;
    let res = await openPaddleCheckout({ product: primary, userId: user.id, email: user.email, ...completedOpt });
    if (!res.ok && res.reason === 'no_price' && displayedBilling) {
      res = await openPaddleCheckout({ product: monthlyKey, userId: user.id, email: user.email, ...completedOpt });
    }
    if (!res.ok && (res.reason === 'no_paddle' || res.reason === 'no_price')) {
      if (import.meta.env.DEV) toast.message(res.message);
      if (onCheckoutCompleted) {
        onCheckoutCompleted(primary);
        return;
      }
      handleGetStarted();
      return;
    }
    if (!res.ok) toast.error(res.message);
  }, [user, displayedBilling, navigate, handleGetStarted, completedOpt, onCheckoutCompleted]);

  const lockEarlyBookworm = useCallback(async () => {
    if (user && !user.emailConfirmed) {
      toast.error('Please verify your email before checkout.');
      navigate('/auth/verify-email?redirect=' + encodeURIComponent('/early-access'));
      return;
    }
    const checkoutUserId = user?.id ?? 'guest';
    const checkoutEmail = user?.email;
    const gate = user ? assertPrelaunchCheckoutAllowed(user, 'bookworm') : { ok: true };
    if (!gate.ok) {
      setDupModal({ open: true, message: gate.message });
      return;
    }
    const product: CheckoutProductKey = displayedBilling ? 'bookworm_yearly' : 'bookworm_monthly';
    if (import.meta.env.DEV) {
      onCheckoutCompleted?.(product);
      return;
    }
    const res = await openPaddleCheckout({
      product,
      userId: checkoutUserId,
      email: checkoutEmail,
      ...completedOpt,
    });
    if (!res.ok && (res.reason === 'no_paddle' || res.reason === 'no_price')) {
      if (import.meta.env.DEV) toast.message(res.message);
      if (onCheckoutCompleted) {
        onCheckoutCompleted(product);
        return;
      }
      toast.error('Checkout is not configured yet.');
      return;
    }
    if (!res.ok) toast.error(res.message);
  }, [user, displayedBilling, completedOpt, onCheckoutCompleted, navigate, toast]);

  const lockEarlySage = useCallback(async () => {
    if (user && !user.emailConfirmed) {
      toast.error('Please verify your email before checkout.');
      navigate('/auth/verify-email?redirect=' + encodeURIComponent('/early-access'));
      return;
    }
    const checkoutUserId = user?.id ?? 'guest';
    const checkoutEmail = user?.email;
    const gate = user ? assertPrelaunchCheckoutAllowed(user, 'sage') : { ok: true };
    if (!gate.ok) {
      setDupModal({ open: true, message: gate.message });
      return;
    }
    const product: CheckoutProductKey = displayedBilling ? 'bibliophile_yearly' : 'bibliophile_monthly';
    if (import.meta.env.DEV) {
      onCheckoutCompleted?.(product);
      return;
    }
    const res = await openPaddleCheckout({
      product,
      userId: checkoutUserId,
      email: checkoutEmail,
      ...completedOpt,
    });
    if (!res.ok && (res.reason === 'no_paddle' || res.reason === 'no_price')) {
      if (import.meta.env.DEV) toast.message(res.message);
      if (onCheckoutCompleted) {
        onCheckoutCompleted(product);
        return;
      }
      toast.error('Checkout is not configured yet.');
      return;
    }
    if (!res.ok) toast.error(res.message);
  }, [user, displayedBilling, completedOpt, onCheckoutCompleted, navigate, toast]);

  const claimGenesisSeatEarly = useCallback(() => {
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/early-access/genesis-choice'));
      return;
    }
    if (!user.emailConfirmed) {
      toast.error('Please verify your email before continuing.');
      navigate('/auth/verify-email?redirect=' + encodeURIComponent('/early-access/genesis-choice'));
      return;
    }
    const gate = assertPrelaunchCheckoutAllowed(user, 'genesis');
    if (!gate.ok) {
      setDupModal({ open: true, message: gate.message });
      return;
    }
    markGenesisChoiceFlowPending();
    navigate('/early-access/genesis-choice', { state: { genesisLtd: true } });
  }, [user, navigate]);

  const dupModalEl = (
    <DuplicatePrelaunchPurchaseModal
      open={dupModal.open}
      message={dupModal.message}
      onClose={() => setDupModal({ open: false, message: '' })}
      onGoDashboard={() => {
        setDupModal({ open: false, message: '' });
        navigate('/dashboard');
      }}
    />
  );

  if (earlyAccessPricing) {
    const seatsRemaining = lifetimeDealSeatsRemaining(genesisInventory);
    const ltdSoldOut = seatsRemaining === 0;

    return (
      <>
        {dupModalEl}
        <div className="mb-10 flex flex-col items-center gap-4 md:mb-14 md:gap-5">
          <div
            className="relative grid w-56 grid-cols-2 rounded-full border border-white/10 bg-[#1a2f45]/50 p-1"
            role="group"
            aria-label="Billing period"
          >
            <div
              className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-[#266ba7] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                transform: billingYearly ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
              }}
            />
            <button
              type="button"
              onClick={() => selectBillingPeriod(false)}
              className={`relative z-10 min-h-11 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
                !billingYearly ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => selectBillingPeriod(true)}
              className={`relative z-10 min-h-11 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
                billingYearly ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              Yearly
            </button>
          </div>
          <div
            className={`flex min-h-[1.25rem] justify-center transition-opacity duration-300 ease-out ${
              billingYearly ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!billingYearly}
          >
            <span className="text-sm font-semibold text-[#266ba7]">Save 50%</span>
          </div>
          <div className="flex justify-center pt-0.5">
            <span
              className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-white/10 bg-[#1a2f45]/25 px-2.5 py-1 text-[11px] font-medium text-white/40"
              title="1 credit ≈ 1 AI interaction. Amounts shown are monthly credit pools."
            >
              <Info className="h-3 w-3 shrink-0 text-[#7bbdf3]/70" aria-hidden />
              Credit guide
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch md:gap-10 lg:gap-12">
          <ScrollReveal duration={0.42} yOffset={10} scale={1} delay={0} className="flex h-full min-h-0 flex-col">
            <div className="flex h-full min-h-0 flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#266ba7]/40 hover:shadow-[0_24px_48px_-12px_rgba(38,107,167,0.28)]">
              <div className="mb-6">
                <h3 className="mb-1 text-2xl font-bold text-white">Bookworm</h3>
              </div>
              <div
                className={`mb-6 transition-all duration-300 ease-out ${priceReveal ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
              >
                {displayedBilling ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-lg text-white/40 line-through">$6/month standard</span>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">$3</span>
                      <span className="text-sm text-white/50">per month</span>
                    </div>
                    <span className="text-xs text-white/45">billed annually · 50% off · tax-exclusive</span>
                    <span className="text-xs text-white/45">Billed annually: $36 total</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">$3</span>
                      <span className="text-sm text-white/50">per month</span>
                    </div>
                    <span className="text-xs text-white/45">billed monthly · tax-exclusive</span>
                  </div>
                )}
              </div>
              <ul className="mb-8 flex flex-1 flex-col space-y-3">
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  <span className="flex flex-wrap items-center gap-1.5">
                    800 AI credits per month (~25 sessions)
                    <span
                      className="inline-flex cursor-help text-[#7bbdf3]/90"
                      title="1 credit ≈ 1 AI interaction. 800 credits ≈ ~25 sessions/month."
                    >
                      <Info className="h-4 w-4" aria-hidden />
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  5 Sandboxes
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  Unlimited PDF uploads
                </li>
              </ul>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => void lockEarlyBookworm()}
                  className="w-full rounded-full bg-[#266ba7] py-3 font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/35 active:scale-[0.99]"
                >
                  Lock-in Pre-launch Price
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal duration={0.42} yOffset={10} scale={1} delay={0.06} className="flex h-full min-h-0 flex-col">
            <div className="flex h-full min-h-0 flex-col rounded-3xl border-2 border-[#3b82c4] bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] p-8 shadow-2xl shadow-[#266ba7]/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_28px_56px_-12px_rgba(38,107,167,0.38)]">
              <div className="mb-6">
                <h3 className="mb-1 text-2xl font-bold text-white">Sage</h3>
              </div>
              <div
                className={`mb-6 transition-all duration-300 ease-out ${priceReveal ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
              >
                {displayedBilling ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-lg text-white/50 line-through">$16/month standard</span>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">$8</span>
                      <span className="text-sm text-white/70">per month</span>
                    </div>
                    <span className="text-xs text-white/60">billed annually · 50% off · tax-exclusive</span>
                    <span className="text-xs text-white/45">Billed annually: $96 total</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">$8</span>
                      <span className="text-sm text-white/70">per month</span>
                    </div>
                    <span className="text-xs text-white/60">billed monthly · tax-exclusive</span>
                  </div>
                )}
              </div>
              <ul className="mb-8 flex flex-1 flex-col space-y-3">
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  <span className="flex flex-wrap items-center gap-1.5">
                    2,500 AI credits per month (~80 sessions)
                    <span
                      className="inline-flex cursor-help text-white/80"
                      title="1 credit ≈ 1 AI interaction. 2,500 credits ≈ ~80 sessions/month."
                    >
                      <Info className="h-4 w-4" aria-hidden />
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  Unused credits roll over every month
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  Unlimited Sandboxes
                </li>
              </ul>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => void lockEarlySage()}
                  className="w-full rounded-full bg-white py-3 font-semibold text-[#266ba7] transition-all duration-200 hover:bg-white/95 hover:shadow-xl active:scale-[0.99]"
                >
                  Lock-in Pre-launch Price
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal duration={0.42} yOffset={10} scale={1} delay={0.12} className="flex h-full min-h-0 flex-col">
            <div className="flex h-full min-h-0 flex-col rounded-3xl border-2 border-[#266ba7]/50 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#7bbdf3]/45 hover:shadow-[0_24px_48px_-12px_rgba(123,189,243,0.18)]">
              <div className="mb-6">
                <h3 className="mb-1 text-2xl font-bold text-white">Lifetime Deal</h3>
              </div>
              <div className="mb-6 space-y-3">
                <p className="flex flex-wrap items-baseline gap-2 leading-tight">
                  <span className="text-5xl font-bold tracking-tight text-white">$80</span>
                  <span className="text-sm font-medium text-white/45">· First 50 seats</span>
                </p>
                <p className="flex flex-wrap items-baseline gap-2 leading-tight">
                  <span className="text-5xl font-bold tracking-tight text-white">$119</span>
                  <span className="text-sm font-medium text-white/45">· Remaining 150 seats</span>
                </p>
                <p className="pt-1 text-lg font-bold leading-snug text-white">
                  {seatsRemaining != null ? `${seatsRemaining} seats remaining` : (
                    <span className="text-base font-semibold text-white/55">Loading seats…</span>
                  )}
                </p>
                <p
                  className="text-sm font-medium leading-relaxed text-[#7bbdf3]"
                  style={{
                    textShadow: '0 0 18px rgba(123,189,243,0.45), 0 0 36px rgba(38,107,167,0.2)',
                  }}
                >
                  Only 200 seats total. Ever.
                </p>
              </div>
              <ul className="mb-8 flex flex-1 flex-col space-y-3">
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  One-time 15,000 legacy AI credits included
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  Bookworm tier free forever
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  20% lifetime discount on Sage and Future Higher tier plans.
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  Exclusive Genesis identity badge.
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  Exclusive Quilora Cap Merch
                </li>
              </ul>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={claimGenesisSeatEarly}
                  disabled={ltdSoldOut}
                  className="w-full rounded-full bg-[#266ba7] py-3 font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
                >
                  {ltdSoldOut ? 'All Genesis seats claimed' : 'Claim my Seat'}
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <p className="mx-auto mt-14 max-w-3xl text-center text-xs leading-relaxed text-white/45 sm:mt-16 sm:text-sm md:mt-20">
          Monthly plans: first month charged today at the pre-launch rate · renews monthly at the standard rate after.
          Annual plans: full year charged upfront today at 50% off · renews annually at the standard rate after year 1.
          Lifetime Deal: one-time payment today. If we don&apos;t launch within 90 days of your purchase, you get a full
          refund — no questions asked.
        </p>
      </>
    );
  }

  return (
    <>
      {dupModalEl}
      {!earlyAccessPricing && genesisInventory ? (
        <div
          id="genesis-slot-counter"
          className="mb-8 rounded-2xl border border-[#266ba7]/25 bg-[#1a2f45]/40 px-4 py-3 text-center text-sm text-white/80"
        >
          <span className="font-mono text-xs uppercase tracking-wider text-[#7bbdf3]">Genesis lifetime slots</span>
          <p className="mt-1">
            €80 tier — <strong className="text-white">{genesisInventory.genesis80.remaining}</strong> / {genesisInventory.genesis80.cap} left · €119 tier —{' '}
            <strong className="text-white">{genesisInventory.genesis119.remaining}</strong> / {genesisInventory.genesis119.cap} left
          </p>
        </div>
      ) : null}

      {!earlyAccessPricing ? (
        <p className="mb-8 text-center text-xs text-white/45">Prices shown are tax-exclusive; Paddle shows tax before you pay.</p>
      ) : null}

      <div className="mb-12 flex flex-col items-center gap-3">
        <div
          className="relative grid w-56 grid-cols-2 rounded-full border border-white/10 bg-[#1a2f45]/50 p-1"
          role="group"
          aria-label="Billing period"
        >
          <div
            className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-[#266ba7] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              transform: billingYearly ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
            }}
          />
          <button
            type="button"
            onClick={() => selectBillingPeriod(false)}
            className={`relative z-10 min-h-11 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
              !billingYearly ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => selectBillingPeriod(true)}
            className={`relative z-10 min-h-11 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors duration-200 ${
              billingYearly ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Yearly
          </button>
        </div>
        <div
          className={`flex min-h-[1.25rem] justify-center transition-opacity duration-300 ease-out ${
            billingYearly ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!billingYearly}
        >
          <span className="text-sm font-semibold text-[#266ba7]">Save 18%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
        <div
          className="animate-fade-in-up relative flex h-full min-h-0 flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#266ba7]/35 hover:shadow-[0_24px_48px_-12px_rgba(38,107,167,0.25)]"
          style={{ animationDelay: '0ms' }}
        >
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold text-white">Bookworm</h3>
            <p className="text-sm text-white/60">Solid credits each month — up to 5 sandboxes.</p>
          </div>
          <div
            className={`mb-6 transition-all duration-300 ease-out ${priceReveal ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
          >
            {displayedBilling ? (
              <div className="flex flex-col gap-1">
                <span className="text-lg text-white/40 line-through">€6/month</span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span id="price-display-bookworm" className="text-5xl font-bold text-white">
                    €4.92
                  </span>
                  <span className="text-sm text-white/50">/month</span>
                </div>
                <span className="text-xs text-white/45">billed annually · tax-exclusive</span>
                <span className="text-xs text-white/45">Billed annually: €59.04 total</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">€6</span>
                <span className="text-sm text-white/50">/month · tax-exclusive</span>
              </div>
            )}
          </div>
          <ul className="mb-8 space-y-3">
            {['800 credits / month', 'Up to 5 sandboxes', 'Core canvas & AI'].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void runCheckoutSubscription()}
            className="w-full rounded-full bg-[#266ba7] py-3 font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/35 active:scale-[0.99]"
          >
            Choose Bookworm
          </button>
          <p className="mb-2 mt-4 text-center text-xs text-white/45">
            Staying on the free tier? You still need to confirm Bookworm once — no card required.
          </p>
          <button
            type="button"
            disabled={bookwormConfirmBusy}
            onClick={() => void confirmBookwormFreePlan()}
            className="w-full rounded-full border border-white/20 bg-white/5 py-3 font-semibold text-white transition-all duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bookwormConfirmBusy ? 'Saving…' : 'Confirm free Bookworm plan'}
          </button>
        </div>

        <div
          className="animate-fade-in-up relative flex h-full min-h-0 flex-col rounded-3xl border-2 border-[#3b82c4] bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] p-8 shadow-2xl shadow-[#266ba7]/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_28px_56px_-12px_rgba(38,107,167,0.35)]"
          style={{ animationDelay: '75ms' }}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-sm font-semibold text-[#266ba7]">Most Popular</div>
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold text-white">Sage</h3>
            <p className="text-sm text-white/80">Bibliophile tier — rollover credits, unlimited sandboxes.</p>
          </div>
          <div
            className={`mb-6 transition-all duration-300 ease-out ${priceReveal ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
          >
            {displayedBilling ? (
              <div className="flex flex-col gap-1">
                <span className="text-lg text-white/50 line-through">€16/month</span>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span id="price-display-sage" className="text-5xl font-bold text-white">
                    €13.12
                  </span>
                  <span className="text-sm text-white/70">/month</span>
                </div>
                <span className="text-xs text-white/60">billed annually · save 18% · tax-exclusive</span>
                <span className="text-xs text-white/45">Billed annually: €157.44 total</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">€16</span>
                <span className="text-sm text-white/70">/month · tax-exclusive</span>
              </div>
            )}
          </div>
          <ul className="mb-8 space-y-3">
            {['2,500 credits / month', 'Unlimited sandboxes', 'Rollover credits', 'Priority-friendly usage'].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-white/90">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void runBibliophileCheckout()}
            className="w-full rounded-full bg-white py-3 font-semibold text-[#266ba7] transition-all duration-200 hover:bg-white/95 hover:shadow-xl active:scale-[0.99]"
          >
            Upgrade to Sage
          </button>
        </div>

        <div
          className="animate-fade-in-up relative flex h-full min-h-0 flex-col rounded-3xl border-2 border-[#266ba7]/50 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#7bbdf3]/40 hover:shadow-[0_24px_48px_-12px_rgba(123,189,243,0.15)]"
          style={{ animationDelay: '150ms' }}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-[#266ba7] bg-[#266ba7]/15 px-4 py-1 text-sm font-semibold text-[#266ba7]">
            Limited Offer
          </div>
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold text-white">Genesis</h3>
            <p className="text-sm text-white/60">Lifetime depth — strictly limited seats.</p>
          </div>
          <div className="mb-6 space-y-2">
            <p className="text-xs text-white/50">One-time · tax-exclusive</p>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-white/45">€80</p>
                <span id="price-display-genesis-80" className="text-4xl font-bold text-white">
                  €80
                </span>
                {genesisInventory ? (
                  <p className="mt-1 text-xs text-[#7bbdf3]">{genesisInventory.genesis80.remaining} seats left</p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-white/45">€119</p>
                <span id="price-display-genesis-119" className="text-4xl font-bold text-white">
                  €119
                </span>
                {genesisInventory ? (
                  <p className="mt-1 text-xs text-[#7bbdf3]">{genesisInventory.genesis119.remaining} seats left</p>
                ) : null}
              </div>
            </div>
          </div>
          <ul className="mb-8 space-y-3">
            {['15,000 credits / month', 'Unlimited sandboxes', 'Genesis badge & perks'].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={claimGenesisSeatEarly}
              className="min-h-11 w-full rounded-full bg-[#266ba7] py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30 active:scale-[0.99]"
            >
              Choose your Genesis package
            </button>
            <p className="text-center text-xs text-white/45">€80 or €119 tier is selected on the next screen based on remaining seats.</p>
          </div>
        </div>
      </div>

      {!earlyAccessPricing ? (
        <>
          <div className="mt-14 overflow-x-auto rounded-2xl border border-white/10">
            <table id="feature-comparison-table" className="w-full min-w-[520px] border-collapse text-left text-sm">
              <caption className="sr-only">Feature comparison by tier</caption>
              <thead>
                <tr className="border-b border-white/10 bg-[#1a2f45]/60">
                  <th className="px-4 py-3 font-semibold text-white/90">Feature</th>
                  <th className="px-4 py-3 font-semibold text-white/90">Bookworm</th>
                  <th className="px-4 py-3 font-semibold text-white/90">Sage</th>
                  <th className="px-4 py-3 font-semibold text-white/90">Genesis</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                {[
                  ['Monthly credits', '800', '2,500', '15,000'],
                  ['Sandboxes', 'Up to 5', 'Unlimited', 'Unlimited'],
                  ['Credit rollover', '—', 'Yes', 'Yes'],
                  ['Billing', 'Monthly / yearly', 'Monthly / yearly', 'One-time lifetime'],
                ].map(([a, b, c, d]) => (
                  <tr key={String(a)} className="border-b border-white/5">
                    <td className="px-4 py-2.5 font-medium text-white/80">{a}</td>
                    <td className="px-4 py-2.5">{b}</td>
                    <td className="px-4 py-2.5">{c}</td>
                    <td className="px-4 py-2.5">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p id="tax-note" className="mt-4 text-center text-xs text-white/40">
            Tax (if any) is calculated by Paddle at checkout from your billing location.
          </p>
        </>
      ) : null}
    </>
  );
}
