import { useEffect, useState } from 'react';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { PricingPlansBlock } from '../components/marketing/PricingPlansBlock';
import { markPrelaunchFlowEntered } from '../lib/prelaunchFlowFlag';

export function PreLaunchEarlyAccessPage() {
  const [showHeadlineLine2, setShowHeadlineLine2] = useState(false);
  const [showSubhead, setShowSubhead] = useState(false);

  useEffect(() => {
    markPrelaunchFlowEntered();
  }, []);

  useEffect(() => {
    const headlineLine2DelayMs = 720;
    const headlineAnimMs = 900;
    const pauseAfterHeadlineMs = 460;
    const line2 = window.setTimeout(() => setShowHeadlineLine2(true), headlineLine2DelayMs);
    const sub = window.setTimeout(
      () => setShowSubhead(true),
      headlineLine2DelayMs + headlineAnimMs + pauseAfterHeadlineMs,
    );
    return () => {
      window.clearTimeout(line2);
      window.clearTimeout(sub);
    };
  }, []);

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <QuiloraMarketingNavBar logoOnly />

      <main className="flex-1 px-4 pb-16 pt-40 sm:px-6 sm:pb-20 sm:pt-44 md:pt-48 lg:pt-52">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14 md:gap-20 lg:gap-24">
          <header className="w-full space-y-6 text-center md:space-y-8" aria-live="polite">
            <h1 className="quilora-heading-section mx-auto flex max-w-5xl flex-wrap justify-center gap-x-3 gap-y-1 text-balance text-3xl font-bold leading-tight text-white sm:gap-x-4 md:flex-nowrap md:gap-x-[0.45em] lg:text-5xl">
              <span className="animate-prelaunch-headline-reveal inline-block text-center">You found us early.</span>
              {showHeadlineLine2 ? (
                <span className="animate-prelaunch-headline-reveal inline-block text-center">That means something.</span>
              ) : null}
            </h1>
            {showSubhead ? (
              <p className="animate-prelaunch-sub-reveal mx-auto max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl md:max-w-3xl">
                As one of our first believers, you get the best deal Quilora will ever offer. You&apos;ll be charged today
                at your pre-launch rate — your canvas access and your plan period both begin on launch day.
              </p>
            ) : null}
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
