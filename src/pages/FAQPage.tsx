import { Link, useNavigate } from 'react-router';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { useApp } from '../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Menu, X, ChevronDown } from 'lucide-react';

type FaqCategory = 'general' | 'features' | 'pricing';

const FAQ_TABS: { id: FaqCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
];

const faqByCategory: Record<FaqCategory, { question: string; answer: string }[]> = {
  general: [
    {
      question: 'What is Quilora and how does it work?',
      answer:
        'Quilora is an AI-powered workspace for deep reading: upload literature, use nodes and an infinite canvas to map ideas, and move between reading-focused and mastery workflows so themes, characters, and evidence stay connected to the text.',
    },
    {
      question: 'How is Quilora different from ChatGPT or other AI chatbots?',
      answer:
        'General chatbots answer in isolation. Quilora is built around your book—nodes, canvas layout, reading mode, quizzes, and traceable quotes—so analysis stays grounded in what you are actually reading.',
    },
    {
      question: 'What formats do you support?',
      answer:
        'You can work with PDFs and pasted text where the app supports them; additional formats may appear as we expand. Quilora is optimized for narrative and long-form literary material.',
    },
    {
      question: 'Is Quilora multilingual?',
      answer:
        'Yes, where enabled: you can use multiple interface languages in Settings, and the AI can often analyze sources and respond in more than one language depending on your content and plan.',
    },
    {
      question: 'How accurate is the AI analysis?',
      answer:
        'Insights aim to cite the text you provide, but models can miss nuance. Treat Quilora as a study partner—cross-check important points against the source and your own judgment.',
    },
    {
      question: 'Can I use Quilora on mobile?',
      answer:
        'You can use Quilora in the mobile browser where supported. Complex canvas work is most comfortable on a larger screen; check current device guidance in-app.',
    },
    {
      question: 'Is my data secure on Quilora?',
      answer:
        'We apply standard protections for accounts and uploads. Review our Privacy Policy for retention, subprocessors, and what you can delete; avoid uploading highly sensitive personal data unless you accept those terms.',
    },
    {
      question: 'Do I need to create an account to use Quilora?',
      answer:
        'An account is required for syncing sandboxes, saved insights, and billing. Some marketing pages may let you explore positioning without logging in, but full use needs sign-up.',
    },
    {
      question: 'Can I share my sandboxes with others?',
      answer:
        'Sharing depends on the product version you are on. Where collaboration exists, use in-app share or export; otherwise treat your workspace as private until sharing is available.',
    },
    {
      question: 'What devices and browsers does Quilora support?',
      answer:
        'Use a recent version of Chrome, Edge, Firefox, or Safari on desktop for the best experience. Performance on older browsers or very small screens may vary.',
    },
  ],
  features: [
    {
      question: 'What are nodes and how do I use them?',
      answer:
        'Nodes are canvas elements for ideas, quotes, characters, or links. Place and connect them to mirror how concepts relate as you read.',
    },
    {
      question: 'What is the difference between Canvass Mode and Reading Mode?',
      answer:
        'Reading Mode keeps you in the text for linear study. Canvass Mode opens the spatial canvas for arranging and comparing nodes at a glance.',
    },
    {
      question: 'How does the Lens Node work?',
      answer:
        'It surfaces themes, symbols, plot threads, and big-picture patterns so you can see structure beyond a quick skim.',
    },
    {
      question: 'What is the Connector Node used for?',
      answer:
        'It links ideas—cause and effect, parallels, contrasts—so relationships across your map stay explicit.',
    },
    {
      question: 'Can I drag and drop nodes onto the canvas?',
      answer:
        'Yes. Reposition nodes freely to reflect how your understanding changes.',
    },
    {
      question: 'What is the Evidence Node?',
      answer:
        'It anchors claims to verbatim excerpts from your material so insights remain checkable against the source.',
    },
    {
      question: 'How does the Mastery Heatmap work?',
      answer:
        'It summarizes where your comprehension looks strong or weak by topic or section so you can prioritize review after quizzes or study blocks.',
    },
    {
      question: 'What is the Freestyle Node?',
      answer:
        'A flexible scratch space for hypotheses and connections that do not yet fit a specialized node.',
    },
    {
      question: 'Can I highlight text in Reading Mode and send it to the canvas?',
      answer:
        'Where supported, selections from Reading Mode can flow into your canvas workflow as you build your map.',
    },
    {
      question: 'How does the AI Tutor Mode work?',
      answer:
        'It discusses your material with you, surfaces gaps, and explains concepts in context—alongside quizzes and your own notes.',
    },
  ],
  pricing: [
    {
      question: 'What are the limitations of the Free plan?',
      answer:
        'Free tiers usually cap questions per session and include cooldowns, while paid plans raise limits and unlock more analysis, exports, or priority usage—see current plan details in-app.',
    },
    {
      question: 'Can I upgrade or downgrade my plan at any time?',
      answer:
        'You can change plans from billing settings. Upgrades often apply immediately; downgrades may align to the end of a billing period depending on policy.',
    },
    {
      question: 'How is Quilora different from ChatGPT or other AI chatbots?',
      answer:
        'Pricing aside, Quilora bundles literature workflows—canvas, nodes, reading and mastery—so you pay for a structured study surface, not a generic chat window.',
    },
    {
      question: 'Can I save my insights and export them?',
      answer:
        'Saved libraries and exports are included on qualifying paid tiers; exact formats (such as PDF) depend on your plan.',
    },
    {
      question: 'Can I use Quilora for academic essays?',
      answer:
        'Yes for planning, evidence gathering, and outlining—always produce your own analysis and follow your institution’s academic integrity rules.',
    },
    {
      question: 'Is the Lifetime Deal a one-time payment?',
      answer:
        'LTD is billed once for the lifetime entitlement described at purchase. Confirm the exact scope in checkout and your receipt.',
    },
    {
      question: 'What happens to my data if I cancel my subscription?',
      answer:
        'After cancellation, access may revert to Free limits. Data retention follows the Privacy Policy—export what you need before leaving if exports are available on your tier.',
    },
    {
      question: 'Does the Free plan include access to all modes?',
      answer:
        'Core modes are available within Free limits, but some advanced analysis, exports, or capacity may require a paid tier.',
    },
    {
      question: 'Can I get a refund if I change my mind?',
      answer:
        'Refund eligibility depends on the terms shown at purchase and regional rules. Check billing FAQs or support for the current policy.',
    },
    {
      question: 'Is there a student discount available?',
      answer:
        'We may run education pricing from time to time. Watch announcements in-app or contact support with your school email to see if a program applies.',
    },
  ],
};

