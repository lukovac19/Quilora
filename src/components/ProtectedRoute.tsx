import { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
  if (authLoading) {
    return <div className="min-h-screen bg-[#0a1929]" aria-busy="true" />;
  }

  // Temporary bypass for testing: allow access to protected routes without login.
  // Keep the component here so auth gating can be restored later.
  return <>{children}</>;
}
