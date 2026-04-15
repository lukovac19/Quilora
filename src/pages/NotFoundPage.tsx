import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#00CFFF]/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-[#00CFFF]" />
        </div>

        <h1 className="text-6xl font-bold text-[#E6F0FF] mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          404
        </h1>

        <p className="text-xl text-[#E6F0FF]/70 mb-8">
          Page not found
        </p>

        <Link
          to="/"
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00CFFF] to-[#0090FF] 
                   text-[#0A0F18] font-bold hover:shadow-[0_0_30px_rgba(0,207,255,0.5)]
                   transition-all duration-150 inline-block"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
