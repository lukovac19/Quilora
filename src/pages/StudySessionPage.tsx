import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { 
  ArrowLeft,
  Upload,
  FileText,
  Send,
  Sparkles,
  Plus,
  Save,
  ChevronRight,
  Brain,
  FileQuestion,
  Network,
  PenTool,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  Eye,
  Lightbulb,
  Quote,
  BookOpen,
  MessageSquare,
  Target,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'quiz' | 'mindmap' | 'essay';
  data?: any;
}

interface MasterySection {
  id: string;
  title: string;
  icon: any;
  type: 'overview' | 'characters' | 'themes' | 'chapters' | 'insights';
  content: string;
  prompts: Array<{ label: string; icon: any }>;
}

interface Highlight {
  id: string;
  text: string;
  page: number;
  color: string;
}

export function StudySessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  
  // State
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [pdfName, setPdfName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);
  const [masteryContent, setMasteryContent] = useState<MasterySection[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPos, setHighlightMenuPos] = useState({ x: 0, y: 0 });
  const [pdfViewerExpanded, setPdfViewerExpanded] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(150);
  
  const maxFreeQuestions = 5;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for session continuation
  useEffect(() => {
    const sessionId = searchParams.get('continue') || searchParams.get('session');
    if (sessionId) {
      // Navigate to the new study session page with session data
      navigate(`/new-study-session?session=${sessionId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Auto-save session state when it changes
  useEffect(() => {
    if (pdfUploaded && pdfName) {
      const sessionId = searchParams.get('continue') || searchParams.get('session') || 'current';
      const sessionData = {
        pdfName,
        messages,
        questionCount,
        highlights,
        lastActive: new Date().toISOString()
      };
      localStorage.setItem(`quilora_session_${sessionId}`, JSON.stringify(sessionData));
    }
  }, [messages, questionCount, highlights, pdfName, pdfUploaded, searchParams]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfName(file.name);
      setIsLoading(true);
      setLoadingProgress(0);

      const statuses = [
        'Analyzing document structure...',
        'Extracting key themes...',
        'Identifying characters...',
        'Processing chapter summaries...',
        'Generating intelligent insights...'
      ];

      let currentStatus = 0;
      const interval = setInterval(() => {
        currentStatus++;
        if (currentStatus < statuses.length) {
          setLoadingStatus(statuses[currentStatus]);
          setLoadingProgress((currentStatus / statuses.length) * 100);
        } else {
          clearInterval(interval);
          setLoadingProgress(100);
          setTimeout(() => {
            setIsLoading(false);
            showToast('Material analyzed successfully', 'success');
            // Navigate to the new study session page
            navigate(`/new-study-session?pdf=${encodeURIComponent(file.name)}`);
          }, 500);
        }
      }, 1000);

      setLoadingStatus(statuses[0]);
    }
  };

  const initializeMastery = (fileName: string) => {
    const sections: MasterySection[] = [
      {
        id: '1',
        title: 'Chapter Overview',
        icon: BookOpen,
        type: 'chapters',
        content: 'This opening chapter establishes the narrative foundation, introducing the protagonist within their initial context. The exposition carefully constructs the setting while planting seeds for the central conflict that will drive the story forward.',
        prompts: [
          { label: 'Explain like I\'m 5', icon: Lightbulb },
          { label: 'Go deeper', icon: Layers },
          { label: 'Give examples', icon: Quote }
        ]
      },
      {
        id: '2',
        title: 'Key Themes',
        icon: Target,
        type: 'themes',
        content: 'Central themes include identity transformation, the search for authentic meaning, and the tension between individual agency and societal structures. These motifs weave throughout the narrative, reflected in symbolic elements and character trajectories.',
        prompts: [
          { label: 'Explain like I\'m 5', icon: Lightbulb },
          { label: 'Thematic connections', icon: Network },
          { label: 'Symbolic elements', icon: Sparkles }
        ]
      },
      {
        id: '3',
        title: 'Character Analysis',
        icon: MessageSquare,
        type: 'characters',
        content: 'The protagonist demonstrates complex psychological depth with clearly defined motivations and internal contradictions. Supporting characters provide narrative contrast, each embodying different philosophical perspectives on the work\'s central questions.',
        prompts: [
          { label: 'Explain like I\'m 5', icon: Lightbulb },
          { label: 'Character relationships', icon: Network },
          { label: 'Development arc', icon: Target }
        ]
      },
      {
        id: '4',
        title: 'Important Insights',
        icon: Eye,
        type: 'insights',
        content: 'The work employs sophisticated literary techniques including foreshadowing, symbolism, and subtle character development. Pay attention to recurring imagery and how the author\'s narrative choices reinforce thematic elements.',
        prompts: [
          { label: 'Explain like I\'m 5', icon: Lightbulb },
          { label: 'Literary devices', icon: Sparkles },
          { label: 'Deeper analysis', icon: Layers }
        ]
      }
    ];

    setMasteryContent(sections);
  };

  const handlePromptClick = (section: MasterySection, prompt: any) => {
    if (questionCount >= maxFreeQuestions) {
      showToast('Free plan limit reached. Upgrade to continue.', 'warning');
      return;
    }

    const aiResponse: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Here's ${prompt.label.toLowerCase()} for "${section.title}": This provides a tailored explanation based on your request. The AI analyzes the specific content and adapts the complexity level to match your chosen perspective, ensuring you grasp both surface-level and deeper meanings.`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiResponse]);
    setQuestionCount(prev => prev + 1);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || questionCount >= maxFreeQuestions) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setQuestionCount(prev => prev + 1);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a comprehensive response to: "${userMessage.content}"\n\nIn a production environment, this connects to your AI backend for deep literary analysis with accurate citations, quote references, and contextual understanding of the work.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFeatureAction = (action: string) => {
    setShowFeatureMenu(false);
    
    if (questionCount >= maxFreeQuestions) {
      showToast('Free plan limit reached. Upgrade to continue.', 'warning');
      return;
    }

    switch (action) {
      case 'eli5':
        generateELI5();
        break;
      case 'quiz':
        generateQuiz();
        break;
      case 'mindmap':
        generateMindMap();
        break;
      case 'essay':
        generateEssay();
        break;
    }
    
    setQuestionCount(prev => prev + 1);
  };

  const generateELI5 = () => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Think of this story like a puzzle where someone is trying to reach a dream that seems far away. It's like when you really want something you can't quite reach - maybe a toy on a high shelf. The story shows us what happens when people chase their dreams and what they learn along the way!",
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, message]);
    showToast('ELI5 explanation generated', 'success');
  };

  const generateQuiz = () => {
    const quiz = {
      questions: [
        { q: 'What is the main setting of the story?', options: ['New York', 'London', 'Paris', 'Chicago'], correct: 0 },
        { q: 'Who is the narrator?', options: ['Gatsby', 'Nick', 'Daisy', 'Tom'], correct: 1 },
        { q: 'What symbolizes hope in the novel?', options: ['The green light', 'The car', 'The mansion', 'The city'], correct: 0 },
        { q: 'What era is the story set in?', options: ['1900s', '1920s', '1940s', '1960s'], correct: 1 },
        { q: 'What is the central theme?', options: ['War', 'The American Dream', 'Family', 'Politics'], correct: 1 },
        { q: 'Where does Gatsby live?', options: ['West Egg', 'East Egg', 'Manhattan', 'Queens'], correct: 0 },
        { q: 'What is Gatsby\'s goal?', options: ['Money', 'Fame', 'Daisy', 'Revenge'], correct: 2 }
      ]
    };

    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Quiz Generated',
      timestamp: new Date(),
      type: 'quiz',
      data: quiz
    };
    setMessages(prev => [...prev, message]);
    showToast('7-question quiz generated', 'success');
  };

  const generateMindMap = () => {
    const mindmap = {
      central: pdfName.replace('.pdf', ''),
      nodes: [
        { id: 1, label: 'Characters', children: ['Protagonist', 'Antagonist', 'Supporting Cast'] },
        { id: 2, label: 'Themes', children: ['Identity', 'Power', 'Transformation', 'Society'] },
        { id: 3, label: 'Symbols', children: ['Light/Dark', 'Journey', 'Objects'] },
        { id: 4, label: 'Setting', children: ['Time Period', 'Location', 'Atmosphere'] }
      ]
    };

    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Mind Map Generated',
      timestamp: new Date(),
      type: 'mindmap',
      data: mindmap
    };
    setMessages(prev => [...prev, message]);
    showToast('Mind map created successfully', 'success');
  };

  const generateEssay = () => {
    const essay = {
      title: 'Central Symbolism Analysis',
      paragraphs: [
        {
          text: 'The central symbol represents the protagonist\'s deepest aspirations and the narrative\'s thematic core.',
          quotes: ['"The symbolic element recurs throughout, gaining layered meaning with each appearance."']
        },
        {
          text: 'This symbol evolves as the narrative progresses, initially representing pure possibility but gradually revealing complex truths.',
          quotes: ['"The author carefully constructs this imagery to resonate with the work\'s philosophical questions."']
        }
      ]
    };

    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Essay Generated',
      timestamp: new Date(),
      type: 'essay',
      data: essay
    };
    setMessages(prev => [...prev, message]);
    showToast('Essay with quotes generated', 'success');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextHighlight = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      setSelectedText(text);
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setHighlightMenuPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setShowHighlightMenu(true);
      }
    }
  };

  const handleHighlightAction = (action: string) => {
    if (questionCount >= maxFreeQuestions) {
      showToast('Free plan limit reached. Upgrade to continue.', 'warning');
      setShowHighlightMenu(false);
      return;
    }

    let promptText = '';
    switch (action) {
      case 'ask':
        promptText = `Tell me about: "${selectedText}"`;
        break;
      case 'explain':
        promptText = `Explain this passage: "${selectedText}"`;
        break;
      case 'summarize':
        promptText = `Summarize: "${selectedText}"`;
        break;
      case 'questions':
        promptText = `Generate questions about: "${selectedText}"`;
        break;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestionCount(prev => prev + 1);
    setShowHighlightMenu(false);
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on your highlighted text, here's a detailed analysis: The selected passage is significant because it reveals key insights about the narrative. This connects to broader themes and demonstrates the author's technique.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      showToast('Analysis generated from highlighted text', 'success');
    }, 1500);

    const newHighlight: Highlight = {
      id: Date.now().toString(),
      text: selectedText,
      page: currentPage,
      color: '#266ba7'
    };
    setHighlights(prev => [...prev, newHighlight]);
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'quiz') {
      return <QuizComponent data={message.data} />;
    }
    if (message.type === 'mindmap') {
      return <MindMapComponent data={message.data} />;
    }
    if (message.type === 'essay') {
      return <EssayComponent data={message.data} />;
    }
    return <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#266ba7]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#3b82c4]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Contextual Header */}
      <header className="border-b border-white/5 bg-[#0a1929]/95 backdrop-blur-xl sticky top-0 z-40 relative">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left: Back + Status */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>

            {pdfUploaded && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">Active Study Session</span>
              </div>
            )}
          </div>

          {/* Center: Book Info */}
          {pdfUploaded && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-[#1a2f45]/60 to-[#0a1929]/60 backdrop-blur-sm border border-white/10">
              <FileText className="w-4 h-4 text-[#266ba7]" />
              <span className="text-sm text-white font-medium max-w-xs truncate">{pdfName}</span>
            </div>
          )}

          {/* Right: PDF Toggle + Counter */}
          <div className="flex items-center gap-3">
            {pdfUploaded && (
              <>
                <button
                  onClick={() => setPdfViewerExpanded(!pdfViewerExpanded)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-[#266ba7] hover:border-[#266ba7] hover:text-white transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Open PDF</span>
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                
                <div className="px-3 py-2 rounded-full bg-white/5 border border-white/10">
                  <span className="text-xs text-white/70">
                    <span className={questionCount >= maxFreeQuestions ? 'text-orange-400' : 'text-[#266ba7] font-semibold'}>{questionCount}</span>
                    <span className="text-white/40">/</span>
                    <span className="text-white/40">{maxFreeQuestions}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="text-center max-w-md w-full animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] shadow-2xl shadow-[#266ba7]/30 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">Analyzing Your Material</h2>
            <p className="text-white/60 mb-8 text-sm">{loadingStatus}</p>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#266ba7] via-[#3b82c4] to-[#266ba7] rounded-full transition-all duration-500 animate-pulse"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/40 mt-3 font-mono">{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      )}

      {/* Upload Screen */}
      {!pdfUploaded && !isLoading && (
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="text-center max-w-2xl animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] shadow-2xl shadow-[#266ba7]/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Upload className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#266ba7]/50 to-[#1e5a8f]/50 blur-xl" />
            </div>
            
            <h1 className="text-4xl font-semibold text-white mb-4">
              Material Mastery Awaits
            </h1>
            <p className="text-lg text-white/60 mb-10 leading-relaxed max-w-xl mx-auto">
              Upload a literary work and experience an intelligent, guided study environment where AI meets deep learning
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="group px-10 py-4 rounded-full bg-[#266ba7] hover:bg-[#3b82c4] text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-[#266ba7]/40 transition-all duration-300 inline-flex items-center gap-3 hover:-translate-y-0.5"
            >
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Upload PDF to Begin
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="block mx-auto mt-6 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              or select from My PDFs
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Fixed-Height Split Panel Layout */}
      {pdfUploaded && !isLoading && (
        <div className="flex-1 flex overflow-hidden relative" style={{ height: 'calc(100vh - 73px)' }}>
          {/* Left: Mastery Panel (70%) - Independently Scrollable */}
          <div className="w-[70%] border-r border-white/5 flex flex-col relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <div className="px-8 py-6 space-y-6">
              {masteryContent.map((section, index) => (
                <div
                  key={section.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Insight Block with Glassmorphism */}
                  <div className="group p-6 rounded-3xl bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl hover:shadow-[#266ba7]/10 hover:border-[#266ba7]/30 transition-all duration-300">
                    {/* Block Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <section.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                    </div>

                    {/* Content */}
                    <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-white/80 leading-relaxed">{section.content}</p>
                    </div>

                    {/* Guided Action Prompts */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/50 mb-3">EXPLORE FURTHER</p>
                      <div className="grid grid-cols-1 gap-2">
                        {section.prompts.map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePromptClick(section, prompt)}
                            disabled={questionCount >= maxFreeQuestions}
                            className="group/btn w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#266ba7]/30 hover:bg-white/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3">
                              <prompt.icon className="w-4 h-4 text-[#266ba7]" />
                              <span className="text-sm text-white/90 font-medium">{prompt.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/40 group-hover/btn:text-[#266ba7] group-hover/btn:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Spacer for smooth scrolling */}
              <div className="h-8" />
            </div>
          </div>

          {/* Right: Intelligence Chat Panel (30%) - Fixed, Always Visible */}
          <div className="w-[30%] flex flex-col bg-[#0a1929] relative z-10 h-full">
            {/* Chat Header */}
            <div className="border-b border-white/5 p-4 bg-gradient-to-r from-[#1a2f45]/50 to-[#0a1929]/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Intelligence Chat</h3>
                  <p className="text-xs text-white/40">AI-powered literary analysis</p>
                </div>
              </div>
            </div>

            {/* Messages - Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[90%] ${message.role === 'user' ? '' : 'w-full'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#266ba7] to-[#1e5a8f] flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs text-white/50 font-medium">Quilora AI</span>
                      </div>
                    )}
                    <div className={`rounded-2xl p-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[#266ba7] to-[#3b82c4] text-white border border-[#266ba7]/20'
                        : 'bg-gradient-to-br from-[#1a2f45]/60 to-[#0a1929]/60 backdrop-blur-sm border border-white/10 text-white/90'
                    }`}>
                      {renderMessage(message)}
                    </div>
                    {message.role === 'assistant' && (
                      <button className="mt-2 flex items-center gap-2 text-xs text-white/40 hover:text-[#266ba7] transition-colors">
                        <Save className="w-3 h-3" />
                        Save Response
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-[#1a2f45]/60 to-[#0a1929]/60 border border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#266ba7] animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-[#266ba7] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#266ba7] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Free Plan Warning */}
            {questionCount >= maxFreeQuestions && (
              <div className="px-4 pb-3 flex-shrink-0">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-400 text-sm font-bold">!</span>
                    </div>
                    <div>
                      <p className="text-sm text-white/90 font-medium mb-1">Free plan limit reached</p>
                      <p className="text-xs text-white/60 mb-3">Upgrade to continue your learning journey</p>
                      <button 
                        onClick={() => navigate('/pricing')}
                        className="text-xs text-[#266ba7] font-semibold hover:underline"
                      >
                        Upgrade to Pro →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area - Sticky at Bottom */}
            <div className="border-t border-white/5 p-4 bg-[#0a1929]/95 backdrop-blur-sm flex-shrink-0">
              <div className="relative">
                <div className="flex items-end gap-2">
                  {/* Feature Menu Trigger */}
                  <button
                    onClick={() => setShowFeatureMenu(!showFeatureMenu)}
                    disabled={questionCount >= maxFreeQuestions}
                    className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 hover:from-[#266ba7]/20 hover:to-[#266ba7]/10 border border-white/10 hover:border-[#266ba7]/30 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Plus className={`w-5 h-5 text-white/60 group-hover:text-[#266ba7] transition-all ${showFeatureMenu ? 'rotate-45' : ''}`} />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything..."
                    disabled={questionCount >= maxFreeQuestions}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#266ba7]/50 focus:ring-2 focus:ring-[#266ba7]/20 transition-all disabled:opacity-50"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || questionCount >= maxFreeQuestions}
                    className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all group ${
                      inputMessage.trim() && questionCount < maxFreeQuestions
                        ? 'bg-gradient-to-br from-[#266ba7] to-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30 text-white'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Send className={`w-4 h-4 ${inputMessage.trim() && questionCount < maxFreeQuestions ? 'group-hover:translate-x-0.5' : ''} transition-transform`} />
                  </button>
                </div>

                {/* Feature Menu */}
                {showFeatureMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full p-2 rounded-2xl bg-[#1a2f45]/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in">
                    <button
                      onClick={() => handleFeatureAction('eli5')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#266ba7]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Brain className="w-4 h-4 text-[#266ba7]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Explain like I'm 5</div>
                        <div className="text-xs text-white/50">Simplified explanation</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFeatureAction('quiz')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#266ba7]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileQuestion className="w-4 h-4 text-[#266ba7]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Generate Quiz</div>
                        <div className="text-xs text-white/50">7 questions</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFeatureAction('mindmap')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#266ba7]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Network className="w-4 h-4 text-[#266ba7]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Create Mind Map</div>
                        <div className="text-xs text-white/50">Visual connections</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFeatureAction('essay')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#266ba7]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PenTool className="w-4 h-4 text-[#266ba7]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Generate Essay</div>
                        <div className="text-xs text-white/50">With quotes</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen PDF Viewer Overlay */}
      {pdfViewerExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-[85%] h-[90%] bg-[#0a1929] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
            {/* PDF Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#1a2f45]/80 to-[#0a1929]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#266ba7]" />
                <h3 className="text-sm font-semibold text-white">{pdfName}</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPdfZoom(Math.max(0.5, pdfZoom - 0.25))}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-white/70 w-16 text-center">{Math.round(pdfZoom * 100)}%</span>
                  <button
                    onClick={() => setPdfZoom(Math.min(2, pdfZoom + 0.25))}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <button
                  onClick={() => setPdfViewerExpanded(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span className="text-sm">Close</span>
                </button>
              </div>
            </div>

            {/* PDF Content Area */}
            <div className="flex-1 overflow-y-auto p-12 bg-gradient-to-b from-[#1a2f45]/20 to-transparent scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="max-w-4xl mx-auto">
                <div
                  className="bg-white rounded-2xl p-12 shadow-2xl transition-transform origin-top"
                  style={{ transform: `scale(${pdfZoom})` }}
                  onMouseUp={handleTextHighlight}
                >
                  {/* Mock PDF Content */}
                  <div className="space-y-6 text-gray-900 select-text">
                    <h2 className="text-3xl font-bold mb-8">Chapter {currentPage}</h2>
                    <p className="leading-relaxed text-lg">
                      The protagonist stood at the crossroads, contemplating the path ahead. Years of searching had led to this moment, where past and future converged in the present uncertainty.
                    </p>
                    <p className="leading-relaxed text-lg">
                      "We are all architects of our own destiny," the mentor had said, words that now echoed with newfound significance. The journey had transformed more than just circumstances - it had reshaped identity itself.
                    </p>
                    <p className="leading-relaxed text-lg">
                      In the distance, the city lights flickered like stars fallen to earth, each representing a dream, a hope, a possibility. The symbolic resonance was unmistakable - light against darkness, aspiration against limitation.
                    </p>
                    <p className="leading-relaxed text-lg">
                      This pivotal moment encapsulated the work's central themes: the tension between individual agency and societal forces, the transformative power of choice, and the eternal human quest for meaning.
                    </p>
                    <p className="leading-relaxed text-lg">
                      The character's evolution throughout this section demonstrates the author's mastery of psychological realism. Each decision, each moment of doubt, contributes to a portrait of authentic human experience.
                    </p>
                    <p className="leading-relaxed text-lg">
                      Through careful use of metaphor and symbolism, the narrative weaves together multiple thematic strands into a cohesive whole. The recurring motif of journey serves both literal and figurative purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Navigation */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-gradient-to-r from-[#1a2f45]/80 to-[#0a1929]/80 backdrop-blur-sm">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Previous</span>
              </button>
              <span className="text-sm text-white/70">
                Page <span className="text-white font-semibold">{currentPage}</span> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="text-sm">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Highlight Action Menu */}
      {showHighlightMenu && (
        <div
          className="fixed z-[60] animate-scale-in"
          style={{
            top: `${highlightMenuPos.y}px`,
            left: `${highlightMenuPos.x}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="mb-2 p-2 rounded-2xl bg-[#1a2f45]/95 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-1">
            <button
              onClick={() => handleHighlightAction('ask')}
              className="px-3 py-2 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-all whitespace-nowrap"
            >
              Ask about this
            </button>
            <button
              onClick={() => handleHighlightAction('explain')}
              className="px-3 py-2 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-all whitespace-nowrap"
            >
              Explain
            </button>
            <button
              onClick={() => handleHighlightAction('summarize')}
              className="px-3 py-2 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-all whitespace-nowrap"
            >
              Summarize
            </button>
            <button
              onClick={() => handleHighlightAction('questions')}
              className="px-3 py-2 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-all whitespace-nowrap"
            >
              Generate questions
            </button>
            <button
              onClick={() => setShowHighlightMenu(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Quiz Component - Responsive Grid Layout
function QuizComponent({ data }: { data: any }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (qIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const score = answers.filter((ans, idx) => ans === data.questions[idx].correct).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-white">Knowledge Check: 7 Questions</h4>
        {showResults && (
          <div className="px-3 py-1.5 rounded-full bg-[#266ba7]/20 text-[#266ba7] text-xs font-semibold">
            Score: {score}/{data.questions.length}
          </div>
        )}
      </div>
      
      {/* Two-column grid layout */}
      <div className="grid grid-cols-1 gap-3">
        {data.questions.map((q: any, qIdx: number) => (
          <div key={qIdx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
            <p className="text-sm text-white/90 mb-3 font-medium">{qIdx + 1}. {q.q}</p>
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt: string, oIdx: number) => (
                <button
                  key={oIdx}
                  onClick={() => handleAnswer(qIdx, oIdx)}
                  className={`text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    answers[qIdx] === oIdx
                      ? showResults
                        ? oIdx === q.correct
                          ? 'bg-emerald-500/20 border border-emerald-500/30 text-white'
                          : 'bg-red-500/20 border border-red-500/30 text-white'
                        : 'bg-[#266ba7]/20 border border-[#266ba7]/30 text-white'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {showResults && oIdx === q.correct && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                    {showResults && answers[qIdx] === oIdx && oIdx !== q.correct && <X className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    <span className="line-clamp-2">{opt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => setShowResults(!showResults)}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#266ba7] to-[#3b82c4] hover:shadow-lg hover:shadow-[#266ba7]/30 text-white text-sm font-semibold transition-all"
      >
        {showResults ? `Review Answers (${score}/${data.questions.length})` : 'Check Answers'}
      </button>
    </div>
  );
}

// Mind Map Component - Grid Layout
function MindMapComponent({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white mb-4 text-center">{data.central}</h4>
      <div className="grid grid-cols-2 gap-3">
        {data.nodes.map((node: any) => (
          <div key={node.id} className="p-4 rounded-xl bg-gradient-to-br from-[#266ba7]/20 to-[#266ba7]/10 border border-[#266ba7]/30 hover:border-[#266ba7]/50 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-sm font-semibold text-white mb-3">{node.label}</div>
            <div className="space-y-1.5">
              {node.children.map((child: string, idx: number) => (
                <div key={idx} className="text-xs text-white/70 pl-3 py-1 border-l-2 border-[#266ba7]/30 hover:border-[#266ba7] transition-all">
                  {child}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Essay Component
function EssayComponent({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-white mb-4">{data.title}</h4>
      {data.paragraphs.map((para: any, idx: number) => (
        <div key={idx} className="space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">{para.text}</p>
          {para.quotes.map((quote: string, qIdx: number) => (
            <div key={qIdx} className="pl-4 border-l-2 border-[#266ba7]/30 py-2 bg-[#266ba7]/5 rounded-r-lg">
              <p className="text-xs text-[#266ba7] italic">{quote}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}