import { Upload, Send, Bookmark, BookmarkCheck, FileText, MessageSquare, Quote as QuoteIcon, Loader2, ChevronDown, ChevronUp, RotateCcw, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

interface Quote {
  id: string;
  text: string;
  page: number;
  isBookmarked: boolean;
  expandedContext?: boolean;
}

interface QuoteQuestHeroProps {
  onQuoteSaved: () => void;
  currentUser: any | null;
  onQuestionAsked: () => void;
  onNeedAuth: () => void;
}

const SAMPLE_QUOTES = [
  { text: 'Ljubav je vječna snaga koja povezuje sve žive stvari u univerzumu.', page: 42 },
  { text: 'U tišini noći, može se čuti šapat slobode koja teče kroz naše vene.', page: 87 },
  { text: 'Svjetlost uvijek pronalazi put kroz najmanje pukotine tame.', page: 124 },
  { text: 'Ptice koje odlete nikada ne zaborave gdje im je dom, jer je dom uvijek u srcu.', page: 156 },
  { text: 'Smrt nije kraj, već početak novog razumijevanja postojanja.', page: 203 },
  { text: 'Sunce izlazi svaki dan, noseći nadu u svojim zracima.', page: 78 },
  { text: 'Nora je bila žena snažnog duha i nepokolebljive volje.', page: 34 },
  { text: 'Kuća je stajala na vrhu brda, okružena visokim borovama.', page: 12 }
];

const SAMPLE_CONTEXT = 'Bilo je rano jutro kada je sunce izašlo iznad brda. Ptice su pjevale u daljini, a vjetar je tiho šuštao kroz lišće. [Glavni citat se nalazi ovdje u kontekstu.] Scena je odisala mirom i spokojem koji su obilježili taj trenutak u priči.';

const PLACEHOLDER_EXAMPLES = [
  'Na kojim stranicama se spominje motiv sunca?',
  'Kako je opisana Ana Karenjina u prvom poglavlju?',
  'Koji su ključni citati o slobodi?',
  'Šta je simbol ptice u knjizi?'
];

const SMART_SUGGESTIONS = [
  'Motivi',
  'Karakterizacija likova',
  'Ključni citati',
  'Tema i ideja djela',
  'Simbolika',
  'Odnosi među likovima',
  'Važni događaji'
];

const FOLLOW_UP_QUESTIONS = [
  'U kojim se dijelovima knjige ponavlja isti motiv?',
  'Kako se ovaj opis povezuje s glavnom idejom djela?',
  'Kako je drugi lik doživio isti događaj?'
];

export function QuoteQuestHero({ onQuoteSaved, currentUser, onQuestionAsked, onNeedAuth }: QuoteQuestHeroProps) {
  const [fileName, setFileName] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [results, setResults] = useState<Quote[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Rotate placeholders every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      toast.success('PDF učitan uspješno!');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      toast.success('PDF učitan uspješno!');
    }
  };

  const detectQueryType = (query: string): 'count' | 'motif' | 'character' | 'description' | 'general' => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('koliko') && (lowerQuery.includes('puta') || lowerQuery.includes('se'))) {
      return 'count';
    }
    if (lowerQuery.includes('motiv')) {
      return 'motif';
    }
    if (lowerQuery.includes('karakterizacija') || lowerQuery.includes('lik')) {
      return 'character';
    }
    if (lowerQuery.includes('opis')) {
      return 'description';
    }
    return 'general';
  };

  const handleSubmit = () => {
    if (!currentUser) {
      toast.error('Molimo prijavite se da biste postavili pitanje.');
      onNeedAuth();
      return;
    }

    if (!fileName) {
      toast.error('Molimo prvo učitajte PDF.');
      return;
    }
    
    if (!question) {
      toast.error('Molimo unesite pitanje.');
      return;
    }

    // Call the callback to track question asked
    onQuestionAsked();
    
    setIsAnalyzing(true);
    setShowSuggestions(false);
    
    // Simulate AI processing
    setTimeout(() => {
      const queryType = detectQueryType(question);
      
      if (queryType === 'count') {
        const match = question.match(/["'](.+?)["']|(\w+)/);
        const word = match ? (match[1] || match[2]) : 'riječ';
        const count = 12 + Math.floor(Math.random() * 30);
        
        const countResult: Quote = {
          id: `count-${Date.now()}`,
          text: `Riječ "${word}" pojavljuje se ${count} puta u knjizi.`,
          page: 0,
          isBookmarked: false
        };
        
        const relevantQuotes = SAMPLE_QUOTES
          .filter(() => Math.random() > 0.4)
          .slice(0, 3 + Math.floor(Math.random() * 3))
          .map((quote, index) => ({
            id: `quote-${Date.now()}-${index}`,
            text: quote.text,
            page: quote.page + Math.floor(Math.random() * 20),
            isBookmarked: false
          }));
        
        setResults([countResult, ...relevantQuotes]);
      } else {
        const relevantQuotes = SAMPLE_QUOTES
          .filter(quote => {
            if (queryType === 'motif') {
              return Math.random() > 0.4;
            }
            if (queryType === 'character') {
              return quote.text.includes('Nora') || Math.random() > 0.5;
            }
            return Math.random() > 0.3;
          })
          .slice(0, 3 + Math.floor(Math.random() * 3))
          .map((quote, index) => ({
            id: `quote-${Date.now()}-${index}`,
            text: quote.text,
            page: quote.page + Math.floor(Math.random() * 20),
            isBookmarked: false
          }));
        
        setResults(relevantQuotes);
      }
      
      setIsAnalyzing(false);
      toast.success('Analiza završena!');
    }, 1500);
  };

  const toggleBookmark = (quoteId: string) => {
    setResults(prev => prev.map(quote => {
      if (quote.id === quoteId) {
        const newBookmarkState = !quote.isBookmarked;
        
        if (newBookmarkState) {
          const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes') || '[]');
          savedQuotes.push({
            id: quoteId,
            text: quote.text,
            page: quote.page,
            dateSaved: new Date().toLocaleDateString('bs-BA', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            })
          });
          localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));
          toast.success('Citat sačuvan!');
          onQuoteSaved();
        } else {
          const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes') || '[]');
          const filtered = savedQuotes.filter((q: any) => q.id !== quoteId);
          localStorage.setItem('savedQuotes', JSON.stringify(filtered));
          toast.info('Citat uklonjen iz sačuvanih');
          onQuoteSaved();
        }
        
        return { ...quote, isBookmarked: newBookmarkState };
      }
      return quote;
    }));
  };

  const toggleContext = (quoteId: string) => {
    setResults(prev => prev.map(quote => 
      quote.id === quoteId 
        ? { ...quote, expandedContext: !quote.expandedContext }
        : quote
    ));
  };

  const resetAnalysis = () => {
    setResults([]);
    setQuestion('');
    setFileName('');
    toast.info('Analiza resetovana');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(`Prikaži ${suggestion.toLowerCase()}`);
    setShowSuggestions(false);
  };

  const handleFollowUpClick = (followUp: string) => {
    setQuestion(followUp);
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center bg-[#0A0A0A] pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-[#001F54]/20 via-transparent to-transparent" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-12 py-20 w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 
            className="text-[#E6F0FF] mb-6"
            style={{ 
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}
          >
            Analizirajte knjige uz AI
          </h1>
          <p className="text-[#E6F0FF]/70 text-lg md:text-xl max-w-3xl mx-auto">
            Učitajte PDF, postavite pitanje i dobijte precizne citate i stranice
          </p>
        </div>

        {/* Main interaction area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left side - Upload and Search */}
          <div className="space-y-6">
            {/* PDF Upload */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[#E6F0FF]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  1. Učitaj PDF
                </label>
                {fileName && (
                  <button
                    onClick={resetAnalysis}
                    className="text-[#E6F0FF]/50 hover:text-[#00D1FF] transition-all text-sm flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#001F54]/40 border-2 border-dashed transition-all cursor-pointer min-h-[120px] ${
                    isDragOver 
                      ? 'border-[#00D1FF] bg-[#001F54]/70 shadow-[0_0_20px_rgba(0,209,255,0.3)]' 
                      : 'border-[#00D1FF]/30 hover:border-[#00D1FF]/60 hover:bg-[#001F54]/60'
                  }`}
                  style={{ boxShadow: isDragOver ? '0 0 20px rgba(0,209,255,0.3)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
                >
                  <Upload className={`w-8 h-8 transition-all ${isDragOver ? 'text-[#00D1FF] scale-110' : 'text-[#00D1FF]'}`} />
                  <div className="text-center">
                    {fileName ? (
                      <div>
                        <p className="text-[#E6F0FF] mb-1">{fileName}</p>
                        <p className="text-[#00D1FF] text-sm">✓ Učitano</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[#E6F0FF]">Klikni ili prevuci PDF</p>
                        <p className="text-[#E6F0FF]/50 text-sm">Maksimalno 10MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Question Input */}
            <div>
              <label className="block text-[#E6F0FF] mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                2. Postavi pitanje
              </label>
              <div className="relative">
                <Textarea
                  placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="min-h-[150px] bg-[#001F54]/40 border-[#00D1FF]/30 text-[#E6F0FF] placeholder:text-[#E6F0FF]/40 focus:border-[#00D1FF] resize-none transition-all"
                  style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
                />
                
                {/* Smart Suggestions */}
                {showSuggestions && question.length === 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[#E6F0FF]/50 text-sm">Prijedlozi:</p>
                    <div className="flex flex-wrap gap-2">
                      {SMART_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1 rounded-full bg-[#001F54]/60 border border-[#00D1FF]/30 text-[#E6F0FF]/80 text-sm hover:border-[#00D1FF] hover:bg-[#001F54]/80 hover:shadow-[0_0_10px_rgba(0,209,255,0.2)] transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#0FB2FF] hover:from-[#00D1FF]/90 hover:to-[#0FB2FF]/90 text-[#0A0A0A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              <Send className="w-5 h-5 mr-2" />
              {isAnalyzing ? 'Analizira se...' : 'Počni'}
            </Button>
          </div>

          {/* Right side - Results */}
          <div>
            <label className="block text-[#E6F0FF] mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              3. Rezultati
            </label>
            <div 
              className="p-6 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 min-h-[380px] max-h-[600px] overflow-y-auto custom-scrollbar"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <Loader2 className="w-12 h-12 text-[#00D1FF] animate-spin" />
                  <p className="text-[#E6F0FF]/60">AI analizira tekst...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-6">
                  {results.map((quote, index) => (
                    <div
                      key={quote.id}
                      className="relative space-y-3"
                      style={{
                        animation: `fadeIn 0.5s ease-in ${index * 0.1}s both`
                      }}
                    >
                      <div className="p-4 rounded-xl bg-[#0A0A0A]/50 border border-[#00D1FF]/20 hover:border-[#00D1FF]/40 transition-all group">
                        {quote.page > 0 && (
                          <button
                            onClick={() => toggleBookmark(quote.id)}
                            className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-300 ${
                              quote.isBookmarked 
                                ? 'text-[#00D1FF] bg-[#00D1FF]/10' 
                                : 'text-[#E6F0FF]/40 hover:text-[#00D1FF] hover:bg-[#00D1FF]/10'
                            }`}
                            style={{
                              animation: quote.isBookmarked ? 'pulse 0.5s ease-in-out' : 'none'
                            }}
                          >
                            {quote.isBookmarked ? (
                              <BookmarkCheck className="w-5 h-5" />
                            ) : (
                              <Bookmark className="w-5 h-5" />
                            )}
                          </button>
                        )}

                        <div className={quote.page > 0 ? 'pr-10' : ''}>
                          <p 
                            className="text-[#E6F0FF]/80 leading-relaxed mb-3"
                            style={{
                              textShadow: quote.page > 0 ? '0 0 10px rgba(0,209,255,0.1)' : 'none'
                            }}
                          >
                            {quote.page > 0 ? `"${quote.text}"` : quote.text}
                          </p>
                          {quote.page > 0 && (
                            <>
                              <div className="flex items-center gap-2 text-sm mb-3">
                                <span className="px-2 py-1 rounded bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/30">
                                  Stranica {quote.page}
                                </span>
                              </div>
                              
                              {/* Toggle wider context */}
                              <button
                                onClick={() => toggleContext(quote.id)}
                                className="flex items-center gap-2 text-[#E6F0FF]/50 hover:text-[#00D1FF] transition-all text-sm"
                              >
                                {quote.expandedContext ? (
                                  <>
                                    <Minus className="w-4 h-4" />
                                    Sakrij širi kontekst
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    Prikaži širi kontekst
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Context */}
                      {quote.expandedContext && quote.page > 0 && (
                        <div 
                          className="p-4 rounded-xl bg-[#001F54]/20 border border-[#00D1FF]/10"
                          style={{
                            animation: 'fadeIn 0.3s ease-in'
                          }}
                        >
                          <p className="text-[#E6F0FF]/60 text-sm leading-relaxed">
                            {SAMPLE_CONTEXT}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Follow-up Questions */}
                  {results.length > 0 && (
                    <div className="pt-4 border-t border-[#00D1FF]/10">
                      <p className="text-[#E6F0FF]/70 text-sm mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        Predložena pitanja:
                      </p>
                      <div className="space-y-2">
                        {FOLLOW_UP_QUESTIONS.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleFollowUpClick(question)}
                            className="w-full text-left px-4 py-2 rounded-lg bg-[#001F54]/30 border border-[#00D1FF]/20 text-[#E6F0FF]/70 text-sm hover:border-[#00D1FF]/50 hover:bg-[#001F54]/50 hover:text-[#E6F0FF] transition-all"
                          >
                            → {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#E6F0FF]/40 text-center">
                  <p>Učitajte PDF i postavite pitanje da vidite rezultate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}