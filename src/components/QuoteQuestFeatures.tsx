import { MessageSquare, Network, FileText, History } from 'lucide-react';

export function QuoteQuestFeatures() {
  return (
    <section className="py-32 bg-[#0A0F18]" id="features">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="text-center mb-24">
          <h2 
            className="text-5xl md:text-6xl mb-6 text-white"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Šta sve možete raditi s QuoteQuestom
          </h2>
          <p className="text-xl text-[#E6F0FF]/70 max-w-3xl mx-auto leading-relaxed">
            Izaberite način rada i započnite analizu
          </p>
        </div>

        {/* Feature 1: Razgovor o knjizi */}
        <div className="mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#00CFFF]/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <h3 
                  className="text-3xl text-white"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Razgovor o knjizi
                </h3>
              </div>
              <p className="text-lg text-[#E6F0FF]/70 leading-relaxed mb-6">
                Postavljajte pitanja o djelu na prirodnom jeziku. AI analizira sadržaj i daje detaljne odgovore sa citatima i referencama.
              </p>
              <ul className="space-y-3 text-[#E6F0FF]/60 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Dubinska analiza tema i motiva</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Karakterizacija likova i njihovih odnosa</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Prepoznavanje stilskih figura</span>
                </li>
              </ul>

              {/* CTA Button */}
              <div>
                <button
                  className="px-8 py-4 bg-transparent border-2 border-[#00CFFF] text-[#00CFFF] rounded-xl
                           hover:bg-[#00CFFF]/10 hover:shadow-[0_0_20px_rgba(0,207,255,0.3)]
                           transition-all duration-200"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Započni razgovor
                </button>
                <p 
                  className="text-[#00CFFF] text-sm mt-3 uppercase tracking-wider"
                  style={{ 
                    fontFamily: 'Orbitron, sans-serif',
                    textShadow: '0 0 10px rgba(0, 207, 255, 0.5)'
                  }}
                >
                  Uskoro
                </p>
              </div>
            </div>

            {/* Chat Preview */}
            <div className="bg-[#04245A]/20 border border-[#04245A]/40 rounded-2xl p-8">
              <div className="space-y-6">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#04245A]/40 border border-[#04245A]/60 rounded-2xl px-6 py-4 max-w-[80%]">
                    <p className="text-[#E6F0FF] text-sm">
                      Koji su glavni motivi u djelu?
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-[#04245A]/60 border border-[#00CFFF]/30 rounded-2xl px-6 py-4 max-w-[85%]">
                    <p className="text-[#E6F0FF]/90 text-sm leading-relaxed mb-3">
                      U djelu se ističu tri ključna motiva:
                    </p>
                    <ul className="space-y-2 text-[#E6F0FF]/80 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-[#00CFFF]">1.</span>
                        <span>Most kao simbol vječnosti</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#00CFFF]">2.</span>
                        <span>Historijska promjenjivost</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#00CFFF]">3.</span>
                        <span>Ljudska patnja kroz vrijeme</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Mape uma */}
        <div className="mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Mind Map Preview */}
            <div className="bg-[#04245A]/20 border border-[#04245A]/40 rounded-2xl p-12 order-2 md:order-1">
              <div className="relative">
                {/* Central Node */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-[#00CFFF]/20 border-2 border-[#00CFFF] rounded-xl px-6 py-3">
                    <span className="text-white text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      Na Drini ćuprija
                    </span>
                  </div>
                </div>

                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ minHeight: '300px' }}>
                  <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#00CFFF" strokeWidth="1" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#00CFFF" strokeWidth="1" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#00CFFF" strokeWidth="1" opacity="0.3" />
                  <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#00CFFF" strokeWidth="1" opacity="0.3" />
                </svg>

                {/* Satellite Nodes */}
                <div className="absolute left-[12%] top-[12%]">
                  <div className="bg-[#04245A]/60 border border-[#04245A] rounded-lg px-4 py-2">
                    <span className="text-[#E6F0FF]/80 text-xs">Most</span>
                  </div>
                </div>
                <div className="absolute right-[8%] top-[12%]">
                  <div className="bg-[#04245A]/60 border border-[#04245A] rounded-lg px-4 py-2">
                    <span className="text-[#E6F0FF]/80 text-xs">Historija</span>
                  </div>
                </div>
                <div className="absolute left-[8%] bottom-[12%]">
                  <div className="bg-[#04245A]/60 border border-[#04245A] rounded-lg px-4 py-2">
                    <span className="text-[#E6F0FF]/80 text-xs">Likovi</span>
                  </div>
                </div>
                <div className="absolute right-[12%] bottom-[12%]">
                  <div className="bg-[#04245A]/60 border border-[#04245A] rounded-lg px-4 py-2">
                    <span className="text-[#E6F0FF]/80 text-xs">Simboli</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#00CFFF]/10 rounded-xl flex items-center justify-center">
                  <Network className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <h3 
                  className="text-3xl text-white"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Mape uma
                </h3>
              </div>
              <p className="text-lg text-[#E6F0FF]/70 leading-relaxed mb-6">
                Vizualizujte povezanost tema, likova i događaja. AI automatski kreira mrežu koncepata i prikazuje odnose između elemenata djela.
              </p>
              <ul className="space-y-3 text-[#E6F0FF]/60 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Interaktivna mreža koncepata</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Vizualni prikaz odnosa</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Pregled tematske strukture</span>
                </li>
              </ul>

              {/* CTA Button */}
              <div>
                <button
                  className="px-8 py-4 bg-transparent border-2 border-[#00CFFF] text-[#00CFFF] rounded-xl
                           hover:bg-[#00CFFF]/10 hover:shadow-[0_0_20px_rgba(0,207,255,0.3)]
                           transition-all duration-200"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Kreiraj mapu uma
                </button>
                <p 
                  className="text-[#00CFFF] text-sm mt-3 uppercase tracking-wider"
                  style={{ 
                    fontFamily: 'Orbitron, sans-serif',
                    textShadow: '0 0 10px rgba(0, 207, 255, 0.5)'
                  }}
                >
                  Uskoro
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Esejski odgovori */}
        <div className="mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#00CFFF]/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <h3 
                  className="text-3xl text-white"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Esejski odgovori
                </h3>
              </div>
              <p className="text-lg text-[#E6F0FF]/70 leading-relaxed mb-6">
                Dobijte strukturirane esejske odgovore sa uvodom, analizom i zaključkom. Svaki odgovor uključuje direktne citate i reference.
              </p>
              <ul className="space-y-3 text-[#E6F0FF]/60 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Kompletan esejski format</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Argumentovana analiza</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Direktni citati iz djela</span>
                </li>
              </ul>

              {/* CTA Button */}
              <div>
                <button
                  className="px-8 py-4 bg-transparent border-2 border-[#00CFFF] text-[#00CFFF] rounded-xl
                           hover:bg-[#00CFFF]/10 hover:shadow-[0_0_20px_rgba(0,207,255,0.3)]
                           transition-all duration-200"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Generiši esej
                </button>
                <p 
                  className="text-[#00CFFF] text-sm mt-3 uppercase tracking-wider"
                  style={{ 
                    fontFamily: 'Orbitron, sans-serif',
                    textShadow: '0 0 10px rgba(0, 207, 255, 0.5)'
                  }}
                >
                  Uskoro
                </p>
              </div>
            </div>

            {/* Essay Preview */}
            <div className="bg-[#04245A]/20 border border-[#04245A]/40 rounded-2xl p-8">
              <div className="space-y-6">
                {/* Uvod */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#00CFFF] rounded-full"></div>
                    <span 
                      className="text-[#00CFFF] text-xs uppercase tracking-wider"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      Uvod
                    </span>
                  </div>
                  <p className="text-[#E6F0FF]/80 text-sm leading-relaxed">
                    Most na Drini predstavlja centralni simbol kroz koji Andrić promatra tok historije...
                  </p>
                </div>

                {/* Analiza */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#00CFFF] rounded-full"></div>
                    <span 
                      className="text-[#00CFFF] text-xs uppercase tracking-wider"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      Analiza
                    </span>
                  </div>
                  <p className="text-[#E6F0FF]/80 text-sm leading-relaxed mb-3">
                    Kroz vijek postojanja, most postaje svjedok...
                  </p>
                  <div className="bg-[#04245A]/40 border-l-2 border-[#00CFFF] pl-4 py-2">
                    <p className="text-[#E6F0FF]/60 text-xs italic">
                      "I na njemu se, kao na kakvoj ogromnoj priči, piše povijest grada..."
                    </p>
                    <p className="text-[#00CFFF]/50 text-xs mt-1">— str. 15</p>
                  </div>
                </div>

                {/* Zaključak */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#00CFFF] rounded-full"></div>
                    <span 
                      className="text-[#00CFFF] text-xs uppercase tracking-wider"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      Zaključak
                    </span>
                  </div>
                  <p className="text-[#E6F0FF]/80 text-sm leading-relaxed">
                    Most kao arhitektonsko djelo nadilazi svoju fizičku prirodu...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: Pregled ranijih pitanja */}
        <div>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* History Preview */}
            <div className="bg-[#04245A]/20 border border-[#04245A]/40 rounded-2xl p-8 order-2 md:order-1">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[#04245A]/30 border border-[#04245A]/50 rounded-xl hover:border-[#00CFFF]/30 transition-all">
                  <div className="w-2 h-2 bg-[#00CFFF] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-[#E6F0FF] text-sm mb-1">
                      Kakva je uloga mosta u djelu?
                    </p>
                    <p className="text-[#E6F0FF]/50 text-xs">
                      danas u 14:23
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#04245A]/30 border border-[#04245A]/50 rounded-xl hover:border-[#00CFFF]/30 transition-all">
                  <div className="w-2 h-2 bg-[#00CFFF] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-[#E6F0FF] text-sm mb-1">
                      Ko su glavni likovi u romanu?
                    </p>
                    <p className="text-[#E6F0FF]/50 text-xs">
                      jučer u 19:45
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#04245A]/30 border border-[#04245A]/50 rounded-xl hover:border-[#00CFFF]/30 transition-all">
                  <div className="w-2 h-2 bg-[#00CFFF] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-[#E6F0FF] text-sm mb-1">
                      Analiziraj temporalnu strukturu priče
                    </p>
                    <p className="text-[#E6F0FF]/50 text-xs">
                      3 dana ranije
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-[#04245A]/30 border border-[#04245A]/50 rounded-xl hover:border-[#00CFFF]/30 transition-all">
                  <div className="w-2 h-2 bg-[#00CFFF] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-[#E6F0FF] text-sm mb-1">
                      Koji historijski eventi se spominju?
                    </p>
                    <p className="text-[#E6F0FF]/50 text-xs">
                      prošle sedmice
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#00CFFF]/10 rounded-xl flex items-center justify-center">
                  <History className="w-7 h-7 text-[#00CFFF]" />
                </div>
                <h3 
                  className="text-3xl text-white"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Pregled ranijih pitanja
                </h3>
              </div>
              <p className="text-lg text-[#E6F0FF]/70 leading-relaxed mb-6">
                Pristupite kompletnoj historiji vaših pitanja i odgovora. Sve analize ostaju sačuvane za kasnije pregledavanje i ponovljeno učenje.
              </p>
              <ul className="space-y-3 text-[#E6F0FF]/60 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Sva pitanja na jednom mjestu</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Hronološki pregled aktivnosti</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#00CFFF] mt-1">•</span>
                  <span>Brza pretraga prethodnih analiza</span>
                </li>
              </ul>

              {/* CTA Button */}
              <div>
                <button
                  className="px-8 py-4 bg-transparent border-2 border-[#00CFFF] text-[#00CFFF] rounded-xl
                           hover:bg-[#00CFFF]/10 hover:shadow-[0_0_20px_rgba(0,207,255,0.3)]
                           transition-all duration-200"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Pogledaj historiju
                </button>
                <p 
                  className="text-[#00CFFF] text-sm mt-3 uppercase tracking-wider"
                  style={{ 
                    fontFamily: 'Orbitron, sans-serif',
                    textShadow: '0 0 10px rgba(0, 207, 255, 0.5)'
                  }}
                >
                  Uskoro
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}