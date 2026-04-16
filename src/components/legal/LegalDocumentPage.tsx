import { useId, type ReactNode } from 'react';
import { QuiloraMarketingNavBar } from '../QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../QuiloraSiteFooter';
import { QUILORA_LANDING_GRADIENT, QUILORA_SECTION_CARD } from '../../lib/quiloraMarketingUi';
import { ScrollReveal } from '../ScrollReveal';

export type LegalTocItem = { id: string; label: string };

const tocPanelClass = `${QUILORA_SECTION_CARD} p-5 sm:p-6`;
const articleShellClass = `${QUILORA_SECTION_CARD} mx-auto max-w-[800px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8 sm:py-10`;
const selectClass =
  'w-full cursor-pointer rounded-2xl border border-white/10 bg-[#0d1f33]/80 px-4 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#266ba7]/50 focus:ring-2 focus:ring-[#266ba7]/20';

const sectionCardClass =
  'scroll-mt-28 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/55 p-6 sm:p-8 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]';

const bodyClass =
  'text-base leading-[1.75] text-white/75 [&_strong]:font-semibold [&_strong]:text-white/95 [&_a]:text-[#7bbdf3] [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white';

const sectionTitleClass = 'text-lg font-bold tracking-tight text-[#3b82c4] sm:text-xl';

/** One visually separated legal section (replaces flat heading + paragraphs). */
export function LegalSectionCard({ id, title, children }: { id: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className={sectionCardClass}>
      <h2 className={sectionTitleClass}>{title}</h2>
      <div className={`space-y-4 ${bodyClass}`}>{children}</div>
    </section>
  );
}

/** @deprecated Prefer LegalSectionCard for new layouts */
export function LegalSectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className={`scroll-mt-32 ${sectionTitleClass}`}>
      {children}
    </h2>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className={bodyClass}>{children}</p>;
}

export function LegalBulletList({ children }: { children: ReactNode }) {
  return (
    <ul className={`${bodyClass} ml-5 list-disc space-y-2 pl-1 marker:text-[#5b9bd6] sm:ml-6`}>{children}</ul>
  );
}

export function LegalDocumentPage({
  title,
  lastUpdatedLine,
  heroSubtitle,
  toc,
  children,
  /** Slightly wider vertical rhythm between section cards (e.g. long-form Terms). */
  articleInnerClassName = 'gap-6 sm:gap-8',
}: {
  title: string;
  lastUpdatedLine: string;
  /** Optional inspiring line under the hero title */
  heroSubtitle?: string;
  toc: LegalTocItem[];
  children: ReactNode;
  articleInnerClassName?: string;
}) {
  const selectId = useId();
  const scrollToId = (id: string) => {
    if (!id) return;
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0a1929] font-[Inter,sans-serif] text-white">
      <QuiloraMarketingNavBar />

      <section className="relative overflow-x-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:pb-28 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 z-0" style={{ background: QUILORA_LANDING_GRADIENT }} aria-hidden />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-14">
            <ScrollReveal delay={0} duration={0.5}>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
                {title}
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.06} duration={0.5}>
              <p className="mt-3 text-sm font-medium text-[#7bbdf3]/90 sm:text-base">{lastUpdatedLine}</p>
            </ScrollReveal>
            {heroSubtitle ? (
              <ScrollReveal delay={0.1} duration={0.5}>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">{heroSubtitle}</p>
              </ScrollReveal>
            ) : null}
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <div className="order-2 min-w-0 flex-1 lg:order-2">
              <article className={articleShellClass}>
                <div className={`flex flex-col ${articleInnerClassName}`}>{children}</div>
              </article>
            </div>

            <div className="order-1 w-full shrink-0 lg:order-1 lg:w-56 xl:w-60">
              <div className="lg:sticky lg:top-28">
                <div className="mb-4 lg:hidden">
                  <label htmlFor={selectId} className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                    On this page
                  </label>
                  <select
                    id={selectId}
                    defaultValue=""
                    className={selectClass}
                    onChange={(e) => {
                      scrollToId(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value="" disabled className="bg-[#0a1929] text-white/80">
                      Jump to section…
                    </option>
                    {toc.map((item) => (
                      <option key={item.id} value={item.id} className="bg-[#0a1929] text-white">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <nav className={`${tocPanelClass} hidden lg:block`} aria-label="Table of contents">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">On this page</p>
                  <ul className="space-y-1">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => scrollToId(item.id)}
                          className="w-full rounded-xl px-2 py-2 text-left text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-[#b8d9ff]"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuiloraSiteFooter />
    </div>
  );
}
