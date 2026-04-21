import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navLinkClass =
  'cursor-pointer text-base text-white/70 transition-colors duration-200 hover:text-white';

export type QuiloraMarketingNavBarProps = {
  /** Pre-launch: logo only, no links or auth actions */
  logoOnly?: boolean;
  /** Pre-launch Screen 1: logo + “Already signed-up?” + Log-in pill (top-right) */
  preLaunchScreen1Nav?: boolean;
};

export function QuiloraMarketingNavBar({ logoOnly = false, preLaunchScreen1Nav = false }: QuiloraMarketingNavBarProps) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => navigate('/auth?mode=signup');

  if (preLaunchScreen1Nav) {
    return (
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/5 bg-[#0a1929]/80 backdrop-blur-lg' : 'bg-[#0a1929]/95'
        }`}
      >
        <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90">
              <img src="/quilora-logo-icon.png" alt="" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} />
              <span className="truncate text-xl font-semibold text-white">Quilora</span>
            </Link>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              <span className="text-sm font-medium text-white/90 sm:text-base">Already signed-up?</span>
              <button
                type="button"
                onClick={() => navigate('/auth?mode=login')}
                className="min-h-11 shrink-0 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7bbdf3]/40 hover:bg-white/10 hover:text-white sm:px-6 sm:text-base"
              >
                Log-in
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (logoOnly) {
    return (
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/5 bg-[#0a1929]/80 backdrop-blur-lg' : 'bg-[#0a1929]/95'
        }`}
      >
        <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-start">
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <img src="/quilora-logo-icon.png" alt="" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} />
              <span className="truncate text-xl font-semibold text-white">Quilora</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/5 bg-[#0a1929]/80 backdrop-blur-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 transition-opacity hover:opacity-90">
            <img src="/quilora-logo-icon.png" alt="" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} />
            <span className="truncate text-xl font-semibold text-white">Quilora</span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <Link to="/features" className={navLinkClass}>
              Features
            </Link>
            <Link to="/how-it-works" className={navLinkClass}>
              How it Works
            </Link>
            <Link to="/pricing" className={navLinkClass}>
              Pricing
            </Link>
            <Link to="/faq" className={navLinkClass}>
              FAQ
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-end gap-4 md:flex">
            <button
              type="button"
              onClick={() => navigate('/auth?mode=login')}
              className="min-h-11 rounded-full px-3 text-base text-white/70 transition-colors duration-200 hover:text-white"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={handleGetStarted}
              className="min-h-11 rounded-full bg-[#266ba7] px-6 py-2.5 text-base font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30"
            >
              Get Started
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {!user && (
              <button
                type="button"
                onClick={handleGetStarted}
                className="min-h-11 shrink-0 rounded-full bg-[#266ba7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b82c4]"
              >
                Get Started
              </button>
            )}
            {user && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="min-h-11 shrink-0 rounded-full bg-[#266ba7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b82c4]"
              >
                Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-3 w-full animate-fade-in border-t border-white/10 pt-3 pb-2 md:hidden">
            <div className="flex w-full flex-col items-stretch gap-1">
              <Link
                to="/features"
                className={`${navLinkClass} min-h-11 rounded-lg px-2 py-3`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/how-it-works"
                className={`${navLinkClass} min-h-11 rounded-lg px-2 py-3`}
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link
                to="/pricing"
                className={`${navLinkClass} min-h-11 rounded-lg px-2 py-3`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/faq"
                className={`${navLinkClass} min-h-11 rounded-lg px-2 py-3`}
                onClick={() => setMobileMenuOpen(false)}
              >
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
  );
}
