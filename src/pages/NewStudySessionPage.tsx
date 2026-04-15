import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { 
  ArrowLeft, 
  Send, 
  Sparkles,
  BookOpen,
  Target,
  Users,
  MapPin,
  Network,
  PenTool,
  FileQuestion,
  User,
  Search,
  Menu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function NewStudySessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useApp();
  const { showToast } = useToast();
  
  const pdfName = searchParams.get('pdf') || 'Crime and Punishment';
  const sessionId = '1';
  const bookTitle = pdfName.replace('.pdf', '');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(2);
  const totalChapters = 12;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Show initial greeting
    const greeting: Message = {
      id: '1',
      role: 'assistant',
      content: `Hello! You opened ${bookTitle}. Where shall we begin? 👇`,
      timestamp: new Date()
    };
    setMessages([greeting]);
  }, [bookTitle]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setTooltipPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setShowTooltip(true);
      }
    } else {
      setShowTooltip(false);
    }
  };

  const handleTooltipAction = (action: string) => {
    let promptText = '';
    switch (action) {
      case 'explain':
        promptText = `Explain this passage: "${selectedText}"`;
        break;
      case 'summarize':
        promptText = `Summarize: "${selectedText}"`;
        break;
      case 'essay':
        promptText = `Help me write about: "${selectedText}"`;
        break;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowTooltip(false);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This passage reveals key insights about the narrative. The selected text demonstrates the author's technique and connects to broader themes in the work.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleExploreChapter = (topic: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Tell me about ${topic}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Here's a comprehensive analysis of ${topic} in this chapter: The narrative explores deep psychological themes and character development that are central to understanding the work's broader message.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleGenerate = (type: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Generate ${type}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've created a ${type} for this chapter. This provides a structured overview of key concepts, themes, and character relationships.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      showToast(`${type} generated successfully`, 'success');
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is an AI-powered analysis response. In production, this connects to your backend for deep literary analysis with accurate citations and contextual understanding.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ 
        backgroundColor: '#0a1929',
        fontFamily: 'Ramabhadra, sans-serif'
      }}
    >
      {/* Top Header Bar */}
      <header className="flex-shrink-0 h-16 border-b border-white/5 bg-[#0a1929]/95 backdrop-blur-xl flex items-center px-6 gap-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Session Identifier Pill - Centered */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#1a2f45]/60 to-[#0a1929]/60 backdrop-blur-sm border border-white/10">
            <BookOpen className="w-4 h-4 text-[#266ba7]" />
            <span className="text-sm text-white/90">
              <span className="text-white/50">Session-{sessionId}</span>
              <span className="text-white/30 mx-2">·</span>
              <span className="font-medium">{bookTitle}</span>
            </span>
          </div>
        </div>

        {/* Right Side: Chapter Progress + Avatar */}
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-white/70">
              <span className="text-[#266ba7] font-semibold">{currentChapter}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/40">{totalChapters}</span>
              <span className="text-white/50 ml-1">chapters</span>
            </span>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#266ba7] to-[#3b82c4] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </header>

      {/* Main Content: Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: PDF Reader */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0f1e2e] to-[#0a1929] relative">
          {/* PDF Controls Bar */}
          <div className="flex-shrink-0 h-12 border-b border-white/5 flex items-center px-6 gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-white/50">
              {showSidebar ? 'Contents' : 'Toggle Contents'}
            </div>
          </div>

          {/* PDF Content Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-12 py-8">
            <div 
              ref={pdfContentRef}
              className="max-w-3xl mx-auto"
              onMouseUp={handleTextSelection}
            >
              {/* Chapter Heading */}
              <h1 className="text-3xl font-bold text-white/95 mb-8" style={{ fontFamily: 'Ramabhadra, sans-serif' }}>
                Chapter {currentChapter}
              </h1>

              {/* Chapter Content */}
              <div className="space-y-6 text-white/85 leading-relaxed" style={{ fontSize: '14px', fontFamily: 'Ramabhadra, sans-serif' }}>
                <p>
                  The protagonist stood at the crossroads, contemplating the path ahead. Years of searching had led to this moment, where past and future converged in the present uncertainty. The weight of decisions made and unmade pressed heavily upon consciousness, each thought a thread in the complex tapestry of existence.
                </p>
                <p>
                  "We are all architects of our own destiny," the mentor had said, words that now echoed with newfound significance. The journey had transformed more than just circumstances—it had reshaped identity itself, revealing layers of self previously unknown and unexplored.
                </p>
                <p>
                  In the distance, the city lights flickered like stars fallen to earth, each representing a dream, a hope, a possibility. The symbolic resonance was unmistakable—light against darkness, aspiration against limitation, the eternal struggle between what is and what could be.
                </p>
                <p>
                  This pivotal moment encapsulated the work's central themes: the tension between individual agency and societal forces, the transformative power of choice, and the eternal human quest for meaning in a world that often seems indifferent to our deepest desires.
                </p>
                <p>
                  The character's evolution throughout this section demonstrates the author's mastery of psychological realism. Each decision, each moment of doubt, contributes to a portrait of authentic human experience—raw, unfiltered, and profoundly relatable.
                </p>
                <p>
                  Through careful use of metaphor and symbolism, the narrative weaves together multiple thematic strands into a cohesive whole. The recurring motif of journey serves both literal and figurative purposes, inviting readers to reflect on their own paths through life.
                </p>
                <p>
                  As the scene unfolds, we witness the culmination of character development that has been building throughout the preceding chapters. The internal conflict reaches its zenith, forcing a confrontation with truths long avoided and realities long denied.
                </p>
                <p>
                  The setting itself becomes a character—dynamic, responsive, reflecting the protagonist's inner turmoil through atmospheric details and environmental cues. Weather, architecture, and landscape all conspire to create a mood that enhances the psychological depth of the narrative.
                </p>
              </div>
            </div>
          </div>

          {/* Text Selection Tooltip */}
          {showTooltip && (
            <div
              className="fixed z-50 animate-scale-in"
              style={{
                top: `${tooltipPosition.y}px`,
                left: `${tooltipPosition.x}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <div className="mb-2 flex items-center gap-1 p-1.5 rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600/90 backdrop-blur-xl border border-amber-400/30 shadow-2xl">
                <button
                  onClick={() => handleTooltipAction('explain')}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all whitespace-nowrap"
                >
                  Explain
                </button>
                <button
                  onClick={() => handleTooltipAction('summarize')}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all whitespace-nowrap"
                >
                  Summarize
                </button>
                <button
                  onClick={() => handleTooltipAction('essay')}
                  className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-all whitespace-nowrap"
                >
                  + Essay
                </button>
              </div>
            </div>
          )}

          {/* Sidebar */}
          {showSidebar && (
            <div className="absolute top-0 left-0 bottom-0 w-64 bg-[#0a1929]/95 backdrop-blur-xl border-r border-white/10 animate-slide-in-left">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-4 h-4 text-[#266ba7]" />
                  <h3 className="text-sm font-semibold text-white">Contents</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#266ba7]/50"
                  />
                </div>
              </div>
              <div className="p-4 space-y-1">
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map((chapter) => (
                  <button
                    key={chapter}
                    onClick={() => setCurrentChapter(chapter)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      chapter === currentChapter
                        ? 'bg-[#266ba7]/20 text-white border border-[#266ba7]/30'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Chapter {chapter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: AI Chat - Fixed Width 300px */}
        <div className="w-[300px] flex-shrink-0 bg-[#0a1929] border-l border-white/10 flex flex-col">
          {/* Chat Header */}
          <div className="flex-shrink-0 p-4 border-b border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#266ba7]" />
              <h3 className="text-sm font-semibold text-white">Intelligence Chat</h3>
            </div>
            <p className="text-xs text-white/40">AI analysis</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-[#266ba7] to-[#3b82c4] text-white'
                    : 'bg-gradient-to-br from-[#1a2f45]/60 to-[#0a1929]/60 border border-white/10 text-white/90'
                }`}>
                  <p className="text-xs leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {/* Explore Chapter Section */}
            {messages.length === 1 && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wide">Explore Chapter</div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Chapter Overview', icon: BookOpen },
                    { label: 'Key Themes', icon: Target },
                    { label: 'Characters & Motivations', icon: Users },
                    { label: 'Symbolism of Place', icon: MapPin }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExploreChapter(item.label)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#266ba7]/30 hover:bg-white/10 transition-all text-left group"
                    >
                      <item.icon className="w-3.5 h-3.5 text-[#266ba7] flex-shrink-0" />
                      <span className="text-xs text-white/90">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Generate Section */}
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wide pt-2">Generate</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Mind Map', icon: Network },
                    { label: 'Essay', icon: PenTool },
                    { label: 'Quiz', icon: FileQuestion }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGenerate(item.label)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#266ba7]/30 hover:bg-white/10 transition-all ${
                        idx === 2 ? 'col-span-2' : ''
                      }`}
                    >
                      <item.icon className="w-4 h-4 text-[#266ba7] mb-1" />
                      <span className="text-xs text-white/90">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Hint */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400/90 leading-relaxed">
                    💡 Highlight text in the PDF for quick actions
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input - Fixed at Bottom */}
          <div className="flex-shrink-0 p-4 border-t border-white/5">
            <div className="flex items-end gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#266ba7]/50 focus:ring-1 focus:ring-[#266ba7]/20 transition-all"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`p-2 rounded-lg transition-all ${
                  inputMessage.trim()
                    ? 'bg-gradient-to-br from-[#266ba7] to-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
