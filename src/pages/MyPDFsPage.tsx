import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  ArrowLeft,
  Calendar,
  PlayCircle,
  X
} from 'lucide-react';

interface PDFFile {
  id: string;
  name: string;
  uploadDate: Date;
  status: 'processing' | 'ready' | 'failed';
  size: string;
  pages: number;
  sessionId?: string;
}

export function MyPDFsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'processing' | 'ready' | 'failed'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Mock data - in production, this would come from your backend/state
  const [pdfs, setPdfs] = useState<PDFFile[]>([
    {
      id: '1',
      name: 'The Great Gatsby.pdf',
      uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'ready',
      size: '2.4 MB',
      pages: 180,
      sessionId: 'session-1'
    },
    {
      id: '2',
      name: '1984 by George Orwell.pdf',
      uploadDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'ready',
      size: '3.1 MB',
      pages: 328,
      sessionId: 'session-2'
    },
    {
      id: '3',
      name: 'To Kill a Mockingbird.pdf',
      uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'processing',
      size: '2.8 MB',
      pages: 281,
    },
    {
      id: '4',
      name: 'Pride and Prejudice.pdf',
      uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'ready',
      size: '1.9 MB',
      pages: 432,
      sessionId: 'session-4'
    },
    {
      id: '5',
      name: 'Moby Dick.pdf',
      uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'failed',
      size: '4.2 MB',
      pages: 585,
    }
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const newPdf: PDFFile = {
        id: Date.now().toString(),
        name: file.name,
        uploadDate: new Date(),
        status: 'processing',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        pages: 0
      };
      setPdfs(prev => [newPdf, ...prev]);

      // Simulate processing
      setTimeout(() => {
        setPdfs(prev => prev.map(pdf => 
          pdf.id === newPdf.id 
            ? { ...pdf, status: 'ready' as const, pages: Math.floor(Math.random() * 400) + 100, sessionId: `session-${newPdf.id}` }
            : pdf
        ));
      }, 3000);
    }
  };

  const handleOpenPDF = (pdf: PDFFile) => {
    if (pdf.status === 'ready' && pdf.sessionId) {
      navigate(`/study-session?session=${pdf.sessionId}`);
    }
  };

  const handleRetry = (pdfId: string) => {
    setPdfs(prev => prev.map(pdf => 
      pdf.id === pdfId ? { ...pdf, status: 'processing' as const } : pdf
    ));

    setTimeout(() => {
      setPdfs(prev => prev.map(pdf => 
        pdf.id === pdfId 
          ? { ...pdf, status: 'ready' as const, sessionId: `session-${pdfId}` }
          : pdf
      ));
    }, 3000);
  };

  const handleDelete = (pdfId: string) => {
    setPdfs(prev => prev.filter(pdf => pdf.id !== pdfId));
    setActiveMenu(null);
  };

  const filteredPdfs = pdfs.filter(pdf => {
    const matchesSearch = pdf.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || pdf.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'processing': return <Clock className="w-4 h-4 text-[#266ba7] animate-pulse" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a1929', fontFamily: 'Inter, sans-serif' }}>
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#266ba7]/5 via-transparent to-[#266ba7]/5 pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a1929]/90 backdrop-blur-xl">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-white">My PDFs</h1>
                  <p className="text-sm text-white/50 mt-0.5">Manage your literature library</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#266ba7] hover:bg-[#3b82c4] text-white font-medium shadow-lg hover:shadow-xl hover:shadow-[#266ba7]/40 transition-all duration-300"
              >
                <Upload className="w-4 h-4" />
                Upload PDF
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search PDFs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#266ba7]/50 focus:ring-2 focus:ring-[#266ba7]/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                    filterStatus !== 'all'
                      ? 'bg-[#266ba7]/20 border-[#266ba7]/30 text-[#266ba7]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {filterStatus === 'all' ? 'All' : getStatusText(filterStatus)}
                  </span>
                </button>

                {showFilterMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 p-2 rounded-2xl bg-[#1a2f45]/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in z-50">
                    {['all', 'ready', 'processing', 'failed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status as any);
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                          filterStatus === status
                            ? 'bg-[#266ba7]/20 text-[#266ba7] font-medium'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {status === 'all' ? 'All PDFs' : getStatusText(status)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* PDF Grid */}
        <div className="p-6 max-w-7xl mx-auto">
          {filteredPdfs.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#266ba7]/10 flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-[#266ba7]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No PDFs found' : 'No PDFs yet'}
              </h3>
              <p className="text-white/50 mb-6">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Upload your first literary work to get started'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#266ba7] hover:bg-[#3b82c4] text-white font-medium shadow-lg hover:shadow-xl hover:shadow-[#266ba7]/40 transition-all duration-300"
                >
                  <Upload className="w-4 h-4" />
                  Upload PDF
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPdfs.map((pdf, index) => (
                <div
                  key={pdf.id}
                  className="group p-5 rounded-3xl bg-gradient-to-br from-[#1a2f45]/40 to-[#0a1929]/40 backdrop-blur-xl border border-white/10 hover:border-[#266ba7]/30 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(pdf.status)}
                        <span className={`text-xs font-medium ${
                          pdf.status === 'ready' ? 'text-emerald-400' :
                          pdf.status === 'processing' ? 'text-[#266ba7]' :
                          'text-red-400'
                        }`}>
                          {getStatusText(pdf.status)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 truncate group-hover:text-[#266ba7] transition-colors">
                        {pdf.name}
                      </h3>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === pdf.id ? null : pdf.id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenu === pdf.id && (
                        <div className="absolute top-full right-0 mt-2 w-40 p-2 rounded-2xl bg-[#1a2f45]/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in z-50">
                          <button
                            onClick={() => handleDelete(pdf.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(pdf.uploadDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{pdf.size}</span>
                      <span>{pdf.pages > 0 ? `${pdf.pages} pages` : '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {pdf.status === 'ready' && (
                      <button
                        onClick={() => handleOpenPDF(pdf)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#266ba7] hover:bg-[#3b82c4] text-white text-sm font-medium transition-all"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Open
                      </button>
                    )}
                    {pdf.status === 'processing' && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-medium cursor-not-allowed">
                        <Clock className="w-4 h-4 animate-spin" />
                        Processing
                      </div>
                    )}
                    {pdf.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(pdf.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}