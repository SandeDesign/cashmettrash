// src/components/common/Toast.tsx
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

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
  error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
  info: <Info className="w-5 h-5 flex-shrink-0" />,
};

const ToastNotification: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`cmt-alert cmt-alert-${toast.type} cmt-animate-in max-w-sm w-full`}
      style={{ background: 'var(--cmt-surface)', boxShadow: 'var(--cmt-shadow-lift)' }}
      role="status"
    >
      {ICONS[toast.type]}
      <p className="flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Melding sluiten"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
          <ToastNotification toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default Toast;
