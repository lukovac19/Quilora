import { Link, useNavigate, useSearchParams } from 'react-router';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { useApp } from '../context/AppContext';
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { openPaddleCheckout, type CheckoutProductKey } from '../lib/billingCheckout';
import { PricingPlansBlock } from '../components/marketing/PricingPlansBlock';

let pricingBoostCheckoutThrottleAt = 0;

export function PricingPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const onCheckoutCompletedPlan = useCallback((_product: CheckoutProductKey) => {
    navigate('/onboarding');
  }, [navigate]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What are the limitations of the Free plan?',
      answer:
        'The Free plan allows 5 questions per session with a 4-hour cooldown period between sessions. You get basic AI analysis and quote extraction features.',
    },
    {
      question: 'Can I upgrade or downgrade my plan at any time?',
      answer:
        'Yes, you can upgrade or downgrade your subscription at any time. Changes take effect immediately for upgrades, and at the end of the billing period for downgrades.',
    },
    {
      question: 'How is Quilora different from ChatGPT or other AI chatbots?',
      answer:
        'Quilora is specifically designed for literature analysis with specialized features like character tracking, theme analysis, and quote extraction. Unlike general chatbots, it understands narrative structure and literary devices.',
    },
    {
      question: 'Can I save my insights and export them?',
      answer:
        'Standard and Pro plans allow you to save insights. Pro users can export their analysis to PDF format for essays and presentations.',
    },
    {
      question: 'Can I use Quilora for academic essays?',
      answer:
        'Yes! Quilora provides essay support with structured outlines and insights. However, we recommend using it as a study aid and analysis tool, not as a replacement for your own critical thinking and writing.',
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
      const res = await openPaddleCheckout({
        product: 'boost_pack',
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
        if (res.reason === 'no_paddle' || res.reason === 'no_price') {
          if (import.meta.env.DEV) toast.message(res.message);
        } else {
          toast.error(res.message);
        }
      } else {
        toast.success('Checkout opened — credits apply after Paddle confirms payment.');
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
            <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 transition-opacity hover:opacity-90">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] shadow-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Quilora</span>
            </Link>

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
                void openPaddleCheckout({ product: 'boost_pack', userId: user.id, email: user.email }).then((res) => {
                  if (!res.ok && res.reason !== 'no_paddle' && res.reason !== 'no_price') toast.error(res.message);
                  else if (!res.ok && import.meta.env.DEV) toast.message(res.message);
                  else if (res.ok) toast.success('Checkout opened — credits apply after Paddle confirms payment.');
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
                    openFAQ === index ? 'max-h-96' : 'max-h-0'
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
