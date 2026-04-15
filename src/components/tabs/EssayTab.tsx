import { Quote } from 'lucide-react';

export function EssayTab() {
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-[#04245A]/20 border-b border-[#04245A]/40 p-6">
        <h2 
          className="text-2xl text-white mb-2 uppercase tracking-wide"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Analiza: Most kao simbol
        </h2>
        <p className="text-sm text-[#E6F0FF]/60">
          Generisano AI esejem na osnovu vašeg upita • Posljednja izmjena: prije 2 sata
        </p>
      </div>

      {/* Essay Content */}
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Uvod */}
        <section>
          <h3 
            className="text-lg text-[#00CFFF] mb-4 uppercase tracking-wider"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Uvod
          </h3>
          <div className="space-y-4 text-[#E6F0FF]/80 leading-relaxed">
            <p>
              U romanu "Na Drini ćuprija" Ive Andrića, most ne predstavlja samo arhitektonsku građevinu, 
              već funkcioniše kao višeslojni simbol koji objedinjuje historijske, kulturološke i filozofske 
              dimenzije narativa. Kroz četiri stoljeća postojanja, ćuprija postaje svjedok i učesnik u 
              promjenama koje oblikuju sudbinu Višegrada i njegovih stanovnika.
            </p>
            <p>
              Andrić koristi most kao centralnu metaforu koja spaja ne samo dvije obale rijeke Drine, 
              već i različite civilizacije, vjere, kulture i epohe. Ovaj simbolički potencijal čini 
              ćupriju pravim glavnim likom romana.
            </p>
          </div>
        </section>

        {/* Analiza */}
        <section>
          <h3 
            className="text-lg text-[#00CFFF] mb-4 uppercase tracking-wider"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Analiza
          </h3>
          <div className="space-y-6 text-[#E6F0FF]/80 leading-relaxed">
            <div>
              <h4 className="text-[#00CFFF]/80 font-semibold mb-3">Most kao simbol trajnosti</h4>
              <p className="mb-4">
                Za razliku od ljudskih likova koji dolaze i odlaze, ćuprija ostaje konstantna kroz 
                prolaznost vremena. Andrić piše:
              </p>
              <blockquote className="border-l-4 border-[#00CFFF]/40 pl-4 py-2 bg-[#04245A]/20 rounded-r-lg italic">
                <Quote className="w-4 h-4 text-[#00CFFF]/60 inline mr-2" />
                <span className="text-[#E6F0FF]/70">
                  "Most je stariji od svega što se oko njega nalazi, otporniji od svih 
                  revolucija i ratova..."
                </span>
              </blockquote>
              <p className="mt-4">
                Ova trajnost nije pasivna - most je aktivni učesnik u životu zajednice, 
                mjesto susreta, trgovine, razgovora i odlučujućih historijskih događaja.
              </p>
            </div>

            <div>
              <h4 className="text-[#00CFFF]/80 font-semibold mb-3">Most kao veza između civilizacija</h4>
              <p>
                Ćuprija spaja Istok i Zapad, muslimanski i hrišćanski svijet, osmansku i evropsku 
                civilizaciju. Na kapiji se susreću različiti načini života, vjerovanja i vrijednosti. 
                Most nije samo fizička veza već i prostor dijaloga i suživota.
              </p>
            </div>

            <div>
              <h4 className="text-[#00CFFF]/80 font-semibold mb-3">Most kao arhiv kolektivne memorije</h4>
              <p>
                Kroz priče vezane za most, Andrić rekonstruiše historiju cijelog regiona. 
                Svaki kamen ćuprije nosi u sebi priču, svaka generacija ostavlja svoj trag. 
                Most postaje živi arhiv kolektivnog iskustva zajednice.
              </p>
            </div>
          </div>
        </section>

        {/* Zaključak */}
        <section>
          <h3 
            className="text-lg text-[#00CFFF] mb-4 uppercase tracking-wider"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            Zaključak
          </h3>
          <div className="space-y-4 text-[#E6F0FF]/80 leading-relaxed">
            <p>
              Simbol mosta u Andrićevom djelu nadilazi svoju primarnu funkciju. On postaje 
              metafora za ljudsku potrebu za povezivanjem, za trajanjem i smislom u svijetu 
              stalnih promjena. Ćuprija opstaje kroz stoljetja kao dokaz da čovjek može 
              stvoriti nešto što nadilazi njegovo ograničeno postojanje.
            </p>
            <p>
              U konačnici, "Na Drini ćuprija" nije samo roman o mostu - to je roman o 
              čovječanstvu koje, uprkos svim razlikama i sukobima, ostaje povezano 
              zajedničkim prostorom i zajedničkom sudbinom.
            </p>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="pt-8 border-t border-[#04245A]/40 flex gap-4">
          <button className="px-6 py-3 bg-[#04245A]/30 border border-[#04245A]/50 rounded-xl
                           text-[#E6F0FF] hover:bg-[#04245A]/40 hover:border-[#00CFFF]/40
                           transition-all duration-150">
            Preuzmite PDF
          </button>
          <button className="px-6 py-3 bg-[#00CFFF]/10 border border-[#00CFFF]/40 rounded-xl
                           text-[#00CFFF] hover:bg-[#00CFFF]/20 hover:border-[#00CFFF]
                           transition-all duration-150">
            Generiši nove detalje
          </button>
        </div>
      </div>
    </div>
  );
}