export function FAQPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faqTab, setFaqTab] = useState<FaqCategory>('general');
  const [displayFaqTab, setDisplayFaqTab] = useState<FaqCategory>('general');
  const [faqFadeIn, setFaqFadeIn] = useState(true);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const faqSwitchRef = useRef<number | null>(null);

  const faqTabIndex = FAQ_TABS.findIndex((t) => t.id === faqTab);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (faqTab === displayFaqTab) return;
    setFaqFadeIn(false);
    if (faqSwitchRef.current) window.clearTimeout(faqSwitchRef.current);
    faqSwitchRef.current = window.setTimeout(() => {
      setDisplayFaqTab(faqTab);
      setOpenFAQ(null);
      setFaqFadeIn(true);
      faqSwitchRef.current = null;
    }, 200);
    return () => {
      if (faqSwitchRef.current) window.clearTimeout(faqSwitchRef.current);
    };
  }, [faqTab, displayFaqTab]);

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };

  const selectFaqTab = (id: FaqCategory) => {
    if (id === faqTab) return;
    setFaqTab(id);
  };

  const currentFaqs = faqByCategory[displayFaqTab];

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
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
              <Link to="/pricing" className="cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white">
                Pricing
              </Link>
              <Link
                to="/faq"
                className="cursor-pointer text-base text-white underline decoration-[#266ba7] decoration-2 underline-offset-4 transition-colors duration-200 hover:text-white"
              >
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
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  Pricing
                </Link>
                <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white underline transition-colors hover:bg-white/5">
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

      <section className="px-4 pb-0 pt-28 sm:px-6 sm:pt-32">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="quilora-heading-hero font-bold text-white">
              Not sure if Quilora is right for you?
            </h1>

            <div className="mt-8 flex justify-center overflow-x-auto px-1 pb-1 sm:mt-10">
              <div
                className="relative flex min-w-[min(100%,18rem)] max-w-xl shrink-0 gap-1 rounded-full border border-white/10 bg-[#1a2f45]/50 p-1 shadow-lg shadow-black/20 sm:min-w-0 sm:w-full"
                role="tablist"
                aria-label="FAQ category"
              >
                <div
                  className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-[#266ba7] shadow-md shadow-[#266ba7]/25 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-[calc((100%-16px)/3)]"
                  style={{
                    transform: `translateX(calc(${faqTabIndex} * (100% + 4px)))`,
                  }}
                />
                {FAQ_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={faqTab === id}
                    onClick={() => selectFaqTab(id)}
                    className={`relative z-10 flex min-h-11 flex-1 items-center justify-center rounded-full px-2 py-2.5 text-center text-sm font-semibold transition-colors duration-200 sm:px-3 ${
                      faqTab === id ? 'text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 md:pt-20">
        <div className="container mx-auto max-w-3xl">
          <div
            className={`space-y-4 transition-opacity duration-200 ease-out ${
              faqFadeIn ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {currentFaqs.map((faq, index) => (
              <div
                key={`${displayFaqTab}-${faq.question}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-sm transition-all duration-300 hover:border-[#266ba7]/30"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="flex min-h-[3.25rem] w-full items-center justify-between gap-3 p-4 text-left transition-all sm:p-6"
                >
                  <h3 className="min-w-0 flex-1 pr-2 text-base font-semibold text-white sm:text-lg">{faq.question}</h3>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#266ba7] transition-transform duration-300 ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFAQ === index ? 'max-h-[32rem]' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6 leading-relaxed text-white/70">{faq.answer}</div>
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
