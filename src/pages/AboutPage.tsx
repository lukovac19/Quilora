import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';
import { QuiloraMarketingNavBar } from '../components/QuiloraMarketingNavBar';
import { QuiloraSiteFooter } from '../components/QuiloraSiteFooter';
import { QUILORA_LANDING_GRADIENT, QUILORA_SECTION_CARD } from '../lib/quiloraMarketingUi';

const storyCardClass = `${QUILORA_SECTION_CARD} mx-auto max-w-[720px] px-6 py-10 sm:px-10 sm:py-12`;
const storyBodyClass = 'text-base leading-[1.8] text-white/78 sm:text-lg';
const sectionTitleClass = 'text-xl font-bold tracking-tight text-[#3b82c4] sm:text-2xl';

export function AboutPage() {
  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#0a1929] font-[Inter,sans-serif] text-white">
      <QuiloraMarketingNavBar />

      <section className="relative overflow-x-hidden px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:pb-20 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 z-0" style={{ background: QUILORA_LANDING_GRADIENT }} aria-hidden />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <ScrollReveal delay={0} duration={0.55}>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              About Quilora
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.06} duration={0.55}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg lg:text-xl">
              A friendly space to actually enjoy the books you have to read — built by a student who got tired of guessing which tiny detail would be on the next quiz.
            </p>
          </ScrollReveal>
        </div>

        <div className="relative z-10 mx-auto mt-14 max-w-5xl space-y-8 sm:mt-16 lg:mt-20">
          <ScrollReveal delay={0.04} duration={0.55}>
            <div className={storyCardClass}>
              <p className={storyBodyClass}>
                Reading assignments shouldn&apos;t be a race to extract obscure details. They should be about understanding stories, themes, and ideas that actually stay with you. That belief is what Quilora is built on.
              </p>
              <p className={`${storyBodyClass} mt-6`}>
                I&apos;m a high school senior who has always loved programming. Building things, solving problems, figuring out how software can make life a little easier — that&apos;s always been my world. But even I couldn&apos;t escape the exhausting reading assignments that came with my native language class — a strict teacher, dense books, and tests that asked things like &quot;how many teeth does Anna Karenina&apos;s daughter have?&quot; or &quot;what is the name of the character mentioned once in chapter four?&quot;
              </p>
              <p className={`${storyBodyClass} mt-6`}>
                Micro-detail tests. Not comprehension — memorization. I watched my classmates spend days highlighting random facts just to pass a quiz, stressed out and exhausted, and I thought: this completely misses the point of reading. Nobody was actually connecting with the books. They were just surviving them.
              </p>
              <p className={`${storyBodyClass} mt-6`}>
                So I built a small tool called QuoteQuest to help. I presented it to my class — and when I saw just how much it could help people, something clicked. I didn&apos;t want to stop there. I went back to the drawing board: new name, new design, new features, everything rebuilt from the ground up with more intention and more care. That became Quilora.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08} duration={0.55}>
            <div className={storyCardClass}>
              <h2 className={sectionTitleClass}>What happened next</h2>
              <p className={`${storyBodyClass} mt-6`}>
                When I presented QuoteQuest to my class and put up posters around school, my native language teacher wasn&apos;t pleased. I was called to the principal&apos;s office. It was discouraging — the kind of moment where you wonder if you should just drop the whole thing. But I didn&apos;t.
              </p>
              <p className={`${storyBodyClass} mt-6`}>
                My German teacher saw something different. Where others saw a problem, she saw potential. She was genuinely excited about the idea — about what it could mean for students who avoid books not because they&apos;re lazy, but because the pressure around reading makes the whole experience feel pointless and overwhelming. She encouraged me to keep going, to believe in what I was building. Her enthusiasm and support gave Quilora the push it needed to actually see the light of day.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.12} duration={0.55}>
            <div className={storyCardClass}>
              <h2 className={sectionTitleClass}>Our goal right now</h2>
              <p className={`${storyBodyClass} mt-6`}>
                Quilora&apos;s mission is simple: help students genuinely understand what they read. Not skip books. Not cheat. Understand. Themes, characters, ideas, the bigger picture — well enough to ask real questions and think critically, not just hunt for the right answer to paste into a test.
              </p>
              <p className={`${storyBodyClass} mt-6`}>
                Short-term, we want students to stop dreading reading assignments. To feel like the process is manageable, even enjoyable. To open a book and not immediately wonder how they&apos;re going to memorize enough of it to pass. That&apos;s the problem we&apos;re solving, one book at a time.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.16} duration={0.55}>
            <div className={`${QUILORA_SECTION_CARD} mx-auto max-w-[720px] border-white/5 bg-gradient-to-br from-[#1a2f45]/35 to-[#0a1929]/25 px-6 py-10 text-center sm:px-10 sm:py-12`}>
              <p className="text-base italic leading-relaxed text-white/55 sm:text-lg">
                A huge thank you to my German teacher and my entire class for their support and encouragement — Quilora wouldn&apos;t exist without you.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} duration={0.55}>
            <div className="mx-auto max-w-xl pb-8 text-center">
              <Link
                to="/auth?mode=signup"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#266ba7] px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3b82c4] hover:shadow-xl hover:shadow-[#266ba7]/40"
              >
                Try Quilora
                <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <QuiloraSiteFooter />
    </div>
  );
}
