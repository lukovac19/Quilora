import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  questionsAsked: number;
  lastQuestionTime: number | null;
  cooldownUntil: number | null;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatTabProps {
  currentUser: User | null;
  onQuestionAsked: () => void;
}

export function ChatTab({ currentUser, onQuestionAsked }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Dobrodošli u analizu djela "Na Drini ćuprija". Postavljajte pitanja o temama, karakterima, stilskim figurama ili bilo čemu drugom što vas zanima.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(input),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setInput('');
    onQuestionAsked();
  };

  const generateAIResponse = (question: string) => {
    if (question.toLowerCase().includes('tema')) {
      return 'Glavne teme u "Na Drini ćupriji" uključuju prolaznost vremena, sukob civilizacija, i ćupriju kao simbol trajnosti. Most na Drini je centralni simbol koji povezuje ljude različitih vjera i kultura kroz stoljetja.';
    }
    if (question.toLowerCase().includes('karakter')) {
      return 'Najvažniji likovi uključuju Abidagu, Fatu, i razne vizire. Međutim, prava "glavna ličnost" romana je sam most - ćuprija - koja opstaje kroz generacije dok se ljudski likovi mijenjaju.';
    }
    return 'To je odlično pitanje o "Na Drini ćupriji". Ovo remek-djelo Ive Andrića prati historiju Višegrada kroz prizmu mosta koji spaja Istok i Zapad. Mogu vam pružiti detaljniju analizu specifičnih aspekata djela ako imate dodatna pitanja.';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl p-4 ${
                message.type === 'user'
                  ? 'bg-transparent border-2 border-[#00CFFF]/40 text-[#E6F0FF]'
                  : 'bg-[#04245A]/30 text-[#E6F0FF]/90 border border-[#04245A]/50'
              }`}
            >
              {message.type === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#00CFFF]" />
                  <span className="text-xs text-[#00CFFF]/70 uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    AI Asistent
                  </span>
                </div>
              )}
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="mt-2 text-xs text-[#E6F0FF]/40">
                {message.timestamp.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-[#04245A]/30 p-6 bg-[#050A12]/50">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Postavi pitanje o ovom djelu..."
            className="flex-1 bg-[#04245A]/20 border border-[#04245A]/40 rounded-xl px-4 py-3
                     text-[#E6F0FF] placeholder-[#E6F0FF]/30 
                     focus:outline-none focus:border-[#00CFFF]/50 focus:ring-1 focus:ring-[#00CFFF]/30
                     transition-all duration-150"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-3 bg-[#00CFFF] text-[#0A0F18] rounded-xl
                     hover:bg-[#00CFFF]/90 hover:shadow-[0_0_20px_rgba(0,207,255,0.4)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-150 font-semibold"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
