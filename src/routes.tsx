import { createBrowserRouter, Navigate, useRouteError, isRouteErrorResponse } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { QuiloraLandingPage } from "./pages/QuiloraLandingPage";
import { AuthPage } from "./pages/AuthPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

function messageFromRouteError(routeError: unknown): string {
  if (routeError instanceof Error) return routeError.message;
  if (isRouteErrorResponse(routeError)) {
    return routeError.statusText || `Request failed (${routeError.status})`;
  }
  if (typeof routeError === "string") return routeError;
  if (routeError == null) return "Unknown issue";
  try {
    return JSON.stringify(routeError) ?? "Unknown issue";
  } catch {
    return "Unknown issue";
  }
}

function RouteErrorFallback({ error: errorProp }: { error?: Error }) {
  const routeError = useRouteError();
  const resolvedMessage =
    errorProp?.message ?? messageFromRouteError(routeError) ?? "Unknown issue";
  return (
    <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center p-6">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-[#0b1a2e]/95 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold mb-4">Something went wrong</h1>
        <p className="mb-4 text-sm text-slate-300">We hit an unexpected error while loading this page. You can try reloading or returning to the home screen.</p>
        <div className="rounded-2xl bg-[#101b2c] p-4 text-sm text-slate-200"><strong>Error:</strong> {resolvedMessage}</div>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href="/" className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3b82f6]">Return home</a>
          <button type="button" onClick={() => window.location.reload()} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5">Reload</button>
        </div>
      </div>
    </div>
  );
}
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudySessionPage } from "./pages/StudySessionPage";
import { NewStudySessionPage } from "./pages/NewStudySessionPage";
import { MyPDFsPage } from "./pages/MyPDFsPage";
import { SavedInsightsPage } from "./pages/SavedInsightsPage";
import { AllSessionsPage } from "./pages/AllSessionsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { PricingPage } from "./pages/PricingPage";
import { FAQPage } from "./pages/FAQPage";
import { AboutPage } from "./pages/AboutPage";
import { BlogPage } from "./pages/BlogPage";
import { ContactPage } from "./pages/ContactPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { PaymentTermsPage } from "./pages/PaymentTermsPage";
import { PreLaunchPage } from "./pages/PreLaunchPage";
import { PreLaunchEarlyAccessPage } from "./pages/PreLaunchEarlyAccessPage";
import { GenesisChoicePage } from "./pages/GenesisChoicePage";
import { PrelaunchPromisesPage } from "./pages/PrelaunchPromisesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardFrame2 } from "./pages/DashboardFrame2";
import { SandboxLoadingFrame } from "./pages/SandboxLoadingFrame";
export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, Component: PreLaunchPage },
      {
        path: "early-access/genesis-welcome",
        element: <Navigate to="/early-access" replace />,
      },
      {
        path: "early-access/genesis-choice",
        element: (
          <ProtectedRoute>
            <GenesisChoicePage />
          </ProtectedRoute>
        ),
      },
      { path: "early-access", Component: PreLaunchEarlyAccessPage },
      { path: "early-access/promises", Component: PrelaunchPromisesPage },
      { path: "home", Component: QuiloraLandingPage },
      { path: "pre-launch", element: <Navigate to="/" replace /> },
      { path: "pre-launch/early-access", element: <Navigate to="/early-access" replace /> },
      { 
        path: "auth", 
        Component: AuthPage 
      },
      {
        path: "auth/verify-email",
        Component: VerifyEmailPage,
      },
      {
        path: "onboarding",
        element: (
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        ),
      },
      { 
        path: "features", 
        Component: FeaturesPage 
      },
      { 
        path: "how-it-works", 
        Component: HowItWorksPage 
      },
      { 
        path: "pricing", 
        Component: PricingPage 
      },
      { 
        path: "faq", 
        Component: FAQPage 
      },
      { 
        path: "about", 
        Component: AboutPage 
      },
      { 
        path: "blog", 
        Component: BlogPage 
      },
      { 
        path: "contact", 
        Component: ContactPage 
      },
      { 
        path: "privacy", 
        Component: PrivacyPage 
      },
      { 
        path: "terms", 
        Component: TermsPage 
      },
      {
        path: "payments",
        Component: PaymentTermsPage,
      },
      { 
        path: "dashboard-frame-2", 
        Component: DashboardFrame2 
      },
      {
        path: "sandbox-loading-frame",
        element: (
          <ProtectedRoute>
            <SandboxLoadingFrame />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "session/:sessionId?",
        element: (
          <ProtectedRoute>
            <StudySessionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "study-session",
        element: (
          <ProtectedRoute>
            <StudySessionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "new-study-session",
        element: (
          <ProtectedRoute>
            <NewStudySessionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pdfs",
        element: (
          <ProtectedRoute>
            <MyPDFsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "saved",
        element: (
          <ProtectedRoute>
            <SavedInsightsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "all-sessions",
        element: (
          <ProtectedRoute>
            <AllSessionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);