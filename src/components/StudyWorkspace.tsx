import { useState } from 'react';
import { BookSidebar } from './BookSidebar';
import { WorkspaceTabs } from './WorkspaceTabs';
import { AIGuidancePanel } from './AIGuidancePanel';

interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  questionsAsked: number;
  lastQuestionTime: number | null;
  cooldownUntil: number | null;
}

interface StudyWorkspaceProps {
  currentUser: User | null;
  onQuestionAsked: () => void;
  onChangeBook: () => void;
  onBackToDashboard: () => void;
}

export function StudyWorkspace({ currentUser, onQuestionAsked, onChangeBook, onBackToDashboard }: StudyWorkspaceProps) {
  const [currentBook] = useState({
    title: 'Na Drini ćuprija',
    author: 'Ivo Andrić',
  });

  return (
    <div className="min-h-screen bg-[#0A0F18] text-[#E6F0FF]">
      {/* Back to Dashboard Button */}
      <button
        onClick={onBackToDashboard}
        className="fixed top-8 left-8 z-50 px-5 py-3 bg-[#04245A]/60 border border-[#00CFFF]/30 
                 text-[#00CFFF] rounded-xl hover:bg-[#04245A] hover:border-[#00CFFF]
                 transition-all duration-150 backdrop-blur-sm text-sm"
        style={{ fontFamily: 'Orbitron, sans-serif' }}
      >
        ← Dashboard
      </button>

      {/* Main Layout Grid - Increased spacing */}
      <div className="flex h-screen pt-4">
        {/* Left Sidebar - Book Context */}
        <BookSidebar 
          book={currentBook}
          onChangeBook={onChangeBook}
        />

        {/* Center Area - Main Workspace with more padding */}
        <div className="flex-1 flex flex-col overflow-hidden px-6">
          <WorkspaceTabs 
            currentUser={currentUser}
            onQuestionAsked={onQuestionAsked}
          />
        </div>

        {/* Right Panel - AI Guidance */}
        <AIGuidancePanel />
      </div>
    </div>
  );
}
