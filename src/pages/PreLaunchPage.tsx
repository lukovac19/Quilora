import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Star } from 'lucide-react';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { useApp } from '../context/AppContext';
import { ScrollReveal } from '../components/ScrollReveal';

const testimonials = [
  {
    name: 'Nejra Mehović',
    avatarSrc: '/testimonials/review-1-nejra.png',
    comment:
      'All recommendations for Quilora — extremely well thought out. One of the rare tools that performs its job exceptionally well without errors, while also being very accessible and ideal for frequent use.',
  },
  {
    name: 'Lejla Tucaković',
    avatarSrc: '/testimonials/review-2-lejla.png',
    comment:
      'Quilora saved my high school education. I’m sure it will do the same for future generations. From personal experience, I know the creator is trustworthy and the product is built with genuine care.',
  },
  {
    name: 'Adna Murguz',
    avatarSrc: '/testimonials/review-3-adna.png',
    comment:
      'Quilora is very useful for students because it helps with understanding books in a simple and structured way. It provides clear summaries and analysis that make studying easier and definitely saves me a lot of time.',
  },
  {
    name: 'Suada Spahić',
    avatarSrc: '/testimonials/review-4-canvas.png',
    comment:
      'The Canvas is where I finally stop rereading the same chapter on loop. I pin ideas, nudge them into clusters, and draw light links between characters and themes until the shape of the argument is obvious. Visual thinking makes dense material feel manageable without dumbing it down.',
  },
];

export function PreLaunchPage() {
  const navigate = useNavigate();
  const { user, authLoading } = useApp();

  useEffect(() => {
    if (authLoading) return;
    if (user?.emailConfirmed) {
      // AUTH-10: returning verified users skip splash → pre-launch pricing / account path (not raw canvas).
      navigate('/early-access', { replace: true });
    }
  }, [authLoading, user?.emailConfirmed, navigate]);

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <QuiloraMarketingNavBar preLaunchScreen1Nav />

      <main className="flex-1 px-4 pb-16 pt-40 sm:px-6 sm:pb-20 sm:pt-44 md:pt-48 lg:pt-52">
        <div className="mx-auto max-w-5xl space-y-6 text-center sm:space-y-8">
          <div className="animate-fade-in-up space-y-6 sm:space-y-8">
            <h1 className="quilora-heading-hero mx-auto max-w-4xl font-bold leading-tight text-white">
              Quote Quest is evolving into Quilora
            </h1>

            <p className="quilora-subhead mx-auto max-w-3xl text-base leading-relaxed text-white/60 sm:text-lg lg:text-2xl">
              The AI tool that let you ask anything about your books is growing into something bigger — something &apos;Infinite&apos;
            </p>

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/auth?mode=signup&redirect=' + encodeURIComponent('/early-access'),
                    )
                  }
                  className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#266ba7] px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3b82c4] hover:shadow-xl hover:shadow-[#266ba7]/40 sm:w-auto sm:px-10 sm:py-4 sm:text-lg"
                >
                  Sign up for Pre-Launch
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/early-access')}
                  className="min-h-11 w-full rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-white/80 transition-all hover:border-[#7bbdf3]/40 hover:text-white sm:w-auto"
                >
                  Browse pre-launch pricing
                </button>
              </div>
              <div className="mt-1 space-y-1 text-center text-xs leading-snug text-[#7bbdf3]/90 sm:text-sm">
                <p>50% off all regular plans</p>
                <p>Limited Lifetime Deal Seats Available</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 w-full max-w-6xl sm:mt-24 md:mt-28">
          <ScrollReveal delay={0} duration={0.5} yOffset={18}>
            <h2 className="quilora-heading-section mb-8 text-center font-bold text-white sm:mb-10">
              Built for readers, loved by our pioneering users
            </h2>
          </ScrollReveal>

          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-visible pb-4 pt-1 scrollbar-thin sm:-mx-6 md:mx-0 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible md:pb-0 md:pt-0">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal
                key={testimonial.name}
                delay={0.05 + index * 0.1}
                duration={0.55}
                yOffset={0}
                xOffset={index % 2 === 0 ? -18 : 18}
                scale={0.98}
                className="w-[min(100vw-2.5rem,320px)] shrink-0 snap-center first:pl-4 last:pr-4 md:w-auto md:shrink md:first:pl-0 md:last:pr-0"
              >
                <div className="group h-full">
                  <div className="h-full rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#266ba7]/35 hover:shadow-[0_24px_48px_-18px_rgba(38,107,167,0.32)] sm:p-8">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/5 transition-all duration-500 ease-out group-hover:shadow-[0_0_28px_rgba(38,107,167,0.35)] group-hover:ring-[#266ba7]/45">
                        <img
                          src={testimonial.avatarSrc}
                          alt=""
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <h3 className="text-lg font-semibold text-white transition-colors duration-300 group-hover:text-[#e8f4ff]">
                        {testimonial.name}
                      </h3>

                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-[#FACC15] text-[#FACC15] transition-transform duration-300 ease-out will-change-transform group-hover:scale-110"
                            style={{ transitionDelay: `${40 * i}ms` }}
                          />
                        ))}
                      </div>

                      <p className="text-base leading-relaxed text-white/70 transition-colors duration-300 group-hover:text-white/88 md:text-sm">
                        &ldquo;{testimonial.comment}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </main>

      <QuiloraSiteFooter homeProductAnchors />
    </div>
  );
}
