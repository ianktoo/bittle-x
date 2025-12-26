import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4">
      {toasts.map((t) => (
        <div 
          key={t.id}
          className={`
            pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl border-l-4 transition-all animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-300
            ${t.type === 'success' ? 'bg-zinc-900 text-white border-green-500' : ''}
            ${t.type === 'error' ? 'bg-red-900/95 text-white border-red-500' : ''}
            ${t.type === 'info' ? 'bg-zinc-800 text-white border-blue-500' : ''}
          `}
        >
          {t.type === 'success' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
          {t.type === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
          {t.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
          
          <p className="flex-1 text-sm font-bold">{t.message}</p>
          
          <button onClick={() => onDismiss(t.id)} className="opacity-50 hover:opacity-100 p-1">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;