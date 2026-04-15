import { ModernNavbar } from '../components/ModernNavbar';
import { ScrollReveal } from '../components/ScrollReveal';
import { Sparkles, Calendar, Clock, ArrowRight } from 'lucide-react';

export function BlogPage() {
  const blogPosts = [
    {
      title: '10 Savjeta za Efikasnu Analizu Književnosti sa AI',
      excerpt: 'Otkrijte kako maksimalno iskoristiti AI alate za dubinsku analizu književnih djela i pripremu za ispite.',
      date: '15. Februar 2026',
      readTime: '5 min',
      category: 'Savjeti',
      image: 'bg-gradient-to-br from-blue-500/20 to-[#00CFFF]/20'
    },
    {
      title: 'Kako QuoteQuest AI Revolucionira Učenje',
      excerpt: 'Priča o tome kako smo kombinovali AI tehnologiju i književnost da kreiramo savršenu learning platformu.',
      date: '10. Februar 2026',
      readTime: '7 min',
      category: 'Tehnologija',
      image: 'bg-gradient-to-br from-purple-500/20 to-[#00CFFF]/20'
    },
    {
      title: 'Novi Update: Mind Maps Generator',
      excerpt: 'Predstavljamo novu mogućnost - kreiraj vizuelne mind mape za lakše razumijevanje kompleksnih knjiga.',
      date: '5. Februar 2026',
      readTime: '4 min',
      category: 'Update',
      image: 'bg-gradient-to-br from-green-500/20 to-[#00CFFF]/20'
    },
    {
      title: 'Studije Slučaja: Kako Studenti Koriste QuoteQuest',
      excerpt: 'Pročitajte priče naših korisnika i kako im je QuoteQuest pomogao u studiju književnosti.',
      date: '1. Februar 2026',
      readTime: '6 min',
      category: 'Priče',
      image: 'bg-gradient-to-br from-orange-500/20 to-[#00CFFF]/20'
    },
    {
      title: 'Best Practices za Pisanje Eseja sa AI Pomoći',
      excerpt: 'Naučite kako kombinovati AI alate sa vašom kreativnošću za pisanje sjajnih eseja.',
      date: '28. Januar 2026',
      readTime: '8 min',
      category: 'Savjeti',
      image: 'bg-gradient-to-br from-pink-500/20 to-[#00CFFF]/20'
    },
    {
      title: 'Najavljujemo Multi-Language Support',
      excerpt: 'QuoteQuest AI sada govori tvoj jezik! Dostupno na Bosanskom, English i Español.',
      date: '20. Januar 2026',
      readTime: '3 min',
      category: 'Update',
      image: 'bg-gradient-to-br from-cyan-500/20 to-[#00CFFF]/20'
    }
  ];

  const categories = ['Sve', 'Savjeti', 'Tehnologija', 'Update', 'Priče'];

  return (
    <div className="min-h-screen bg-[#0A0F18] text-[#E6F0FF]">
      <ModernNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00CFFF]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <ScrollReveal delay={0} duration={0.5}>
            <div className="text-center mb-16">
              <div className="inline-block mb-6 px-4 py-2 rounded-full bg-[#04245A]/40 border border-[#00CFFF]/30">
                <span className="text-sm text-[#00CFFF] font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Savjeti, Vijesti i Insights
                </span>
              </div>
              <h1
                className="text-5xl lg:text-6xl font-bold mb-6"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                QuoteQuest{' '}
                <span className="bg-gradient-to-r from-[#00CFFF] to-[#04A4FF] bg-clip-text text-transparent">
                  Blog
                </span>
              </h1>
              <p className="text-xl text-[#E6F0FF]/70 max-w-3xl mx-auto">
                Ostani informisan o novim mogućnostima, savjetima za učenje i AI tehnologiji
              </p>
            </div>
          </ScrollReveal>

          {/* Categories */}
          <ScrollReveal delay={0.2} duration={0.5}>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`px-5 py-2 rounded-full transition-all duration-200 ${
                    index === 0
                      ? 'bg-gradient-to-r from-[#00CFFF] to-[#04A4FF] text-white'
                      : 'bg-[#04245A]/40 border border-[#00CFFF]/20 text-[#E6F0FF] hover:border-[#00CFFF]/50'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <ScrollReveal key={index} delay={index * 0.1} duration={0.5}>
                <article className="group rounded-2xl bg-gradient-to-b from-[#04245A]/40 to-[#04245A]/20 border border-[#00CFFF]/20 hover:border-[#00CFFF]/50 transition-all duration-300 overflow-hidden hover:shadow-[0_0_30px_rgba(0,207,255,0.2)] cursor-pointer">
                  {/* Image Placeholder */}
                  <div className={`h-48 ${post.image} flex items-center justify-center`}>
                    <div className="w-16 h-16 rounded-full bg-[#00CFFF]/20 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-[#00CFFF]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    <div className="inline-block px-3 py-1 rounded-full bg-[#00CFFF]/20 text-[#00CFFF] text-xs font-medium mb-3">
                      {post.category}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-xl font-bold mb-3 text-[#E6F0FF] group-hover:text-[#00CFFF] transition-colors duration-200"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-[#E6F0FF]/70 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-[#E6F0FF]/60">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#00CFFF] group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>

          {/* Newsletter Section */}
          <ScrollReveal delay={0.6} duration={0.5}>
            <div className="mt-20 p-8 rounded-2xl bg-gradient-to-b from-[#04245A]/40 to-[#04245A]/20 border border-[#00CFFF]/30 text-center">
              <h3
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Pridruži se našem{' '}
                <span className="bg-gradient-to-r from-[#00CFFF] to-[#04A4FF] bg-clip-text text-transparent">
                  Newsletter-u
                </span>
              </h3>
              <p className="text-[#E6F0FF]/70 mb-6 max-w-2xl mx-auto">
                Primi nove blog postove, savjete za učenje i ekskluzivne updates direktno u svoj inbox
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="tvoj.email@example.com"
                  className="flex-1 px-4 py-3 rounded-lg bg-[#0A0F18] border border-[#00CFFF]/30 text-[#E6F0FF] placeholder:text-[#E6F0FF]/40 focus:outline-none focus:border-[#00CFFF] transition-colors"
                />
                <button
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#00CFFF] to-[#04A4FF] text-white font-bold btn-hover-glow whitespace-nowrap"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Prijavi se
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#00CFFF]/10 mt-20">
        <div className="container mx-auto max-w-6xl">
          <p className="text-sm text-[#E6F0FF]/60">
            © 2026 Quilora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
