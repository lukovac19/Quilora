import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'What is Quilora and how does it work?',
    answer: 'Quilora is an AI-powered material mastery platform designed specifically for literature analysis. Upload any PDF book, and our AI provides structured insights including chapter summaries, character analysis, themes, and guided learning prompts. Unlike chatbots, Quilora offers a proactive learning experience with intelligent question generation and deep literary understanding.'
  },
  {
    question: 'How is Quilora different from ChatGPT or other AI chatbots?',
    answer: 'Quilora is purpose-built for literary material mastery, not general conversation. We offer a dual-interface with 70% dedicated to structured, guided insights (chapters, themes, characters) and 30% for flexible Q&A. You get features like quiz generation, mind maps, essay outlines with quotes, and persistent study session history—all tailored for deep book comprehension.'
  },
  {
    question: 'What formats do you support?',
    answer: 'Currently, we support PDF uploads for books and literary materials. We focus exclusively on literature—we don\'t do Maths & Sciences. Literature FTW!'
  },
  {
    question: 'What are the limitations of the Free plan?',
    answer: 'The Free plan allows 5 questions per study session with a 4-hour cooldown between sessions. You get access to basic AI analysis, quote extraction, and chapter summaries. Upgrade to Standard or Pro for unlimited questions, advanced features like quiz generation, mind maps, and essay support.'
  },
  {
    question: 'Can I save my insights and export them?',
    answer: 'Yes! All insights, quotes, quiz results, and mind maps can be saved to your "Saved Insights" library. Pro plan users can export their study sessions and insights to PDF format for offline access.'
  },
  {
    question: 'Is Quilora multilingual?',
    answer: 'Yes, Quilora supports English, Bosnian, and Spanish interfaces. You can switch languages in Settings. Our AI can analyze books in multiple languages and provide insights in your preferred language.'
  },
  {
    question: 'How accurate is the AI analysis?',
    answer: 'Quilora uses advanced AI models fine-tuned specifically for literary analysis. All insights include source references and page numbers where applicable. While highly accurate, we recommend using Quilora as a study companion alongside your own critical thinking and course materials.'
  },
  {
    question: 'Can I use Quilora for academic essays?',
    answer: 'Absolutely! Quilora provides structured essay outlines with relevant quotes and thematic analysis to support your writing. However, all content should be used as a learning aid and referenced appropriately in academic work. We encourage original thought and proper citation practices.'
  }
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqData.map((item, index) => (
        <div
          key={index}
          className="rounded-2xl bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-sm border border-white/10 overflow-hidden transition-all duration-300 hover:border-[#266ba7]/30"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex items-center justify-between p-6 text-left transition-all"
          >
            <h3 className="text-lg font-semibold text-white pr-4">
              {item.question}
            </h3>
            <ChevronDown
              className={`w-5 h-5 text-[#266ba7] flex-shrink-0 transition-transform duration-300 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === index ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="px-6 pb-6 text-white/70 leading-relaxed">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
