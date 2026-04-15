import { Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

export function PricingSection() {
  const { language } = useApp();

  const plans = [
    {
      id: 'blitz',
      name: 'Blitz Mode',
      price: '€0',
      period: language === 'bs' ? 'Besplatno' : language === 'es' ? 'Gratis' : 'Free',
      icon: Zap,
      features: [
        language === 'bs' ? '5 pitanja' : language === 'es' ? '5 preguntas' : '5 questions',
        language === 'bs' ? '4 sata čekanja' : language === 'es' ? '4 horas de espera' : '4 hour cooldown',
        language === 'bs' ? 'Ograničeni PDF-ovi' : language === 'es' ? 'PDFs limitados' : 'Limited PDFs',
        language === 'bs' ? 'Bez exporta' : language === 'es' ? 'Sin exportación' : 'No export',
      ],
      popular: false,
    },
    {
      id: 'normal',
      name: 'Normal Mode',
      price: '€6',
      period: language === 'bs' ? '/mjesečno' : language === 'es' ? '/mes' : '/month',
      icon: Sparkles,
      features: [
        language === 'bs' ? 'Essay kvizovi' : language === 'es' ? 'Cuestionarios de ensayo' : 'Essay quizzes',
        language === 'bs' ? 'Mastery path' : language === 'es' ? 'Ruta de dominio' : 'Mastery path',
        language === 'bs' ? 'Više generacija' : language === 'es' ? 'Más generaciones' : 'More generations',
        language === 'bs' ? 'Export omogućen' : language === 'es' ? 'Exportación habilitada' : 'Export enabled',
      ],
      popular: false,
    },
    {
      id: 'hardquest',
      name: 'Hard Quest',
      price: '€12',
      period: language === 'bs' ? '/mjesečno' : language === 'es' ? '/mes' : '/month',
      icon: Crown,
      features: [
        language === 'bs' ? 'Detaljna pitanja' : language === 'es' ? 'Preguntas detalladas' : 'Deep detailed questions',
        language === 'bs' ? 'Timed eseji' : language === 'es' ? 'Ensayos temporizados' : 'Timed essays',
        language === 'bs' ? 'MCQ pitanja' : language === 'es' ? 'Preguntas MCQ' : 'MCQ questions',
        language === 'bs' ? 'Mindmap po sesiji' : language === 'es' ? 'Mapa mental por sesión' : 'Mindmap per session',
        language === 'bs' ? 'Source-linked odgovori' : language === 'es' ? 'Respuestas vinculadas' : 'Source-linked answers',
      ],
      popular: true,
    },
    {
      id: 'lifetime',
      name: 'Lifetime Deal',
      price: '€80',
      period: language === 'bs' ? 'Jednom' : language === 'es' ? 'Una vez' : 'One-time',
      icon: Crown,
      features: [
        language === 'bs' ? 'Sve iz Hard Quest' : language === 'es' ? 'Todo de Hard Quest' : 'Everything from Hard Quest',
        language === 'bs' ? 'Doživotni pristup' : language === 'es' ? 'Acceso de por vida' : 'Lifetime access',
        language === 'bs' ? 'Bez mjesečnih naknada' : language === 'es' ? 'Sin tarifas mensuales' : 'No monthly fees',
        language === 'bs' ? 'Prioritetna podrška' : language === 'es' ? 'Soporte prioritario' : 'Priority support',
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-[#E6F0FF] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {language === 'bs' ? 'Izaberi svoj plan' : language === 'es' ? 'Elige tu plan' : 'Choose Your Plan'}
          </h2>
          <p className="text-xl text-[#E6F0FF]/70">
            {language === 'bs' 
              ? 'Od besplatnog do doživotnog, pronađi idealno rješenje'
              : language === 'es'
              ? 'Desde gratis hasta de por vida, encuentra la solución ideal'
              : 'From free to lifetime, find the perfect solution'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-[#04245A]/40 border rounded-3xl p-8 
                          transition-all duration-150 ${
                  plan.popular
                    ? 'border-[#00CFFF] shadow-[0_0_40px_rgba(0,207,255,0.3)] lg:-mt-4 lg:mb-[-16px]'
                    : 'border-[#00CFFF]/20 hover:border-[#00CFFF]/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full 
                                bg-gradient-to-r from-[#00CFFF] to-[#0090FF]">
                    <span className="text-xs text-[#0A0F18] font-bold uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {language === 'bs' ? 'Najpopularnije' : language === 'es' ? 'Más popular' : 'Most Popular'}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    plan.popular ? 'bg-[#00CFFF]/30' : 'bg-[#00CFFF]/20'
                  }`}>
                    <Icon className="w-7 h-7 text-[#00CFFF]" />
                  </div>

                  <h3 className="text-xl font-bold text-[#E6F0FF] mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-[#00CFFF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {plan.price}
                    </span>
                  </div>

                  <p className="text-sm text-[#E6F0FF]/60">{plan.period}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-[#00CFFF] flex-shrink-0 mr-2 mt-0.5" />
                      <span className="text-sm text-[#E6F0FF]/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth?mode=signup"
                  className={`block w-full py-3 rounded-xl text-center font-bold transition-all duration-150 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#00CFFF] to-[#0090FF] text-[#0A0F18] hover:shadow-[0_0_30px_rgba(0,207,255,0.5)]'
                      : 'bg-[#04245A]/60 border border-[#00CFFF]/30 text-[#00CFFF] hover:border-[#00CFFF] hover:bg-[#04245A]'
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {language === 'bs' ? 'Počni' : language === 'es' ? 'Empezar' : 'Get Started'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
