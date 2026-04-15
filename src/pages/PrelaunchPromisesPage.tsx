import { Link } from 'react-router';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { PRELAUNCH_PROMISE_REGISTRY } from '../data/prelaunchPromiseRegistry';

/** Phase 7 — user-visible promise registry (HTML v4). */
export function PrelaunchPromisesPage() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <QuiloraMarketingNavBar logoOnly />

      <main className="relative z-10 flex-1 px-4 pb-20 pt-32 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#7bbdf3]/90">Pre-launch · Phase 7</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Promise &amp; communications registry</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            This page mirrors the <strong className="text-white/80">Pre-Launch User Flow v4</strong> registry: every major
            promise, billing definition, and transactional email name we ship against. It exists so product, support, and
            engineering stay aligned.
          </p>

          <ol className="mt-12 space-y-10">
            {PRELAUNCH_PROMISE_REGISTRY.map((section, i) => (
              <li
                key={section.id}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929]/80 p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-mono text-white/35">{String(i + 1).padStart(2, '0')}</span>
                  <h2 className="text-lg font-semibold text-white sm:text-xl">{section.title}</h2>
                </div>
                {section.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {section.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[#266ba7]/30 bg-[#266ba7]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7bbdf3]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/70">
                  {section.bullets.map((b, j) => (
                    <li key={`${section.id}-${j}`}>{b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-center text-sm text-white/45">
            <Link to="/early-access" className="font-medium text-[#7bbdf3] underline-offset-2 hover:underline">
              ← Back to pre-launch pricing
            </Link>
          </p>
        </div>
      </main>

      <QuiloraSiteFooter homeProductAnchors />
    </div>
  );
}
