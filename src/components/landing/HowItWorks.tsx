import { useApp } from '../../context/AppContext';
import { Upload, Sparkles, MessageSquare } from 'lucide-react';

export function HowItWorks() {
  const { language } = useApp();

  const steps = [
    {
      icon: Upload,
      title: language === 'bs' ? 'Upload PDF' : language === 'es' ? 'Cargar PDF' : 'Upload PDF',
      description: language === 'bs'
        ? 'Jednostavno upload-uj bilo koju knjigu u PDF formatu'
        : language === 'es'
        ? 'Simplemente carga cualquier libro en formato PDF'
        : 'Simply upload any book in PDF format',
    },
    {
      icon: Sparkles,
      title: language === 'bs' ? 'AI obrađuje' : language === 'es' ? 'IA procesa' : 'AI Processes',
      description: language === 'bs'
        ? 'Naš AI analizira tekst i ekstraktuje ključne informacije'
        : language === 'es'
        ? 'Nuestra IA analiza el texto y extrae información clave'
        : 'Our AI analyzes the text and extracts key information',
    },
    {
      icon: MessageSquare,
      title: language === 'bs' ? 'Postavi pitanja' : language === 'es' ? 'Haz preguntas' : 'Ask Questions',
      description: language === 'bs'
        ? 'Dobij detaljne odgovore sa citatima i referencama'
        : language === 'es'
        ? 'Obtén respuestas detalladas con citas y referencias'
        : 'Get detailed answers with quotes and references',
    },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 bg-gradient-to-b from-transparent via-[#04245A]/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#E6F0FF] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {language === 'bs' ? 'Kako funkcioniše' : language === 'es' ? 'Cómo funciona' : 'How It Works'}
          </h2>
          <p className="text-xl text-[#E6F0FF]/70">
            {language === 'bs' 
              ? 'Tri jednostavna koraka do boljeg razumijevanja'
              : language === 'es'
              ? 'Tres pasos simples para una mejor comprensión'
              : 'Three simple steps to better understanding'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-1/3 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#00CFFF]/20 via-[#00CFFF]/50 to-[#00CFFF]/20"></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <div className="bg-[#04245A]/40 border border-[#00CFFF]/20 rounded-3xl p-8 text-center
                              hover:border-[#00CFFF]/50 transition-all duration-150">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full 
                                bg-gradient-to-r from-[#00CFFF] to-[#0090FF] flex items-center justify-center">
                    <span className="text-[#0A0F18] font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {index + 1}
                    </span>
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-[#00CFFF]/20 flex items-center justify-center mx-auto mb-6 mt-4">
                    <Icon className="w-8 h-8 text-[#00CFFF]" />
                  </div>

                  <h3 className="text-xl font-bold text-[#E6F0FF] mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {step.title}
                  </h3>

                  <p className="text-[#E6F0FF]/70">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
