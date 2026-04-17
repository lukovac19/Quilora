import { Link } from 'react-router';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

type QuiloraSiteFooterProps = {
  /** @deprecated No longer used; kept so existing call sites do not break. */
  homeProductAnchors?: boolean;
  className?: string;
};

const socialBtn =
  'flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white';

export function QuiloraSiteFooter({ className = '' }: QuiloraSiteFooterProps) {
  return (
    <footer className={`border-t border-white/5 bg-[#0a1929] px-4 py-12 sm:px-6 sm:py-14 ${className}`}>
      <div className="container mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <img src="/quilora-logo-icon.png" alt="" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} aria-hidden />
            <span className="text-xl font-semibold text-white">Quilora</span>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
            Quilora — AI-powered reading assistant that helps you understand and analyze books deeply
          </p>
        </div>

        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <Link to="/privacy" className="text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline">
            Privacy
          </Link>
          <Link to="/terms" className="text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline">
            Terms &amp; Conditions
          </Link>
          <Link
            to="/refund-policy"
            className="text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Refund Policy
          </Link>
        </nav>

        <div className="flex items-center justify-center gap-3">
          <a href="#" className={socialBtn} aria-label="Facebook">
            <Facebook className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </a>
          <a href="#" className={socialBtn} aria-label="Instagram">
            <Instagram className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </a>
          <a href="#" className={socialBtn} aria-label="LinkedIn">
            <Linkedin className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </a>
        </div>

        <p className="text-sm text-white/40">© 2026 Quilora. All rights reserved.</p>
      </div>
    </footer>
  );
}
