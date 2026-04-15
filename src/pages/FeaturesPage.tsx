import { Link, useNavigate } from 'react-router';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { useApp } from '../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import { BookOpen, Menu, X, Check, ChevronDown } from 'lucide-react';

type FeatureTab = 'deeper' | 'clarity' | 'progress';

const TAB_ORDER: FeatureTab[] = ['deeper', 'clarity', 'progress'];

const featurePanels: Record<
  FeatureTab,
  { headline: string; body: string; bullets: string[] }
> = {
  deeper: {
    headline: 'Deeper Comprehension.',
    body:
      'Go beyond surface-level reading. The Lens Node breaks down your material into themes, ideas, connections, and key moments so you understand not just what you read but why it matters.',
    bullets: [
      'Lens Node: Analyze themes, characters, symbols, plot, and ideas from any material.',
      'Persona Node: Dig into character traits and motivations backed by the text.',
      'Evidence Node: Ground every insight with verbatim proof from your material.',
    ],
  },
  clarity: {
    headline: 'Clarity.',
    body:
      'Complex material becomes something you can actually see. Your infinite canvas turns dense narratives and long-form texts into a visual layout that makes sense at a glance.',
    bullets: [
      'Infinite Canvas: An open, visual workspace that works the way your mind does.',
      'Connector Node: Map relationships, trace cause and effect, and contrast ideas across your material.',
      'Source Node: Upload PDFs, EPUBs, or paste text directly onto the canvas.',
    ],
  },
  progress: {
    headline: 'Progress.',
    body:
      'Knowing is different from understanding. Mastery Mode puts your knowledge map to the test with an AI quizzer that assesses your comprehension and an AI tutor that fills in the gaps.',
    bullets: [
      'AI Quizzer: Randomly assesses your comprehension through a mix of question types.',
      'AI Tutor: Guides your discussion and fills in gaps in your understanding.',
      'Mastery Heatmap: See exactly where your comprehension holds and where it needs work.',
    ],
  },
};

const featuresPageFaq: { question: string; answer: string }[] = [
  {
    question: 'What are nodes and how do I use them?',
    answer:
      'Nodes are the building blocks on your canvas—each one can hold an idea, a quote, a character beat, or a connection. Place them, link them, and arrange them so the map matches how you think about the text.',
  },
  {
    question: 'What is the difference between Canvass Mode and Reading Mode?',
    answer:
      'Reading Mode keeps you anchored in the text for close reading and highlights. Canvass Mode opens the infinite canvas so you can lay out nodes spatially, compare ideas, and see the big picture at once.',
  },
  {
    question: 'Can I highlight text in Reading Mode and send it to the canvas?',
    answer:
      'Where the app supports it, you can capture a selection from Reading Mode and bring it onto the canvas as a node or attachment so evidence stays tied to your map.',
  },
  {
    question: 'How does the AI Tutor Mode work?',
    answer:
      'AI Tutor discusses your material with you, asks follow-ups, and explains concepts in context—helping you fill gaps after quizzes or when a topic still feels fuzzy.',
  },
  {
    question: 'How does the Mastery Heatmap work?',
    answer:
      'It summarizes how well you have retained material across topics or sections—so you can see strengths at a glance and focus review where comprehension is thinner.',
  },
];

