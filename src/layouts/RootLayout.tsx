import { Outlet } from 'react-router';

export function RootLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0F18] text-[#E6F0FF]">
      <Outlet />
    </div>
  );
}