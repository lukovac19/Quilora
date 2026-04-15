import { useApp } from '../../context/AppContext';
import { BookOpen, MessageSquare, Save, Sparkles, Users, Brain } from 'lucide-react';

export function Features() {
  const { language } = useApp();

  const features = [
    {
      icon: Sparkles,
      title: language === 'bs' ? 'AI Analiza' : language === 'es' ? 'Análisis IA' : 'AI Analysis',
      description: language === 'bs' 
        ? 'Duboka analiza teksta sa naprednom AI tehnologijom'
        : language === 'es'
        ? 'Análisis profundo de texto con tecnología IA avanzada'
        : 'Deep text analysis with advanced AI technology',
    },
    {
      icon: MessageSquare,
      title: language === 'bs' ? 'Prirodni jezik' : language === 'es' ? 'Lenguaje natural' : 'Natural Language',
      description: language === 'bs'
        ? 'Postavljaj pitanja kao da razgovaraš sa prijateljem'
        : language === 'es'
        ? 'Haz preguntas como si hablaras con un amigo'
        : 'Ask questions as if talking to a friend',
    },
    {
      icon: Users,
      title: language === 'bs' ? 'Ekstrakcija likova' : language === 'es' ? 'Extracción de personajes' : 'Character Extraction',
      description: language === 'bs'
        ? 'Automatska identifikacija i analiza likova'
        : language === 'es'
        ? 'Identificación y análisis automático de personajes'
        : 'Automatic character identification and analysis',
    },
    {
      icon: BookOpen,
      title: language === 'bs' ? 'Referencirani odgovori' : language === 'es' ? 'Respuestas referenciadas' : 'Source References',
      description: language === 'bs'
        ? 'Svaki odgovor sa citatima i brojevima stranica'
        : language === 'es'
        ? 'Cada respuesta con citas y números de página'
        : 'Every answer with quotes and page numbers',
    },
    {
      icon: Brain,
      title: language === 'bs' ? 'Generisanje pitanja' : language === 'es' ? 'Generación de preguntas' : 'Question Generation',
      description: language === 'bs'
        ? 'Kreiraj studijska pitanja prilagođena tvom nivou'
        : language === 'es'
        ? 'Crea preguntas de estudio adaptadas a tu nivel'
        : 'Create study questions tailored to your level',
    },
    {
      icon: Save,
      title: language === 'bs' ? 'Izvoz rezultata' : language === 'es' ? 'Exportar resultados' : 'Export Results',
      description: language === 'bs'
        ? 'Sačuvaj i izvezi svoje analize u različitim formatima'
        : language === 'es'
        ? 'Guarda y exporta tus análisis en diferentes formatos'
        : 'Save and export your analyses in various formats',
    },
  ];

  return (
    <section id="features" className="py-24 px-6 lg:px-12 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#E6F0FF] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {language === 'bs' ? 'Moćne funkcije' : language === 'es' ? 'Funciones poderosas' : 'Powerful Features'}
          </h2>
          <p className="text-xl text-[#E6F0FF]/70">
            {language === 'bs' 
              ? 'Sve što ti treba za duboko razumijevanje književnosti'
              : language === 'es'
              ? 'Todo lo que necesitas para una comprensión profunda de la literatura'
              : 'Everything you need for deep literary understanding'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-[#04245A]/40 border border-[#00CFFF]/20 rounded-3xl p-8 
                         hover:border-[#00CFFF]/50 hover:shadow-[0_0_30px_rgba(0,207,255,0.2)]
                         transition-all duration-150 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#00CFFF]/20 flex items-center justify-center mb-6 
                              group-hover:bg-[#00CFFF]/30 transition-all duration-150">
                  <Icon className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <h3 className="text-xl font-bold text-[#E6F0FF] mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-[#E6F0FF]/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