function IconLayers({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 3.5 4 7.25v1.5l8 3.75 8-3.75v-1.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m4 12.25 8 3.75 8-3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m4 16.75 8 3.75 8-3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEyeMinimal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M12 5C7 5 3.73 8.11 2 12c1.73 3.89 5 7 10 7s8.27-3.11 10-7c-1.73-3.89-5-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconArrowUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M12 19V5m0 0-5.5 5.5M12 5l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeaturesPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featureTab, setFeatureTab] = useState<FeatureTab>('deeper');
  const [displayFeatureTab, setDisplayFeatureTab] = useState<FeatureTab>('deeper');
  const [featureFadeIn, setFeatureFadeIn] = useState(true);
  const [openFeatureFaq, setOpenFeatureFaq] = useState<number | null>(null);

  const featureTabIndex = TAB_ORDER.indexOf(featureTab);

  const featureSwitchRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (featureTab === displayFeatureTab) return;
    setFeatureFadeIn(false);
    if (featureSwitchRef.current) window.clearTimeout(featureSwitchRef.current);
    featureSwitchRef.current = window.setTimeout(() => {
      setDisplayFeatureTab(featureTab);
      setFeatureFadeIn(true);
      featureSwitchRef.current = null;
    }, 200);
    return () => {
      if (featureSwitchRef.current) window.clearTimeout(featureSwitchRef.current);
    };
  }, [featureTab, displayFeatureTab]);

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };

  const selectFeatureTab = (t: FeatureTab) => {
    if (t === featureTab) return;
    setFeatureTab(t);
  };

  const panel = featurePanels[displayFeatureTab];
  const cardTitle = panel.headline.replace(/\.\s*$/, '');

  const navLink = (to: string, label: string, active: boolean) => (
    <Link
      to={to}
      className={
        active
          ? 'cursor-pointer text-base text-white underline decoration-[#266ba7] decoration-2 underline-offset-4 transition-colors duration-200'
          : 'cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white'
      }
    >
      {label}
    </Link>
  );

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

            <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
              {navLink('/features', 'Features', true)}
              {navLink('/how-it-works', 'How it Works', false)}
              {navLink('/pricing', 'Pricing', false)}
              {navLink('/faq', 'FAQ', false)}
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
                <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white underline transition-colors hover:bg-white/5">
                  Features
                </Link>
                <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  How it Works
                </Link>
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="min-h-11 rounded-lg px-2 py-3 text-base text-white/70 transition-colors hover:bg-white/5 hover:text-white">
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

      <section className="pt-36 pb-8 px-6 md:pt-40 md:pb-10">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl lg:text-5xl font-bold text-white">What you build with Quilora.</h1>

          <div className="mt-8 flex justify-center overflow-x-auto px-1 pb-1 sm:mt-10">
            <div
              className="relative flex min-w-[min(100%,20rem)] max-w-xl shrink-0 gap-1 rounded-full border border-white/10 bg-[#1a2f45]/50 p-1 sm:min-w-0 sm:w-full"
              role="tablist"
              aria-label="Feature focus"
            >
              <div
                className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-full bg-[#266ba7] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-[calc((100%-16px)/3)]"
                style={{
                  transform: `translateX(calc(${featureTabIndex} * (100% + 4px)))`,
                }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={featureTab === 'deeper'}
                onClick={() => selectFeatureTab('deeper')}
                className={`relative z-10 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-2 py-2.5 text-center text-sm font-semibold transition-colors duration-200 sm:px-3 ${
                  featureTab === 'deeper' ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <IconLayers className="h-[18px] w-[18px] shrink-0 text-current" />
                <span className="hidden sm:inline">Deeper Comprehension</span>
                <span className="sm:hidden">Deeper</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={featureTab === 'clarity'}
                onClick={() => selectFeatureTab('clarity')}
                className={`relative z-10 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-2 py-2.5 text-center text-sm font-semibold transition-colors duration-200 sm:px-3 ${
                  featureTab === 'clarity' ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <IconEyeMinimal className="h-[18px] w-[18px] shrink-0 text-current" />
                Clarity
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={featureTab === 'progress'}
                onClick={() => selectFeatureTab('progress')}
                className={`relative z-10 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-2 py-2.5 text-center text-sm font-semibold transition-colors duration-200 sm:px-3 ${
                  featureTab === 'progress' ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <IconArrowUp className="h-[18px] w-[18px] shrink-0 text-current" />
                Progress
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <div
            className={`transition-opacity duration-200 ease-out ${
              featureFadeIn ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="mx-auto w-full max-w-2xl rounded-3xl border border-[#266ba7]/25 bg-gradient-to-br from-[#1a2f45]/70 via-[#132842]/80 to-[#0a1929] px-8 py-10 shadow-[0_20px_60px_-24px_rgba(38,107,167,0.35)] ring-1 ring-white/5 md:px-12 md:py-12">
              <h2 className="text-center text-xl font-bold text-[#3b82c4] md:text-2xl">{cardTitle}</h2>
              <p className="mx-auto mt-6 max-w-lg text-center text-base leading-[1.7] text-slate-300 md:text-[17px]">
                {panel.body}
              </p>
              <p className="mt-10 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#266ba7]/90">
                Features to highlight
              </p>
              <ul className="mx-auto mt-6 max-w-lg space-y-4">
                {panel.bullets.map((line) => (
                  <li
                    key={line}
                    className="flex gap-3 text-left text-sm leading-relaxed text-slate-200/95 md:text-[15px]"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#3b82c4]"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 pb-24 pt-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-white lg:text-4xl">
            Frequently Asked Questions about Features
          </h2>
          <div className="space-y-4">
            {featuresPageFaq.map((item, index) => (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-sm transition-all duration-300 hover:border-[#266ba7]/30"
              >
                <button
                  type="button"
                  onClick={() => setOpenFeatureFaq(openFeatureFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left transition-all"
                >
                  <h3 className="pr-4 text-lg font-semibold text-white">{item.question}</h3>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#266ba7] transition-transform duration-300 ${
                      openFeatureFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFeatureFaq === index ? 'max-h-80' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6 leading-relaxed text-white/70">{item.answer}</div>
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
