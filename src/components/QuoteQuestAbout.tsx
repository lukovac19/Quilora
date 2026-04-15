export function QuoteQuestAbout() {
  return (
    <section id="about" className="relative py-24 bg-[#001F54]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 
            className="text-[#E6F0FF] mb-6"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.02em'
            }}
          >
            O nama
          </h2>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div 
            className="p-8 md:p-12 rounded-xl bg-[#0A0A0A]/40 border border-[#00D1FF]/20"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
          >
            <p className="text-[#E6F0FF]/80 text-lg leading-relaxed mb-6">
              QuoteQuest je AI koji čita i razumije knjige.<br />
              Učitajte PDF, postavite pitanje i pronađite tačne citate, stranice i analizu direktno iz teksta.
            </p>
            <p className="text-[#E6F0FF]/80 text-lg leading-relaxed mb-6">
              Lektire nikada nisu bile jednostavnije.<br />
              Umjesto beskrajnih pretraga i sažetaka, QuoteQuest pronalazi ono što je zaista napisano.<br />
              Pomaže vam da brzo razumijete sadržaj, pronađete ključne dijelove i učite pametnije — bez gubljenja vremena.
            </p>
            <p className="text-[#00D1FF] text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              QuoteQuest ne nagađa — on čita.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}