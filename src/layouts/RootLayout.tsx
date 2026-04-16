import { Analytics } from '@vercel/analytics/react';
import { Outlet, useLocation } from 'react-router';

export function RootLayout() {
  const location = useLocation();
  const path = `${location.pathname}${location.search}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F18] text-[#E6F0FF]">
      <Outlet />
      <Analytics route={location.pathname} path={path} />
    </div>
  );
}