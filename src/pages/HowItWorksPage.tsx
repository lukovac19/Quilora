import { Link, useNavigate } from 'react-router';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { BookOpen, Menu, X } from 'lucide-react';

export function HowItWorksPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };

  const [studyMode, setStudyMode] = useState<'mastery' | 'canvas'>('mastery');

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
            {/* Logo */}
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center gap-2 transition-opacity hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] shadow-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Quilora</span>
            </Link>

            {/* Desktop Navigation - Centered */}
            <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
              <Link to="/features" className="cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white">
                Features
              </Link>
              <Link
                to="/how-it-works"
                className="cursor-pointer text-base text-white underline decoration-[#266ba7] decoration-2 underline-offset-4 transition-colors duration-200 hover:text-white"
              >
                How it Works
              </Link>
              <Link to="/pricing" className="cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white">
                Pricing
              </Link>
              <Link to="/faq" className="cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white">
                FAQ
              </Link>
            </div>

            {/* Desktop CTA */}
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
                <Link
                  to="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-11 rounded-lg px-2 py-3 text-base text-white underline transition-colors hover:bg-white/5"
                >
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

      <main className="min-w-0 px-4 pb-24 pt-32 sm:px-6 sm:pb-28 sm:pt-36 md:pt-40">
        <div className="container mx-auto max-w-4xl">
          <h1 className="quilora-heading-section text-center font-bold text-white">How Quilora Works</h1>

          <div className="mt-10 flex justify-center overflow-x-auto px-1 pb-1 sm:mt-12 md:mt-14">
            <div
              className="relative grid w-full min-w-[min(100%,18rem)] max-w-md grid-cols-2 rounded-full border border-white/10 bg-[#1a2f45]/50 p-1 shadow-lg shadow-black/15"
              role="tablist"
              aria-label="Study mode"
            >
              <div
                className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#266ba7] shadow-md shadow-[#266ba7]/25 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  transform:
                    studyMode === 'canvas' ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                }}
              />
              <button
                type="button"
                role="tab"
                aria-selected={studyMode === 'mastery'}
                onClick={() => setStudyMode('mastery')}
                className={`relative z-10 min-h-11 rounded-full px-3 py-3 text-center text-sm font-semibold transition-colors duration-200 sm:px-4 ${
                  studyMode === 'mastery' ? 'text-white' : 'text-white/45 hover:text-white/75'
                }`}
              >
                Mastery
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={studyMode === 'canvas'}
                onClick={() => setStudyMode('canvas')}
                className={`relative z-10 min-h-11 rounded-full px-3 py-3 text-center text-sm font-semibold transition-colors duration-200 sm:px-4 ${
                  studyMode === 'canvas' ? 'text-white' : 'text-white/45 hover:text-white/75'
                }`}
              >
                Study Canvas
              </button>
            </div>
          </div>

          <div className="mx-auto mt-16 flex max-w-3xl flex-col items-center gap-12 md:mt-20 md:gap-16">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] w-full max-w-2xl rounded-3xl border border-[#266ba7]/20 bg-gradient-to-br from-[#1a2f45]/70 via-[#132842]/85 to-[#0a1929] shadow-[0_24px_60px_-28px_rgba(38,107,167,0.35)] ring-1 ring-white/5"
                role="img"
                aria-label={`Video or animation placeholder ${i + 1} of 3`}
              />
            ))}
          </div>
        </div>
      </main>

      <QuiloraSiteFooter />
    </div>
  );
}