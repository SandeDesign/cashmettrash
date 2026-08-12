import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastNotification: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
      bg: 'bg-green-900/90',
      border: 'border-green-500/40',
      icon: <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
    },
    error: {
      bg: 'bg-red-900/90',
      border: 'border-red-500/40',
      icon: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
    },
    warning: {
      bg: 'bg-yellow-900/90',
      border: 'border-yellow-500/40',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
    },
    info: {
      bg: 'bg-blue-900/90',
      border: 'border-blue-500/40',
      icon: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
    }
  };

  const s = styles[toast.type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${s.bg} ${s.border} max-w-sm w-full animate-in slide-in-from-right-full duration-300`}
    >
      {s.icon}
      <p className="flex-1 text-sm text-white leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/40 hover:text-white transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default Toast;
