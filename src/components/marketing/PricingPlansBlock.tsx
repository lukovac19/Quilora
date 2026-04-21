import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Check, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useApp } from '../../context/AppContext';
import {
  openDodoCheckout,
  fetchGenesisInventory,
  getCheckoutProductId,
  isEarlyBirdSoldOut,
  isGenesisSoldOut,
  lifetimeDealSeatsRemaining,
  type CheckoutProductKey,
  type GenesisInventory,
} from '../../lib/billingCheckout';
import { CheckoutButton } from '../CheckoutButton';
import { markGenesisChoiceFlowPending } from '../../lib/genesisEarlyAccessSession';
import { assertPrelaunchCheckoutAllowed } from '../../lib/prelaunchPurchaseGuards';
import { DuplicatePrelaunchPurchaseModal } from '../prelaunch/DuplicatePrelaunchPurchaseModal';
import { ScrollReveal } from '../ScrollReveal';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

const TIP_AI_CREDITS =
  'AI Credits are consumed only for AI interactions. PDF uploads and other features are already included in the plan depending on the availed Tier.';
const TIP_SANDBOXES =
  'Workspaces to organize your tasks. Create exclusive areas for specific themes, books, or projects.';
const TIP_CREDITS_ROLLOVER =
  'Unused credits carry over to the next month, ideal for users with fluctuating workloads.';
const TIP_LEGACY_15K =
  'This is a one-time AI credits boost exclusive for LTD accounts. These credits do not expire and act as a massive starter pool for your workspace.';
const TIP_QUILORA_CAP =
  'Shipping and size details will be coordinated with you via email within the next 90 days. Please note: Shipping costs are not included.';

