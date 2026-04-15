import { X, Trash2, Bookmark, FileDown, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface SavedQuote {
  id: string;
  text: string;
  page: number;
  dateSaved: string;
}

interface SavedQuotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotes: SavedQuote[];
  onDeleteQuote: (id: string) => void;
  onDeleteAll: () => void;
  isMobile: boolean;
}

export function SavedQuotesModal({ 
  open, 
  onOpenChange, 
  quotes, 
  onDeleteQuote, 
  onDeleteAll,
  isMobile 
}: SavedQuotesModalProps) {
  const exportAsPDF = () => {
    // Mock export functionality
    const text = quotes.map(q => `\"${q.text}\" - Stranica ${q.page} (${q.dateSaved})`).join('\\n\\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moji-citati.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const content = (
    <div className="space-y-4">
      {quotes.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={exportAsPDF}
            variant="outline"
            size="sm"
            className="border-[#00D1FF]/30 text-[#00D1FF] hover:bg-[#00D1FF]/10 hover:text-[#00D1FF] hover:border-[#00D1FF]/50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={onDeleteAll}
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
          >
            <Trash className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      )}
      
      {quotes.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-[#00D1FF]/30 mx-auto mb-4" />
          <p className="text-[#E6F0FF]/60">Nema sačuvanih citata</p>
          <p className="text-[#E6F0FF]/40 text-sm mt-2">
            Kliknite 🔖 ikonu na citatu da ga sačuvate
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="p-4 rounded-xl bg-[#001F54]/40 border border-[#00D1FF]/30 hover:border-[#00D1FF]/50 transition-all"
                style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)' }}
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1">
                    <p className="text-[#E6F0FF]/80 leading-relaxed">
                      "{quote.text}"
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteQuote(quote.id)}
                    className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#E6F0FF]/40">
                  <span>Stranica {quote.page}</span>
                  <span>•</span>
                  <span>{quote.dateSaved}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0A] border border-[#00D1FF]/30 text-[#E6F0FF] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#E6F0FF] flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <Bookmark className="w-5 h-5 text-[#00D1FF]" />
            Moji citati
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}