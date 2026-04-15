import { AICharacterCard } from './AICharacterCard';
import { BookTimeline } from './BookTimeline';
import { MotifScanner } from './MotifScanner';
import { StylisticFiguresDetector } from './StylisticFiguresDetector';
import { SymbolicMeaningBox } from './SymbolicMeaningBox';

const SAMPLE_CHARACTER = {
  name: 'Ana Karenjina',
  role: 'Glavni lik',
  traits: 'Strastvena, inteligentna i hrabra žena koja se bori protiv društvenih konvencija svog vremena. Karakteriše je duboka emotivnost i želja za autentičnim životom.',
  development: 'Kroz priču prolazi transformaciju od poštovane dame visokog društva do žene koja slijedi svoja osjećanja uprkos društvenim posljedicama. Njen razvoj pokazuje unutrašnji sukob između dužnosti i ljubavi.',
  keyQuotes: [
    { text: 'Sretne porodice sve su slične jedna drugoj, svaka nesretna porodica nesretna je na svoj način.', page: 1 },
    { text: 'Mogao bih biti sretan samo ako bi ona bila sretna.', page: 89 },
    { text: 'Život nije san, a ja želim da bude stvaran.', page: 167 }
  ]
};

export function AIFeaturesShowcase() {
  return (
    <section className="relative py-24 bg-[#0A0A0A]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 
            className="text-[#E6F0FF] mb-4"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.02em'
            }}
          >
            AI Features
          </h2>
          <p className="text-[#E6F0FF]/70 max-w-2xl mx-auto">
            Napredne AI komponente za dubinsku analizu književnih djela
          </p>
        </div>

        <div className="space-y-12">
          {/* Book Timeline */}
          <div>
            <h3 className="text-[#E6F0FF]/90 mb-4 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Vremenska linija
            </h3>
            <BookTimeline />
          </div>

          {/* AI Character Card */}
          <div>
            <h3 className="text-[#E6F0FF]/90 mb-4 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              AI kartica lika
            </h3>
            <AICharacterCard character={SAMPLE_CHARACTER} />
          </div>

          {/* Motif Scanner */}
          <div>
            <h3 className="text-[#E6F0FF]/90 mb-4 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Skeniranje motiva
            </h3>
            <MotifScanner />
          </div>

          {/* Stylistic Figures */}
          <div>
            <h3 className="text-[#E6F0FF]/90 mb-4 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Stilske figure
            </h3>
            <StylisticFiguresDetector />
          </div>

          {/* Symbolic Meanings */}
          <div>
            <h3 className="text-[#E6F0FF]/90 mb-4 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Simbolički značaj
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SymbolicMeaningBox symbol="sunce" />
              <SymbolicMeaningBox symbol="ptica" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
