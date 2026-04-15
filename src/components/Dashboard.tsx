import { BookOpen, MessageSquare, BookMarked, TrendingUp } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  questionsAsked: number;
  lastQuestionTime: number | null;
  cooldownUntil: number | null;
}

interface DashboardProps {
  currentUser: User | null;
  onContinueLearning: () => void;
}

export function Dashboard({ currentUser, onContinueLearning }: DashboardProps) {
  const analyzedPercentage = 92;
  const totalBooks = 3;
  const questionsAsked = 127;
  const savedQuotes = 24;

  return (
    <div className="min-h-screen bg-[#0A0F18] text-[#E6F0FF]">
      <div className="max-w-7xl mx-auto px-8 py-16">
        
        {/* Welcome Section - More spacing */}
        <div className="mb-16">
          <h1 
            className="text-5xl mb-4 text-white"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Dobrodošla nazad{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-lg text-[#E6F0FF]/60">
            Nastavi tamo gdje si stala sa analizom književnosti
          </p>
        </div>

        {/* Current Book Progress - Clean card with generous padding */}
        <div className="bg-[#04245A]/30 rounded-3xl p-10 border border-[#04245A]/50 mb-12 hover:border-[#00CFFF]/40 transition-all duration-200">
          <div className="flex items-start gap-8">
            {/* Book Icon/Cover */}
            <div className="w-32 h-48 bg-gradient-to-br from-[#04245A] to-[#02153A] rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-14 h-14 text-[#00CFFF]/40" />
            </div>

            {/* Book Info */}
            <div className="flex-1">
              <div className="mb-2">
                <span 
                  className="text-xs uppercase tracking-wider text-[#00CFFF]/70 mb-2 inline-block"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Trenutna knjiga
                </span>
              </div>
              <h2 
                className="text-3xl mb-3 text-white"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Na Drini ćuprija
              </h2>
              <p className="text-lg text-[#E6F0FF]/60 mb-6">
                Ivo Andrić
              </p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#E6F0FF]/70">Analizirano</span>
                  <span 
                    className="text-lg text-[#00CFFF]"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {analyzedPercentage}%
                  </span>
                </div>
                <div className="h-3 bg-[#04245A]/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00CFFF] to-[#0099CC] rounded-full transition-all duration-500"
                    style={{ width: `${analyzedPercentage}%` }}
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={onContinueLearning}
                className="px-8 py-4 bg-[#00CFFF] text-[#0A0F18] rounded-xl
                         hover:shadow-[0_0_30px_rgba(0,207,255,0.5)] transition-all duration-150
                         text-base tracking-wide"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Nastavi učenje →
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Increased spacing and padding */}
        <div className="mb-12">
          <h3 
            className="text-2xl mb-8 text-[#E6F0FF]"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Pregled aktivnosti
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Analyzed Books */}
            <div className="bg-[#04245A]/20 rounded-2xl p-8 border border-[#04245A]/40 hover:border-[#00CFFF]/40 transition-all duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <div>
                  <div 
                    className="text-4xl text-white mb-1"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {totalBooks}
                  </div>
                  <div className="text-sm text-[#E6F0FF]/60">
                    Analizirane knjige
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Asked */}
            <div className="bg-[#04245A]/20 rounded-2xl p-8 border border-[#04245A]/40 hover:border-[#00CFFF]/40 transition-all duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <div>
                  <div 
                    className="text-4xl text-white mb-1"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {questionsAsked}
                  </div>
                  <div className="text-sm text-[#E6F0FF]/60">
                    Postavljeno pitanja
                  </div>
                </div>
              </div>
            </div>

            {/* Saved Quotes */}
            <div className="bg-[#04245A]/20 rounded-2xl p-8 border border-[#04245A]/40 hover:border-[#00CFFF]/40 transition-all duration-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center">
                  <BookMarked className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <div>
                  <div 
                    className="text-4xl text-white mb-1"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {savedQuotes}
                  </div>
                  <div className="text-sm text-[#E6F0FF]/60">
                    Sačuvani citati
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insights - Optional contextual info */}
        <div className="bg-[#04245A]/20 rounded-2xl p-8 border border-[#04245A]/40">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#00CFFF]/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-[#00CFFF]" />
            </div>
            <div>
              <h4 
                className="text-lg mb-2 text-white"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Tvoj napredak
              </h4>
              <p className="text-[#E6F0FF]/70 leading-relaxed">
                Sjajno napreduješ! Prošle sedmice si postavila 23 pitanja i analizirala 2 nova poglavlja. 
                Nastavi u istom tempu da bi završila analizu trenutne knjige.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
