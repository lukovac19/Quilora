import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import type { CheckoutProductKey } from '../lib/billingCheckout';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { PricingPlansBlock } from '../components/marketing/PricingPlansBlock';

export function PreLaunchEarlyAccessPage() {
  const navigate = useNavigate();

  const onCheckoutCompleted = useCallback(
    (_product: CheckoutProductKey) => {
      navigate('/onboarding');
    },
    [navigate],
  );

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <QuiloraMarketingNavBar logoOnly />

      <main className="flex-1 px-4 pb-16 pt-40 sm:px-6 sm:pb-20 sm:pt-44 md:pt-48 lg:pt-52">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center space-y-8 sm:space-y-10">
          <div className="w-full space-y-4 text-center">
            <h1 className="quilora-heading-section font-bold text-white text-3xl lg:text-5xl">You found us early. That means something.</h1>
            <p className="mx-auto max-w-2xl text-lg text-white/60 sm:text-xl">
              As one of our first believers, you get the best deal Quilora will ever offer. Lock in your rate now — your plan starts the day we go live.
            </p>
          </div>

          <div className="w-full">
            <PricingPlansBlock earlyAccessPricing onCheckoutCompleted={onCheckoutCompleted} />
          </div>

          <p className="max-w-2xl text-center text-xs leading-relaxed text-white/45 sm:text-sm">
            Pre-launch policies, email names, and refund definitions are listed on the{' '}
            <Link to="/early-access/promises" className="font-medium text-[#7bbdf3] underline-offset-2 hover:underline">
              promise registry
            </Link>{' '}
            (Phase 7 of the internal flow spec).
          </p>
        </div>
      </main>

      <QuiloraSiteFooter homeProductAnchors />
    </div>
  );
}
