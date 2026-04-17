import { Link } from 'react-router';

/** Same mark + wordmark as `QuiloraMarketingNavBar` (PNG + Inter label). */
export function QuiloraNavLogoLink({
  className = 'flex min-w-0 flex-1 items-center gap-2 transition-opacity hover:opacity-90',
}: {
  className?: string;
}) {
  return (
    <Link to="/" className={className}>
      <img src="/quilora-logo-icon.png" alt="" className="h-10 w-10 shrink-0 object-contain" width={40} height={40} />
      <span className="truncate text-xl font-semibold text-white">Quilora</span>
    </Link>
  );
}
