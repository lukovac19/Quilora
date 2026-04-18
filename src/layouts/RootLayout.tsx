import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Outlet, useLocation, useNavigate } from 'react-router';

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (location.pathname !== '/') return;
    const sp = new URLSearchParams(location.search);
    if (!sp.get('error') && !sp.get('error_code')) return;
    const next = new URLSearchParams(sp);
    if (!next.get('mode')) next.set('mode', 'login');
    navigate({ pathname: '/auth', search: next.toString() }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F18] text-[#E6F0FF]">
      <Outlet />
      <Analytics route={location.pathname} path={path} />
    </div>
  );
}