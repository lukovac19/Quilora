import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import type { CheckoutProductKey } from '../lib/billingCheckout';
import { useTranslation } from '../lib/translations';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  Upload,
  FileText,
  Search,
  Zap,
  ArrowRight,
  Star,
  Play,
} from 'lucide-react';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { FAQAccordion } from '../components/FAQAccordion';
import { getThemeColors } from '../lib/theme';
import { ScrollReveal } from '../components/ScrollReveal';
import { PricingPlansBlock } from '../components/marketing/PricingPlansBlock';

export function QuiloraLandingPage() {
  const { t } = useTranslation();
  const { theme } = useApp();
  const navigate = useNavigate();
  const onCheckoutCompletedPlan = useCallback((_product: CheckoutProductKey) => {
    navigate('/onboarding');
  }, [navigate]);
  const colors = getThemeColors(theme);

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };

  const features = [
    {
      icon: Search,
      title: 'Quote Extraction',
      description: 'Instantly find and save meaningful quotes from any book with AI-powered search'
    },
    {
      icon: MessageSquare,
      title: 'Character Analysis',
      description: 'Deep dive into character development, motivations, and relationships'
    },
    {
      icon: Sparkles,
      title: 'AI Question Generation',
      description: 'Generate thoughtful discussion questions to deepen your understanding'
    },
    {
      icon: FileText,
      title: 'Essay Support',
      description: 'Get structured outlines and insights to enhance your writing'
    }
  ];

  const steps = [
    {
      stepLabel: 'Step 1',
      subhead: 'Create Your Sandbox',
      body: 'Start with a topic, a book, a subject, or a theme. Quilora gives you an open space like a sandbox — an infinite canvas where your ideas take shape.',
    },
    {
      stepLabel: 'Step 2',
      subhead: 'Connect the Dots',
      body: 'Use nodes to break down ideas, connect concepts, and map relationships in a visual layout that works the way your mind does.',
    },
    {
      stepLabel: 'Step 3',
      subhead: 'Read, Explore, and Go Deeper',
      body: 'Switch between Reading Mode and Mastery Mode as you go deeper into your material, test your subject, and challenge yourself — all without leaving your flow.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Martinez',
      comment: 'Quilora transformed how I approach my literature courses. The AI insights are incredible.',
    },
    {
      name: 'James Chen',
      comment: 'Finally, a tool that helps me truly understand complex texts instead of just summarizing them.',
    },
    {
      name: 'Emily Rodriguez',
      comment: 'The mastery mode is a game-changer for retaining what I read.',
    },
    {
      name: 'Michael Thompson',
      comment: 'I can finally engage with classic literature on a deeper level thanks to Quilora.',
    }
  ];

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      <QuiloraMarketingNavBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pb-28 sm:pt-36 lg:px-6 lg:pb-32 lg:pt-40 xl:pt-48 xl:pb-40">
        {/* Background Gradient — soft blue at top, smooth fade toward white at bottom */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(38, 107, 167, 0.26) 0%, rgba(38, 107, 167, 0.14) 18%, rgba(120, 170, 215, 0.12) 40%, rgba(200, 220, 240, 0.14) 62%, rgba(255, 255, 255, 0.12) 82%, rgba(255, 255, 255, 0.2) 100%)',
          }}
          aria-hidden
        />
        
        <div className="relative container mx-auto max-w-5xl">
          <div className="animate-fade-in-up space-y-6 text-center sm:space-y-8">
            {/* Headline */}
            <h1 className="quilora-heading-hero mx-auto max-w-4xl font-bold leading-tight text-white">
              Infinite ways to master your reading list
            </h1>

            {/* Sub-headline */}
            <p className="quilora-subhead mx-auto max-w-3xl text-base leading-relaxed text-white/60 sm:text-lg lg:text-2xl">
              Quilora reimagines how you read fiction, narratives, and long-form texts with AI workflows built for deeper comprehension
            </p>

            {/* CTA Button */}
            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                onClick={handleGetStarted}
                className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#266ba7] px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3b82c4] hover:shadow-xl hover:shadow-[#266ba7]/40 sm:w-auto sm:px-10 sm:py-4 sm:text-lg"
              >
                Get Started
                <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Demo video placeholder */}
            <div
              className="mx-auto flex min-h-[min(280px,55vh)] w-full min-w-0 max-w-5xl flex-col items-center justify-center gap-4 rounded-2xl px-4 sm:min-h-[340px] sm:gap-5 sm:rounded-3xl sm:px-6 md:min-h-[420px] lg:max-w-6xl lg:min-h-[460px]"
              style={{ backgroundColor: '#d1d5db' }}
              role="img"
              aria-label="Video placeholder"
            >
              <div className="w-[4.5rem] h-[4.5rem] md:w-24 md:h-24 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                <Play className="w-9 h-9 md:w-12 md:h-12 text-[#0a1929] ml-1" fill="currentColor" />
              </div>
              <p className="text-sm md:text-base font-medium text-[#0a1929]/80">
                Video placeholder
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-12">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="quilora-heading-section px-1 font-bold text-white sm:px-0">
              There's no replacement to reading, but if you want mastery, Quilora provides the depth you seek
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-3xl bg-gradient-to-br from-[#1a2f45]/50 to-[#0a1929] border border-white/5 hover:border-[#266ba7]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#266ba7]/10 animate-fade-in-up"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed text-white/60 md:text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="bg-gradient-to-b from-[#266ba7]/[0.09] via-[#266ba7]/[0.04] to-transparent px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="quilora-heading-section mb-4 font-bold text-white">
              How Quilora works
            </h2>
          </div>

          <div className="space-y-14 sm:space-y-20 md:space-y-28">
            {steps.map((step, index) => (
              <div
                key={index}
                className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-14"
              >
                <div className="order-1 space-y-3 text-left [&>*]:m-0">
                  <ScrollReveal
                    xOffset={-32}
                    yOffset={0}
                    scale={1}
                    delay={0}
                    duration={0.55}
                  >
                    <p className="text-2xl lg:text-3xl font-bold text-[#266ba7]">
                      {step.stepLabel}
                    </p>
                  </ScrollReveal>
                  <ScrollReveal
                    xOffset={-28}
                    yOffset={0}
                    scale={1}
                    delay={0.14}
                    duration={0.55}
                  >
                    <p className="text-lg lg:text-xl font-medium text-white">
                      {step.subhead}
                    </p>
                  </ScrollReveal>
                  <ScrollReveal
                    xOffset={-24}
                    yOffset={0}
                    scale={1}
                    delay={0.22}
                    duration={0.55}
                  >
                    <p className="text-base font-normal leading-relaxed text-white/60">
                      {step.body}
                    </p>
                  </ScrollReveal>
                </div>
                <ScrollReveal
                  className="order-2 min-w-0"
                  xOffset={32}
                  yOffset={0}
                  scale={1}
                  delay={0.08}
                  duration={0.55}
                >
                  <div
                    className="min-h-[200px] md:min-h-[220px] rounded-2xl flex flex-col items-center justify-center gap-4 px-6 py-10 bg-[#266ba7]/20 border border-[#266ba7]/25"
                    role="img"
                    aria-label="Video placeholder"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#266ba7]/35 flex items-center justify-center">
                      <Play
                        className="w-7 h-7 text-[#266ba7]"
                        strokeWidth={2}
                        fill="currentColor"
                      />
                    </div>
                    <p className="text-base font-medium text-white/80">
                      Video Placeholder
                    </p>
                  </div>
                </ScrollReveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative overflow-x-hidden px-4 py-16 sm:px-6 sm:py-24">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(420px,70vw)] w-[min(720px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#266ba7]/[0.07] blur-3xl"
          aria-hidden
        />
        <div className="relative container mx-auto max-w-6xl">
          <ScrollReveal delay={0} duration={0.5} yOffset={18}>
            <h2 className="quilora-heading-section mb-10 text-center font-bold text-white sm:mb-12">
              From our pioneering users
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
                      <div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] ring-2 ring-white/5 transition-all duration-500 ease-out group-hover:shadow-[0_0_28px_rgba(38,107,167,0.35)] group-hover:ring-[#266ba7]/45" />

                      <h3 className="text-lg font-semibold text-white transition-colors duration-300 group-hover:text-[#e8f4ff]">
                        {testimonial.name}
                      </h3>

                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-[#266ba7] text-[#266ba7] transition-transform duration-300 ease-out will-change-transform group-hover:scale-110"
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
      </section>

      {/* Pricing — same Bookworm · Sage · Genesis block as /pricing */}
      <section id="pricing" className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="container mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <div className="space-y-4 text-center">
            <h2 className="quilora-heading-section font-bold text-white text-3xl lg:text-5xl">
              Choose your path to mastering your reading list.
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/60 sm:text-xl">Select the plan that aligns with your goals.</p>
          </div>
          <PricingPlansBlock onCheckoutCompleted={onCheckoutCompletedPlan} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] p-6 sm:rounded-3xl sm:p-10 lg:p-12">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative flex flex-col items-center space-y-5 text-center sm:space-y-6">
              <h2 className="quilora-heading-section font-bold text-white">
                Master the depth of every story
              </h2>
              <p className="mx-auto max-w-2xl text-base text-white/80 sm:text-lg lg:text-xl">
                Join our growing list of learners who use Quilora to reimagine the study process for literature, narratives, and books
              </p>
              <button
                onClick={handleGetStarted}
                className="group mx-auto flex min-h-11 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#266ba7] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto sm:py-4"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <QuiloraSiteFooter homeProductAnchors />
    </div>
  );
}