import { BarChart3, TrendingUp } from 'lucide-react';

export function BookStatistics() {
  return (
    <section className="relative bg-[#0A0A0A] py-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <h2 
            className="text-[#E6F0FF] mb-4"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              letterSpacing: '-0.02em'
            }}
          >
            Statistika knjige
          </h2>
          <p className="text-[#E6F0FF]/70 text-lg">
            Najčešće riječi, motivi i likovi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Najčešće riječi */}
          <div 
            className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 hover:border-[#00D1FF]/50 transition-all"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-[#00D1FF]" />
              <h3 className="text-[#E6F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Najčešće riječi
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { word: 'ljubav', count: 147, percentage: 100 },
                { word: 'život', count: 128, percentage: 87 },
                { word: 'vrijeme', count: 95, percentage: 65 },
                { word: 'svijet', count: 73, percentage: 50 },
                { word: 'srce', count: 61, percentage: 41 }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#E6F0FF]/80">{item.word}</span>
                    <span className="text-[#00D1FF]">{item.count}</span>
                  </div>
                  <div className="h-2 bg-[#001F54]/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivi */}
          <div 
            className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 hover:border-[#00D1FF]/50 transition-all"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#00D1FF]" />
              <h3 className="text-[#E6F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Dominantni motivi
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { motif: 'Ljubav', count: 89, percentage: 100 },
                { motif: 'Smrt', count: 67, percentage: 75 },
                { motif: 'Sloboda', count: 54, percentage: 61 },
                { motif: 'Voda', count: 42, percentage: 47 },
                { motif: 'Svjetlost', count: 38, percentage: 43 }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#E6F0FF]/80">{item.motif}</span>
                    <span className="text-[#00D1FF]">{item.count}</span>
                  </div>
                  <div className="h-2 bg-[#001F54]/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Likovi */}
          <div 
            className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 hover:border-[#00D1FF]/50 transition-all md:col-span-2 lg:col-span-1"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-[#00D1FF]" />
              <h3 className="text-[#E6F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Glavni likovi
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { character: 'Ana', appearances: 234, percentage: 100 },
                { character: 'Marko', appearances: 198, percentage: 85 },
                { character: 'Ivan', appearances: 156, percentage: 67 },
                { character: 'Marija', appearances: 123, percentage: 53 },
                { character: 'Petar', appearances: 98, percentage: 42 }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#E6F0FF]/80">{item.character}</span>
                    <span className="text-[#00D1FF]">{item.appearances}</span>
                  </div>
                  <div className="h-2 bg-[#001F54]/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF]"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Future enhancement note */}
        <div className="mt-8 p-4 rounded-xl bg-[#001F54]/20 border border-[#00D1FF]/20 text-center">
          <p className="text-[#E6F0FF]/50 text-sm">
            💡 Napredne statistike dostupne nakon učitavanja knjige
          </p>
        </div>
      </div>
    </section>
  );
}
