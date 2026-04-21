import { useEffect } from 'react';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { PricingPlansBlock } from '../components/marketing/PricingPlansBlock';
import { markPrelaunchFlowEntered } from '../lib/prelaunchFlowFlag';

export function PreLaunchEarlyAccessPage() {
  useEffect(() => {
    markPrelaunchFlowEntered();
  }, []);

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <QuiloraMarketingNavBar logoOnly />

      <main className="flex-1 px-4 pb-16 pt-40 sm:px-6 sm:pb-20 sm:pt-44 md:pt-48 lg:pt-52">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14 md:gap-20 lg:gap-24">
          <header className="w-full space-y-6 text-center md:space-y-8">
            <h1 className="quilora-heading-section text-3xl font-bold text-white lg:text-5xl">
              You found us early. That means something.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl md:max-w-3xl">
              As one of our first believers, you get the best deal Quilora will ever offer. You&apos;ll be charged today
              at your pre-launch rate — your canvas access and your plan period both begin on launch day.
            </p>
          </header>

          <div className="w-full pt-2 md:pt-4">
            <PricingPlansBlock earlyAccessPricing />
          </div>
        </div>
      </main>

      <QuiloraSiteFooter />
    </div>
  );
}
