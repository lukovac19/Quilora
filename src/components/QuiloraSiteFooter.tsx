import { Link } from 'react-router';
import { BookOpen } from 'lucide-react';

type QuiloraSiteFooterProps = {
  /** When true, Product links scroll to #features / #pricing on this page (landing home). */
  homeProductAnchors?: boolean;
  className?: string;
};

export function QuiloraSiteFooter({ homeProductAnchors = false, className = '' }: QuiloraSiteFooterProps) {
  return (
    <footer className={`border-t border-white/5 bg-[#0a1929] px-4 py-10 sm:px-6 sm:py-12 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 grid gap-8 text-center md:grid-cols-4 md:text-left">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f]">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Quilora</span>
            </div>
            <p className="mx-auto max-w-sm text-base text-white/50 md:mx-0 md:text-sm">
              AI-powered reading assistant that helps you understand and analyze books deeply
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-base font-semibold text-white md:text-sm">Product</h4>
            <ul className="space-y-2">
              <li>
                {homeProductAnchors ? (
                  <a
                    href="#features"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="cursor-pointer text-base text-white/50 transition-colors hover:text-white md:text-sm"
                  >
                    Features
                  </a>
                ) : (
                  <Link to="/features" className="text-base text-white/50 transition-colors hover:text-white md:text-sm">
                    Features
                  </Link>
                )}
              </li>
              <li>
                {homeProductAnchors ? (
                  <a
                    href="#pricing"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="cursor-pointer text-base text-white/50 transition-colors hover:text-white md:text-sm"
                  >
                    Pricing
                  </a>
                ) : (
                  <Link to="/pricing" className="text-base text-white/50 transition-colors hover:text-white md:text-sm">
                    Pricing
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-base font-semibold text-white md:text-sm">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-base text-white/50 transition-colors hover:text-white md:text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-base text-white/50 transition-colors hover:text-white md:text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-base text-white/50 transition-colors hover:text-white md:text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-base text-white/50 transition-colors hover:text-white md:text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/payments" className="text-base text-white/50 transition-colors hover:text-white md:text-sm">
                  Payments
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-center md:flex-row md:text-left">
          <div>
            <div className="text-base text-white/40 md:text-sm">© 2026 Quilora. All rights reserved.</div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/40 transition-colors hover:text-white" aria-label="Social">
              <div className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/5 hover:bg-white/10">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
