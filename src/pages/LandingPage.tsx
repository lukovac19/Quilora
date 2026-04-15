import { ModernNavbar } from '../components/ModernNavbar';
import { useTranslation } from '../lib/translations';
import { useNavigate, Link } from 'react-router';
import { ArrowRight, Upload, MessageSquare, BookCheck, Sparkles, Zap, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScrollReveal } from '../components/ScrollReveal';
import { useParallax } from '../hooks/useParallax';
import { useState, useEffect } from 'react';

export function LandingPage() {
  const { t } = useTranslation();
  const { user } = useApp();
  const navigate = useNavigate();
  const parallax1 = useParallax({ speed: 0.15, direction: 'down' });
  const parallax2 = useParallax({ speed: 0.08, direction: 'up' });
  const [heroGlowVisible, setHeroGlowVisible] = useState(false);

  useEffect(() => {
    // Trigger hero glow animation on mount
    const timer = setTimeout(() => setHeroGlowVisible(true), 100);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleStartFree = () => {
    navigate('/auth?mode=signup');
  };

  const handleUpgrade = () => {
    if (user) {
      navigate('/dashboard#pricing');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F18] text-[#E6F0FF] page-transition">
      <ModernNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Glow - subtle parallax */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00CFFF]/10 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ease-out"
          style={{
            ...parallax1,
            opacity: heroGlowVisible ? 1 : 0,
            transform: `${parallax1.transform} scale(${heroGlowVisible ? 1 : 0.8})`,
          }}
        />

        {/* Secondary decorative glow */}
        <div
          className="absolute -top-20 -right-40 w-[600px] h-[600px] bg-[#04A4FF]/5 rounded-full blur-[100px] pointer-events-none"
          style={parallax2}
        />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              {/* Badge */}
              <ScrollReveal delay={0} duration={0.4}>
                <div className="inline-block mb-6 px-4 py-2 rounded-full bg-[#04245A]/40 border border-[#00CFFF]/30">
                  <span className="text-sm text-[#00CFFF] font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t('hero.badge')}
                  </span>
                </div>
              </ScrollReveal>

              {/* Hero Title */}
              <ScrollReveal delay={0.1} duration={0.5}>
                <h1
                  className="text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {t('hero.title')}{' '}
                  <span className="bg-gradient-to-r from-[#00CFFF] via-[#04A4FF] to-[#00CFFF] bg-clip-text text-transparent">
                    {t('hero.titleHighlight')}
                  </span>{' '}
                  {t('hero.titleEnd')}
                </h1>
              </ScrollReveal>

              {/* Hero Subtitle */}
              <ScrollReveal delay={0.2} duration={0.5}>
                <p className="text-lg text-[#E6F0FF]/80 mb-8 leading-relaxed">
                  {t('hero.subtitle')}
                </p>
              </ScrollReveal>

              {/* CTA Buttons */}
              <ScrollReveal delay={0.3} duration={0.5}>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleStartFree}
                    className="group px-8 py-4 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#04A4FF] text-white font-bold text-lg btn-hover-glow flex items-center gap-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {t('hero.cta.start')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>

                  <button
                    onClick={handleUpgrade}
                    className="px-8 py-4 rounded-xl bg-[#04245A]/40 border-2 border-[#00CFFF]/30 text-[#00CFFF] font-bold text-lg neon-hover"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {t('hero.cta.upgrade')}
                  </button>
                </div>
              </ScrollReveal>

              {/* Stats - Staggered */}
              <div className="mt-12 grid grid-cols-3 gap-6">
                <ScrollReveal delay={0.4} duration={0.4}>
                  <div>
                    <div className="text-3xl font-bold text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      10K+
                    </div>
                    <div className="text-sm text-[#E6F0FF]/60">{t('hero.stats.users')}</div>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={0.5} duration={0.4}>
                  <div>
                    <div className="text-3xl font-bold text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      50K+
                    </div>
                    <div className="text-sm text-[#E6F0FF]/60">{t('hero.stats.books')}</div>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={0.6} duration={0.4}>
                  <div>
                    <div className="text-3xl font-bold text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      99%
                    </div>
                    <div className="text-sm text-[#E6F0FF]/60">{t('hero.stats.satisfaction')}</div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* Right: Animated Mockup */}
            <ScrollReveal delay={0.2} duration={0.6}>
              <div className="relative">
                {/* Device Frame */}
                <div className="relative rounded-2xl border-4 border-[#00CFFF]/30 bg-[#0A0F18] p-4 shadow-[0_0_60px_rgba(0,207,255,0.3)] neon-hover">
                  {/* Mock Chat Interface */}
                  <div className="rounded-xl bg-gradient-to-b from-[#04245A]/60 to-[#0A0F18] p-6 space-y-4">
                    {/* Message 1 */}
                    <div className="flex gap-3 animate-fade-in-up">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#04245A]" />
                      <div className="flex-1 bg-[#04245A]/60 rounded-xl p-4 border border-[#00CFFF]/20">
                        <p className="text-sm text-[#E6F0FF]">Ko je glavni protagonist u knjizi?</p>
                      </div>
                    </div>

                    {/* Message 2 - AI Response */}
                    <div className="flex gap-3 flex-row-reverse animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#04A4FF] to-[#00CFFF] flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 bg-gradient-to-r from-[#00CFFF]/10 to-[#04245A]/30 rounded-xl p-4 border border-[#00CFFF]/30">
                        <p className="text-sm text-[#E6F0FF] mb-2">
                          Glavni protagonist je... <span className="text-[#00CFFF]">(Str. 24)</span>
                        </p>
                        <div className="flex gap-2 mt-3">
                          <div className="px-3 py-1 rounded-lg bg-[#00CFFF]/20 text-xs text-[#00CFFF]">
                            Quote
                          </div>
                          <div className="px-3 py-1 rounded-lg bg-[#00CFFF]/20 text-xs text-[#00CFFF]">
                            Save
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Typing Indicator */}
                    <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#04245A]" />
                      <div className="bg-[#04245A]/60 rounded-xl px-4 py-3 border border-[#00CFFF]/20">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse" />
                          <div className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse delay-75" />
                          <div className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse delay-150" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00CFFF]/20 to-[#04A4FF]/20 blur-xl -z-10" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 relative">
        {/* Subtle background glow with parallax */}
        <div
          className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#04245A]/5 rounded-full blur-[80px] pointer-events-none"
          style={parallax2}
        />
        
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal delay={0} duration={0.5}>
            <div className="text-center mb-16">
              <h2
                className="text-4xl font-bold mb-4"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {t('howItWorks.title')}
              </h2>
              <p className="text-lg text-[#E6F0FF]/70">
                {t('howItWorks.subtitle')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <ScrollReveal delay={0.1} duration={0.5}>
              <div className="relative group">
                <div className="p-8 rounded-2xl bg-gradient-to-b from-[#04245A]/40 to-[#04245A]/20 border border-[#00CFFF]/20 card-hover">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00CFFF] to-[#04245A] flex items-center justify-center mb-6 group-hover:shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all duration-300">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {t('howItWorks.step1.title')}
                  </h3>
                  <p className="text-[#E6F0FF]/70">
                    {t('howItWorks.step1.description')}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Step 2 */}
            <ScrollReveal delay={0.2} duration={0.5}>
              <div className="relative group">
                <div className="p-8 rounded-2xl bg-gradient-to-b from-[#04245A]/40 to-[#04245A]/20 border border-[#00CFFF]/20 card-hover">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00CFFF] to-[#04245A] flex items-center justify-center mb-6 group-hover:shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all duration-300">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {t('howItWorks.step2.title')}
                  </h3>
                  <p className="text-[#E6F0FF]/70">
                    {t('howItWorks.step2.description')}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Step 3 */}
            <ScrollReveal delay={0.3} duration={0.5}>
              <div className="relative group">
                <div className="p-8 rounded-2xl bg-gradient-to-b from-[#04245A]/40 to-[#04245A]/20 border border-[#00CFFF]/20 card-hover">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00CFFF] to-[#04245A] flex items-center justify-center mb-6 group-hover:shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all duration-300">
                    <BookCheck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {t('howItWorks.step3.title')}
                  </h3>
                  <p className="text-[#E6F0FF]/70">
                    {t('howItWorks.step3.description')}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Modes Comparison */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-[#04245A]/10 relative overflow-hidden">
        {/* Decorative parallax glow */}
        <div
          className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"
          style={parallax1}
        />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <ScrollReveal delay={0} duration={0.5}>
            <div className="text-center mb-16">
              <h2
                className="text-4xl font-bold mb-4"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {t('modes.title')}
              </h2>
              <p className="text-lg text-[#E6F0FF]/70">
                {t('modes.subtitle')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Blitz Mode */}
            <ScrollReveal delay={0.1} duration={0.5}>
              <div className="p-6 rounded-2xl bg-[#04245A]/20 border border-gray-500/30 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6 text-gray-400" />
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {t('modes.blitz.name')}
                  </h3>
                </div>
                <div className="text-2xl font-bold text-gray-300 mb-4">{t('modes.blitz.price')}</div>
                <ul className="space-y-2 text-sm text-[#E6F0FF]/70">
                  <li>• {t('modes.blitz.features.questions')}</li>
                  <li>• {t('modes.blitz.features.cooldown')}</li>
                  <li>• {t('modes.blitz.features.answers')}</li>
                  <li>• {t('modes.blitz.features.pdfs')}</li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Normal Mode */}
            <ScrollReveal delay={0.2} duration={0.5}>
              <div className="p-6 rounded-2xl bg-[#04245A]/30 border border-blue-500/30 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {t('modes.normal.name')}
                  </h3>
                </div>
                <div className="text-2xl font-bold text-blue-300 mb-4">{t('modes.normal.price')}</div>
                <ul className="space-y-2 text-sm text-[#E6F0FF]/70">
                  <li>• {t('modes.normal.features.questions')}</li>
                  <li>• {t('modes.normal.features.essays')}</li>
                  <li>• {t('modes.normal.features.export')}</li>
                  <li>• {t('modes.normal.features.pdfs')}</li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Hard Quest Mode */}
            <ScrollReveal delay={0.3} duration={0.5}>
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-[#00CFFF]/20 border-2 border-purple-500/40 card-hover">
                <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold animate-pulse">
                  {t('modes.hardquest.popular')}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {t('modes.hardquest.name')}
                  </h3>
                </div>
                <div className="text-2xl font-bold text-purple-300 mb-4">{t('modes.hardquest.price')}</div>
                <ul className="space-y-2 text-sm text-[#E6F0FF]/70">
                  <li>• {t('modes.hardquest.features.analysis')}</li>
                  <li>• {t('modes.hardquest.features.essays')}</li>
                  <li>• {t('modes.hardquest.features.mindmaps')}</li>
                  <li>• {t('modes.hardquest.features.mcq')}</li>
                  <li>• {t('modes.hardquest.features.verified')}</li>
                </ul>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.4} duration={0.5}>
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/dashboard#pricing')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#04A4FF] text-white font-bold btn-hover-glow"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {t('modes.viewAll')}
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#00CFFF]/10">
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal delay={0.4} duration={0.4}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-6 text-sm">
                <a href="/about" className="text-[#E6F0FF]/60 hover:text-[#00CFFF] transition-colors">
                  About
                </a>
                <a href="/contact" className="text-[#E6F0FF]/60 hover:text-[#00CFFF] transition-colors">
                  Contact
                </a>
                <a href="/privacy" className="text-[#E6F0FF]/60 hover:text-[#00CFFF] transition-colors">
                  Privacy
                </a>
                <a href="/terms" className="text-[#E6F0FF]/60 hover:text-[#00CFFF] transition-colors">
                  Terms
                </a>
              </div>
              <p className="text-sm text-[#E6F0FF]/60 md:text-right">© 2026 Quilora. All rights reserved.</p>
            </div>
          </ScrollReveal>
        </div>
      </footer>
    </div>
  );
}