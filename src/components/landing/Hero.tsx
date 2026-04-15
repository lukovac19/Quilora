import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { t } from '../../lib/translations';
import { motion } from '../ui/motion';
import { Sparkles, Zap } from 'lucide-react';

export function Hero() {
  const { language } = useApp();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F18] via-[#04245A]/20 to-[#0A0F18]"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00CFFF]/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#04245A]/30 rounded-full blur-[100px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/30 mb-8">
              <Sparkles className="w-4 h-4 text-[#00CFFF]" />
              <span className="text-sm text-[#00CFFF] font-semibold">
                {language === 'bs' ? 'AI-powered učenje' : language === 'es' ? 'Aprendizaje con IA' : 'AI-Powered Learning'}
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-[#E6F0FF] mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {language === 'bs' ? (
                <>
                  Ovladaj bilo kojom{' '}
                  <span className="bg-gradient-to-r from-[#00CFFF] to-[#0090FF] bg-clip-text text-transparent">
                    knjigom
                  </span>
                </>
              ) : language === 'es' ? (
                <>
                  Domina cualquier{' '}
                  <span className="bg-gradient-to-r from-[#00CFFF] to-[#0090FF] bg-clip-text text-transparent">
                    libro
                  </span>
                </>
              ) : (
                <>
                  Master Any{' '}
                  <span className="bg-gradient-to-r from-[#00CFFF] to-[#0090FF] bg-clip-text text-transparent">
                    Book
                  </span>
                </>
              )}
            </h1>

            <p className="text-xl text-[#E6F0FF]/70 mb-8 leading-relaxed">
              {t('hero.subtitle', language)}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/auth?mode=signup"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#0090FF] 
                         text-[#0A0F18] font-bold hover:shadow-[0_0_40px_rgba(0,207,255,0.5)]
                         transition-all duration-150 text-center"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {t('hero.cta.start', language)}
              </Link>

              <a
                href="#pricing"
                className="px-8 py-4 rounded-xl bg-[#04245A]/60 border-2 border-[#00CFFF]/30 
                         text-[#00CFFF] font-bold hover:border-[#00CFFF] hover:bg-[#04245A]
                         transition-all duration-150 text-center flex items-center justify-center space-x-2"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <Zap className="w-5 h-5" />
                <span>{t('hero.cta.upgrade', language)}</span>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-[#00CFFF]/20">
              <div>
                <p className="text-3xl font-bold text-[#00CFFF] mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  10K+
                </p>
                <p className="text-sm text-[#E6F0FF]/60">
                  {language === 'bs' ? 'Korisnika' : language === 'es' ? 'Usuarios' : 'Users'}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#00CFFF] mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  50K+
                </p>
                <p className="text-sm text-[#E6F0FF]/60">
                  {language === 'bs' ? 'Knjiga' : language === 'es' ? 'Libros' : 'Books'}
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#00CFFF] mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  99%
                </p>
                <p className="text-sm text-[#E6F0FF]/60">
                  {language === 'bs' ? 'Tačnost' : language === 'es' ? 'Precisión' : 'Accuracy'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00CFFF]/20 to-[#0090FF]/20 rounded-3xl blur-3xl"></div>

              {/* Mockup Card */}
              <div className="relative bg-gradient-to-br from-[#04245A]/80 to-[#04245A]/40 border border-[#00CFFF]/30 rounded-3xl p-8 backdrop-blur-xl">
                {/* Mock Chat Interface */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center space-x-3 pb-4 border-b border-[#00CFFF]/20">
                    <div className="w-10 h-10 rounded-lg bg-[#00CFFF]/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#00CFFF]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#E6F0FF]">AI Assistant</p>
                      <p className="text-xs text-[#E6F0FF]/60">Online</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-[#00CFFF] to-[#0090FF] text-[#0A0F18] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                        <p className="text-sm">Who is the protagonist?</p>
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="bg-[#04245A]/60 border border-[#00CFFF]/20 text-[#E6F0FF] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%]">
                        <p className="text-sm mb-2">The protagonist is...</p>
                        <p className="text-xs text-[#00CFFF] italic">"Quote from page 45"</p>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="pt-4 border-t border-[#00CFFF]/20">
                    <div className="bg-[#04245A]/60 border border-[#00CFFF]/20 rounded-xl px-4 py-3">
                      <p className="text-sm text-[#E6F0FF]/40">Ask anything about the book...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}