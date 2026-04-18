import { Link, useNavigate, useSearchParams } from 'react-router';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { QuiloraNavLogoLink } from '../components/QuiloraNavLogoLink';
import { useApp } from '../context/AppContext';
import { useState, useEffect, useCallback } from 'react';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { openPlanCheckout } from '../lib/billingCheckout';
import type { InternalPlanKey } from '../lib/billing/types';
import { PricingPlansBlock } from '../components/marketing/PricingPlansBlock';

let pricingBoostCheckoutThrottleAt = 0;

export function PricingPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const onCheckoutCompletedPlan = useCallback((_product: InternalPlanKey) => {
    navigate('/onboarding');
  }, [navigate]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What do I get with each plan?',
      answer:
        'Each plan gives you monthly AI credits and access to all core features, with higher tiers unlocking more credits and fewer limits on things like sandboxes and saved work.',
    },
    {
      question: 'What are credits and how do they work?',
      answer:
        'Credits are only used for AI actions like analysis, prompts, and assessments—Canvas Mode and core features are fully included in all plans.',
    },
    {
      question: 'What happens if I run out of credits?',
      answer:
        'You can continue using non-AI features, or instantly top up with a Boost Pack to keep going without interruption.',
    },
    {
      question: 'Do unused credits roll over?',
      answer:
        'Credits only roll over on the Sage plan (and future higher tiers), so unused credits aren’t lost at the end of each billing cycle.',
    },
    {
      question: 'Can I upgrade or downgrade anytime?',
      answer:
        'Yes—you can switch plans anytime, and your work stays intact with changes applied immediately to your account.',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchParams.get('checkout') !== 'boost') return;
    if (!user?.id) {
      navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/pricing?checkout=boost'));
      return;
    }
    const now = Date.now();
    if (now - pricingBoostCheckoutThrottleAt < 900) return;
    pricingBoostCheckoutThrottleAt = now;
    const uid = user.id;
    const email = user.email;
    let cancelled = false;
    void (async () => {
      const res = await openPlanCheckout({
        planKey: 'boost_pack',
        userId: uid,
        email,
      });
      if (cancelled) return;
      setSearchParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.delete('checkout');
          return next;
        },
        { replace: true },
      );
      if (!res.ok) {
        if (res.reason === 'not_configured') {
          if (import.meta.env.DEV) toast.message(res.message);
        } else {
          toast.error(res.message);
        }
      } else {
        toast.success('Checkout opened — credits apply after payment is confirmed.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, user?.id, user?.email, navigate, setSearchParams]);

  const handleGetStarted = useCallback(() => {
    navigate('/auth?mode=signup');
  }, [navigate]);

  const billingGateRequired = searchParams.get('billing') === 'required';

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'backdrop-blur-lg bg-[#0a1929]/80 border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <QuiloraNavLogoLink />

            <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
              <Link to="/features" className="cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white">
                Features
              </Link>
              <Link to="/how-it-works" className="cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white">
                How it Works
              </Link>
              <Link
                to="/pricing"
                className="cursor-pointer text-base text-white underline decoration-[#266ba7] decoration-2 underline-offset-4 transition-colors duration-200 hover:text-white"
              >
                Pricing
              </Link>
              <Link to="/faq" className="cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white">
                FAQ
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 rounded-full bg-[#266ba7] hover:bg-[#3b82c4] text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#266ba7]/30 hover:-translate-y-0.5"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/auth?mode=login')}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    Log In
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="px-6 py-2.5 rounded-full bg-[#266ba7] hover:bg-[#3b82c4] text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#266ba7]/30 hover:-translate-y-0.5"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="min-h-11 shrink-0 rounded-full bg-[#266ba7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b82c4]"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="min-h-11 shrink-0 rounded-full bg-[#266ba7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b82c4]"
                >
                  Get Started
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 w-full animate-fade-in border-t border-white/10 pt-3 pb-2 md:hidden">
              <div className="flex w-full flex-col items-stretch gap-1">
                <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  Features
                </Link>
                <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  How it Works
                </Link>
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white underline transition-colors hover:bg-white/5">
                  Pricing
                </Link>
                <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  FAQ
                </Link>
                {!user && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/auth?mode=login');
                    }}
                    className="min-h-11 rounded-lg px-2 py-3 text-left text-base text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Log In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pb-8 pt-32 sm:px-6 sm:pt-36 md:pt-40">
        <div className="container mx-auto max-w-6xl">
          {billingGateRequired ? (
            <div
              role="status"
              className="mb-8 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-4 text-center text-sm text-amber-50 sm:px-6"
            >
              <strong className="font-semibold">Finish setup to use Quilora.</strong> Choose a paid plan below, or confirm the
              free Bookworm tier before you can open the app.
            </div>
          ) : null}
          <div className="text-center space-y-4">
            <h1 className="text-3xl lg:text-5xl font-bold text-white">
              Choose your path to mastering your reading list.
            </h1>
            <p className="text-xl text-white/60">Select the plan that aligns with your goals.</p>
          </div>
        </div>
      </section>

      {/* EP-02 Landing / Pricing — Bookworm · Sage · Genesis */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="container mx-auto max-w-6xl">
          <PricingPlansBlock onCheckoutCompleted={onCheckoutCompletedPlan} />
        </div>
      </section>

      {/* Boost Pack — same offer as Payments / credits context */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-white">Running low before your renewal?</h2>
            <p className="mt-2 text-base text-white/60">Grab a Boost Pack to keep going</p>
            <p className="mt-4 text-lg font-semibold text-[#7bbdf3]">$1.99 for 200 credits</p>
            <button
              type="button"
              onClick={() => {
                if (!user?.id) {
                  navigate('/auth?mode=signup&redirect=' + encodeURIComponent('/pricing?checkout=boost'));
                  return;
                }
                void openPlanCheckout({ planKey: 'boost_pack', userId: user.id, email: user.email }).then((res) => {
                  if (!res.ok && res.reason !== 'not_configured') toast.error(res.message);
                  else if (!res.ok && import.meta.env.DEV) toast.message(res.message);
                  else if (res.ok) toast.success('Checkout opened — credits apply after payment is confirmed.');
                });
              }}
              className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#266ba7] px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30"
            >
              Buy Boost Pack
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-12">
            Frequently Asked Questions about Pricing
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className="rounded-2xl bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-sm border border-white/10 overflow-hidden transition-all duration-300 hover:border-[#266ba7]/30"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left transition-all"
                >
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-[#266ba7] flex-shrink-0 transition-transform duration-300 ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFAQ === index ? 'max-h-[36rem]' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6 text-white/70 leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuiloraSiteFooter />
    </div>
  );
}
