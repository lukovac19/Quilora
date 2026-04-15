import { ScrollReveal } from '../components/ScrollReveal';
import { Send } from 'lucide-react';
import { Link } from 'react-router';
import { useState } from 'react';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { QUILORA_LANDING_GRADIENT, QUILORA_SECTION_CARD } from '../lib/quiloraMarketingUi';

const sectionCardClass = QUILORA_SECTION_CARD;

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-[#0d1f33]/80 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#266ba7]/50 focus:ring-2 focus:ring-[#266ba7]/20';

const SUPPORT_EMAIL = 'support@quilora.ai';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden text-white" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <QuiloraMarketingNavBar />

      <section className="relative overflow-x-hidden px-4 pb-24 pt-32 sm:px-6 sm:pb-28 sm:pt-36 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 z-0" style={{ background: QUILORA_LANDING_GRADIENT }} aria-hidden />

        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <ScrollReveal delay={0} duration={0.5}>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">Get in Touch</h1>
            </ScrollReveal>
            <ScrollReveal delay={0.08} duration={0.5}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
                Questions, bugs, or ideas — send a note. We read every message and usually reply within a day or two.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.12} duration={0.5}>
            <div className={`${sectionCardClass} p-8 sm:p-10`}>
              {submitted ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                    <Send className="h-7 w-7 text-emerald-300" />
                  </div>
                  <h2 className="text-xl font-bold text-emerald-200">Thanks — we got it.</h2>
                  <p className="mt-2 text-sm text-emerald-100/80">We&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-white/70">
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      className={inputClass}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-white/70">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-white/70">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className={`${inputClass} resize-none`}
                      placeholder="What would you like us to know?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex w-full min-h-11 items-center justify-center gap-2 rounded-full bg-[#266ba7] py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30"
                  >
                    <Send className="h-5 w-5" />
                    Submit
                  </button>
                </form>
              )}

              <p className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-white/55">
                Prefer email directly?{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#7bbdf3] underline-offset-2 hover:text-white hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} duration={0.5}>
            <p className="mt-10 text-center text-sm text-white/45">
              Looking for quick answers?{' '}
              <Link to="/faq" className="font-medium text-[#7bbdf3] hover:text-white">
                Browse the FAQ
              </Link>
            </p>
          </ScrollReveal>
        </div>
      </section>

      <QuiloraSiteFooter />
    </div>
  );
}
