import { useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: Check,
    error: X,
    info: Info,
    warning: AlertCircle
  };

  const colors = {
    success: '#266ba7',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };

  const Icon = icons[type];
  const color = colors[type];

  return (
    <div 
      className="fixed top-6 right-6 z-[100] animate-slide-in-right"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#1a2f45]/95 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div 
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <p className="text-white text-sm font-medium pr-2">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
