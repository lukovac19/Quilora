import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { QUILORA_SECTION_CARD } from '../lib/quiloraMarketingUi';
import { PaymentTermsBody } from '../legal/paymentTermsBody';

const TOC = [
  { id: 'section-1', label: '1. INTRODUCTION' },
  { id: 'section-2', label: '2. PADDLE AS OUR MERCHANT OF RECORD' },
  { id: 'section-3', label: '3. SUBSCRIPTIONS AND AUTO-RENEWAL' },
  { id: 'section-4', label: '4. CANCELLATION POLICY' },
  { id: 'section-5', label: '5. REFUND POLICY' },
  { id: 'section-6', label: '6. TAXES' },
  { id: 'section-7', label: '7. DISPUTES AND CHARGEBACKS' },
  { id: 'section-8', label: '8. PRICE CHANGES' },
  { id: 'section-contact', label: 'Billing support' },
] as const;

export function PaymentTermsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('checkout') === 'boost') {
      navigate('/pricing?checkout=boost', { replace: true });
    }
  }, [searchParams, navigate]);

  const scrollToLegal = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0a1929] font-[Inter,sans-serif] text-white">
      <QuiloraMarketingNavBar />

      <section className="border-b border-white/5 px-4 py-16 sm:px-6 sm:py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="quilora-heading-section text-2xl font-bold text-white sm:text-3xl">Full payment terms</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/50">Last updated: April 14, 2026</p>
          </div>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
            <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-56">
              <nav className={`${QUILORA_SECTION_CARD} hidden p-5 lg:block`} aria-label="Payment terms sections">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">On this page</p>
                <ul className="space-y-1">
                  {TOC.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollToLegal(item.id)}
                        className="w-full rounded-xl px-2 py-2 text-left text-xs text-white/65 transition-colors hover:bg-white/[0.06] hover:text-[#b8d9ff] sm:text-sm"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
            <div className="min-w-0 flex-1">
              <article className={`${QUILORA_SECTION_CARD} mx-auto max-w-[800px] space-y-6 p-6 sm:p-8`}>
                <PaymentTermsBody />
              </article>
            </div>
          </div>
        </div>
      </section>

      <QuiloraSiteFooter />
    </div>
  );
}