function PlanInfoTip({ label, text, triggerClassName }: { label: string; text: string; triggerClassName?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex shrink-0 cursor-help items-center justify-center rounded-full border-0 bg-transparent p-0.5 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#266ba7]/45 ${triggerClassName ?? 'text-[#7bbdf3]/90'}`}
          aria-label={label}
        >
          <Info className="h-4 w-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[min(320px,calc(100vw-2rem))] border border-white/15 bg-[#0f2336] px-3 py-2.5 text-left text-xs font-normal leading-relaxed text-white shadow-xl [&>svg]:fill-[#0f2336]"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export type PricingPlansBlockProps = {
  /** Early access: Monthly/Yearly toggle and plan cards only (no genesis banner, tax line, comparison table). */
  earlyAccessPricing?: boolean;
  /** When set, checkout completion in this tab invokes this (early access and default pricing). */
  onCheckoutCompleted?: (product: CheckoutProductKey) => void;
};

/** Shared Bookworm · Sage · Genesis grid — used on /pricing and landing (#pricing) to stay in sync. */
export function PricingPlansBlock({ earlyAccessPricing = false, onCheckoutCompleted }: PricingPlansBlockProps) {
  const { user } = useApp();
  const navigate = useNavigate();
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
    const pollMs = earlyAccessPricing ? 10_000 : 10_000;
    const id = window.setInterval(load, pollMs);
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
    navigate('/auth?redirect=' + encodeURIComponent('/pricing'));
  }, [navigate]);

  const completedOpt = useMemo(() => {
    if (onCheckoutCompleted) return { onCheckoutCompleted };
    return {} as { onCheckoutCompleted?: (p: CheckoutProductKey) => void };
  }, [onCheckoutCompleted]);

  const runCheckoutSubscription = useCallback(async () => {
    if (!user?.id) {
      navigate('/auth?redirect=' + encodeURIComponent('/pricing'));
      return;
    }
    const yearlyKey: CheckoutProductKey = 'bookworm_yearly';
    const monthlyKey: CheckoutProductKey = 'bookworm_monthly';
    const primary = displayedBilling ? yearlyKey : monthlyKey;
    let res = await openDodoCheckout({
      product: primary,
      userId: user.id,
      email: user.email,
      ...completedOpt,
    });
    if (!res.ok && res.reason === 'no_price' && displayedBilling) {
      res = await openDodoCheckout({
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
    if (!res.ok && (res.reason === 'no_dodo' || res.reason === 'no_price')) {
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
      navigate('/auth?redirect=' + encodeURIComponent('/pricing'));
      return;
    }
    const yearlyKey: CheckoutProductKey = 'sage_yearly';
    const monthlyKey: CheckoutProductKey = 'sage_monthly';
    const primary = displayedBilling ? yearlyKey : monthlyKey;
    let res = await openDodoCheckout({ product: primary, userId: user.id, email: user.email, ...completedOpt });
    if (!res.ok && res.reason === 'no_price' && displayedBilling) {
      res = await openDodoCheckout({ product: monthlyKey, userId: user.id, email: user.email, ...completedOpt });
    }
    if (!res.ok && (res.reason === 'no_dodo' || res.reason === 'no_price')) {
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
    if (!user?.id) {
      navigate('/auth?redirect=' + encodeURIComponent('/early-access'));
      return;
    }
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
    const res = await openDodoCheckout({
      product,
      userId: checkoutUserId,
      email: checkoutEmail,
      ...completedOpt,
    });
    if (!res.ok && (res.reason === 'no_dodo' || res.reason === 'no_price')) {
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
    if (!user?.id) {
      navigate('/auth?redirect=' + encodeURIComponent('/early-access'));
      return;
    }
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
    const product: CheckoutProductKey = displayedBilling ? 'sage_yearly' : 'sage_monthly';
    if (import.meta.env.DEV) {
      onCheckoutCompleted?.(product);
      return;
    }
    const res = await openDodoCheckout({
      product,
      userId: checkoutUserId,
      email: checkoutEmail,
      ...completedOpt,
    });
    if (!res.ok && (res.reason === 'no_dodo' || res.reason === 'no_price')) {
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
      navigate('/auth?redirect=' + encodeURIComponent('/early-access/genesis-choice'));
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

  const earlyBirdSoldOut = genesisInventory ? isEarlyBirdSoldOut(genesisInventory) : false;
  const lifetimeEarlyId = getCheckoutProductId('lifetime_early_bird');
  const lifetimeStandardId = getCheckoutProductId('lifetime_standard');
  const lifetimePlusSageId = getCheckoutProductId('lifetime_plus_sage');

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
                    <PlanInfoTip label="AI Credits" text={TIP_AI_CREDITS} />
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  <span className="flex flex-wrap items-center gap-1.5">
                    5 Sandboxes
                    <PlanInfoTip label="Sandboxes" text={TIP_SANDBOXES} />
                  </span>
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
                    <PlanInfoTip label="AI Credits" text={TIP_AI_CREDITS} triggerClassName="text-white/80" />
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  <span className="flex flex-wrap items-center gap-1.5">
                    Unused credits roll over every month
                    <PlanInfoTip label="Credits Rollover" text={TIP_CREDITS_ROLLOVER} triggerClassName="text-white/80" />
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  <span className="flex flex-wrap items-center gap-1.5">
                    Unlimited Sandboxes
                    <PlanInfoTip label="Sandboxes" text={TIP_SANDBOXES} triggerClassName="text-white/80" />
                  </span>
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
            <div className="flex h-full min-h-0 flex-col rounded-3xl border-2 border-amber-400/45 bg-gradient-to-br from-amber-950/30 via-[#1a2f45]/55 to-[#0a1929] p-8 shadow-[0_24px_56px_-14px_rgba(218,165,32,0.22)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-amber-300/55 hover:shadow-[0_28px_64px_-12px_rgba(251,191,36,0.26)]">
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
                  <span className="flex flex-wrap items-center gap-1.5">
                    15,000 one time legacy credits
                    <PlanInfoTip label="15,000 Legacy Credits" text={TIP_LEGACY_15K} />
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  Bookworm Plan free forever
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  20% Lifetime discount on Sage and Future higher plans
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  Exclusive Genesis Account identity badge
                </li>
                <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  <span className="flex flex-wrap items-center gap-1.5">
                    Quilora Cap (Exclusive for LTD)
                    <PlanInfoTip label="Quilora Cap" text={TIP_QUILORA_CAP} />
                  </span>
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
            {genesisInventory.genesis176 ? (
              <>
                {' '}
                · €176 bundle — <strong className="text-white">{genesisInventory.genesis176.remaining}</strong> left
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {!earlyAccessPricing ? (
        <p className="mb-8 text-center text-xs text-white/45">Prices shown are tax-exclusive; Dodo Payments shows tax before you pay.</p>
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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch md:gap-10 lg:gap-12">
        <ScrollReveal duration={0.42} yOffset={10} scale={1} delay={0} className="flex h-full min-h-0 flex-col">
          <div className="relative flex h-full min-h-0 flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#266ba7]/40 hover:shadow-[0_24px_48px_-12px_rgba(38,107,167,0.28)]">
            <div className="mb-6">
              <h3 className="mb-1 text-2xl font-bold text-white">Basic</h3>
              <p className="text-xs text-white/45">Same tier as Bookworm in-app</p>
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
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">€6</span>
                    <span className="text-sm text-white/50">/month</span>
                  </div>
                  <span className="text-xs text-white/45">billed monthly · tax-exclusive</span>
                </div>
              )}
            </div>
            <ul className="mb-8 flex flex-1 flex-col space-y-3">
              {['800 credits / month', 'Up to 5 sandboxes', 'Core canvas & AI'].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              {getCheckoutProductId(displayedBilling ? 'bookworm_yearly' : 'bookworm_monthly') ? (
                <CheckoutButton
                  productId={getCheckoutProductId(displayedBilling ? 'bookworm_yearly' : 'bookworm_monthly')!}
                  productKind={displayedBilling ? 'bookworm_yearly' : 'bookworm_monthly'}
                  label={displayedBilling ? 'Choose Basic (yearly)' : 'Choose Basic (monthly)'}
                  duplicateGate="bookworm"
                  className="w-full rounded-full bg-[#266ba7] py-3 font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/35 active:scale-[0.99]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void runCheckoutSubscription()}
                  className="w-full rounded-full bg-[#266ba7] py-3 font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/35 active:scale-[0.99]"
                >
                  Choose Basic
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal duration={0.42} yOffset={10} scale={1} delay={0.06} className="flex h-full min-h-0 flex-col">
          <div className="relative flex h-full min-h-0 flex-col rounded-3xl border-2 border-[#3b82c4] bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] p-8 shadow-2xl shadow-[#266ba7]/30 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_28px_56px_-12px_rgba(38,107,167,0.38)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-sm font-semibold text-[#266ba7]">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="mb-1 text-2xl font-bold text-white">Pro</h3>
              <p className="text-xs text-white/50">Same tier as Sage in-app</p>
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
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">€16</span>
                    <span className="text-sm text-white/70">/month</span>
                  </div>
                  <span className="text-xs text-white/60">billed monthly · tax-exclusive</span>
                </div>
              )}
            </div>
            <ul className="mb-8 flex flex-1 flex-col space-y-3">
              {['2,500 credits / month', 'Unlimited sandboxes', 'Rollover credits', 'Priority-friendly usage'].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-white" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              {getCheckoutProductId(displayedBilling ? 'sage_yearly' : 'sage_monthly') ? (
                <CheckoutButton
                  productId={getCheckoutProductId(displayedBilling ? 'sage_yearly' : 'sage_monthly')!}
                  productKind={displayedBilling ? 'sage_yearly' : 'sage_monthly'}
                  label={displayedBilling ? 'Upgrade to Sage (yearly)' : 'Upgrade to Sage (monthly)'}
                  duplicateGate="sage"
                  className="w-full rounded-full bg-white py-3 font-semibold text-[#266ba7] transition-all duration-200 hover:bg-white/95 hover:shadow-xl active:scale-[0.99]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void runBibliophileCheckout()}
                  className="w-full rounded-full bg-white py-3 font-semibold text-[#266ba7] transition-all duration-200 hover:bg-white/95 hover:shadow-xl active:scale-[0.99]"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal duration={0.42} yOffset={10} scale={1} delay={0.12} className="flex h-full min-h-0 flex-col">
          <div className="relative flex h-full min-h-0 flex-col rounded-3xl border-2 border-[#266ba7]/50 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#7bbdf3]/45 hover:shadow-[0_24px_48px_-12px_rgba(123,189,243,0.18)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-[#266ba7] bg-[#266ba7]/15 px-4 py-1 text-sm font-semibold text-[#266ba7]">
              Limited Offer
            </div>
            <div className="mb-6">
              <h3 className="mb-1 text-2xl font-bold text-white">Enterprise</h3>
              <p className="text-xs text-white/45">Genesis lifetime program</p>
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
            <ul className="mb-8 flex flex-1 flex-col space-y-3">
              <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                15,000 legacy credits (one-time allocation)
              </li>
              <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                Unlimited sandboxes
              </li>
              <li className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#266ba7]" />
                Genesis badge & perks
              </li>
            </ul>
              <div className="mt-auto flex flex-col gap-2 pt-6">
              {!earlyBirdSoldOut && lifetimeEarlyId ? (
                <CheckoutButton
                  productId={lifetimeEarlyId}
                  productKind="lifetime_early_bird"
                  label="Lifetime Early Bird — $80 (50 seats)"
                  duplicateGate="genesis"
                  requireEmailVerified
                  className="min-h-11 w-full rounded-full bg-[#266ba7] py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30 active:scale-[0.99]"
                />
              ) : null}
              {lifetimeStandardId ? (
                <CheckoutButton
                  productId={lifetimeStandardId}
                  productKind="lifetime_standard"
                  label="Lifetime Standard — $119"
                  duplicateGate="genesis"
                  requireEmailVerified
                  className="min-h-11 w-full rounded-full border border-white/20 bg-white/10 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-white/15 active:scale-[0.99]"
                />
              ) : null}
              {lifetimePlusSageId ? (
                <CheckoutButton
                  productId={lifetimePlusSageId}
                  productKind="lifetime_plus_sage"
                  label="Lifetime + 1 Year Sage — $176"
                  duplicateGate="genesis"
                  requireEmailVerified
                  className="min-h-11 w-full rounded-full border border-[#7bbdf3]/40 bg-[#1a2f45]/80 py-3 text-base font-semibold text-[#7bbdf3] transition-all duration-200 hover:bg-[#1a2f45] active:scale-[0.99]"
                />
              ) : null}
              {!lifetimeEarlyId && !lifetimeStandardId && !lifetimePlusSageId ? (
                <button
                  type="button"
                  onClick={claimGenesisSeatEarly}
                  className="min-h-11 w-full rounded-full bg-[#266ba7] py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30 active:scale-[0.99]"
                >
                  Choose your Genesis package
                </button>
              ) : null}
              <p className="text-center text-xs text-white/45">
                Early Bird hides automatically after 50 sales. Standard and bundle use separate checkout products.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {!earlyAccessPricing ? (
        <>
          <div className="mt-14 overflow-x-auto rounded-2xl border border-white/10">
            <table id="feature-comparison-table" className="w-full min-w-[520px] border-collapse text-left text-sm">
              <caption className="sr-only">Feature comparison by tier</caption>
              <thead>
                <tr className="border-b border-white/10 bg-[#1a2f45]/60">
                  <th className="px-4 py-3 font-semibold text-white/90">Feature</th>
                  <th className="px-4 py-3 font-semibold text-white/90">Basic</th>
                  <th className="px-4 py-3 font-semibold text-white/90">Pro</th>
                  <th className="px-4 py-3 font-semibold text-white/90">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                {[
                  ['AI credits', '800 / month', '2,500 / month', '15,000 legacy (one-time)'],
                  ['Sandboxes', 'Up to 5', 'Unlimited', 'Unlimited'],
                  ['Credit rollover', '—', 'Yes', '—'],
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
            Tax (if any) is calculated by Dodo Payments at checkout from your billing location.
          </p>
        </>
      ) : null}
    </>
  );
}
