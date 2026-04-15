import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChatTab } from './tabs/ChatTab';
import { MindMapTab } from './tabs/MindMapTab';
import { EssayTab } from './tabs/EssayTab';
import { HistoryTab } from './tabs/HistoryTab';

interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  questionsAsked: number;
  lastQuestionTime: number | null;
  cooldownUntil: number | null;
}

interface WorkspaceTabsProps {
  currentUser: User | null;
  onQuestionAsked: () => void;
}

export function WorkspaceTabs({ currentUser, onQuestionAsked }: WorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState('razgovor');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      {/* Tab Navigation - Increased padding */}
      <div className="border-b border-[#04245A]/30 bg-[#0A0F18]/80 backdrop-blur-sm px-4 pt-6">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none border-none">
          <TabTrigger value="razgovor">Razgovor</TabTrigger>
          <TabTrigger value="mapa-uma">Mapa uma</TabTrigger>
          <TabTrigger value="esejski">Esejski odgovor</TabTrigger>
          <TabTrigger value="historija">Historija</TabTrigger>
        </TabsList>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <TabsContent value="razgovor" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <ChatTab currentUser={currentUser} onQuestionAsked={onQuestionAsked} />
        </TabsContent>

        <TabsContent value="mapa-uma" className="h-full m-0">
          <MindMapTab />
        </TabsContent>

        <TabsContent value="esejski" className="h-full m-0">
          <EssayTab />
        </TabsContent>

        <TabsContent value="historija" className="h-full m-0">
          <HistoryTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function TabTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="px-8 py-5 text-sm uppercase tracking-wider bg-transparent 
                 text-[#E6F0FF]/50 border-b-2 border-transparent rounded-none
                 data-[state=active]:text-[#00CFFF] data-[state=active]:border-[#00CFFF]
                 data-[state=active]:shadow-[0_0_12px_rgba(0,207,255,0.3)]
                 hover:text-[#E6F0FF]/80 transition-all duration-150"
      style={{ fontFamily: 'Orbitron, sans-serif' }}
    >
      {children}
    </TabsTrigger>
  );
}